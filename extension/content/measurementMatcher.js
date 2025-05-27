const MeasurementMatcher = {
    // Define our standard measurement types
    STANDARD_MEASUREMENTS: {
        chestPitToPit: {
            aliases: ['chest pit to pit', 'pit to pit', 'chest width', 'chest (pit to pit)'],
            maxValue: 60,  // Maximum reasonable value in cm
            minValue: 30   // Minimum reasonable value in cm
        },
        chestAround: {
            aliases: ['chest', 'chest around', 'chest circumference', 'chest (around)'],
            maxValue: 150, // Maximum reasonable value in cm
            minValue: 70   // Minimum reasonable value in cm
        },
        shoulderToHem: {
            aliases: ['shoulder to hem', 'length (shoulder to hem)', 'total length']
        },
        waist: {
            aliases: ['waist', 'waist around', 'waist circumference']
        },
        hip: {
            aliases: ['hip', 'hip around', 'hip circumference']
        }
    },

    // Helper function to clean measurement names
    cleanMeasurementName(name) {
        return name.toLowerCase()
            .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
            .replace(/\s+/g, ' ')      // Normalize spaces
            .trim();
    },

    // Determine if a chest measurement is likely pit-to-pit or around based on value
    determineChestType(value) {
        // Handle range values (e.g., "86.36 - 91.44")
        let minValue, maxValue;
        if (typeof value === 'string' && value.includes('-')) {
            [minValue, maxValue] = value.split('-').map(v => parseFloat(v.trim()));
        } else {
            minValue = maxValue = parseFloat(value);
        }

        // If value is between typical pit-to-pit range
        if (minValue >= this.STANDARD_MEASUREMENTS.chestPitToPit.minValue && 
            maxValue <= this.STANDARD_MEASUREMENTS.chestPitToPit.maxValue) {
            return 'chestPitToPit';
        }
        // If value is between typical around range
        if (minValue >= this.STANDARD_MEASUREMENTS.chestAround.minValue && 
            maxValue <= this.STANDARD_MEASUREMENTS.chestAround.maxValue) {
            return 'chestAround';
        }
        return null;
    },

    // Match a measurement header to our standard measurements
    matchMeasurement(header, value) {
        const cleanHeader = this.cleanMeasurementName(header);
        
        // First try to match by name
        for (const [standardName, config] of Object.entries(this.STANDARD_MEASUREMENTS)) {
            if (config.aliases.some(alias => cleanHeader.includes(alias))) {
                // Special handling for chest measurements
                if (standardName === 'chestPitToPit' || standardName === 'chestAround') {
                    // Only match by name if the header explicitly mentions the type
                    if (cleanHeader.includes('pit to pit') || cleanHeader.includes('around')) {
                        return {
                            standardName,
                            confidence: 'high',
                            reason: 'explicit name match'
                        };
                    }
                    // If it's just "chest", we need to determine by value
                    const determinedType = this.determineChestType(value);
                    if (determinedType) {
                        return {
                            standardName: determinedType,
                            confidence: 'medium',
                            reason: 'value range match for ambiguous chest measurement'
                        };
                    }
                }
                return {
                    standardName,
                    confidence: 'high',
                    reason: 'name match'
                };
            }
        }

        // If no name match and it's a chest measurement, try to determine by value
        if (cleanHeader.includes('chest')) {
            const determinedType = this.determineChestType(value);
            if (determinedType) {
                return {
                    standardName: determinedType,
                    confidence: 'medium',
                    reason: 'value range match for ambiguous chest measurement'
                };
            }
        }

        return null;
    },

    // Process a size chart and match all measurements
    processSizeChart(sizeChart) {
        const matchedMeasurements = {};
        const unmatchedMeasurements = [];

        sizeChart.headers.forEach((header, index) => {
            // Skip the first header (usually size)
            if (index === 0) return;

            // Get a sample value from the first size
            const sampleValue = sizeChart.sizes[0][header];
            
            const match = this.matchMeasurement(header, sampleValue);
            if (match) {
                matchedMeasurements[header] = {
                    standardName: match.standardName,
                    confidence: match.confidence,
                    reason: match.reason
                };
            } else {
                unmatchedMeasurements.push(header);
            }
        });

        return {
            matchedMeasurements,
            unmatchedMeasurements,
            metadata: {
                processedAt: new Date().toISOString(),
                totalHeaders: sizeChart.headers.length - 1, // Exclude size column
                matchedCount: Object.keys(matchedMeasurements).length,
                unmatchedCount: unmatchedMeasurements.length
            }
        };
    }
};

// Make it available globally
window.MeasurementMatcher = MeasurementMatcher;
