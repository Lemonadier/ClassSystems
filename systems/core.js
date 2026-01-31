/**
 * Core System Module
 * Shared utilities and system-agnostic functions
 */

const SystemCore = {
    /**
     * Get action buttons HTML for a given system
     */
    getActionsHTML: (system, role, lang) => {
        const baseActions = {
            bank: {
                teacher: [
                    { id: 'transaction', icon: 'fa-money-bill-transfer', color: 'indigo', label: lang.btn_new_tx },
                    { id: 'add-student', icon: 'fa-user-plus', color: 'emerald', label: lang.btn_add_student },
                    { id: 'batch-student', icon: 'fa-users', color: 'blue', label: lang.btn_batch_add },
                    { id: 'multi-tx', icon: 'fa-layer-group', color: 'purple', label: lang.btn_batch_tx }
                ],
                parent: []
            },
            attendance: {
                teacher: [
                    { id: 'transaction', icon: 'fa-check-circle', color: 'emerald', label: lang.btn_new_tx },
                    { id: 'multi-tx', icon: 'fa-users-check', color: 'emerald', label: lang.btn_batch_tx }
                ],
                parent: []
            },
            health: {
                teacher: [
                    { id: 'transaction', icon: 'fa-weight-scale', color: 'rose', label: lang.btn_new_tx },
                    { id: 'multi-tx', icon: 'fa-heart-pulse', color: 'rose', label: lang.btn_batch_tx }
                ],
                parent: []
            },
            profile: {
                teacher: [
                    { id: 'transaction', icon: 'fa-pencil', color: 'amber', label: lang.btn_new_tx },
                    { id: 'multi-tx', icon: 'fa-users', color: 'amber', label: lang.btn_batch_tx }
                ],
                parent: []
            }
        };

        const actions = baseActions[system]?.[role] || [];
        return actions.map(action => `
            <button onclick="openModal('${action.id}')" class="p-4 rounded-xl border border-slate-200 hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-all group text-left">
                <div class="w-10 h-10 rounded-full bg-${action.color}-100 text-${action.color}-600 flex items-center justify-center mb-3 group-hover:bg-${action.color}-600 group-hover:text-white transition-colors"><i class="fa-solid ${action.icon}"></i></div>
                <div class="font-semibold text-slate-700 text-sm">${action.label}</div>
            </button>
        `).join('');
    },

    /**
     * Get student field options for transaction modal based on system
     */
    getFieldOptions: (system, transactions) => {
        const options = {
            bank: ['Type', 'Amount', 'Status', 'Note'],
            attendance: ['Type', 'Status', 'Note'],
            health: ['Weight', 'Height', 'BMI', 'Note'],
            profile: ['Score', 'Note']
        };
        return options[system] || [];
    },

    /**
     * Validate transaction data based on system
     */
    validateTransaction: (system, data) => {
        if (!data['Student ID']) return 'Student ID required';
        
        switch(system) {
            case 'bank':
                if (!data.Type || !data.Amount) return 'Type and Amount required';
                break;
            case 'attendance':
                if (!data.Type) return 'Status/Type required';
                break;
            case 'health':
                if (!data.Weight && !data.Height) return 'Weight or Height required';
                break;
            case 'profile':
                if (!data.Score && !data.Note) return 'Score or Note required';
                break;
        }
        return null;
    }
};
