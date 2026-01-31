/**
 * Health System Module
 * Handles health-specific logic: weight, height, BMI
 */

const SystemHealth = {
    /**
     * Get health transaction fields
     */
    getTransactionFields: (lang) => {
        return [
            { name: 'Weight', label: lang.label_weight, type: 'number', optional: true },
            { name: 'Height', label: lang.label_height, type: 'number', optional: true },
            { name: 'Date', label: lang.label_date, type: 'date', required: true },
            { name: 'Note', label: lang.label_note, type: 'text', optional: true }
        ];
    },

    /**
     * Calculate BMI from weight and height
     * @param weight Weight in kg
     * @param height Height in cm
     * @returns BMI value rounded to 1 decimal
     */
    calculateBMI: (weight, height) => {
        if (!weight || !height) return null;
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        return parseFloat(bmi.toFixed(1));
    },

    /**
     * Get BMI category
     */
    getBMICategory: (bmi) => {
        if (!bmi) return 'Unknown';
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    },

    /**
     * Get BMI color
     */
    getBMIColor: (bmi) => {
        if (!bmi) return 'bg-gray-100';
        if (bmi < 18.5) return 'bg-blue-100 text-blue-800';
        if (bmi < 25) return 'bg-green-100 text-green-800';
        if (bmi < 30) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    },

    /**
     * Format health measurement for display
     */
    formatValue: (value, field) => {
        if (!value) return '-';
        switch(field) {
            case 'Weight': return `${value} kg`;
            case 'Height': return `${value} cm`;
            case 'BMI': return `${value} BMI`;
            default: return value;
        }
    }
};
