#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update setTableMode headers to show ID, Name, Class, No, Data
old_headers = "heading.innerHTML = '<th class=\"p-3\">Name</th><th class=\"p-3 text-right\">Balance</th>';"
new_headers = "heading.innerHTML = '<th class=\"p-3 text-xs\">ID</th><th class=\"p-3\">Name</th><th class=\"p-3 text-xs text-center\">Class</th><th class=\"p-3 text-xs text-center\">No</th><th class=\"p-3 text-right text-xs\">Data</th>';"

content = content.replace(old_headers, new_headers)

# 2. Update renderTable to show all student data columns
old_render = """// Student List
                if(item.Name && item.Name.toLowerCase().includes(searchVal)) {
                     let display = CONFIG.activeSystem === 'bank' ? `฿${app.formatMoney(item.balance)}` : item.balance;
                     if(CONFIG.activeSystem === 'attendance') display += '%';
                     tbody.innerHTML += `<tr><td class="p-3">${item.Name}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>`;">

new_render = """// Student List - Show ID, Name, Class, No, Data
                if(item.Name && item.Name.toLowerCase().includes(searchVal)) {
                     let display = CONFIG.activeSystem === 'bank' ? `฿${app.formatMoney(item.balance)}` : item.balance;
                     if(CONFIG.activeSystem === 'attendance') display += '%';
                     tbody.innerHTML += `<tr><td class="p-3 text-xs">${item['Student ID']}</td><td class="p-3">${item.Name}</td><td class="p-3 text-xs text-center">${item.Grade}</td><td class="p-3 text-xs text-center">${item.No}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>`;">

content = content.replace(old_render, new_render)

# 3. Update renderWeeklyAttendance to show grid with students as rows and weeks/days as columns
old_weekly_start = "renderWeeklyAttendance: () => {"
new_weekly_fn = """renderWeeklyAttendance: () => {
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
        
        // Build grid HTML
        let html = '<div class="overflow-x-auto"><table class="border-collapse w-full"><thead><tr style="background:#f3f4f6"><th class="border p-2 text-xs font-bold text-left" style="min-width:120px">Student</th>';
        
        // Add date headers
        const allDates = [];
        for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            allDates.push(dateKey);
            const date = new Date(d);
            const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
            const dayNum = date.getDate();
            html += `<th class="border p-2 text-xs font-bold text-center" style="min-width:35px" title="${dateKey}">${dayName}<br>${dayNum}</th>`;
        }
        
        html += '</tr></thead><tbody>';
        
        // Add student rows
        displayStudents.forEach(student => {
            html += `<tr><td class="border p-2 text-xs font-bold" style="background:#f9fafb">${student.Name}<br><span class="text-gray-500">${student.Grade}</span></td>`;
            
            allDates.forEach(dateKey => {
                const status = attendanceMap[student['Student ID']][dateKey];
                let cellHtml = '<td class="border p-2 text-center" style="background:#fafbfc">';
                
                if(status === 'Present') {
                    cellHtml += '<div class="w-6 h-6 mx-auto bg-green-200 text-green-700 rounded font-bold flex items-center justify-center text-xs" title="Present">✓</div>';
                } else if(status === 'Late') {
                    cellHtml += '<div class="w-6 h-6 mx-auto bg-amber-200 text-amber-700 rounded font-bold flex items-center justify-center text-xs" title="Late">◐</div>';
                } else if(status === 'Absent') {
                    cellHtml += '<div class="w-6 h-6 mx-auto bg-red-200 text-red-700 rounded font-bold flex items-center justify-center text-xs" title="Absent">✗</div>';
                } else {
                    cellHtml += '<div class="w-6 h-6 mx-auto bg-gray-200 text-gray-500 rounded flex items-center justify-center text-xs" title="No data">-</div>';
                }
                
                cellHtml += '</td>';
                html += cellHtml;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }"""

# Find the old renderWeeklyAttendance function end
import re
old_weekly_pattern = r'renderWeeklyAttendance: \(\) => \{[^}]*\},'
# This is complex, let's use a simpler approach - find the function and replace it
idx = content.find('renderWeeklyAttendance: () => {')
if idx >= 0:
    # Find the end of this function (next comma at same bracket level)
    bracket_count = 0
    start_idx = idx + len('renderWeeklyAttendance: () => ')
    i = start_idx
    in_string = False
    string_char = None
    
    while i < len(content):
        char = content[i]
        
        # Handle strings
        if char in ['"', "'", '`'] and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
        
        # Count brackets outside strings
        if not in_string:
            if char == '{':
                bracket_count += 1
            elif char == '}':
                bracket_count -= 1
                if bracket_count == -1:  # Found the closing brace
                    # Replace from start to here
                    before = content[:idx]
                    after = content[i+1:]
                    content = before + "renderWeeklyAttendance: () => {" + new_weekly_fn.replace("renderWeeklyAttendance: () => {", "") + after
                    break
        
        i += 1

# Write back
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Updated student data display (ID, Name, Class, No, Data)")
print("✓ Updated attendance weekly grid to show students as rows and dates as columns")
