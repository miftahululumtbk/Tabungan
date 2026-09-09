/**
 * Google Apps Script - Backend for Student Savings Management System
 * Copy this code into your Google Apps Script project.
 */

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SS = SpreadsheetApp.getActiveSpreadsheet();

// Sheets definitions
const SHEETS = {
  SISWA: 'SISWA',
  TRANSAKSI: 'TRANSAKSI',
  USERS: 'USERS',
  LOG: 'LOG'
};

/**
 * Handle GET Requests
 */
function doGet(e) {
  const action = e.parameter.action;
  let response;

  try {
    switch (action) {
      case 'getDashboard':
        response = getDashboardData();
        break;
      case 'getStudents':
        response = getStudents();
        break;
      case 'getStudent':
        response = getStudent(e.parameter.id);
        break;
      case 'getTransactions':
        response = getTransactions();
        break;
      case 'getBalances':
        response = getBalances();
        break;
      case 'getStudentDetail':
        response = getStudentDetail(e.parameter.idSiswa);
        break;
      case 'getReports':
        response = getReports(e.parameter);
        break;
      default:
        return createResponse(false, 'Perintah GET tidak ditemukan: ' + action);
    }
    return createResponse(true, 'Success', response);
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  let action = e.parameter.action;
  let data = {};
  
  try {
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      // Fallback: use parameters if body is empty
      data = e.parameter;
    }
    
    // Prioritaskan action dari body jika ada
    if (data && data.action) {
      action = data.action;
    }
  } catch (err) {
    // Jika JSON gagal, coba gunakan parameter URL sebagai data
    data = e.parameter;
  }

  if (!action) {
    return createResponse(false, 'Gagal: Perintah (action) tidak ditemukan dalam permintaan.');
  }

  try {
    let result;
    // Gunakan switch case yang lebih aman (case-insensitive jika perlu)
    switch (action) {
      case 'addStudent':
        result = addStudent(data);
        break;
      case 'addBulkStudents':
        result = addBulkStudents(data.students);
        break;
      case 'updateStudent':
        result = updateStudent(data);
        break;
      case 'deleteStudent':
        result = deleteStudent(data.id);
        break;
      case 'addTransaction':
        result = addTransaction(data);
        break;
      case 'addBulkTransactions':
        result = addBulkTransactions(data.transactions);
        break;
      case 'updateTransaction':
        result = updateTransaction(data);
        break;
      case 'deleteTransaction':
        result = deleteTransaction(data.id);
        break;
      case 'backupData':
        result = backupData();
        break;
      case 'restoreData':
        result = restoreData(data.backupId);
        break;
      default:
        return createResponse(false, 'Perintah POST tidak ditemukan: ' + action);
    }
    return createResponse(true, 'Operation successful', result);
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Helper to create JSON output
 */
function createResponse(success, message, data = {}) {
  const output = {
    success: success,
    message: message,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * --- CORE FUNCTIONS ---
 */

function getDashboardData() {
  const students = getStudents();
  const transactions = getTransactions();
  const balances = getBalances();
  
  let totalSaldo = 0;
  let totalSetoran = 0;
  let totalPenarikan = 0;
  
  balances.forEach(b => {
    totalSaldo += b.saldo;
    totalSetoran += b.totalSetoran;
    totalPenarikan += b.totalPenarikan;
  });

  return {
    jumlahSiswa: students.length,
    totalSaldo: totalSaldo,
    totalSetoran: totalSetoran,
    totalPenarikan: totalPenarikan,
    recentTransactions: transactions.slice(0, 10)
  };
}

function getStudents() {
  const sheet = SS.getSheetByName(SHEETS.SISWA);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    return {
      id: row[0],
      nama: row[1],
      kelas: row[2],
      noWa: row[3],
      status: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };
  });
}

function getTransactions() {
  const sheet = SS.getSheetByName(SHEETS.TRANSAKSI);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data.shift();
  
  // Sort by date descending
  return data.map(row => {
    return {
      id: row[0],
      tanggal: row[1],
      idSiswa: row[2],
      namaSiswa: row[3],
      jenis: row[4],
      nominal: row[5],
      keterangan: row[6],
      petugas: row[7],
      createdAt: row[8]
    };
  }).reverse();
}

function getBalances() {
  const students = getStudents();
  const transactions = getTransactions();
  
  return students.map(s => {
    const sTx = transactions.filter(t => t.idSiswa === s.id);
    const setoran = sTx.filter(t => t.jenis === 'SETORAN').reduce((acc, t) => acc + t.nominal, 0);
    const penarikan = sTx.filter(t => t.jenis === 'PENARIKAN').reduce((acc, t) => acc + t.nominal, 0);
    
    return {
      idSiswa: s.id,
      namaSiswa: s.nama,
      kelas: s.kelas,
      totalSetoran: setoran,
      totalPenarikan: penarikan,
      saldo: setoran - penarikan
    };
  });
}

function getStudentDetail(idSiswa) {
  const students = getStudents();
  const student = students.find(s => s.id === idSiswa);
  const transactions = getTransactions();
  const history = transactions.filter(t => t.idSiswa === idSiswa);
  
  const setoran = history.filter(t => t.jenis === 'SETORAN').reduce((acc, t) => acc + t.nominal, 0);
  const penarikan = history.filter(t => t.jenis === 'PENARIKAN').reduce((acc, t) => acc + t.nominal, 0);

  return {
    student: student,
    balance: {
      idSiswa: idSiswa,
      totalSetoran: setoran,
      totalPenarikan: penarikan,
      saldo: setoran - penarikan
    },
    history: history
  };
}

function addStudent(data) {
  const sheet = SS.getSheetByName(SHEETS.SISWA);
  const id = 'S' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const now = new Date();
  
  sheet.appendRow([
    id,
    data.nama,
    data.kelas,
    data.noWa,
    data.status || 'AKTIF',
    now,
    now
  ]);
  
  logAction('ADD_STUDENT', id, 'Tambah siswa: ' + data.nama);
  return { id: id };
}

function addBulkStudents(students) {
  const sheet = SS.getSheetByName(SHEETS.SISWA);
  const now = new Date();
  const addedIds = [];
  
  students.forEach(student => {
    const id = 'S' + Utilities.getUuid().substring(0, 8).toUpperCase();
    sheet.appendRow([
      id,
      student.nama,
      student.kelas,
      student.noWa || '',
      'AKTIF',
      now,
      now
    ]);
    addedIds.push(id);
  });
  
  logAction('ADD_BULK_STUDENTS', addedIds.length, `Tambah ${addedIds.length} siswa secara massal`);
  return { count: addedIds.length };
}

function updateStudent(data) {
  const sheet = SS.getSheetByName(SHEETS.SISWA);
  const rows = sheet.getDataRange().getValues();
  const id = data.id;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      if (data.nama) sheet.getRange(i + 1, 2).setValue(data.nama);
      if (data.kelas) sheet.getRange(i + 1, 3).setValue(data.kelas);
      if (data.noWa) sheet.getRange(i + 1, 4).setValue(data.noWa);
      if (data.status) sheet.getRange(i + 1, 5).setValue(data.status);
      sheet.getRange(i + 1, 7).setValue(new Date());
      
      logAction('UPDATE_STUDENT', id, 'Update siswa: ' + id);
      return { id: id };
    }
  }
  throw new Error('Siswa tidak ditemukan');
}

function deleteStudent(id) {
  const transactionSheet = SS.getSheetByName(SHEETS.TRANSAKSI);
  const transactionData = transactionSheet.getDataRange().getValues();
  
  // Check if student has any transactions
  for (let i = 1; i < transactionData.length; i++) {
    if (transactionData[i][2] === id) {
      throw new Error('Gagal menghapus: Siswa ini memiliki riwayat transaksi keuangan. Silakan nonaktifkan saja statusnya jika sudah tidak aktif.');
    }
  }
  
  const studentSheet = SS.getSheetByName(SHEETS.SISWA);
  const studentData = studentSheet.getDataRange().getValues();
  
  for (let i = 1; i < studentData.length; i++) {
    if (studentData[i][0] === id) {
      const studentName = studentData[i][1];
      studentSheet.deleteRow(i + 1);
      logAction('DELETE_STUDENT', id, 'Hapus permanen siswa: ' + studentName);
      return { success: true, message: 'Siswa berhasil dihapus permanen.' };
    }
  }
  
  throw new Error('Siswa tidak ditemukan');
}

function addTransaction(data) {
  // Use lock to prevent race conditions on balance calculation
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Wait up to 10 seconds
  
  try {
    const nominal = parseInt(data.nominal);
    if (data.jenis === 'PENARIKAN') {
      const balanceData = getStudentDetail(data.idSiswa).balance;
      if (balanceData.saldo < nominal) {
        throw new Error('Saldo tidak mencukupi untuk penarikan. Saldo saat ini: ' + balanceData.saldo);
      }
    }
    
    const sheet = SS.getSheetByName(SHEETS.TRANSAKSI);
    const id = 'TX' + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + Utilities.getUuid().substring(0, 4).toUpperCase();
    
    sheet.appendRow([
      id,
      data.tanggal,
      data.idSiswa,
      data.namaSiswa,
      data.jenis,
      nominal,
      data.keterangan || '',
      data.petugas || 'System',
      new Date()
    ]);
    
    const newBalance = getStudentDetail(data.idSiswa).balance.saldo;
    logAction('ADD_TRANSACTION', id, `${data.jenis} untuk ${data.namaSiswa} senilai ${nominal}`);
    
    return { 
      transaction: { id, ...data, nominal, createdAt: new Date() },
      newBalance: newBalance
    };
  } finally {
    lock.releaseLock();
  }
}

function addBulkTransactions(transactions) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Higher timeout for bulk
  
  try {
    const sheet = SS.getSheetByName(SHEETS.TRANSAKSI);
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "GMT+7", "yyyyMMdd");
    const results = [];
    
    transactions.forEach(tx => {
      if (!tx.nominal || tx.nominal <= 0) return;
      
      const id = 'TX' + dateStr + Utilities.getUuid().substring(0, 4).toUpperCase();
      const nominal = parseInt(tx.nominal);
      
      sheet.appendRow([
        id,
        tx.tanggal || now,
        tx.idSiswa,
        tx.namaSiswa,
        tx.jenis || 'SETORAN',
        nominal,
        tx.keterangan || 'Setoran Massal',
        tx.petugas || 'System',
        now
      ]);
      results.push(id);
    });
    
    logAction('ADD_BULK_TRANSACTIONS', results.length, `Tambah ${results.length} transaksi massal`);
    return { count: results.length };
  } finally {
    lock.releaseLock();
  }
}

function updateTransaction(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const sheet = SS.getSheetByName(SHEETS.TRANSAKSI);
    const rows = sheet.getDataRange().getValues();
    const id = data.id;
    const nominal = parseInt(data.nominal);
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        // If it's a withdrawal, check balance again (excluding this current transaction's old value)
        if (data.jenis === 'PENARIKAN') {
          const detail = getStudentDetail(data.idSiswa);
          const currentTotalSetoran = detail.balance.totalSetoran;
          const currentTotalPenarikan = detail.balance.totalPenarikan;
          const oldNominal = rows[i][5];
          const currentBalanceWithoutThis = currentTotalSetoran - (currentTotalPenarikan - oldNominal);
          
          if (currentBalanceWithoutThis < nominal) {
            throw new Error('Saldo tidak mencukupi untuk penarikan. Saldo tersedia: ' + currentBalanceWithoutThis);
          }
        }
        
        sheet.getRange(i + 1, 2).setValue(data.tanggal);
        sheet.getRange(i + 1, 3).setValue(data.idSiswa);
        sheet.getRange(i + 1, 4).setValue(data.namaSiswa);
        sheet.getRange(i + 1, 5).setValue(data.jenis);
        sheet.getRange(i + 1, 6).setValue(nominal);
        sheet.getRange(i + 1, 7).setValue(data.keterangan || '');
        
        logAction('UPDATE_TRANSACTION', id, `Update transaksi ${id}`);
        return { success: true };
      }
    }
    throw new Error('Transaksi tidak ditemukan');
  } finally {
    lock.releaseLock();
  }
}

function deleteTransaction(id) {
  const sheet = SS.getSheetByName(SHEETS.TRANSAKSI);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      logAction('DELETE_TRANSACTION', id, `Hapus transaksi ${id}`);
      return { success: true };
    }
  }
  throw new Error('Transaksi tidak ditemukan');
}

function getReports(params) {
  const transactions = getTransactions();
  const students = getStudents();
  
  return transactions.filter(t => {
    const txDate = new Date(t.tanggal);
    const txDateStr = Utilities.formatDate(txDate, "GMT+7", "yyyy-MM-dd");
    
    const matchesStart = !params.startDate || txDateStr >= params.startDate;
    const matchesEnd = !params.endDate || txDateStr <= params.endDate;
    
    if (!(matchesStart && matchesEnd)) return false;
    
    if (params.idSiswa && t.idSiswa !== params.idSiswa) return false;
    if (params.jenis && t.jenis !== params.jenis) return false;
    
    if (params.kelas) {
      const student = students.find(s => s.id === t.idSiswa);
      if (!student || student.kelas !== params.kelas) return false;
    }
    
    return true;
  });
}

function backupData() {
  const folder = DriveApp.getRootFolder();
  const name = 'BACKUP_TABUNGAN_' + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HH-mm");
  const copy = DriveApp.getFileById(SS_ID).makeCopy(name, folder);
  
  logAction('BACKUP', copy.getId(), 'Backup database dibuat');
  return { downloadUrl: copy.getUrl(), backupId: copy.getId() };
}

function restoreData(backupId) {
  // Simple restore strategy: Copy data from backup sheets to current sheets
  const backupSS = SpreadsheetApp.openById(backupId);
  
  Object.values(SHEETS).forEach(sheetName => {
    const sourceSheet = backupSS.getSheetByName(sheetName);
    const targetSheet = SS.getSheetByName(sheetName);
    
    if (sourceSheet && targetSheet) {
      targetSheet.clear();
      const data = sourceSheet.getDataRange().getValues();
      targetSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
  });
  
  logAction('RESTORE', backupId, 'Database direstore dari backup');
  return true;
}

function logAction(action, idData, keterangan) {
  const sheet = SS.getSheetByName(SHEETS.LOG);
  sheet.appendRow([
    'LOG' + Utilities.getUuid().substring(0, 8),
    new Date(),
    action,
    idData,
    'Operator',
    keterangan
  ]);
}

/**
 * Setup Initial Spreadsheet
 */
function setup() {
  // Create sheets if not exist
  Object.values(SHEETS).forEach(name => {
    if (!SS.getSheetByName(name)) {
      SS.insertSheet(name);
    }
  });
  
  // Setup Headers
  SS.getSheetByName(SHEETS.SISWA).getRange(1, 1, 1, 7).setValues([['ID_SISWA', 'NAMA', 'KELAS', 'NO_WA', 'STATUS', 'CREATED_AT', 'UPDATED_AT']]);
  SS.getSheetByName(SHEETS.TRANSAKSI).getRange(1, 1, 1, 9).setValues([['ID_TRANSAKSI', 'TANGGAL', 'ID_SISWA', 'NAMA_SISWA', 'JENIS', 'NOMINAL', 'KETERANGAN', 'PETUGAS', 'CREATED_AT']]);
  SS.getSheetByName(SHEETS.USERS).getRange(1, 1, 1, 5).setValues([['ID_USER', 'USERNAME', 'NAMA', 'ROLE', 'STATUS']]);
  SS.getSheetByName(SHEETS.LOG).getRange(1, 1, 1, 6).setValues([['ID_LOG', 'WAKTU', 'AKSI', 'ID_DATA', 'USER', 'KETERANGAN']]);
  
  // Formatting
  Object.values(SHEETS).forEach(name => {
    const sheet = SS.getSheetByName(name);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#f1f5f9').setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
}
