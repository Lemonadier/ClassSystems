/**
 * Authentication & Session Management
 */

const authModule = {
    checkSetupStatus: async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`${CONFIG.apiUrl}?op=get_status`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            const data = await res.json();
            if (data.status === 'success' && data.setup_required) {
                CONFIG.isSetupMode = true;
                document.getElementById('msg-setup-required').classList.remove('hidden');
                window.switchAuthTab('teacher');
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                Swal.fire('Error', 'API connection timeout - Invalid API Key or server unreachable', 'error');
            }
            document.getElementById('connection-status').classList.remove('hidden');
        }
    },

    handleTeacherLogin: async (e) => { 
        e.preventDefault();
        const key = document.getElementById('login-teacher-key').value.trim();
        if(key) {
             app.loading(true);
             const op = CONFIG.isSetupMode ? 'setup_admin' : 'verify_auth';
             const res = await fetch(CONFIG.apiUrl, { method: 'POST', body: JSON.stringify({ op, adminKey: key }) });
             const d = await res.json();
             app.loading(false);
             if(d.status === 'success') { 
                 localStorage.setItem('cb_session_token', key);
                 // persist the API URL and key permanently when teacher logs in
                 const apiInputVal = document.getElementById('api-url')?.value?.trim();
                 if(apiInputVal) {
                     localStorage.setItem('cb_api_url', apiInputVal);
                     localStorage.setItem('cb_session_api_url', apiInputVal);
                     localStorage.setItem('cb_teacher_api_key', apiInputVal);
                 } else {
                     const existing = localStorage.getItem('cb_api_url') || localStorage.getItem('cb_session_api_url') || localStorage.getItem('cb_teacher_api_key') || CONFIG.apiUrl || '';
                     if(existing) { localStorage.setItem('cb_api_url', existing); localStorage.setItem('cb_session_api_url', existing); localStorage.setItem('cb_teacher_api_key', existing); }
                 }
                 localStorage.setItem('cb_session_expiry', Date.now() + CONFIG.sessionTimeout);
                 CONFIG.role = 'teacher';
                 app.showLauncher();
             } else Swal.fire('Error', d.message, 'error');
        }
    },

    handleStudentLogin: (e) => {
        e.preventDefault();
        const id = document.getElementById('login-student-id').value.trim();
        app.loading(true);
        app.fetchData(async () => {
            const s = state.students.find(x => String(x['Student ID']).toLowerCase() === id.toLowerCase());
            app.loading(false);
            if (s) { 
                localStorage.setItem('cb_session_user', JSON.stringify(s));
                localStorage.setItem('cb_session_role', 'parent');
                localStorage.setItem('cb_session_expiry', Date.now() + CONFIG.sessionTimeout);
                CONFIG.role = 'parent'; CONFIG.user = s;
                app.showLauncher();
            } else Swal.fire('Not Found', 'Student ID not found', 'error');
        });
    },

    generateParentMagicLink: () => {
        if (!CONFIG.user || CONFIG.role !== 'parent') { Swal.fire('Error', 'Only parents can generate a magic link', 'error'); return; }
        const childId = CONFIG.user['Student ID'];
        const apiUrl = CONFIG.apiUrl || localStorage.getItem('cb_api_url') || '';
        if (!apiUrl) { Swal.fire('Error', 'API URL not configured', 'error'); return; }
        const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?role=parent&childId=${encodeURIComponent(childId)}&apiUrl=${btoa(apiUrl)}`;
        navigator.clipboard.writeText(link);
        Swal.fire('Success', 'Magic link copied to clipboard', 'success');
    },

    logout: () => { localStorage.clear(); location.reload(); }
};
