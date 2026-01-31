/**
 * Profile System Module
 * Handles profile-specific logic: mood, skills, scores
 */

const SystemProfile = {
    /**
     * Get profile transaction fields
     */
    getTransactionFields: (lang) => {
        return [
            { name: 'Score', label: lang.label_intel, type: 'number', optional: true },
            { name: 'Mood', label: lang.label_mood, type: 'select', options: ['Happy', 'Neutral', 'Sad'], optional: true },
            { name: 'Date', label: lang.label_date, type: 'date', required: true },
            { name: 'Note', label: lang.label_note, type: 'text', optional: true }
        ];
    },

    /**
     * Mood types and icons
     */
    moodTypes: {
        'Happy': '😊',
        'Neutral': '😐',
        'Sad': '😞'
    },

    /**
     * Get mood icon
     */
    getMoodIcon: (mood) => {
        return SystemProfile.moodTypes[mood] || '😐';
    },

    /**
     * Get mood color
     */
    getMoodColor: (mood) => {
        const colors = {
            'Happy': 'bg-yellow-100 text-yellow-800',
            'Neutral': 'bg-gray-100 text-gray-800',
            'Sad': 'bg-blue-100 text-blue-800'
        };
        return colors[mood] || 'bg-gray-100 text-gray-800';
    },

    /**
     * Format score for display
     */
    formatScore: (score) => {
        if (!score) return '-';
        const num = parseFloat(score);
        return `${num.toFixed(1)}/10`;
    },

    /**
     * Get score display color
     */
    getScoreColor: (score) => {
        if (!score) return 'bg-gray-100';
        const num = parseFloat(score);
        if (num >= 8) return 'bg-green-100 text-green-800';
        if (num >= 6) return 'bg-blue-100 text-blue-800';
        if (num >= 4) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }
};
