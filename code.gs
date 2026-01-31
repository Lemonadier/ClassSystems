/**
 * ClassBank v7.6 Backend - Auto-Repair & Safe Headers
 */

const SHEET_ID = "1I3H67ou-hG1kKpbJfcNQRKA17j8CLGMm6tInVUd-2S8"; 
const STUDENTS_SHEET = "Students";
const TRANSACTIONS_SHEET = "Transactions";
const HEALTH_SHEET = "Health";
const ATTENDANCE_SHEET = "Attendance";
const PROFILE_SHEET = "Profile";
const SETTINGS_SHEET = "Settings";

function getSS() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // FIX: Check if sheet is empty (deleted rows) and re-add headers
  if (sheet.getLastRow() === 0) {
    if (sheetName === STUDENTS_SHEET) {
      sheet.appendRow(["Student ID", "Name", "Grade", "No", "Created At"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f3f4f6");
    } else if (sheetName === TRANSACTIONS_SHEET) {
      sheet.appendRow(["Transaction ID", "Student ID", "Type", "Amount", "Date", "Timestamp", "Note"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
    } else if (sheetName === HEALTH_SHEET) {
      sheet.appendRow(["Transaction ID", "Student ID", "Weight", "Height", "BMI", "Date", "Timestamp"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#fce7f3");
    } else if (sheetName === ATTENDANCE_SHEET) {
      sheet.appendRow(["Transaction ID", "Student ID", "Status", "Date", "Timestamp"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#d1fae5");
    } else if (sheetName === PROFILE_SHEET) {
      sheet.appendRow(["Transaction ID", "Student ID", "Mood", "Score", "Date", "Timestamp"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#fef3c7");
    } else if (sheetName === SETTINGS_SHEET) {
      sheet.appendRow(["Key", "Value", "Updated At"]);
      sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#e2e8f0");
    }
  }
  return sheet;
}

function hashString(str) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function verifyAdmin(ss, providedKey) {
  const sheet = ensureSheet(ss, SETTINGS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === "ADMIN_HASH") {
      return data[i][1] === hashString(String(providedKey));
    }
  }
  return false;
}

function doGet(e) {
  const op = e.parameter.op;
  const system = e.parameter.system;
  const ss = getSS();
  
  if (op === "get_data") {
    ensureSheet(ss, STUDENTS_SHEET);
    ensureSheet(ss, TRANSACTIONS_SHEET);
    ensureSheet(ss, HEALTH_SHEET);
    ensureSheet(ss, ATTENDANCE_SHEET);
    ensureSheet(ss, PROFILE_SHEET);
    
    let transactions = [];
    if (system === 'bank') transactions = getData(ss, TRANSACTIONS_SHEET) || [];
    else if (system === 'health') transactions = getData(ss, HEALTH_SHEET) || [];
    else if (system === 'attendance') transactions = getData(ss, ATTENDANCE_SHEET) || [];
    else if (system === 'profile') transactions = getData(ss, PROFILE_SHEET) || [];
    
    const students = getData(ss, STUDENTS_SHEET) || [];
    Logger.log('System: ' + system + ', Students: ' + students.length + ', Transactions: ' + transactions.length);
    
    return response({ 
      status: "success", 
      students: students, 
      transactions: transactions
    });
  }

  if (op === "get_status") {
    const sheet = ensureSheet(ss, SETTINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    let isSetup = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "ADMIN_HASH") { isSetup = true; break; }
    }
    return response({ status: "success", setup_required: !isSetup });
  }

  // FIX: Secure Data Fetching for Parents
  if (op === "get_student_data") {
    ensureSheet(ss, STUDENTS_SHEET);
    ensureSheet(ss, TRANSACTIONS_SHEET);
    ensureSheet(ss, HEALTH_SHEET);
    ensureSheet(ss, ATTENDANCE_SHEET);
    ensureSheet(ss, PROFILE_SHEET);

    const studentId = e.parameter.studentId;
    if (!studentId) return response({ status: "error", message: "Student ID required" });

    // Fetch only the specific student
    const allStudents = getData(ss, STUDENTS_SHEET) || [];
    const student = allStudents.find(s => String(s["Student ID"]) === String(studentId));
    
    if (!student) return response({ status: "error", message: "Student not found" });

    let sheetName = TRANSACTIONS_SHEET;
    if (system === 'health') sheetName = HEALTH_SHEET;
    else if (system === 'attendance') sheetName = ATTENDANCE_SHEET;
    else if (system === 'profile') sheetName = PROFILE_SHEET;

    const allTransactions = getData(ss, sheetName) || [];
    const transactions = allTransactions.filter(t => String(t["Student ID"]) === String(studentId));

    return response({ 
      status: "success", 
      students: [student], 
      transactions: transactions
    });
  }
  
  return response({ status: "error", message: "Invalid GET operation" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    const data = JSON.parse(e.postData.contents);
    const op = data.op;
    const ss = getSS();

    if (op === "setup_admin") {
      const sheet = ensureSheet(ss, SETTINGS_SHEET);
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === "ADMIN_HASH") return response({ status: "error", message: "Admin Key already set." });
      }
      sheet.appendRow(["ADMIN_HASH", hashString(data.adminKey), new Date()]);
      return response({ status: "success", message: "Admin Key configured." });
    }

    if (!verifyAdmin(ss, data.adminKey)) {
      return response({ status: "error", message: "⛔ Unauthorized: Incorrect Admin Key" });
    }

    if (op === "verify_auth") return response({ status: "success", message: "Authorized" });

    if (op === "change_admin_key") {
      const sheet = ensureSheet(ss, SETTINGS_SHEET);
      const rows = sheet.getDataRange().getValues();
      const newHash = hashString(data.newKey);
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === "ADMIN_HASH") {
          sheet.getRange(i + 1, 2).setValue(newHash);
          found = true; break;
        }
      }
      if(!found) sheet.appendRow(["ADMIN_HASH", newHash, new Date()]);
      return response({ status: "success", message: "Admin Key updated" });
    }

    if (op === "add_student") {
      const sheet = ensureSheet(ss, STUDENTS_SHEET);
      const students = getData(ss, STUDENTS_SHEET);
      if (students.some(s => String(s["Student ID"]) === String(data.studentId))) {
        return response({ status: "error", message: "Student ID exists" });
      }
      sheet.appendRow([data.studentId, data.name, data.grade, data.no, new Date()]);
      return response({ status: "success", message: "Student added" });
    }
    
    if (op === "batch_add_students") {
      const sheet = ensureSheet(ss, STUDENTS_SHEET);
      const existing = getData(ss, STUDENTS_SHEET);
      let count = 0;
      data.students.forEach(s => {
         if (!existing.some(ex => String(ex["Student ID"]) === String(s.studentId))) {
           sheet.appendRow([s.studentId, s.name, s.grade, s.no, new Date()]);
           count++;
         }
      });
      return response({ status: "success", message: `Added ${count} students.` });
    }

    if (op === "delete_student") {
       const sheet = ensureSheet(ss, STUDENTS_SHEET);
       const values = sheet.getDataRange().getValues();
       for(let i = 1; i < values.length; i++) {
         if(String(values[i][0]) === String(data.studentId)) {
           sheet.deleteRow(i + 1);
           return response({ status: "success", message: "Student deleted" });
         }
       }
       return response({ status: "error", message: "Student not found" });
    }

    if (op === "add_transaction") {
      const system = data.system;
      let sheetName = TRANSACTIONS_SHEET;
      
      if (system === 'bank') sheetName = TRANSACTIONS_SHEET;
      else if (system === 'health') sheetName = HEALTH_SHEET;
      else if (system === 'attendance') sheetName = ATTENDANCE_SHEET;
      else if (system === 'profile') sheetName = PROFILE_SHEET;
      
      const sheet = ensureSheet(ss, sheetName);
      
      if (system === 'bank') {
        sheet.appendRow([Utilities.getUuid(), data.studentId, data.type, data.amount, data.date, new Date(), data.note || ""]);
      } else if (system === 'health') {
        sheet.appendRow([Utilities.getUuid(), data.studentId, data.weight || 0, data.height || 0, data.amount, data.date, new Date()]);
      } else if (system === 'attendance') {
        sheet.appendRow([Utilities.getUuid(), data.studentId, data.type, data.date, new Date()]);
      } else if (system === 'profile') {
        sheet.appendRow([Utilities.getUuid(), data.studentId, data.type, data.amount, data.date, new Date()]);
      }
      
      return response({ status: "success", message: "Transaction recorded" });
    }

    if (op === "batch_add_transactions") {
      const system = data.system || 'bank';
      let sheetName = TRANSACTIONS_SHEET;
      
      if (system === 'bank') sheetName = TRANSACTIONS_SHEET;
      else if (system === 'health') sheetName = HEALTH_SHEET;
      else if (system === 'attendance') sheetName = ATTENDANCE_SHEET;
      else if (system === 'profile') sheetName = PROFILE_SHEET;
      
      const sheet = ensureSheet(ss, sheetName);
      const rows = data.transactions.map(t => {
        if (system === 'bank') {
          return [Utilities.getUuid(), t.studentId, t.type, t.amount, t.date, new Date(), t.note || ""];
        } else if (system === 'health') {
          return [Utilities.getUuid(), t.studentId, t.weight || 0, t.height || 0, t.amount, t.date, new Date()];
        } else if (system === 'attendance') {
          return [Utilities.getUuid(), t.studentId, t.type, t.date, new Date()];
        } else if (system === 'profile') {
          return [Utilities.getUuid(), t.studentId, t.type, t.amount, t.date, new Date()];
        }
      });
      if (rows.length > 0) {
        const colCount = system === 'bank' ? 7 : (system === 'health' ? 7 : (system === 'attendance' ? 5 : 6));
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, colCount).setValues(rows);
      }
      return response({ status: "success", message: `Processed ${data.transactions.length} txs` });
    }

    return response({ status: "error", message: "Invalid operation" });
    
  } catch (err) {
    return response({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const data = range.getValues();
  
  // FIX: Check if data is empty OR only headers exist
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}