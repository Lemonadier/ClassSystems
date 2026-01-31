/**
 * Attendance System Module
 * Handles attendance-specific logic: present, late, absent
 */

const SystemAttendance = {
    /**
     * Attendance status types
     */
    statusTypes: ['Present', 'Late', 'Absent'],

    /**
     * Get attendance transaction fields
     */
    getTransactionFields: (lang) => {
        return [
            { name: 'Type', label: lang.label_status, type: 'select', options: ['Present', 'Late', 'Absent'], required: true },
            { name: 'Date', label: lang.label_date, type: 'date', required: true },
            { name: 'Note', label: lang.label_note, type: 'text', optional: true }
        ];
    },

    /**
     * Format attendance value for display
     */
    formatValue: (status) => {
        const icons = {
            'Present': '✓',
            'Late': '⚠',
            'Absent': '✗',
            '1': '✓',
            '0': '✗'
        };
        return icons[status] || status;
    },

    /**
     * Get attendance color for status
     */
    getStatusColor: (status) => {
        const colors = {
            'Present': 'bg-green-100 text-green-800',
            'Late': 'bg-yellow-100 text-yellow-800',
            'Absent': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    /**
     * Get weekly grid cell color based on status
     */
    getCellColor: (status) => {
        const colors = {
            'Present': 'bg-emerald-400',
            'Late': 'bg-amber-400',
            'Absent': 'bg-red-400',
            '1': 'bg-emerald-400',
            '0': 'bg-red-400'
        };
        return colors[status] || 'bg-slate-200';
    },

    /**
     * Parse attendance data into weekly grid
     */
    buildWeeklyGrid: (transactions, studentId, dateFrom, dateTo) => {
        const weeks = {};
        const studentTx = transactions.filter(t => String(t['Student ID']) === String(studentId));
        
        studentTx.forEach(tx => {
            const date = new Date(tx.Date);
            if (date >= dateFrom && date <= dateTo) {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                if (!weeks[weekKey]) weeks[weekKey] = {};
                weeks[weekKey][date.getDay()] = tx.Type || tx.Status;
            }
        });
        
        return weeks;
    }
};
