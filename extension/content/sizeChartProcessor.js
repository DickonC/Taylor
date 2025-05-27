console.log('✨ Size chart processor initialized');

function processTableData(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const table = tempDiv.querySelector('table');
    if (!table) {
        console.log('❌ No table found in the provided HTML');
        return null;
    }

    const headers = [];
    const sizes = [];
    const originalUnits = {};
    
    // Get headers and detect units
    const headerCells = table.querySelector('tr').querySelectorAll('th');
    headerCells.forEach(th => {
        const text = th.textContent.trim();
        const { measurementName, unit } = UnitConverter.detectUnitFromHeader(text);
        
        if (unit) {
            originalUnits[measurementName] = unit;
            headers.push(UnitConverter.formatMeasurementHeader(measurementName, UnitConverter.UNIT_TYPES.CENTIMETERS));
        } else {
            headers.push(text);
        }
    });

    // Get size data from remaining rows
    const dataRows = table.querySelectorAll('tr:not(:first-child)');
    dataRows.forEach(row => {
        const sizeData = {};
        const brandSize = row.querySelector('th').textContent.trim();
        const measurementCells = row.querySelectorAll('td');

        // First column is brand size
        sizeData[headers[0]] = brandSize;

        // Process measurement cells (starting from second column)
        measurementCells.forEach((cell, index) => {
            const header = headers[index + 1];
            const text = cell.textContent.trim().replace(/\s+/g, ' ').replace(/\u00A0/g, '');
            const measurementName = UnitConverter.detectUnitFromHeader(header).measurementName;
            
            sizeData[header] = UnitConverter.convertMeasurement(
                text,
                originalUnits[measurementName],
                UnitConverter.UNIT_TYPES.CENTIMETERS
            );
        });

        sizes.push(sizeData);
    });

    // Create the final size chart object
    const sizeChart = {
        title: tempDiv.querySelector('h5')?.textContent.trim() || 'Size Chart',
        headers: headers,
        sizes: sizes,
        metadata: {
            processedAt: new Date().toISOString(),
            totalSizes: sizes.length,
            measurementTypes: headers.slice(1),
            originalUnits: originalUnits,
            convertedToCm: true
        }
    };

    // After creating the sizeChart object, add measurement matching
    const measurementMatches = window.MeasurementMatcher.processSizeChart(sizeChart);
    
    // Add the matches to the metadata
    sizeChart.metadata.measurementMatches = measurementMatches;

    // Add detailed logging
    console.log('📏 Size Chart Measurement Analysis:');
    console.log('-----------------------------------');
    console.log('Matched Measurements:');
    Object.entries(measurementMatches.matchedMeasurements).forEach(([header, match]) => {
        console.log(`✅ ${header} -> ${match.standardName} (${match.confidence} confidence)`);
        console.log(`   Reason: ${match.reason}`);
    });
    
    if (measurementMatches.unmatchedMeasurements.length > 0) {
        console.log('\n❌ Unmatched Measurements:');
        measurementMatches.unmatchedMeasurements.forEach(header => {
            console.log(`   ${header}`);
        });
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Total measurements: ${measurementMatches.metadata.totalHeaders}`);
    console.log(`   Matched: ${measurementMatches.metadata.matchedCount}`);
    console.log(`   Unmatched: ${measurementMatches.metadata.unmatchedCount}`);

    return sizeChart;
}

// Add a flag to prevent double processing
let isProcessing = false;

// Listen for size chart data from the extractor
document.addEventListener('sizeChartFound', (event) => {
    // Prevent double processing
    if (isProcessing) return;
    isProcessing = true;

    console.log('📊 Processing size chart data...');
    const processedData = processTableData(event.detail.htmlContent);
    
    if (processedData) {
        console.log('✅ Processed size chart data (converted to cm):');
        console.log(JSON.stringify(processedData, null, 2));
        
        // Dispatch processed data for other parts of the extension
        document.dispatchEvent(new CustomEvent('sizeChartProcessed', {
            detail: { sizeChart: processedData }
        }));
    } else {
        console.log('❌ Failed to process size chart data');
    }

    // Reset the flag after a short delay to allow for any necessary cleanup
    setTimeout(() => {
        isProcessing = false;
    }, 100);
});