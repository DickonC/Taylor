console.log('✨ Size guide extractor initialized and waiting for product detection');

// Listen for the custom event
document.addEventListener('productPageDetected', (event) => {
    extractSizeGuide();
});

function findSizeChartData() {
    try {
        // Look for inline scripts containing size chart data
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent;
            if (content.includes('sizechartv2') || content.includes('size-chart')) {
                const matches = content.match(/sizechartv2[^}]+}/g);
                if (matches) {
                    return matches[0];
                }
            }
        }

        // Look for hidden size chart elements
        const hiddenCharts = document.querySelectorAll('[id*="size-chart"], [id*="sizechart"]');
        for (const chart of hiddenCharts) {
            if (chart.innerHTML.includes('table')) {
                // Dispatch event for the processor
                document.dispatchEvent(new CustomEvent('sizeChartFound', {
                    detail: { htmlContent: chart.innerHTML }
                }));
                return chart.innerHTML;
            }
        }

        // Try to find data in Amazon's global namespace
        if (window.jQuery && window.jQuery.sizechart) {
            return window.jQuery.sizechart;
        }

    } catch (error) {
        console.error('Error finding size chart data:', error);
    }
    return null;
}

async function fetchSizeChartDataDirectly() {
    // Try to fetch the size chart data directly if we can find the ASIN
    try {
        const asin = document.querySelector('#ASIN')?.value || 
                    window.location.pathname.match(/[A-Z0-9]{10}/)?.[0];
        
        if (asin) {
            console.log('📦 Found product ASIN:', asin);
            // We could potentially make a direct request to Amazon's size chart API
            // This would require finding the correct endpoint
            // For now, just logging that we found the ASIN
        }
    } catch (error) {
        console.log('❌ Error fetching size chart data:', error);
    }
}

async function extractSizeGuide() {
    const sizeChartHtml = findSizeChartData();
    
    if (sizeChartHtml) {
        // Dispatch event for the processor to handle
        document.dispatchEvent(new CustomEvent('sizeChartFound', {
            detail: { htmlContent: sizeChartHtml }
        }));
        
        // Listen for processed data
        return new Promise((resolve) => {
            document.addEventListener('sizeChartProcessed', (event) => {
                const sizeChartData = event.detail.sizeChart;
                
                if (sizeChartData) {
                    resolve(sizeChartData);
                } else {
                    resolve(null);
                }
            }, { once: true }); // Only listen once to prevent double execution
        });
    }
    return null;
}