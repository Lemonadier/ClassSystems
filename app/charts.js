/**
 * Charts & Weekly Attendance Visualization
 */

const chartsModule = {
    renderCharts: () => {
        const ctx = document.getElementById('balanceChart');
        const weeklyContainer = document.getElementById('weekly-attendance-container');
        if(!ctx) return;
        
        const chartType = state.chartType || 'bar';
        
        if(chartType === 'weekly-attendance' && CONFIG.activeSystem === 'attendance') {
            if(window.myChart) window.myChart.destroy();
            ctx.style.display = 'none';
            weeklyContainer.style.display = 'block';
            weeklyContainer.classList.add('relative');
            const oldBtn = weeklyContainer.querySelector('.fullscreen-toggle');
            if(oldBtn) oldBtn.remove();
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'fullscreen-toggle absolute top-2 right-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded z-10';
            toggleBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Fullscreen';
            toggleBtn.onclick = (e) => { e.stopPropagation(); app.toggleWeeklyFullscreen(); };
            weeklyContainer.appendChild(toggleBtn);
            app.renderWeeklyAttendance();
            return;
        } else {
            ctx.style.display = 'block';
            weeklyContainer.style.display = 'none';
        }
        
        if(window.myChart) window.myChart.destroy();
        
        const studentFilter = document.getElementById('analytics-student-filter')?.value || '';
        const dateFrom = document.getElementById('analytics-date-from')?.value;
        const dateTo = document.getElementById('analytics-date-to')?.value;
        
        let filteredStudents = state.students.map(s => ({...s, balance: 0}));
        const checkedBoxes = Array.from(document.querySelectorAll('#chart-student-list input[type="checkbox"]:checked')).map(cb => cb.value);
        if(checkedBoxes.length > 0) {
            filteredStudents = state.students.filter(s => checkedBoxes.includes(s['Student ID'])).map(s => ({...s, balance: 0}));
        } else if(studentFilter) {
            filteredStudents = state.students.filter(s => s['Student ID'] === studentFilter).map(s => ({...s, balance: 0}));
        }
        if(!filteredStudents || filteredStudents.length === 0) {
            filteredStudents = state.students.map(s => ({...s, balance: 0}));
        }
        
        let filteredTxns = state.transactions;
        if(dateFrom || dateTo) {
            filteredTxns = state.transactions.filter(t => {
                const txDate = new Date(t.Date);
                const match = (!dateFrom || txDate >= new Date(dateFrom)) && (!dateTo || txDate <= new Date(dateTo));
                return match;
            });
        }
        
        const labels = filteredStudents.map(s => s.Name);
        let datasets = [];
        
        if(CONFIG.activeSystem === 'attendance' && (chartType === 'frequency' || chartType === 'rate')) {
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
        
        const filter = document.getElementById('analytics-student-filter');
        if(filter && filter.children.length === 1) {
            state.students.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s['Student ID'];
                opt.textContent = s.Name;
                filter.appendChild(opt);
            });
        }
        const list = document.getElementById('chart-student-list');
        if(list) {
            list.innerHTML = '';
            state.students.sort((a,b)=> (a.No||0)-(b.No||0)).forEach(s => {
                const id = s['Student ID'];
                const wrap = document.createElement('label');
                wrap.className = 'flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer';
                wrap.innerHTML = `<input type="checkbox" value="${id}" checked class="w-4 h-4 chart-student-checkbox"><span class="text-sm">${s.No}. ${s.Name}</span>`;
                list.appendChild(wrap);
            });
            list.querySelectorAll('.chart-student-checkbox').forEach(cb => cb.addEventListener('change', () => { app.renderCharts(); app.renderWeeklyAttendance(); }));
        }
    },

    renderWeeklyAttendance: () => {
        const container = document.getElementById('weekly-attendance-container');
        if(!container) return;
        
        const studentFilter = document.getElementById('analytics-student-filter')?.value || '';
        const dateFrom = document.getElementById('analytics-date-from')?.value;
        const dateTo = document.getElementById('analytics-date-to')?.value;
        
        const filteredTxns = state.transactions.filter(t => {
            const txDate = new Date(t.Date);
            const match = (!dateFrom || txDate >= new Date(dateFrom)) && (!dateTo || txDate <= new Date(dateTo));
            return match;
        });

        const checkedIds = Array.from(document.querySelectorAll('#chart-student-list input[type="checkbox"]:checked')).map(cb => cb.value);
        let displayStudents = state.students;
        if(checkedIds.length > 0) displayStudents = state.students.filter(s => checkedIds.includes(s['Student ID']));
        else if(studentFilter) displayStudents = state.students.filter(s => s['Student ID'] === studentFilter);
        if(!displayStudents || displayStudents.length === 0) displayStudents = state.students;

        if(CONFIG.role === 'parent' && CONFIG.user) {
            displayStudents = displayStudents.filter(s => String(s['Student ID']) === String(CONFIG.user['Student ID']));
        }

        const attendanceMap = {};
        displayStudents.forEach(s => attendanceMap[s['Student ID']] = {});
        filteredTxns.forEach(t => {
            if(attendanceMap[t['Student ID']]) {
                const key = new Date(t.Date).toISOString().split('T')[0];
                attendanceMap[t['Student ID']][key] = t.Status || t.Type;
            }
        });

        const startElem = document.getElementById('analytics-date-from');
        const endElem = document.getElementById('analytics-date-to');

        const today = new Date();
        function getMonday(d){ const dt=new Date(d); const day = dt.getDay(); const diff = (day === 0 ? -6 : 1 - day); dt.setDate(dt.getDate() + diff); dt.setHours(0,0,0,0); return dt; }
        function getSunday(d){ const dt=new Date(d); const day = dt.getDay(); const diff = (day === 0 ? 0 : 7 - day); dt.setDate(dt.getDate() + diff); dt.setHours(0,0,0,0); return dt; }

        let start = dateFrom ? new Date(dateFrom) : getMonday(today);
        let end = dateTo ? new Date(dateTo) : getSunday(today);

        start.setHours(0,0,0,0); end.setHours(0,0,0,0);

        if(startElem && !startElem.value) startElem.value = start.toISOString().split('T')[0];
        if(endElem && !endElem.value) endElem.value = end.toISOString().split('T')[0];

        const weeks = [];
        let cur = getMonday(start);
        const last = getMonday(end);
        while(cur <= last) {
            weeks.push(new Date(cur));
            cur = new Date(cur); cur.setDate(cur.getDate() + 7);
        }

        let html = '';
        weeks.forEach(weekStart => {
            const cols = [];
            for(let i=0;i<7;i++){ const d = new Date(weekStart); d.setDate(d.getDate() + i); cols.push(d); }

            html += `<div class="mb-6 bg-white p-4 rounded-xl shadow-sm overflow-x-auto">`;
            html += `<div class="mb-2 font-semibold text-slate-600">Week: ${weekStart.toLocaleDateString()}</div>`;
            html += `<table class="w-full border-collapse" style="min-width:700px"><thead><tr><th class="p-2 text-left w-48">Student</th>`;
            cols.forEach(d => { html += `<th class="p-2 text-center text-xs text-slate-500">${d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'})}</th>`; });
            html += `</tr></thead><tbody>`;

            displayStudents.forEach(s => {
                html += `<tr class="border-t"><td class="p-2 font-medium">${s.No}. ${s.Name}</td>`;
                cols.forEach(d => {
                    const key = d.toISOString().split('T')[0];
                    const status = attendanceMap[s['Student ID']][key];
                    let cls = 'bg-gray-200'; let title='No data';
                    if(status === 'Present'){ cls='bg-green-500'; title='Present'; }
                    else if(status === 'Late'){ cls='bg-yellow-500'; title='Late'; }
                    else if(status === 'Absent'){ cls='bg-red-500'; title='Absent'; }
                    html += `<td class="p-2 text-center"><div class="mx-auto w-8 h-8 rounded ${cls}" title="${title}"></div></td>`;
                });
                html += `</tr>`;
            });

            html += `</tbody></table></div>`;
        });

        container.innerHTML = html;
    }
};
