with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace renderWeeklyAttendance function
# The function starts with "renderWeeklyAttendance: () => {"
# We need to find the full function and replace it

start_marker = "renderWeeklyAttendance: () => {"
end_marker = "        app.renderCharts = () => {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx >= 0 and end_idx >= 0:
    new_weekly = """renderWeeklyAttendance: () => {
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
        
        // Create attendance map: {studentId: {date: status}}
        const attendanceMap = {};
        displayStudents.forEach(s => {
            attendanceMap[s['Student ID']] = {};
        });
        
        filteredTxns.forEach(txn => {
            if(attendanceMap[txn['Student ID']]) {
                const dateKey = new Date(txn.Date).toISOString().split('T')[0];
                attendanceMap[txn['Student ID']][dateKey] = txn.Status;
            }
        });
        
        // Get date range for grid
        const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90*24*60*60*1000);
        const endDate = dateTo ? new Date(dateTo) : new Date();
        
        // Build grid HTML as table with students as rows, dates as columns
        let html = '<div class="overflow-x-auto"><table class="border-collapse w-full" style="border-spacing:0"><thead><tr style="background:#f3f4f6"><th class="border p-2 text-xs font-bold text-left" style="min-width:120px;border:1px solid #ddd">Student (Grade)</th>';
        
        // Add date headers
        const allDates = [];
        for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            allDates.push(dateKey);
            const date = new Date(d);
            const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
            const dayNum = date.getDate();
            const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()];
            html += `<th class="border p-2 text-xs font-bold text-center" style="min-width:40px;border:1px solid #ddd" title="${dateKey}">${dayName}<br>${monthName} ${dayNum}</th>`;
        }
        
        html += '</tr></thead><tbody>';
        
        // Add student rows
        displayStudents.forEach(student => {
            html += `<tr><td class="border p-2 text-xs font-bold" style="background:#f9fafb;border:1px solid #ddd">${student.Name}<br><span class="text-gray-500 text-xs">${student.Grade}</span></td>`;
            
            allDates.forEach(dateKey => {
                const status = attendanceMap[student['Student ID']][dateKey];
                let cellHtml = '<td class="border p-1 text-center" style="background:#fafbfc;border:1px solid #ddd">';
                
                if(status === 'Present') {
                    cellHtml += '<div class="w-7 h-7 mx-auto bg-green-200 text-green-700 rounded font-bold flex items-center justify-center text-sm cursor-help hover:bg-green-300" title="Present">✓</div>';
                } else if(status === 'Late') {
                    cellHtml += '<div class="w-7 h-7 mx-auto bg-amber-200 text-amber-700 rounded font-bold flex items-center justify-center text-sm cursor-help hover:bg-amber-300" title="Late">◐</div>';
                } else if(status === 'Absent') {
                    cellHtml += '<div class="w-7 h-7 mx-auto bg-red-200 text-red-700 rounded font-bold flex items-center justify-center text-sm cursor-help hover:bg-red-300" title="Absent">✗</div>';
                } else {
                    cellHtml += '<div class="w-7 h-7 mx-auto bg-gray-200 text-gray-500 rounded flex items-center justify-center text-sm cursor-help hover:bg-gray-300" title="No data">-</div>';
                }
                
                cellHtml += '</td>';
                html += cellHtml;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    },

        app.renderCharts = () => {"""
    
    before = content[:start_idx]
    after = content[end_idx:]
    
    content = before + new_weekly + after

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated renderWeeklyAttendance to show grid layout")
