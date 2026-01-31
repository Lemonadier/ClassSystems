/**
 * ClassMainframe v11.0 Logic (Multi-System)
 */

const SYSTEMS = {
    bank: { 
        name_en: "Financial", name_th: "การเงิน", icon: "fa-vault", color: "bg-indigo-600",
        unit: "฿", isCumulative: true, 
        stat1: "Net Balance", stat2: "Entries"
    },
    attendance: { 
        name_en: "Attendance", name_th: "เช็คชื่อ", icon: "fa-calendar-check", color: "bg-emerald-600",
        unit: "%", isCumulative: false,
        stat1: "Attendance Rate", stat2: "Days Logged"
    },
    health: { 
        name_en: "Health (BMI)", name_th: "สุขภาพ", icon: "fa-heart-pulse", color: "bg-rose-600",
        unit: "BMI", isCumulative: false,
        stat1: "Avg BMI", stat2: "Measurements"
    },
    profile: { 
        name_en: "Profile", name_th: "ประวัติ", icon: "fa-user-astronaut", color: "bg-amber-600",
        unit: "Pts", isCumulative: false,
        stat1: "Avg Intel", stat2: "Mood Logs"
    }
};

const i18n = {
    en: {
        app_name: "ClassMainframe", app_subtitle: "Integrated Management", api_not_connected: "API Not Connected",
        role_student: "Student / Parent", role_teacher: "Teacher",
        label_student_id: "Student ID", btn_view_wallet: "Enter System",
        label_access_pin: "Admin Key", btn_enter_dashboard: "Login", btn_setup: "Setup",
        nav_dashboard: "Dashboard", nav_students: "Data", nav_history: "History", nav_settings: "Settings", nav_logout: "Logout",
        title_overview: "Overview", section_actions: "Quick Actions", label_active_system: "Active System",
        btn_new_tx: "New Entry", btn_add_student: "Add Student", btn_batch_add: "Batch Add", btn_batch_tx: "Batch Entry",
        modal_settings_title: "Settings", label_api_url: "API URL", label_new_key: "Admin Key", btn_copy_link: "Copy Link",
        btn_cancel: "Cancel", btn_save: "Save", btn_confirm: "Confirm", btn_submit: "Submit",
        err_select_student: "Select a student", msg_setup_required: "First Time Setup:", msg_create_admin: "Create Admin Key",
        label_student: "Student", label_date: "Date", btn_switch_sys: "Switch System", launcher_title: "Select Module",
        // System Specific
        label_deposit: "Deposit", label_withdraw: "Withdraw", label_present: "Present", label_late: "Late", label_absent: "Absent",
        label_weight: "Weight (kg)", label_height: "Height (cm)", label_mood: "Mood", label_intel: "Intel Score"
    },
    th: {
        app_name: "ClassMainframe", app_subtitle: "ระบบบริหารจัดการรวม", api_not_connected: "ยังไม่เชื่อมต่อ API",
        role_student: "นักเรียน / ผู้ปกครอง", role_teacher: "ครูผู้สอน",
        label_student_id: "รหัสนักเรียน", btn_view_wallet: "เข้าสู่ระบบ",
        label_access_pin: "รหัส Admin", btn_enter_dashboard: "เข้าสู่ระบบ", btn_setup: "ตั้งค่า",
        nav_dashboard: "ภาพรวม", nav_students: "ข้อมูล", nav_history: "ประวัติ", nav_settings: "ตั้งค่า", nav_logout: "ออกระบบ",
        title_overview: "ภาพรวม", section_actions: "เมนูด่วน", label_active_system: "ระบบทำงาน",
        btn_new_tx: "เพิ่มข้อมูล", btn_add_student: "เพิ่มนักเรียน", btn_batch_add: "เพิ่มหมู่", btn_batch_tx: "บันทึกหมู่",
        modal_settings_title: "ตั้งค่า", label_api_url: "ลิงก์ API", label_new_key: "คีย์ผู้ดูแล", btn_copy_link: "คัดลอกลิงก์",
        btn_cancel: "ยกเลิก", btn_save: "บันทึก", btn_confirm: "ยืนยัน", btn_submit: "ตกลง",
        err_select_student: "เลือกนักเรียน", msg_setup_required: "เริ่มใช้งาน:", msg_create_admin: "สร้างรหัส Admin",
        label_student: "นักเรียน", label_date: "วันที่", btn_switch_sys: "สลับระบบ", launcher_title: "เลือกเมนู",
        // System Specific
        label_deposit: "ฝาก", label_withdraw: "ถอน", label_present: "มา", label_late: "สาย", label_absent: "ขาด",
        label_weight: "น้ำหนัก (กก.)", label_height: "ส่วนสูง (ซม.)", label_mood: "อารมณ์", label_intel: "คะแนนทักษะ"
    }
};

const CONFIG = {
    get apiUrl() { return localStorage.getItem('cb_api_url') || ''; },
    get adminKey() { return localStorage.getItem('cb_session_token') || ''; },
    get lang() { return localStorage.getItem('cb_lang') || 'en'; },
    role: null, user: null, activeSystem: null, sessionTimeout: 20 * 60 * 1000
};

const state = { students: [], transactions: [], tableMode: 'students', isFetching: false, chartType: 'bar' };

const app = {
    init: () => {
        app.setLang(CONFIG.lang);
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get('config')) {
             try { localStorage.setItem('cb_api_url', atob(urlParams.get('config'))); window.history.replaceState({}, document.title, window.location.pathname); } catch(e){}
        }

        const expiry = parseInt(localStorage.getItem('cb_session_expiry') || '0');
        if (expiry > Date.now()) {
            CONFIG.role = localStorage.getItem('cb_session_role');
            if (CONFIG.role === 'student') CONFIG.user = JSON.parse(localStorage.getItem('cb_session_user'));
            app.showLauncher();
        } else if(expiry > 0) app.logout();

        if(!CONFIG.apiUrl) document.getElementById('connection-status')?.classList.remove('hidden');
        else if(!CONFIG.role) app.checkSetupStatus();

        // Hide weekly attendance button initially (only for attendance system)
        const weeklyBtn = document.getElementById('btn-chart-weekly-attendance');
        if(weeklyBtn) weeklyBtn.style.display = 'none';

        // Bind Forms
        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onsubmit = fn; };
        bind('form-login-teacher', app.handleTeacherLogin);
        bind('form-login-student', app.handleStudentLogin);
        bind('form-transaction', app.handleTransaction);
        bind('form-add-student', app.handleAddStudent);
        
        document.getElementById('search-input').oninput = (e) => app.renderTable(e.target.value);
    },

    setLang: (lang) => {
        localStorage.setItem('cb_lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(i18n[lang][key]) el.textContent = i18n[lang][key];
        });
    },

    loading: (show) => {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 z-[999] bg-black/30 flex items-center justify-center hidden';
            loader.innerHTML = '<div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>';
            document.body.appendChild(loader);
        }
        loader.classList.toggle('hidden', !show);
    },

    // --- LAUNCHER ---
    showLauncher: () => {
        document.getElementById('view-auth').classList.add('hidden');
        document.getElementById('view-app').classList.add('hidden');
        document.getElementById('view-launcher').classList.remove('hidden');
        
        const grid = document.getElementById('launcher-grid');
        grid.innerHTML = Object.entries(SYSTEMS).map(([id, sys]) => `
            <button onclick="app.enterSystem('${id}')" class="bg-white p-6 rounded-3xl shadow hover:shadow-xl transition-all flex items-center gap-4 text-left group w-full border border-transparent hover:border-indigo-200">
                <div class="w-12 h-12 rounded-xl ${sys.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fa-solid ${sys.icon} text-xl"></i>
                </div>
                <div><div class="font-bold text-lg text-slate-800">${CONFIG.lang === 'th' ? sys.name_th : sys.name_en}</div></div>
            </button>
        `).join('');
    },

    enterSystem: (sysId) => {
        CONFIG.activeSystem = sysId;
        state.chartType = 'bar'; // Reset chart type when switching systems
        const sys = SYSTEMS[sysId];
        document.getElementById('view-launcher').classList.add('hidden');
        document.getElementById('view-app').classList.remove('hidden');
        
        document.getElementById('active-sys-icon').className = `w-8 h-8 rounded-lg ${sys.color} text-white flex items-center justify-center`;
        document.getElementById('active-sys-icon').innerHTML = `<i class="fa-solid ${sys.icon}"></i>`;
        document.getElementById('active-sys-name').textContent = CONFIG.lang === 'th' ? sys.name_th : sys.name_en;
        
        document.getElementById('label-stat-1').textContent = sys.stat1;
        document.getElementById('label-stat-2').textContent = sys.stat2;

        // Update chart buttons visibility (weekly only for attendance)
        const weeklyBtn = document.getElementById('btn-chart-weekly-attendance');
        if(weeklyBtn) {
            weeklyBtn.style.display = sysId === 'attendance' ? 'flex' : 'none';
        }

        app.updateActionsMenu();
        app.fetchData();
        app.switchTab('dashboard');
    },

    updateActionsMenu: () => {
        const c = document.getElementById('dynamic-actions');
        if (!c) return;
        const lang = i18n[CONFIG.lang];
        const sys = SYSTEMS[CONFIG.activeSystem];
        let html = '';
        
        // System-specific actions
        if (CONFIG.activeSystem === 'bank') {
            html = `
                <button onclick="openModal('transaction')" class="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i class="fa-solid fa-money-bill-transfer"></i></div>
                    <div class="font-semibold text-slate-700 text-sm">${lang.btn_new_tx}</div>
                </button>
            `;
            if (CONFIG.role === 'teacher') {
                html += `
                    <button onclick="openModal('add-student')" class="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><i class="fa-solid fa-user-plus"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_add_student}</div>
                    </button>
                    <button onclick="openModal('batch-student')" class="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><i class="fa-solid fa-users"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_batch_add}</div>
                    </button>
                    <button onclick="openModal('multi-tx')" class="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors"><i class="fa-solid fa-layer-group"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_batch_tx}</div>
                    </button>
                `;
            }
        } else if (CONFIG.activeSystem === 'attendance') {
            html = `
                <button onclick="openModal('transaction')" class="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><i class="fa-solid fa-check-circle"></i></div>
                    <div class="font-semibold text-slate-700 text-sm">${lang.btn_new_tx}</div>
                </button>
            `;
            if (CONFIG.role === 'teacher') {
                html += `
                    <button onclick="openModal('multi-tx')" class="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><i class="fa-solid fa-users-check"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_batch_tx}</div>
                    </button>
                `;
            }
        } else if (CONFIG.activeSystem === 'health') {
            html = `
                <button onclick="openModal('transaction')" class="p-4 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50 transition-all group text-left">
                    <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors"><i class="fa-solid fa-weight-scale"></i></div>
                    <div class="font-semibold text-slate-700 text-sm">${lang.btn_new_tx}</div>
                </button>
            `;
            if (CONFIG.role === 'teacher') {
                html += `
                    <button onclick="openModal('multi-tx')" class="p-4 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors"><i class="fa-solid fa-heart-pulse"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_batch_tx}</div>
                    </button>
                `;
            }
        } else if (CONFIG.activeSystem === 'profile') {
            html = `
                <button onclick="openModal('transaction')" class="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all group text-left">
                    <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors"><i class="fa-solid fa-pencil"></i></div>
                    <div class="font-semibold text-slate-700 text-sm">${lang.btn_new_tx}</div>
                </button>
            `;
            if (CONFIG.role === 'teacher') {
                html += `
                    <button onclick="openModal('multi-tx')" class="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all group text-left">
                        <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors"><i class="fa-solid fa-users"></i></div>
                        <div class="font-semibold text-slate-700 text-sm">${lang.btn_batch_tx}</div>
                    </button>
                `;
            }
        }
        
        c.innerHTML = html;
    },

    // --- DATA ---
    fetchData: async (cb) => {
        if (!CONFIG.apiUrl || state.isFetching) return;
        state.isFetching = true;
        app.loading(true);
        try {
            const url = `${CONFIG.apiUrl}?op=get_data&system=${CONFIG.activeSystem}`;
            console.log('Fetching from:', url, 'System:', CONFIG.activeSystem);
            const res = await fetch(url);
            const data = await res.json();
            console.log('Received data:', data);
            if (data.status === 'success') {
                state.students = data.students || [];
                state.transactions = data.transactions || [];
                console.log('Loaded students:', state.students.length, 'transactions:', state.transactions.length);
                app.processData();
            } else {
                console.error('API returned error:', data.message);
            }
        } catch (e) { 
            console.error('Fetch error:', e);
        } finally { 
            state.isFetching = false; 
            app.loading(false); 
            if (cb) cb(); 
        }
    },

    processData: () => {
        const sys = SYSTEMS[CONFIG.activeSystem];
        let total = 0, count = 0;
        
        state.students.forEach(s => { s.balance = 0; s.dataPoints = 0; });
        
        state.transactions.forEach(t => {
            const s = state.students.find(x => String(x['Student ID']) === String(t['Student ID']));
            if (s) {
                if (CONFIG.activeSystem === 'bank') {
                    const val = parseFloat(t.Amount) || 0;
                    if (t.Type === 'Deposit') s.balance += val; else s.balance -= val;
                } else if (CONFIG.activeSystem === 'attendance') {
                    // Status: Present=1, Late=0.5, Absent=0
                    const statusVal = t.Status === 'Present' ? 1 : (t.Status === 'Late' ? 0.5 : 0);
                    s.balance += statusVal;
                    s.dataPoints++;
                } else if (CONFIG.activeSystem === 'health') {
                    const bmi = parseFloat(t.BMI) || 0;
                    s.balance = bmi; // Latest BMI
                } else if (CONFIG.activeSystem === 'profile') {
                    const score = parseFloat(t.Score) || 0;
                    s.balance = score; // Latest score
                }
            }
        });

        // Calculate specific metrics
        if (CONFIG.activeSystem === 'attendance') {
             state.students.forEach(s => {
                  s.balance = s.dataPoints > 0 ? ((s.balance / s.dataPoints) * 100).toFixed(0) : 0;
             });
        }
        
        const current = state.students.find(s => s['Student ID'] == CONFIG.user?.['Student ID']);
        
        // Calculate Global Stat
        let globalMetric = 0;
        if (CONFIG.role === 'teacher') {
             if (CONFIG.activeSystem === 'bank') globalMetric = state.students.reduce((acc, s) => acc + s.balance, 0);
             else globalMetric = state.students.length > 0 ? (state.students.reduce((acc, s) => acc + parseFloat(s.balance), 0) / state.students.length) : 0;
        }

        const displayMetric = CONFIG.role === 'student' ? (current?.balance || 0) : globalMetric;
        
        document.getElementById('stat-balance').textContent = `${sys.unit === '฿' ? '฿' : ''}${app.formatMoney(displayMetric)} ${sys.unit !== '฿' ? sys.unit : ''}`;
        document.getElementById('stat-count').textContent = state.transactions.length;
        
        app.renderTable();
        app.updateSelectOptions();
        app.renderStudentCards();
        app.renderCharts();
    },

    renderStudentCards: () => {
        const container = document.getElementById('student-cards');
        if(!container) return;
        const sys = CONFIG.activeSystem;
        const lang = i18n[CONFIG.lang];
        
        container.innerHTML = state.students.map(s => {
            let dataDisplay = '';
            if(sys === 'bank') {
                dataDisplay = `<div class="text-2xl font-bold text-indigo-600">฿${app.formatMoney(s.balance)}</div>`;
            } else if(sys === 'attendance') {
                dataDisplay = `<div class="text-2xl font-bold text-emerald-600">${s.balance || 0}%</div>`;
            } else if(sys === 'health') {
                dataDisplay = `<div class="text-2xl font-bold text-rose-600">${s.balance || 'N/A'}</div>`;
            } else if(sys === 'profile') {
                dataDisplay = `<div class="text-2xl font-bold text-amber-600">${s.balance || 0}</div>`;
            }
            
            return `
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <p class="text-sm text-slate-500 font-medium">${s.No}. ${s.Name}</p>
                            <p class="text-xs text-slate-400">Grade ${s.Grade}</p>
                        </div>
                    </div>
                    ${dataDisplay}
                </div>
            `;
        }).join('');
    },

    // --- MODAL INPUTS ---
    updateSelectOptions: () => {
        const sys = CONFIG.activeSystem;
        const lang = i18n[CONFIG.lang];
        const dynTx = document.getElementById('dynamic-tx-fields');
        
        if (sys === 'bank') {
            dynTx.innerHTML = `<div class="grid grid-cols-2 gap-2"><label class="cursor-pointer"><input type="radio" name="tx-type" value="Deposit" checked class="peer sr-only"><div class="p-2 text-center rounded border peer-checked:bg-emerald-500 peer-checked:text-white font-bold text-xs">${lang.label_deposit}</div></label><label class="cursor-pointer"><input type="radio" name="tx-type" value="Withdraw" class="peer sr-only"><div class="p-2 text-center rounded border peer-checked:bg-red-500 peer-checked:text-white font-bold text-xs">${lang.label_withdraw}</div></label></div><input type="number" id="tx-amount" step="0.01" placeholder="${lang.label_amount}" class="w-full p-3 rounded-xl border outline-none">`;
        } else if (sys === 'attendance') {
            dynTx.innerHTML = `<select id="tx-status" class="w-full p-3 rounded-xl border outline-none"><option value="Present">${lang.label_present}</option><option value="Late">${lang.label_late}</option><option value="Absent">${lang.label_absent}</option></select>`;
        } else if (sys === 'health') {
            dynTx.innerHTML = `<div class="grid grid-cols-2 gap-2"><input type="number" id="health-w" placeholder="${lang.label_weight}" class="p-3 border rounded-xl outline-none"><input type="number" id="health-h" placeholder="${lang.label_height}" class="p-3 border rounded-xl outline-none"></div>`;
        } else if (sys === 'profile') {
             dynTx.innerHTML = `<select id="profile-mood" class="w-full p-3 rounded-xl border outline-none"><option value="Happy">😊 Happy</option><option value="Neutral">😐 Neutral</option><option value="Sad">😢 Sad</option></select><input type="number" id="profile-score" placeholder="${lang.label_intel}" class="w-full p-3 border rounded-xl outline-none">`;
        }
        
        const sel = document.getElementById('tx-student');
        sel.innerHTML = '<option value="">Select Student...</option>';
        state.students.sort((a,b) => (a.No||0)-(b.No||0)).forEach(s => {
            sel.innerHTML += `<option value="${s['Student ID']}">${s.No}. ${s.Name}</option>`;
        });
        
        // Date Init
        const now = new Date();
        const dateInput = document.getElementById('tx-date');
        if(dateInput) dateInput.value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    },

    handleTransaction: async (e) => {
        e.preventDefault();
        const sid = document.getElementById('tx-student').value;
        const date = document.getElementById('tx-date').value;
        const sys = CONFIG.activeSystem;
        let amount = 0, type = "Entry", note = "";
        
        if (sys === 'bank') {
            type = document.querySelector('input[name="tx-type"]:checked').value;
            amount = parseFloat(document.getElementById('tx-amount').value);
        } else if (sys === 'attendance') {
            const status = document.getElementById('tx-status').value;
            type = status; 
            amount = status === 'Present' ? 1 : (status === 'Late' ? 0.5 : 0);
        } else if (sys === 'health') {
            const w = parseFloat(document.getElementById('health-w').value);
            const h = parseFloat(document.getElementById('health-h').value);
            amount = (w / ((h/100)*(h/100))).toFixed(2);
            type = "BMI Check";
            note = `W:${w} H:${h}`;
        } else if (sys === 'profile') {
             type = document.getElementById('profile-mood').value;
             amount = parseFloat(document.getElementById('profile-score').value) || 0;
             note = "Mood Update";
        }

        const payload = { op: 'add_transaction', studentId: sid, type, amount, date, note, system: sys };
        if(sys === 'health') { payload.weight = document.getElementById('health-w').value; payload.height = document.getElementById('health-h').value; payload.bmi = amount; }
        
        console.log('Posting transaction payload', payload);
        const success = await app.postData(payload, 'Saved');
        if (success) e.target.reset();
    },

    // --- VISUALIZATION ---
    renderTable: (filter='') => {
        const tbody = document.getElementById('table-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        // Get filter values
        const searchVal = document.getElementById('search-input')?.value?.toLowerCase() || '';
        const src = state.tableMode === 'students' ? state.students : state.transactions;
        const isHistory = state.tableMode === 'history';
        const sys = SYSTEMS[CONFIG.activeSystem];

        console.log('RenderTable - Mode:', state.tableMode, 'System:', CONFIG.activeSystem, 'Items:', src.length);

        src.forEach(item => {
            if(!isHistory) {
                // Student List - Show ID, Name, Class, No, Data
                if(item.Name && item.Name.toLowerCase().includes(searchVal)) {
                     let display = CONFIG.activeSystem === 'bank' ? `฿${app.formatMoney(item.balance)}` : item.balance;
                     if(CONFIG.activeSystem === 'attendance') display += '%';
                     tbody.innerHTML += `<tr><td class="p-3 text-xs">${item["Student ID"]}</td><td class="p-3">${item.Name}</td><td class="p-3 text-xs text-center">${item.Grade}</td><td class="p-3 text-xs text-center">${item.No}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>`;
                }
            } else {
                 // History with filters - handle different column names per system
                 const s = state.students.find(x => x['Student ID'] == item['Student ID']);
                 if(!s) return;
                 
                 const txDate = new Date(item.Date);
                 const dateFrom = document.getElementById('filter-date-from')?.value;
                 const dateTo = document.getElementById('filter-date-to')?.value;
                 
                 const matchesSearch = s.Name.toLowerCase().includes(searchVal);
                 const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
                 const matchesDateTo = !dateTo || txDate <= new Date(dateTo);
                 
                 if (matchesSearch && matchesDateFrom && matchesDateTo) {
                     if (CONFIG.role === 'teacher' || String(s['Student ID']) === String(CONFIG.user?.['Student ID'])) {
                         const dateStr = new Date(item.Date).toLocaleDateString();
                         
                         // Get the right display values based on system
                         let typeDisplay = '', valueDisplay = '';
                         if (CONFIG.activeSystem === 'bank') {
                             typeDisplay = item.Type || 'Unknown';
                             valueDisplay = item.Amount || 0;
                         } else if (CONFIG.activeSystem === 'attendance') {
                             typeDisplay = item.Status || 'Unknown';
                             valueDisplay = '';
                         } else if (CONFIG.activeSystem === 'health') {
                             typeDisplay = `W:${item.Weight} H:${item.Height}`;
                             valueDisplay = item.BMI || 0;
                         } else if (CONFIG.activeSystem === 'profile') {
                             typeDisplay = item.Mood || 'Unknown';
                             valueDisplay = item.Score || 0;
                         }
                         
                         tbody.innerHTML += `<tr><td class="p-3 text-xs"><b>${s.Name}</b><br><span class="text-gray-400">${typeDisplay} (${dateStr})</span></td><td class="p-3 text-right font-mono">${valueDisplay}</td></tr>`;
                     }
                 }
            }
        });
    },

    renderCharts: () => {
        const ctx = document.getElementById('balanceChart');
        const weeklyContainer = document.getElementById('weekly-attendance-container');
        if(!ctx) return;
        
        const chartType = state.chartType || 'bar';
        
        // Show/hide appropriate containers
        if(chartType === 'weekly-attendance' && CONFIG.activeSystem === 'attendance') {
            if(window.myChart) window.myChart.destroy();
            ctx.style.display = 'none';
            weeklyContainer.style.display = 'block';
            app.renderWeeklyAttendance();
            return;
        } else {
            ctx.style.display = 'block';
            weeklyContainer.style.display = 'none';
        }
        
        if(window.myChart) window.myChart.destroy();
        
        // Get filters
        const studentFilter = document.getElementById('analytics-student-filter')?.value || '';
        const dateFrom = document.getElementById('analytics-date-from')?.value;
        const dateTo = document.getElementById('analytics-date-to')?.value;
        
        // Filter students and transactions
        let filteredStudents = state.students.map(s => ({...s, balance: 0}));
        if(studentFilter) {
            filteredStudents = state.students.filter(s => s['Student ID'] === studentFilter).map(s => ({...s, balance: 0}));
        }
        
        let filteredTxns = state.transactions;
        if(dateFrom || dateTo) {
            filteredTxns = state.transactions.filter(t => {
                const txDate = new Date(t.Date);
                const match = (!dateFrom || txDate >= new Date(dateFrom)) && (!dateTo || txDate <= new Date(dateTo));
                return match;
            });
        }
        
        // Calculate data based on system and chart type
        const labels = filteredStudents.map(s => s.Name);
        let datasets = [];
        
        if(CONFIG.activeSystem === 'attendance' && (chartType === 'frequency' || chartType === 'rate')) {
            // For attendance: calculate frequency and rate
            const present = new Array(filteredStudents.length).fill(0);
            const late = new Array(filteredStudents.length).fill(0);
            const absent = new Array(filteredStudents.length).fill(0);
            
            filteredTxns.forEach(t => {
                const idx = filteredStudents.findIndex(s => String(s['Student ID']) === String(t['Student ID']));
                if (idx >= 0) {
                    const status = t.Status || t.Type;
                    if (status === 'Present') present[idx]++;
                    else if (status === 'Late') late[idx]++;
                    else if (status === 'Absent') absent[idx]++;
                }
            });
            
            if(chartType === 'frequency') {
                datasets = [
                    { label: 'Present', data: present, backgroundColor: '#10b981' },
                    { label: 'Late', data: late, backgroundColor: '#f59e0b' },
                    { label: 'Absent', data: absent, backgroundColor: '#ef4444' }
                ];
            } else if(chartType === 'rate') {
                const total = present.map((p, i) => p + late[i] + absent[i]);
                const presentRate = present.map((p, i) => total[i] > 0 ? ((p / total[i]) * 100).toFixed(1) : 0);
                const lateRate = late.map((l, i) => total[i] > 0 ? ((l / total[i]) * 100).toFixed(1) : 0);
                const absentRate = absent.map((a, i) => total[i] > 0 ? ((a / total[i]) * 100).toFixed(1) : 0);
                
                datasets = [
                    { label: 'Present %', data: presentRate, backgroundColor: '#10b981' },
                    { label: 'Late %', data: lateRate, backgroundColor: '#f59e0b' },
                    { label: 'Absent %', data: absentRate, backgroundColor: '#ef4444' }
                ];
            }
        } else {
            // Standard balance calculation
            filteredStudents.forEach(s => { s.balance = 0; });
            filteredTxns.forEach(t => {
                const s = filteredStudents.find(x => String(x['Student ID']) === String(t['Student ID']));
                if (s) {
                    const val = parseFloat(t.Amount) || 0;
                    if (CONFIG.activeSystem === 'bank') {
                        if (t.Type === 'Deposit') s.balance += val; else s.balance -= val;
                    } else {
                        s.balance = val;
                    }
                }
            });
            
            datasets = [{
                label: SYSTEMS[CONFIG.activeSystem].unit,
                data: filteredStudents.map(s => s.balance),
                backgroundColor: '#4f46e5',
                borderColor: '#4338ca',
                borderWidth: 1
            }];
        }
        
        window.myChart = new Chart(ctx, {
            type: chartType === 'frequency' || chartType === 'rate' ? 'bar' : chartType,
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                }
            }
        });
        
        // Populate student filter
        const filter = document.getElementById('analytics-student-filter');
        if(filter && filter.children.length === 1) {
            state.students.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s['Student ID'];
                opt.textContent = s.Name;
                filter.appendChild(opt);
            });
        }
    },

    renderWeeklyAttendance: () => {
        const container = document.getElementById('weekly-attendance-container');
        if(!container) return;
        
        const studentFilter = document.getElementById('analytics-student-filter')?.value || '';
        const dateFrom = document.getElementById('analytics-date-from')?.value;
        const dateTo = document.getElementById('analytics-date-to')?.value;
        
        // Filter transactions
        let filteredTxns = state.transactions;
        if(dateFrom || dateTo) {
            filteredTxns = state.transactions.filter(t => {
                const txDate = new Date(t.Date);
                const match = (!dateFrom || txDate >= new Date(dateFrom)) && (!dateTo || txDate <= new Date(dateTo));
                return match;
            });
        }
        
        // Get students to display
        let displayStudents = state.students;
        if(studentFilter) {
            displayStudents = state.students.filter(s => s['Student ID'] === studentFilter);
        }
        
        // Build week grid for each student
        let html = '<div class="space-y-6">';
        
        displayStudents.forEach(student => {
            const studentTxns = filteredTxns.filter(t => String(t['Student ID']) === String(student['Student ID']));
            
            // Group by week
            const weekMap = {};
            studentTxns.forEach(txn => {
                const date = new Date(txn.Date);
                const weekStart = new Date(date);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if(!weekMap[weekKey]) weekMap[weekKey] = {};
                const dateKey = date.toISOString().split('T')[0];
                weekMap[weekKey][dateKey] = txn.Status || txn.Type;
            });
            
            // Get all days from dateFrom to dateTo and group by week
            const allDays = {};
            const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90*24*60*60*1000); // Last 90 days default
            const endDate = dateTo ? new Date(dateTo) : new Date();
            
            for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const weekStart = new Date(d);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if(!allDays[weekKey]) allDays[weekKey] = {};
                allDays[weekKey][dateKey] = null;
            }
            
            // Merge transaction data into all days
            Object.keys(weekMap).forEach(week => {
                if(!allDays[week]) allDays[week] = {};
                Object.assign(allDays[week], weekMap[week]);
            });
            
            // Render student's weeks
            const weeks = Object.keys(allDays).sort();
            if(weeks.length === 0) return;
            
            html += `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 class="font-bold text-slate-700 mb-3">${student.Name} - ${student.Grade}</h4>
                <div class="space-y-2">`;
            
            weeks.forEach(weekKey => {
                const weekDate = new Date(weekKey);
                const weekEnd = new Date(weekDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekLabel = `${weekDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${weekEnd.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`;
                
                html += `<div class="flex gap-1 items-center">
                    <span class="text-xs text-slate-500 font-semibold w-20 truncate" title="${weekLabel}">${weekLabel}</span>
                    <div class="flex gap-1">`;
                
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const days = Object.keys(allDays[weekKey]).sort();
                
                days.forEach(dateKey => {
                    const date = new Date(dateKey);
                    const status = allDays[weekKey][dateKey];
                    const dayName = dayNames[date.getDay()];
                    
                    let bgColor = 'bg-gray-100';
                    let icon = '○';
                    let title = 'No data';
                    
                    if(status === 'Present') {
                        bgColor = 'bg-green-100 text-green-700';
                        icon = '✓';
                        title = 'Present';
                    } else if(status === 'Late') {
                        bgColor = 'bg-amber-100 text-amber-700';
                        icon = '◑';
                        title = 'Late';
                    } else if(status === 'Absent') {
                        bgColor = 'bg-red-100 text-red-700';
                        icon = '✗';
                        title = 'Absent';
                    }
                    
                    html += `<div class="w-8 h-8 flex items-center justify-center rounded-md ${bgColor} text-xs font-bold cursor-help" title="${title}">${icon}</div>`;
                });
                
                html += `</div></div>`;
            });
            
            html += `</div></div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    setChartType: (type) => {
        state.chartType = type;
        const buttons = document.querySelectorAll('[id^="btn-chart-"]');
        buttons.forEach(btn => {
            btn.classList.remove('text-indigo-600', 'bg-white', 'shadow-sm');
            btn.classList.add('text-slate-500');
        });
        const activeBtn = document.getElementById(`btn-chart-${type}`);
        if(activeBtn) {
            activeBtn.classList.remove('text-slate-500');
            activeBtn.classList.add('text-indigo-600', 'bg-white', 'shadow-sm');
        }
        
        app.renderCharts();
    },

    chartSelectAll: () => {
        document.querySelectorAll('#chart-student-list input[type="checkbox"]').forEach(cb => cb.checked = true);
    },

    chartClearAll: () => {
        document.querySelectorAll('#chart-student-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    },

    // --- CORE ---
    formatMoney: (n) => parseFloat(n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
    postData: async (payload, msg) => {
        app.loading(true);
        payload.adminKey = CONFIG.adminKey; payload.system = CONFIG.activeSystem;
        try {
            const res = await fetch(CONFIG.apiUrl, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.status === 'success') { await app.fetchData(null, true); Swal.fire('Success', msg, 'success'); return true; }
            else if (data.message.includes("Unauthorized")) app.logout();
        } catch(e) {} finally { app.loading(false); }
        return false;
    },
    
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
                localStorage.setItem('cb_session_role', 'student');
                localStorage.setItem('cb_session_expiry', Date.now() + CONFIG.sessionTimeout);
                CONFIG.role = 'student'; CONFIG.user = s;
                app.showLauncher();
            } else Swal.fire('Not Found', 'Student ID not found', 'error');
        });
    },
    
    switchTab: (t) => {
        // Hide all tabs
        document.querySelectorAll('.app-tab').forEach(el => el.classList.add('hidden'));
        
        // Show selected tab
        const tabEl = document.getElementById(`tab-${t}`);
        if(tabEl) tabEl.classList.remove('hidden');
        
        // Update sidebar nav highlighting
        ['dashboard','students','analytics'].forEach(n => {
            const el = document.getElementById(`nav-${n}`);
            if(el) {
                const isActive = (n === 'dashboard' && t === 'dashboard') || 
                                (n === 'students' && t === 'students') ||
                                (n === 'analytics' && t === 'analytics');
                el.className = `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`;
            }
        });
        
        // Update transactions nav button to also highlight when students tab is active
        const txBtn = document.getElementById('nav-transactions');
        if(txBtn) {
            const isActive = t === 'students';
            txBtn.className = `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`;
        }
        
        // Update Data/History button highlights when on students tab
        if(t === 'students') {
            const dataBtn = document.getElementById('btn-mode-students');
            const historyBtn = document.getElementById('btn-mode-history');
            if(dataBtn && historyBtn) {
                if(state.tableMode === 'students') {
                    dataBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-600 transition-all shadow-sm';
                    historyBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all';
                } else {
                    dataBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all';
                    historyBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-600 transition-all shadow-sm';
                }
            }
        }
        
        // Render table if switching to data tabs
        if(t === 'students') app.renderTable();
    },

    saveSettings: async () => {
        const url = document.getElementById('api-url').value.trim();
        if(url) localStorage.setItem('cb_api_url', url);
        location.reload();
    },
    copyShareLink: () => { const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?config=${btoa(CONFIG.apiUrl)}`; navigator.clipboard.writeText(link); Swal.fire('Copied', '', 'success'); },
    handleAddStudent: async (e) => {
        e.preventDefault();
        await app.postData({ op: 'add_student', studentId: document.getElementById('new-id').value, name: document.getElementById('new-name').value, grade: document.getElementById('new-grade').value, no: document.getElementById('new-no').value }, 'Student Added');
    },
    processBatchStudents: async () => {
        const batch = document.getElementById('batch-input').value.split('\n').map(l => {
            const p = l.split(/[\t,]+/).map(s => s.trim());
            return p.length >= 2 ? { studentId: p[0], name: p[1], grade: p[2]||'', no: p[3]||'' } : null;
        }).filter(x => x);
        if(batch.length) await app.postData({ op: 'batch_add_students', students: batch }, 'Batch Added');
    },
    processMultiTx: async () => {
        const checklist = document.querySelectorAll('#multi-student-list input[type="checkbox"]:checked');
        if (checklist.length === 0) { Swal.fire('Info', 'Select at least one student', 'info'); return; }
        
        const sys = CONFIG.activeSystem;
        const transactions = [];
        const date = new Date().toISOString().split('T')[0];
        
        checklist.forEach(checkbox => {
            const sid = checkbox.value;
            let type = 'Entry', amount = 1, note = '';
            
            if (sys === 'bank') {
                type = document.querySelector('input[name="multi-type"]:checked')?.value || 'Deposit';
                amount = parseFloat(document.getElementById('multi-amount')?.value) || 0;
            } else if (sys === 'attendance') {
                type = document.getElementById('multi-status')?.value || 'Present';
                amount = type === 'Present' ? 1 : (type === 'Late' ? 0.5 : 0);
            } else if (sys === 'health') {
                const w = parseFloat(document.getElementById('multi-weight')?.value) || 0;
                const h = parseFloat(document.getElementById('multi-height')?.value) || 0;
                amount = (w / ((h/100)*(h/100))).toFixed(2);
                type = "BMI Check";
                note = `W:${w} H:${h}`;
            } else if (sys === 'profile') {
                type = document.getElementById('multi-mood')?.value || 'Neutral';
                amount = parseFloat(document.getElementById('multi-score')?.value) || 0;
                note = "Mood Update";
            }
            
            transactions.push({ studentId: sid, type, amount, date, note });
        });
        
        if(transactions.length) {
            console.log('Posting batch transactions', transactions);
            await app.postData({ op: 'batch_add_transactions', transactions }, `Processed ${transactions.length} entries`);
        }
        closeModal('multi-tx');
    },
    selectAllMulti: () => {
        document.querySelectorAll('#multi-student-list input[type="checkbox"]').forEach(cb => cb.checked = true);
    },

    populateMultiTxFields: () => {
        const sys = CONFIG.activeSystem;
        const lang = i18n[CONFIG.lang];
        const container = document.getElementById('dynamic-multi-fields');
        
        if (sys === 'bank') {
            container.innerHTML = `
                <input type="number" id="multi-amount" placeholder="${lang.label_amount || 'Amount'}" step="0.01" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
                <div class="grid grid-cols-2 gap-2">
                    <label class="cursor-pointer"><input type="radio" name="multi-type" value="Deposit" checked class="peer sr-only"><div class="p-2 text-center rounded-lg border bg-white border-slate-200 peer-checked:bg-emerald-50 peer-checked:text-emerald-600 font-bold text-sm">${lang.label_deposit}</div></label>
                    <label class="cursor-pointer"><input type="radio" name="multi-type" value="Withdraw" class="peer sr-only"><div class="p-2 text-center rounded-lg border bg-white border-slate-200 peer-checked:bg-red-50 peer-checked:text-red-600 font-bold text-sm">${lang.label_withdraw}</div></label>
                </div>
            `;
        } else if (sys === 'attendance') {
            container.innerHTML = `
                <select id="multi-status" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
                    <option value="Present">${lang.label_present}</option>
                    <option value="Late">${lang.label_late}</option>
                    <option value="Absent">${lang.label_absent}</option>
                </select>
            `;
        } else if (sys === 'health') {
            container.innerHTML = `
                <input type="number" id="multi-weight" placeholder="${lang.label_weight}" step="0.1" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
                <input type="number" id="multi-height" placeholder="${lang.label_height}" step="0.1" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
            `;
        } else if (sys === 'profile') {
            container.innerHTML = `
                <select id="multi-mood" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
                    <option value="Happy">😊 Happy</option>
                    <option value="Neutral">😐 Neutral</option>
                    <option value="Sad">😢 Sad</option>
                </select>
                <input type="number" id="multi-score" placeholder="${lang.label_intel}" step="0.1" required class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500">
            `;
        }
    },
    refreshData: () => app.fetchData(),
    setTableMode: (m) => { 
        state.tableMode = m;
        const heading = document.getElementById('table-head');
        const tbody = document.getElementById('table-body');
        
        // Update button focus
        const btnStudents = document.getElementById('btn-mode-students');
        const btnHistory = document.getElementById('btn-mode-history');
        if(btnStudents) {
            btnStudents.classList.toggle('bg-indigo-50', m === 'students');
            btnStudents.classList.toggle('text-indigo-600', m === 'students');
            btnStudents.classList.toggle('text-slate-500', m !== 'students');
            btnStudents.classList.toggle('hover:bg-slate-50', m !== 'students');
        }
        if(btnHistory) {
            btnHistory.classList.toggle('bg-indigo-50', m === 'history');
            btnHistory.classList.toggle('text-indigo-600', m === 'history');
            btnHistory.classList.toggle('text-slate-500', m !== 'history');
            btnHistory.classList.toggle('hover:bg-slate-50', m !== 'history');
        }
        
        if(heading) {
            if(m === 'students') {
                heading.innerHTML = '<th class="p-3 text-xs">ID</th><th class="p-3">Name</th><th class="p-3 text-xs text-center">Class</th><th class="p-3 text-xs text-center">No</th><th class="p-3 text-right text-xs">Data</th>';
            } else {
                heading.innerHTML = '<th class="p-3">Student</th><th class="p-3 text-right">Details</th>';
            }
        }
        app.renderTable();
    },
    logout: () => { localStorage.clear(); location.reload(); }
};

window.app = app;
window.switchAuthTab = (t) => {
    document.getElementById('form-login-student').classList.toggle('hidden', t !== 'student');
    document.getElementById('form-login-teacher').classList.toggle('hidden', t !== 'teacher');
    document.getElementById('tab-student').className = t === 'student' ? "flex-1 py-2 rounded-lg text-sm font-bold bg-white shadow-sm text-indigo-600" : "flex-1 py-2 rounded-lg text-sm font-bold text-slate-500";
    document.getElementById('tab-teacher').className = t === 'teacher' ? "flex-1 py-2 rounded-lg text-sm font-bold bg-white shadow-sm text-indigo-600" : "flex-1 py-2 rounded-lg text-sm font-bold text-slate-500";
};

window.switchSettingTab = (t) => {
    document.getElementById('set-content-connection').classList.toggle('hidden', t !== 'connection');
    document.getElementById('set-content-security').classList.toggle('hidden', t !== 'security');
    document.getElementById('set-tab-connection').className = t === 'connection' ? "flex-1 pb-2 border-b-2 border-indigo-600 text-indigo-600 font-bold text-sm" : "flex-1 pb-2 border-b-2 border-transparent text-slate-500 font-bold text-sm";
    document.getElementById('set-tab-security').className = t === 'security' ? "flex-1 pb-2 border-b-2 border-indigo-600 text-indigo-600 font-bold text-sm" : "flex-1 pb-2 border-b-2 border-transparent text-slate-500 font-bold text-sm";
};

window.openModal = (n) => {
    const modal = document.getElementById(`modal-${n}`);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if(n.includes('transaction')) app.updateSelectOptions();
    if(n.includes('multi-tx')) {
        app.populateMultiTxFields();
        const list = document.getElementById('multi-student-list');
        list.innerHTML = state.students.map(s => `<label class="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"><input type="checkbox" value="${s['Student ID']}" class="w-4 h-4"><span class="text-sm">${s.No}. ${s.Name}</span></label>`).join('');
    }
};

window.closeModal = (n) => { document.getElementById(`modal-${n}`).classList.add('hidden'); document.getElementById(`modal-${n}`).classList.remove('flex'); };

// Toggle tx fields for Transfer mode
app.toggleTxFields = () => {
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const field = document.getElementById('field-to-student');
    if(type === 'Transfer') field.classList.remove('hidden');
    else field.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => app.init());