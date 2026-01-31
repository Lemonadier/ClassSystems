/**
 * Bank System Module
 * Handles bank-specific logic: deposits, withdrawals, transactions
 */

const SystemBank = {
    /**
     * Get student select options for bank transactions
     */
    getStudentSelectHTML: (students, lang) => {
        return `<option value="">${lang.label_select_student}</option>` +
            students.map(s => `<option value="${s['Student ID']}">${s.Name}</option>`).join('');
    },

    /**
     * Render bank transaction fields
     */
    getTransactionFields: (lang) => {
        return [
            { name: 'Type', label: lang.label_deposit, type: 'select', options: ['Deposit', 'Withdraw'] },
            { name: 'Amount', label: lang.label_amount, type: 'number', required: true },
            { name: 'Status', label: lang.label_status, type: 'text', optional: true },
            { name: 'Note', label: lang.label_note, type: 'text', optional: true }
        ];
    },

    /**
     * Format bank display value
     */
    formatValue: (value) => {
        return `$${parseFloat(value || 0).toFixed(2)}`;
    },

    /**
     * Get bank-specific chart options
     */
    getChartOptions: () => {
        return {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Bank Balance Distribution' }
            }
        };
    }
};
