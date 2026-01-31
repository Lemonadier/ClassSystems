/**
 * Form Handlers & Transaction Processing
 */

const handlersModule = {
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
        const sys = CONFIG.activeSystem;
        let checklist = [];
        
        if(sys === 'attendance') {
            checklist = document.querySelectorAll('#multi-student-list input[type="radio"]:checked');
        } else {
            checklist = document.querySelectorAll('#multi-student-list input[type="checkbox"]:checked');
        }
        
        if (checklist.length === 0) { Swal.fire('Info', 'Select at least one student', 'info'); return; }
        
        const transactions = [];
        const date = new Date().toISOString().split('T')[0];
        
        checklist.forEach(checkbox => {
            let sid = checkbox.value;
            let type = 'Entry', amount = 1, note = '';
            
            if (sys === 'bank') {
                type = document.querySelector('input[name="multi-type"]:checked')?.value || 'Deposit';
                amount = parseFloat(document.getElementById('multi-amount')?.value) || 0;
            } else if (sys === 'attendance') {
                sid = checkbox.getAttribute('data-student') || checkbox.value;
                type = checkbox.value || 'Present';
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
            if(sys === 'attendance') {
                const counts = { Present:0, Late:0, Absent:0 };
                const names = { Present:[], Late:[], Absent:[] };
                transactions.forEach(tx => {
                    const t = tx.type || tx.type;
                    if(t === 'Present') { counts.Present++; names.Present.push(tx.studentId); }
                    else if(t === 'Late') { counts.Late++; names.Late.push(tx.studentId); }
                    else if(t === 'Absent') { counts.Absent++; names.Absent.push(tx.studentId); }
                });

                function idToName(id){ const s = state.students.find(x=>x['Student ID']===id); return s ? `${s.No}. ${s.Name}` : id; }
                const makeList = arr => `<ul class="text-left" style="margin:0;padding-left:16px">${arr.slice(0,50).map(i=>`<li>${idToName(i)}</li>`).join('')}</ul>`;
                const html = `<div class="p-2 text-left"><div><b>Present:</b> ${counts.Present}</div><div><b>Late:</b> ${counts.Late}</div><div><b>Absent:</b> ${counts.Absent}</div><hr class="my-2">${counts.Present?'<div><b>Present:</b>'+makeList(names.Present)+'</div>':''}${counts.Late?'<div><b>Late:</b>'+makeList(names.Late)+'</div>':''}${counts.Absent?'<div><b>Absent:</b>'+makeList(names.Absent)+'</div>':''}</div>`;

                const res = await Swal.fire({ title: `Confirm ${transactions.length} attendance entries`, html, showCancelButton: true, confirmButtonText: 'Confirm', width: '600px' });
                if(!res.isConfirmed) return;
            }

            console.log('Posting batch transactions', transactions);
            await app.postData({ op: 'batch_add_transactions', transactions }, `Processed ${transactions.length} entries`);
        }
        closeModal('multi-tx');
    },

    selectAllMulti: () => {
        if (CONFIG.activeSystem === 'attendance') {
            document.querySelectorAll('#multi-student-list input.attendance-status').forEach(r => {
                if (r.value === 'Present') r.checked = true;
            });
        } else {
            document.querySelectorAll('#multi-student-list input[type="checkbox"]').forEach(cb => cb.checked = true);
        }
    },

    populateMultiTxFields: () => {
        const sys = CONFIG.activeSystem;
        const lang = i18n[CONFIG.lang];
        
        let attendanceHtml = '', fieldHtml = '';
        
        // Student list
        const studentHtml = state.students.sort((a,b) => (a.No||0)-(b.No||0)).map(s => {
            const id = s['Student ID'];
            if (sys === 'attendance') {
                return `<div class="p-2 border-b"><label class="text-sm font-medium">${s.No}. ${s.Name}</label>
                    <div class="flex gap-2 mt-1">
                        <label class="flex items-center"><input type="radio" name="multi-${id}" value="Present" class="attendance-status" data-student="${id}"> <span class="text-xs ml-1">Present</span></label>
                        <label class="flex items-center"><input type="radio" name="multi-${id}" value="Late" class="attendance-status" data-student="${id}"> <span class="text-xs ml-1">Late</span></label>
                        <label class="flex items-center"><input type="radio" name="multi-${id}" value="Absent" class="attendance-status" data-student="${id}"> <span class="text-xs ml-1">Absent</span></label>
                    </div></div>`;
            } else {
                return `<label class="flex items-center gap-2 p-2"><input type="checkbox" value="${id}" class="w-4 h-4"><span class="text-sm">${s.No}. ${s.Name}</span></label>`;
            }
        }).join('');

        let html = `<div id="multi-student-list" class="bg-slate-50 p-3 rounded-xl max-h-48 overflow-y-auto border">${studentHtml}</div>`;

        if (sys === 'bank') {
            fieldHtml = `<div class="grid grid-cols-2 gap-2 mt-3">
                <label><input type="radio" name="multi-type" value="Deposit" checked> ${lang.label_deposit}</label>
                <label><input type="radio" name="multi-type" value="Withdraw"> ${lang.label_withdraw}</label>
            </div>
            <input type="number" id="multi-amount" step="0.01" placeholder="${lang.label_amount}" class="w-full p-2 mt-2 border rounded">`;
        } else if (sys === 'attendance') {
            fieldHtml = `<button onclick="app.selectAllMulti()" class="w-full mt-2 p-2 text-xs bg-emerald-600 text-white rounded">Select All (Present)</button>`;
        } else if (sys === 'health') {
            fieldHtml = `<div class="grid grid-cols-2 gap-2 mt-3">
                <input type="number" id="multi-weight" placeholder="${lang.label_weight}" class="p-2 border rounded">
                <input type="number" id="multi-height" placeholder="${lang.label_height}" class="p-2 border rounded">
            </div>`;
        } else if (sys === 'profile') {
            fieldHtml = `<select id="multi-mood" class="w-full p-2 mt-3 border rounded">
                <option value="Happy">😊 Happy</option>
                <option value="Neutral">😐 Neutral</option>
                <option value="Sad">😢 Sad</option>
            </select>
            <input type="number" id="multi-score" placeholder="${lang.label_intel}" class="w-full p-2 mt-2 border rounded">`;
        }

        const container = document.getElementById('multi-fields');
        if(container) container.innerHTML = html + fieldHtml;
    },

    saveApiUrl: () => {
        const url = document.getElementById('api-url')?.value?.trim();
        if(url) {
            localStorage.setItem('cb_api_url', url);
            localStorage.setItem('cb_session_api_url', url);
            localStorage.setItem('cb_teacher_api_key', url);
            Swal.fire('Saved', 'API URL saved', 'success');
        }
    },

    copyShareLink: () => {
        if (CONFIG.role === 'parent') {
            app.generateParentMagicLink();
        } else {
            const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?config=${btoa(CONFIG.apiUrl)}`;
            navigator.clipboard.writeText(link);
            Swal.fire('Copied', '', 'success');
        }
    },

    saveSettings: async () => {
        const adminKey = document.getElementById('new-admin-key')?.value;
        if (adminKey) {
            const result = await app.postData({ op: 'update_key', adminKey }, 'Admin Key Updated');
            if (result) {
                localStorage.setItem('cb_session_token', adminKey);
                document.getElementById('new-admin-key').value = '';
            }
        }
        closeModal('settings');
    }
};
