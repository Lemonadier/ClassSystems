/**
 * UI Rendering: Tables, Charts, Cards, Forms
 */

const uiModule = {
    setLang: (lang) => {
        localStorage.setItem('cb_lang', lang);
        CONFIG.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[lang][key]) el.textContent = i18n[lang][key];
        });
        // Update language button styles
        document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
        document.getElementById('btn-lang-th').classList.toggle('active', lang === 'th');
        document.getElementById('btn-lang-en').classList.toggle('bg-indigo-600', lang === 'en');
        document.getElementById('btn-lang-en').classList.toggle('text-white', lang === 'en');
        document.getElementById('btn-lang-en').classList.toggle('bg-white', lang !== 'en');
        document.getElementById('btn-lang-en').classList.toggle('text-slate-800', lang !== 'en');
        document.getElementById('btn-lang-th').classList.toggle('bg-indigo-600', lang === 'th');
        document.getElementById('btn-lang-th').classList.toggle('text-white', lang === 'th');
        document.getElementById('btn-lang-th').classList.toggle('bg-white', lang !== 'th');
        document.getElementById('btn-lang-th').classList.toggle('text-slate-800', lang !== 'th');
    },

    loading: (show) => {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 z-[999] bg-black/30 flex items-center justify-center hidden';
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        }
        loader.classList.toggle('hidden', !show);
    },

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
        state.chartType = 'bar';
        const sys = SYSTEMS[sysId];
        document.getElementById('view-launcher').classList.add('hidden');
        document.getElementById('view-app').classList.remove('hidden');

        document.getElementById('active-sys-icon').className = `w-8 h-8 rounded-lg ${sys.color} text-white flex items-center justify-center`;
        document.getElementById('active-sys-icon').innerHTML = `<i class="fa-solid ${sys.icon}"></i>`;
        document.getElementById('active-sys-name').textContent = CONFIG.lang === 'th' ? sys.name_th : sys.name_en;

        document.getElementById('label-stat-1').textContent = sys.stat1;
        document.getElementById('label-stat-2').textContent = sys.stat2;

        const weeklyBtn = document.getElementById('btn-chart-weekly-attendance');
        if (weeklyBtn) {
            weeklyBtn.style.display = sysId === 'attendance' ? 'flex' : 'none';
        }
        const analyticsNav = document.getElementById('nav-analytics');
        if (analyticsNav) {
            analyticsNav.style.display = 'block';
        }
        const studentsNav = document.getElementById('nav-students');
        if (studentsNav) {
            studentsNav.style.display = 'block';
        }

        app.updateActionsMenu();
        app.fetchData();
    },

    updateActionsMenu: () => {
        const c = document.getElementById('dynamic-actions');
        if (!c) return;
        const lang = i18n[CONFIG.lang];
        const html = SystemCore.getActionsHTML(CONFIG.activeSystem, CONFIG.role, lang);
        c.innerHTML = html;
    },

    renderStudentCards: () => {
        const container = document.getElementById('student-cards');
        if (!container) return;
        const sys = CONFIG.activeSystem;
        const lang = i18n[CONFIG.lang];

        let studentsToDisplay = state.students;
        if (CONFIG.role === 'parent') {
            studentsToDisplay = state.students.filter(s => String(s['Student ID']) === String(CONFIG.user?.['Student ID']));
        }

        container.innerHTML = studentsToDisplay.map(s => {
            let dataDisplay = '';
            if (sys === 'bank') {
                dataDisplay = `<div class="text-2xl font-bold text-indigo-600">฿${app.formatMoney(s.balance)}</div>`;
            } else if (sys === 'attendance') {
                dataDisplay = `<div class="text-2xl font-bold text-emerald-600">${s.balance || 0}%</div>`;
            } else if (sys === 'health') {
                dataDisplay = `<div class="text-2xl font-bold text-rose-600">${s.balance || 'N/A'}</div>`;
            } else if (sys === 'profile') {
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
        state.students.sort((a, b) => (a.No || 0) - (b.No || 0)).forEach(s => {
            sel.innerHTML += `<option value="${s['Student ID']}">${s.No}. ${s.Name}</option>`;
        });

        const now = new Date();
        const dateInput = document.getElementById('tx-date');
        if (dateInput) dateInput.value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        const bal = document.getElementById('tx-student-bal');
        function updateBalDisplay(id) {
            if (!bal) return;
            if (!id) { bal.innerHTML = 'Bal: -'; return; }
            const s = state.students.find(x => x['Student ID'] === id);
            if (!s) { bal.innerHTML = 'Bal: -'; return; }
            const txs = state.transactions.filter(t => String(t['Student ID']) === String(id));
            let summary = '';
            if (CONFIG.activeSystem === 'bank') {
                let balval = 0;
                txs.forEach(t => { const val = parseFloat(t.Amount) || 0; if (t.Type === 'Deposit') balval += val; else balval -= val; });
                summary = `<div class="text-xs text-slate-400">Balance: <b class='text-slate-700'>${app.formatMoney(balval)}</b></div>`;
            } else if (CONFIG.activeSystem === 'attendance') {
                const last = txs.sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
                summary = `<div class="text-xs text-slate-400">Last: <b class='text-slate-700'>${last ? (last.Status || last.Type) : 'N/A'}</b></div>`;
            } else if (CONFIG.activeSystem === 'health') {
                const last = txs.sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
                summary = `<div class="text-xs text-slate-400">Weight/Height: <b class='text-slate-700'>${last ? (last.Weight || '') : ''} / ${last ? (last.Height || '') : ''}</b></div>`;
            } else {
                const last = txs.sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
                summary = `<div class="text-xs text-slate-400">Last Entry: <b class='text-slate-700'>${last ? (last.Note || last.Type || '') : 'N/A'}</b></div>`;
            }
            bal.innerHTML = summary;
        }
        sel.addEventListener('change', (ev) => updateBalDisplay(ev.target.value));
    },

    renderTable: (filter = '') => {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const searchVal = document.getElementById('search-input')?.value?.toLowerCase() || '';
        let src = state.tableMode === 'students' ? state.students : state.transactions;
        if (CONFIG.role === 'parent') {
            if (state.tableMode === 'students') src = state.students.filter(s => s['Student ID'] === CONFIG.user?.['Student ID']);
            else src = state.transactions.filter(t => String(t['Student ID']) === String(CONFIG.user?.['Student ID']));
        }
        const isHistory = state.tableMode === 'history';
        const sys = SYSTEMS[CONFIG.activeSystem];

        src.forEach(item => {
            if (!isHistory) {
                if (item.Name && item.Name.toLowerCase().includes(searchVal)) {
                    let display = CONFIG.activeSystem === 'bank' ? `฿${app.formatMoney(item.balance)}` : item.balance;
                    if (CONFIG.activeSystem === 'attendance') display += '%';
                    tbody.innerHTML += `<tr><td class="p-3 text-xs">${item["Student ID"]}</td><td class="p-3">${item.Name}</td><td class="p-3 text-xs text-center">${item.Grade}</td><td class="p-3 text-xs text-center">${item.No}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>`;
                }
            } else {
                const s = state.students.find(x => x['Student ID'] == item['Student ID']);
                if (!s) return;

                const txDate = new Date(item.Date);
                const dateFrom = document.getElementById('filter-date-from')?.value;
                const dateTo = document.getElementById('filter-date-to')?.value;

                const matchesSearch = s.Name.toLowerCase().includes(searchVal);
                const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
                const matchesDateTo = !dateTo || txDate <= new Date(dateTo);

                if (matchesSearch && matchesDateFrom && matchesDateTo) {
                    if (CONFIG.role === 'teacher' || String(s['Student ID']) === String(CONFIG.user?.['Student ID'])) {
                        const dateStr = new Date(item.Date).toLocaleDateString();

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

    switchTab: (t) => {
        document.querySelectorAll('.app-tab').forEach(el => el.classList.add('hidden'));
        const tabEl = document.getElementById(`tab-${t}`);
        if (tabEl) tabEl.classList.remove('hidden');

        ['dashboard', 'students', 'analytics'].forEach(n => {
            const el = document.getElementById(`nav-${n}`);
            if (el) {
                const isActive = (n === 'dashboard' && t === 'dashboard') ||
                    (n === 'students' && t === 'students') ||
                    (n === 'analytics' && t === 'analytics');
                el.className = `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`;
            }
        });

        const txBtn = document.getElementById('nav-transactions');
        if (txBtn) {
            const isActive = t === 'students';
            txBtn.className = `nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`;
        }

        if (t === 'students') {
            const dataBtn = document.getElementById('btn-mode-students');
            const historyBtn = document.getElementById('btn-mode-history');
            if (dataBtn && historyBtn) {
                if (state.tableMode === 'students') {
                    dataBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-600 transition-all shadow-sm';
                    historyBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all';
                } else {
                    dataBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all';
                    historyBtn.className = 'px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-600 transition-all shadow-sm';
                }
            }
        }
    },

    setTableMode: (m) => {
        state.tableMode = m;
        app.renderTable();
        if (m === 'history') {
            const filterSection = document.getElementById('filter-section');
            if (filterSection) filterSection.style.display = 'flex';
        } else {
            const filterSection = document.getElementById('filter-section');
            if (filterSection) filterSection.style.display = 'none';
        }
    },

    formatMoney: (n) => parseFloat(n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),

    setChartType: (type) => {
        state.chartType = type;
        const buttons = document.querySelectorAll('[id^="btn-chart-"]');
        buttons.forEach(btn => {
            btn.classList.remove('text-indigo-600', 'bg-white', 'shadow-sm');
            btn.classList.add('text-slate-500');
        });
        const activeBtn = document.getElementById(`btn-chart-${type}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-slate-500');
            activeBtn.classList.add('text-indigo-600', 'bg-white', 'shadow-sm');
        }

        app.renderCharts();
    },

    chartSelectAll: () => {
        document.querySelectorAll('#chart-student-list input[type="checkbox"]').forEach(cb => cb.checked = true);
        app.renderCharts(); app.renderWeeklyAttendance();
    },

    chartClearAll: () => {
        document.querySelectorAll('#chart-student-list input[type="checkbox"]').forEach(cb => cb.checked = false);
        app.renderCharts(); app.renderWeeklyAttendance();
    },

    toggleWeeklyFullscreen: () => {
        const modal = document.getElementById('modal-weekly');
        const container = document.getElementById('weekly-attendance-full');
        const originalContainer = document.getElementById('weekly-attendance-container');

        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Move content to modal
            container.innerHTML = originalContainer.innerHTML;
            // Remove the toggle button from the modal view to avoid recursion/confusion
            const btn = container.querySelector('.fullscreen-toggle');
            if (btn) btn.remove();
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Content is re-rendered by renderCharts anyway, but let's clear to be safe
            container.innerHTML = '';
        }
    }
};
