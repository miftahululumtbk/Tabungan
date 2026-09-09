import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  X,
  MessageCircle,
  AlertCircle,
  Calendar,
  User,
  Wallet,
  Save,
  Edit2,
  Trash2,
  ListPlus,
  Users,
  Share2,
  Upload,
  Download,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../services/api';
import { Student, Transaction, TransactionType } from '../types';
import { formatRupiah, formatDateShort, generateWhatsAppLink, generateWhatsAppGroupLink, cn } from '../utils/format';
import Papa from 'papaparse';

export const TransactionPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successData, setSuccessData] = useState<{ tx: Transaction; student: Student; newBalance: number } | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkSuccessModalOpen, setIsBulkSuccessModalOpen] = useState(false);
  const [bulkSuccessTransactions, setBulkSuccessTransactions] = useState<any[]>([]);
  const [bulkData, setBulkData] = useState<{ [key: string]: string }>({});
  const [bulkClass, setBulkClass] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    idSiswa: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'SETORAN' as TransactionType,
    nominal: '',
    keterangan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setModalError(null);
    try {
      const [studentsRes, transactionsRes] = await Promise.all([
        apiService.getStudents(),
        apiService.getTransactions()
      ]);
      if (studentsRes.success) setStudents(studentsRes.data.filter(s => s.status === 'AKTIF'));
      if (transactionsRes.success) setTransactions(transactionsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: TransactionType) => {
    setFormData({
      id: '',
      idSiswa: '',
      jenis: type,
      nominal: '',
      keterangan: '',
      tanggal: new Date().toISOString().split('T')[0],
    });
    setSuccessData(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setFormData({
      id: tx.id,
      idSiswa: tx.idSiswa,
      tanggal: tx.tanggal.split('T')[0], // Ensure date format
      jenis: tx.jenis,
      nominal: tx.nominal.toString(),
      keterangan: tx.keterangan || ''
    });
    setSuccessData(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  const handleDeleteTransaction = (id: string) => {
    setTxToDelete(id);
    setModalError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!txToDelete) return;
    
    setLoading(true);
    setModalError(null);
    try {
      const response = await apiService.deleteTransaction(txToDelete);
      if (response.success) {
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        setModalError(response.message);
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setLoading(false);
      setTxToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const nominal = parseInt(formData.nominal);
    if (isNaN(nominal) || nominal <= 0) {
      setModalError('Nominal harus berupa angka positif.');
      return;
    }

    const student = students.find(s => s.id === formData.idSiswa);
    if (!student) {
      setModalError('Pilih siswa terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    try {
      let response;
      if (formData.id) {
        response = await apiService.updateTransaction(formData.id, {
          ...formData,
          nominal,
          namaSiswa: student.nama,
          petugas: 'Operator'
        } as any);
      } else {
        response = await apiService.addTransaction({
          ...formData,
          nominal,
          namaSiswa: student.nama,
          petugas: 'Operator'
        } as any);
      }

      if (response.success) {
        if (formData.id) {
          setIsModalOpen(false);
          fetchData();
        } else {
          const txData = response.data as any;
          setSuccessData({
            tx: txData.transaction,
            student,
            newBalance: txData.newBalance
          });
          fetchData();
        }
      } else {
        setModalError(response.message);
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSubmit = async () => {
    const transactionsToSubmit = Object.entries(bulkData)
      .filter(([_, nominal]) => parseInt(nominal as string) > 0)
      .map(([idSiswa, nominal]) => {
        const student = students.find(s => s.id === idSiswa);
        return {
          idSiswa,
          namaSiswa: student?.nama || '',
          nominal: parseInt(nominal as string),
          tanggal: bulkDate,
          jenis: 'SETORAN' as TransactionType,
          keterangan: 'Setoran Massal',
          petugas: 'Operator'
        };
      });

    if (transactionsToSubmit.length === 0) {
      alert('Tidak ada nominal yang dimasukkan.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const response = await apiService.addBulkTransactions(transactionsToSubmit);
      if (response.success) {
        setBulkSuccessTransactions(transactionsToSubmit);
        setIsBulkModalOpen(false);
        setIsBulkSuccessModalOpen(true);
        setBulkData({});
        fetchData();
      } else {
        setModalError(response.message);
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareGroup = () => {
    if (bulkSuccessTransactions.length === 0) return;
    
    const date = bulkDate ? formatDateShort(bulkDate) : formatDateShort(new Date().toISOString());
    let message = `*LAPORAN SETORAN TABUNGAN SISWA*\n`;
    message += `📅 Tanggal: ${date}\n`;
    message += `🏫 Kelas: ${bulkClass || '-'}\n\n`;
    message += `Daftar Setoran:\n`;
    
    let total = 0;
    bulkSuccessTransactions.forEach((tx, idx) => {
      message += `${idx + 1}. ${tx.namaSiswa}: ${formatRupiah(tx.nominal)}\n`;
      total += tx.nominal;
    });
    
    message += `\n*Total Kas Masuk: ${formatRupiah(total)}*\n\n`;
    message += `_Pesan ini dikirim otomatis melalui Sistem Tabungan Siswa._`;
    
    const link = generateWhatsAppGroupLink(message);
    window.open(link, '_blank');
  };

  const handleShareAllFiltered = () => {
    if (filteredTransactions.length === 0) return;
    
    let title = '*REKAP TRANSAKSI TABUNGAN*';
    if (startDate || endDate) {
      const start = startDate ? formatDateShort(startDate) : 'Awal';
      const end = endDate ? formatDateShort(endDate) : 'Akhir';
      title += `\n📅 Periode: ${start} - ${end}`;
    }
    
    let message = `${title}\n\n`;
    let totalSetoran = 0;
    let totalPenarikan = 0;
    
    filteredTransactions.forEach((tx, idx) => {
      const typeLabel = tx.jenis === 'SETORAN' ? '[S]' : '[P]';
      message += `${idx + 1}. ${tx.namaSiswa} ${typeLabel}: ${formatRupiah(tx.nominal)}\n`;
      if (tx.jenis === 'SETORAN') totalSetoran += tx.nominal;
      else totalPenarikan += tx.nominal;
    });
    
    message += `\n*Ringkasan:*`;
    message += `\nTotal Setoran (+): ${formatRupiah(totalSetoran)}`;
    message += `\nTotal Penarikan (-): ${formatRupiah(totalPenarikan)}`;
    message += `\n*Saldo Bersih: ${formatRupiah(totalSetoran - totalPenarikan)}*`;
    message += `\n\n_Laporan otomatis Sistem Tabungan Siswa._`;
    
    const link = generateWhatsAppGroupLink(message);
    window.open(link, '_blank');
  };

  const classes = Array.from(new Set(students.map(s => s.kelas))).sort();
  const bulkFilteredStudents = bulkClass 
    ? students.filter(s => s.kelas === bulkClass)
    : [];

  const handleShareIndividual = (tx: Transaction) => {
    const student = students.find(s => s.id === tx.idSiswa);
    if (!student) return;

    if (!student.noWa) {
      alert('Siswa tidak ada nomor WA');
      return;
    }

    const message = `*BUKTI TRANSAKSI TABUNGAN*\n\n` +
      `Siswa: ${student.nama}\n` +
      `Kelas: ${student.kelas}\n` +
      `Jenis: ${tx.jenis}\n` +
      `Nominal: ${formatRupiah(tx.nominal)}\n` +
      `Tanggal: ${formatDateShort(tx.tanggal)}\n` +
      (tx.keterangan ? `Ket: ${tx.keterangan}\n` : '') +
      `\nTerima kasih.`;

    const link = generateWhatsAppLink(student.noWa, message);
    window.open(link, '_blank');
  };
  
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    months.forEach((month) => {
      const headers1 = ["NO", "idSiswa", "NAMA", "KELAS", "TANGGAL"];
      // Pad header1 for days 2-31
      for (let i = 2; i <= 31; i++) headers1.push("");
      
      const headers2 = ["", "", "", ""];
      for (let i = 1; i <= 31; i++) headers2.push(i.toString());

      const dataRows = students.map((s, idx) => {
        const row: any[] = [idx + 1, s.id, s.nama, s.kelas];
        for (let i = 1; i <= 31; i++) row.push(0);
        return row;
      });

      const wsData = [headers1, headers2, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, month);
    });

    XLSX.writeFile(wb, "Template_Tabungan_12_Bulan.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const allTransactions: any[] = [];
        const year = new Date().getFullYear();
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        wb.SheetNames.forEach((sheetName) => {
          const monthIdx = months.indexOf(sheetName);
          if (monthIdx === -1) return;

          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          // Data starts from index 2 (skip 2 header rows)
          for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 5) continue;
            
            const idSiswa = row[1];
            const namaSiswa = row[2];
            
            if (!idSiswa) continue;

            // Days 1-31 start at index 4
            for (let day = 1; day <= 31; day++) {
              const val = row[3 + day];
              const nominal = typeof val === 'number' ? val : parseInt(val);
              
              if (nominal && nominal > 0) {
                // Validate date
                const date = new Date(year, monthIdx, day);
                if (date.getMonth() === monthIdx && date.getDate() === day) {
                  const dateStr = date.toISOString().split('T')[0];
                  allTransactions.push({
                    idSiswa,
                    namaSiswa: namaSiswa || 'Siswa',
                    tanggal: dateStr,
                    jenis: 'SETORAN',
                    nominal,
                    keterangan: `Upload Massal (${sheetName})`,
                    petugas: 'Operator'
                  });
                }
              }
            }
          }
        });

        if (allTransactions.length === 0) {
          alert('Tidak ada data transaksi yang valid ditemukan. Pastikan nominal diisi di kolom tanggal.');
          return;
        }

        if (!confirm(`Ditemukan ${allTransactions.length} transaksi. Lanjutkan upload?`)) {
          setUploadLoading(false);
          return;
        }

        const response = await apiService.addBulkTransactions(allTransactions);
        if (response.success) {
          alert(`Berhasil menambahkan ${response.data.count} transaksi.`);
          setIsUploadModalOpen(false);
          fetchData();
        } else {
          alert(response.message);
        }
      } catch (err: any) {
        alert('Gagal memproses file: ' + err.message);
      } finally {
        setUploadLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.idSiswa.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Get YYYY-MM-DD from transaction date
    const dateObj = new Date(tx.tanggal);
    const txDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    const matchesStartDate = !startDate || txDateStr >= startDate;
    const matchesEndDate = !endDate || txDateStr <= endDate;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transaksi Tabungan</h2>
          <p className="text-slate-500">Catat setoran dan penarikan tabungan siswa.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
              className="h-full bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-bold border border-blue-200"
            >
              <Upload size={20} />
              Import
              <ChevronDown size={16} className={cn("transition-transform", isImportMenuOpen && "rotate-180")} />
            </button>
            
            {isImportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[70]" 
                  onClick={() => setIsImportMenuOpen(false)}
                />
                <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[80] animate-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => {
                      handleDownloadTemplate();
                      setIsImportMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Download size={18} className="text-slate-400" />
                    Download Template
                  </button>
                  <button 
                    onClick={() => {
                      setIsUploadModalOpen(true);
                      setIsImportMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-50 transition-colors"
                  >
                    <Upload size={18} className="text-slate-400" />
                    Upload File CSV
                  </button>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-bold border border-blue-200"
          >
            <ListPlus size={20} />
            Setoran Massal
          </button>
          <button 
            onClick={() => handleOpenModal('SETORAN')}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Setoran
          </button>
          <button 
            onClick={() => handleOpenModal('PENARIKAN')}
            className="flex-1 md:flex-none bg-orange-600 text-white px-6 py-2.5 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-orange-100"
          >
            <ArrowLeftRight size={20} />
            Penarikan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari transaksi berdasarkan nama siswa..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dari Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sampai Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={handleShareAllFiltered}
            disabled={filteredTransactions.length === 0}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Share2 size={16} />
            Share Rekap
          </button>
          <button 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSearchTerm('');
            }}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Memuat data transaksi...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">Tanggal</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">Nama Siswa / ID</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">Jenis</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 text-right">Nominal</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">Keterangan</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600 border-r border-slate-100">
                        {formatDateShort(tx.tanggal)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap border-r border-slate-100">
                        <div className="text-xs font-bold text-slate-900">{tx.namaSiswa}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{tx.idSiswa}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap border-r border-slate-100 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          tx.jenis === 'SETORAN' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {tx.jenis}
                        </span>
                      </td>
                      <td className={cn(
                        "px-4 py-2 whitespace-nowrap text-xs font-bold text-right border-r border-slate-100",
                        tx.jenis === 'SETORAN' ? "text-emerald-600" : "text-orange-600"
                      )}>
                        {tx.jenis === 'SETORAN' ? '+' : '-'} {formatRupiah(tx.nominal)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 border-r border-slate-100">
                        {tx.keterangan || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center space-x-2">
                        {(() => {
                          const student = students.find(s => s.id === tx.idSiswa);
                          const hasWa = !!student?.noWa;
                          return (
                            <button 
                              type="button"
                              onClick={() => handleShareIndividual(tx)}
                              disabled={!hasWa}
                              className={cn(
                                "p-2 rounded-lg transition-colors inline-flex items-center justify-center",
                                hasWa 
                                  ? "text-emerald-600 hover:bg-emerald-50" 
                                  : "text-slate-300 cursor-not-allowed"
                              )}
                              title={hasWa ? "Share WhatsApp" : "Siswa tidak ada nomor WA"}
                            >
                              <MessageCircle size={18} />
                            </button>
                          );
                        })()}
                        <button 
                          type="button"
                          onClick={() => handleEditTransaction(tx)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Belum ada riwayat transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {successData ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Transaksi Berhasil!</h3>
                  <p className="text-slate-500">Data telah disimpan ke database.</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Siswa:</span>
                    <span className="text-slate-900 font-bold">{successData.student.nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Jenis:</span>
                    <span className={cn("font-bold", successData.tx.jenis === 'SETORAN' ? "text-emerald-600" : "text-orange-600")}>
                      {successData.tx.jenis}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Nominal:</span>
                    <span className="text-slate-900 font-bold">{formatRupiah(successData.tx.nominal)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-slate-700 font-bold">Saldo Akhir:</span>
                    <span className="text-blue-600 font-extrabold">{formatRupiah(successData.newBalance)}</span>
                  </div>
                </div>

                {modalError && (
                  <div className="bg-red-50 p-3 rounded-xl flex items-start gap-3 text-red-700 text-xs text-left">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{modalError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {successData.student.noWa ? (
                    <a 
                      href={generateWhatsAppLink(
                        successData.student.noWa, 
                        `Assalamu'alaikum Bapak/Ibu Wali dari ${successData.student.nama}.\n\nKami informasikan bahwa telah dilakukan ${successData.tx.jenis.toLowerCase()} tabungan siswa:\n\nTanggal: ${formatDateShort(successData.tx.tanggal)}\nJenis: ${successData.tx.jenis}\nNominal: ${formatRupiah(successData.tx.nominal)}\nSaldo Tabungan: ${formatRupiah(successData.newBalance)}\n\nTerima kasih.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-100"
                    >
                      <MessageCircle size={20} />
                      Kirim Notifikasi WhatsApp
                    </a>
                  ) : (
                    <button 
                      onClick={() => alert('Siswa tidak ada nomor WA')}
                      className="w-full bg-slate-300 text-slate-500 px-6 py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 font-bold"
                    >
                      <MessageCircle size={20} />
                      WA Tidak Tersedia
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full border border-slate-200 text-slate-600 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors font-bold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    {formData.jenis === 'SETORAN' ? (
                      <><TrendingUp className="text-emerald-600" size={20} /> Form Setoran</>
                    ) : (
                      <><TrendingDown className="text-orange-600" size={20} /> Form Penarikan</>
                    )}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Tanggal</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Pilih Siswa</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={formData.idSiswa}
                        onChange={(e) => setFormData({ ...formData, idSiswa: e.target.value })}
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Nominal (Rp)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" 
                        required
                        placeholder="Contoh: 50000"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.nominal}
                        onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Keterangan (Opsional)</label>
                    <textarea 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={2}
                      placeholder="Catatan tambahan..."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                  </div>

                  {modalError && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-start gap-3 text-red-700 text-xs">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p>{modalError}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-3 text-blue-700 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>Pastikan nominal yang dimasukkan sudah benar sebelum menekan tombol simpan.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className={cn(
                        "flex-1 px-4 py-3 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-lg disabled:opacity-50",
                        formData.jenis === 'SETORAN' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                      )}
                    >
                      {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                      Simpan Transaksi
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Transaksi?</h3>
              <p className="text-slate-500 mb-6">
                Tindakan ini akan menghapus data transaksi dan mengembalikan saldo siswa ke nilai sebelumnya.
              </p>

              {modalError && (
                <div className="w-full bg-red-50 p-3 rounded-xl flex items-start gap-3 text-red-700 text-xs mb-4 text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{modalError}</p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Setoran Massal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ListPlus className="text-blue-600" size={20} /> Setoran Massal
              </h3>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 border-b border-slate-100 bg-white space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Pilih Kelas</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
                      value={bulkClass}
                      onChange={(e) => setBulkClass(e.target.value)}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map(c => (
                        <option key={c} value={c}>Kelas {c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Transaksi</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {!bulkClass ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Users size={32} />
                  </div>
                  <p className="text-slate-500 font-medium italic">Silakan pilih kelas terlebih dahulu untuk melihat daftar siswa.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Nominal Setoran (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkFilteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{s.nama}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{s.id}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block w-full max-w-[200px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-emerald-600"
                              value={bulkData[s.id] || ''}
                              onChange={(e) => setBulkData({ ...bulkData, [s.id]: e.target.value })}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
              {modalError && (
                <div className="bg-red-50 p-3 rounded-xl flex items-start gap-3 text-red-700 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{modalError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleBulkSubmit}
                  disabled={isSaving || !bulkClass}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                  Simpan Semua Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses Massal & WA */}
      {isBulkSuccessModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-8 text-center bg-emerald-600 text-white space-y-2">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold">Berhasil Disimpan!</h3>
              <p className="text-emerald-100">{bulkSuccessTransactions.length} transaksi setoran telah berhasil dicatat.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Kirim Notifikasi WhatsApp</h4>
                  <p className="text-xs text-slate-400 italic">Kirim per siswa atau share ke grup</p>
                </div>
                <button 
                  onClick={handleShareGroup}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 font-bold text-xs border border-blue-200"
                >
                  <Share2 size={16} />
                  Share ke Grup
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {bulkSuccessTransactions.map((tx, idx) => {
                  const student = students.find(s => s.id === tx.idSiswa);
                  return (
                    <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                          {tx.namaSiswa.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{tx.namaSiswa}</p>
                          <p className="text-xs font-bold text-emerald-600">{formatRupiah(tx.nominal)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (student) {
                            const message = `Assalamu'alaikum Bapak/Ibu Wali dari ${student.nama}.\n\nKami informasikan bahwa telah dilakukan setoran tabungan siswa:\n\nTanggal: ${formatDateShort(tx.tanggal)}\nNominal: ${formatRupiah(tx.nominal)}\n\nTerima kasih.`;
                            const link = generateWhatsAppLink(
                              student.noWa || '',
                              message
                            );
                            window.open(link, '_blank');
                          }
                        }}
                        disabled={!student?.noWa}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                          student?.noWa 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <MessageCircle size={18} />
                        Kirim WA
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setIsBulkSuccessModalOpen(false)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-sm"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Upload Transaksi</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet size={32} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    Gunakan file CSV sesuai template untuk mengunggah transaksi secara massal.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors relative group">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-2">
                  <Upload className="mx-auto text-slate-400 group-hover:text-blue-500 transition-colors" size={40} />
                  <p className="text-sm font-bold text-slate-600">
                    {uploadLoading ? 'Memproses data...' : 'Klik atau seret file CSV ke sini'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-blue-700 uppercase">Petunjuk Upload:</h4>
                <ul className="text-[11px] text-blue-600 space-y-1 list-disc pl-4 font-medium">
                  <li>Gunakan format file .CSV</li>
                  <li>Kolom wajib: <strong>idSiswa, tanggal, jenis, nominal</strong></li>
                  <li>Kolom opsional: <strong>keterangan</strong></li>
                  <li>Format tanggal: <strong>YYYY-MM-DD</strong> (2024-01-25)</li>
                  <li>Jenis: <strong>SETORAN</strong> atau <strong>PENARIKAN</strong></li>
                </ul>
              </div>

              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrendingUp = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

const TrendingDown = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);
