console.log('✨ Unit converter initialized');

const UnitConverter = {
    UNIT_TYPES: {
        INCHES: 'in',
        CENTIMETERS: 'cm'
    },

    detectUnitFromHeader(headerText) {
        const unitMatch = headerText.match(/\((.*?)\)/);
        return {
            measurementName: headerText.replace(/\s*\(.*?\)/, '').trim(),
            unit: unitMatch ? unitMatch[1].toLowerCase() : null
        };
    },

    formatMeasurementHeader(measurementName, unit) {
        return `${measurementName} (${unit})`;
    },

    convertInchesToCm(inches) {
        return parseFloat((inches * 2.54).toFixed(2));
    },

    convertMeasurement(value, fromUnit, toUnit = this.UNIT_TYPES.CENTIMETERS) {
        if (!value || fromUnit === toUnit) return value;
        
        // Handle range values (e.g., "34 - 36")
        if (typeof value === 'string' && value.includes('-')) {
            const [min, max] = value.split('-').map(num => parseFloat(num.trim()));
            if (fromUnit === this.UNIT_TYPES.INCHES && toUnit === this.UNIT_TYPES.CENTIMETERS) {
                return `${this.convertInchesToCm(min)} - ${this.convertInchesToCm(max)}`;
            }
        }
        
        // Handle single values
        if (fromUnit === this.UNIT_TYPES.INCHES && toUnit === this.UNIT_TYPES.CENTIMETERS) {
            return this.convertInchesToCm(parseFloat(value));
        }
        
        return value;
    }
};
