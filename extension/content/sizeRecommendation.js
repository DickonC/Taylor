const SizeRecommendation = {
    // Calculate the cost (distance) between user measurement and size chart value
    calculateMeasurementCost(userValue, sizeChartValue) {
        if (!userValue || !sizeChartValue) return null;
        
        // Handle range values in size chart (e.g., "86.36 - 91.44")
        if (typeof sizeChartValue === 'string' && sizeChartValue.includes('-')) {
            const [min, max] = sizeChartValue.split('-').map(v => parseFloat(v.trim()));
            
            // If user measurement is within the range, cost is 0
            if (userValue >= min && userValue <= max) {
                return 0;
            }
            
            // If outside range, calculate distance to nearest boundary
            if (userValue < min) {
                return min - userValue;
            } else {
                return userValue - max;
            }
        }
        
        // Handle single values
        const chartValue = parseFloat(sizeChartValue);
        return Math.abs(userValue - chartValue);
    },

    // Get user measurements from storage
    async getUserMeasurements() {
        try {
            const token = await chrome.storage.local.get('authToken');
            if (!token.authToken) {
                console.log('❌ No auth token found');
                return null;
            }

            const response = await fetch('http://localhost:3001/api/measurements/get?garmentType=tshirt', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.measurements?.measurements || null;
        } catch (error) {
            console.error('Error fetching user measurements:', error);
            return null;
        }
    },

    // Add a flag to prevent double execution
    isCalculating: false,

    // Calculate size recommendation
    async calculateSizeRecommendation(sizeChart) {
        // Prevent double execution
        if (this.isCalculating) return;
        this.isCalculating = true;
        
        try {
            console.log('🎯 Starting size recommendation calculation...');
            
            // Get user measurements
            const userMeasurements = await this.getUserMeasurements();
            console.log('👤 User measurements:', userMeasurements);
            
            if (!userMeasurements) {
                console.log('❌ No user measurements found');
                return null;
            }

            // Calculate costs for each size
            const sizeCosts = sizeChart.sizes.map(size => {
                const costs = [];
                let comparedMeasurements = 0;

                // Process each measurement in the size chart
                for (const [chartName, chartValue] of Object.entries(size)) {
                    if (chartName === 'Brand size') continue;

                    const match = sizeChart.metadata.measurementMatches.matchedMeasurements[chartName];
                    if (!match) continue;

                    const userValue = userMeasurements[match.standardName];
                    if (!userValue) continue;

                    const cost = this.calculateMeasurementCost(userValue, chartValue);
                    if (cost !== null) {
                        costs.push(cost);
                        comparedMeasurements++;
                    }
                }

                // If we only have chest measurements, use those
                if (comparedMeasurements === 0 && userMeasurements.chestAround) {
                    const chestMatch = Object.entries(sizeChart.metadata.measurementMatches.matchedMeasurements)
                        .find(([_, match]) => match.standardName === 'chestAround');
                    
                    if (chestMatch) {
                        const [chartName, _] = chestMatch;
                        const cost = this.calculateMeasurementCost(userMeasurements.chestAround, size[chartName]);
                        if (cost !== null) {
                            costs.push(cost);
                            comparedMeasurements = 1;
                        }
                    }
                }

                const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
                const averageCost = comparedMeasurements > 0 ? totalCost / comparedMeasurements : Infinity;

                return {
                    size: size['Brand size'],
                    totalCost,
                    averageCost,
                    comparedMeasurements,
                    costs
                };
            });

            // Find the size with the lowest average cost
            const bestFit = sizeCosts.reduce((best, current) => {
                return current.averageCost < best.averageCost ? current : best;
            });

            if (bestFit.comparedMeasurements > 0) {
                console.log('🏆 RECOMMENDED SIZE:', bestFit.size);
                console.log(`   Average cost: ${bestFit.averageCost.toFixed(2)}cm`);
                console.log(`   Based on ${bestFit.comparedMeasurements} measurement(s)`);
                
                // Store recommendation for popup
                chrome.storage.local.set({ 
                    currentRecommendation: bestFit 
                });
                
                // Show notification on the page
                if (window.sizeRecommendationNotification) {
                    window.sizeRecommendationNotification.show(bestFit);
                }
                
                return bestFit;
            } else {
                console.log('❌ No size recommendation possible - no matching measurements found');
                return null;
            }
        } finally {
            this.isCalculating = false;
        }
    }
};

// Make it available globally
window.SizeRecommendation = SizeRecommendation;

// Listen for processed size chart data
document.addEventListener('sizeChartProcessed', async (event) => {
    // Prevent double calculation
    if (SizeRecommendation.isCalculating) return;
    
    console.log('🔄 Size chart processed, calculating recommendation...');
    const sizeChart = event.detail.sizeChart;
    const recommendation = await SizeRecommendation.calculateSizeRecommendation(sizeChart);
    
    if (recommendation) {
        // Dispatch recommendation event for other parts of the extension
        document.dispatchEvent(new CustomEvent('sizeRecommendationCalculated', {
            detail: { recommendation }
        }));
    }
});
