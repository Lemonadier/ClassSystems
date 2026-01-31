/**
 * Application Core & Initialization
 */

const app = {
    // ===== APP INITIALIZATION =====
    init: () => {
        app.setLang(CONFIG.lang);
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get('config')) {
            try { localStorage.setItem('cb_api_url', atob(urlParams.get('config'))); window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { }
        }

        const expiry = parseInt(localStorage.getItem('cb_session_expiry') || '0');

        if (urlParams.get('role') === 'parent' && urlParams.get('childId')) {
            const childId = urlParams.get('childId');
            const apiUrlEncoded = urlParams.get('apiUrl');
            if (apiUrlEncoded) {
                try {
                    const decodedApi = atob(apiUrlEncoded);
                    localStorage.setItem('cb_api_url', decodedApi);
                    localStorage.setItem('cb_magic_child_id', childId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (e) { console.error('Invalid magic link', e); }
            }
        }

        if (expiry > Date.now()) {
            CONFIG.role = localStorage.getItem('cb_session_role');
            if (CONFIG.role === 'parent') CONFIG.user = JSON.parse(localStorage.getItem('cb_session_user'));
            const savedUrl = localStorage.getItem('cb_session_api_url') || localStorage.getItem('cb_api_url') || localStorage.getItem('cb_teacher_api_key');
            if (savedUrl) {
                localStorage.setItem('cb_api_url', savedUrl);
                Object.defineProperty(CONFIG, 'apiUrl', { value: savedUrl, writable: true, configurable: true });
            }
            if (CONFIG.role) app.showLauncher();
            else app.checkSetupStatus();
        } else if (expiry > 0) app.logout();

        if (!CONFIG.apiUrl) document.getElementById('connection-status')?.classList.remove('hidden');
        else if (!CONFIG.role) app.checkSetupStatus();

        const weeklyBtn = document.getElementById('btn-chart-weekly-attendance');
        if (weeklyBtn) weeklyBtn.style.display = 'none';

        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onsubmit = fn; };
        bind('form-login-teacher', authModule.handleTeacherLogin);
        bind('form-login-student', authModule.handleStudentLogin);
        bind('form-transaction', handlersModule.handleTransaction);
        bind('form-add-student', handlersModule.handleAddStudent);

        document.getElementById('search-input').oninput = (e) => app.renderTable(e.target.value);

        const savedApi = localStorage.getItem('cb_teacher_api_key') || localStorage.getItem('cb_api_url') || localStorage.getItem('cb_session_api_url');
        if (savedApi) {
            if (!localStorage.getItem('cb_api_url')) localStorage.setItem('cb_api_url', savedApi);
            const apiInput = document.getElementById('api-url');
            if (apiInput) apiInput.value = savedApi;
        }
        if (localStorage.getItem('cb_magic_child_id') && !CONFIG.role) {
            const childId = localStorage.getItem('cb_magic_child_id');
            document.getElementById('login-student-id').value = childId;
            setTimeout(() => {
                authModule.handleStudentLogin({ preventDefault: () => { } });
                localStorage.removeItem('cb_magic_child_id');
            }, 300);
        }
        if (CONFIG.role) authModule.startSessionTimer();
    },

    // ===== CORE METHODS =====
    setLang: uiModule.setLang,
    loading: uiModule.loading,
    showLauncher: uiModule.showLauncher,
    enterSystem: uiModule.enterSystem,
    updateActionsMenu: uiModule.updateActionsMenu,
    fetchData: dataModule.fetchData,
    processData: dataModule.processData,
    postData: dataModule.postData,
    checkSetupStatus: authModule.checkSetupStatus,
    generateParentMagicLink: authModule.generateParentMagicLink,

    // ===== UI RENDERING =====
    renderStudentCards: uiModule.renderStudentCards,
    updateSelectOptions: uiModule.updateSelectOptions,
    renderTable: uiModule.renderTable,
    switchTab: uiModule.switchTab,
    setTableMode: uiModule.setTableMode,
    formatMoney: uiModule.formatMoney,
    setChartType: uiModule.setChartType,
    chartSelectAll: uiModule.chartSelectAll,
    chartClearAll: uiModule.chartClearAll,

    // ===== CHARTS =====
    renderCharts: chartsModule.renderCharts,
    renderWeeklyAttendance: chartsModule.renderWeeklyAttendance,

    // ===== HANDLERS =====
    handleTransaction: handlersModule.handleTransaction,
    handleAddStudent: handlersModule.handleAddStudent,
    processBatchStudents: handlersModule.processBatchStudents,
    processMultiTx: handlersModule.processMultiTx,
    selectAllMulti: handlersModule.selectAllMulti,
    populateMultiTxFields: handlersModule.populateMultiTxFields,
    saveApiUrl: handlersModule.saveApiUrl,
    copyShareLink: handlersModule.copyShareLink,
    saveSettings: handlersModule.saveSettings,

    // ===== MISC =====
    refreshData: () => app.fetchData(),
    logout: authModule.logout,
    toggleWeeklyFullscreen: uiModule.toggleWeeklyFullscreen
};

// Expose globally
window.app = app;
