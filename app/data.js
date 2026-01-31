/**
 * Data Management: Fetching, Processing, & Normalization
 */

const dataModule = {
    fetchData: async (cb) => {
        if (!CONFIG.apiUrl || state.isFetching) return;
        state.isFetching = true;
        app.loading(true);
        try {
            let url = `${CONFIG.apiUrl}?op=get_data&system=${CONFIG.activeSystem}`;
            // FIX: Use secure endpoint for parents
            if (CONFIG.role === 'parent' && CONFIG.user) {
                 url = `${CONFIG.apiUrl}?op=get_student_data&system=${CONFIG.activeSystem}&studentId=${CONFIG.user['Student ID']}`;
            }
            console.log('Fetching from:', url, 'System:', CONFIG.activeSystem);
            const res = await fetch(url);
            const data = await res.json();
            console.log('Received data:', data);
            if (data.status === 'success') {
                // Normalize students and transactions to consistent keys
                const rawStudents = data.students || [];
                const rawTx = data.transactions || [];
                state.students = rawStudents.map(s => {
                    return {
                        'Student ID': s['Student ID'] || s.studentId || s.id || s.ID || '',
                        Name: s.Name || s.name || s.fullName || '',
                        Grade: s.Grade || s.grade || s.Class || s.class || '',
                        No: s.No || s.no || '',
                        ...s
                    };
                });

                state.transactions = rawTx.map(t => {
                    return {
                        'Student ID': t['Student ID'] || t.studentId || t.StudentID || t.student_id || t.sid || '',
                        Date: t.Date || t.date || t.createdAt || t.created_at || '',
                        Type: t.Type || t.type || '',
                        Amount: t.Amount || t.amount || t.Value || t.value || '',
                        Status: t.Status || t.status || '',
                        BMI: t.BMI || t.bmi || '',
                        Weight: t.Weight || t.weight || '',
                        Height: t.Height || t.height || '',
                        Score: t.Score || t.score || '',
                        Note: t.Note || t.note || '',
                        ...t
                    };
                });
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
        } else if (CONFIG.role === 'parent') {
             globalMetric = current?.balance || 0;
        }

        const displayMetric = (CONFIG.role === 'parent') ? (current?.balance || 0) : (CONFIG.role === 'student' ? (current?.balance || 0) : globalMetric);
        
        document.getElementById('stat-balance').textContent = `${sys.unit === '฿' ? '฿' : ''}${app.formatMoney(displayMetric)} ${sys.unit !== '฿' ? sys.unit : ''}`;
        document.getElementById('stat-count').textContent = state.transactions.length;
        
        app.renderTable();
        app.updateSelectOptions();
        app.renderStudentCards();
        app.renderCharts();
        // Ensure actions menu reflects current data/system/role after processing
        app.updateActionsMenu();
    },

    postData: async (payload, msg) => {
        const res = await fetch(CONFIG.apiUrl, { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.status === 'success') { await app.fetchData(null, true); Swal.fire('Success', msg, 'success'); return true; }
        else { Swal.fire('Error', data.message || 'Operation failed', 'error'); return false; }
    },

    refreshData: () => app.fetchData()
};
