import re

with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Update headers line
    if 'heading.innerHTML =' in line and "Name</th><th" in line:
        line = line.replace(
            "<th class=\"p-3\">Name</th><th class=\"p-3 text-right\">Balance</th>",
            "<th class=\"p-3 text-xs\">ID</th><th class=\"p-3\">Name</th><th class=\"p-3 text-xs text-center\">Class</th><th class=\"p-3 text-xs text-center\">No</th><th class=\"p-3 text-right text-xs\">Data</th>"
        )
    
    # Update student list comment
    if "// Student List" in line and "if(item.Name" not in line:
        line = line.replace("// Student List", "// Student List - Show ID, Name, Class, No, Data")
    
    # Update student row rendering
    if 'tbody.innerHTML +=' in line and 'item.Name' in line and 'display' in line:
        line = line.replace(
            '<tr><td class="p-3">${item.Name}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>',
            '<tr><td class="p-3 text-xs">${item["Student ID"]}</td><td class="p-3">${item.Name}</td><td class="p-3 text-xs text-center">${item.Grade}</td><td class="p-3 text-xs text-center">${item.No}</td><td class="p-3 text-right font-bold text-indigo-600">${display}</td></tr>'
        )
    
    output.append(line)
    i += 1

with open('script.js', 'w', encoding='utf-8') as f:
    f.writelines(output)

print("Updated script.js successfully")
