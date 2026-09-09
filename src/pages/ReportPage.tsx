import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Printer, 
  Download,
  Calendar,
  User,
  ArrowRight,
  Share2,
  MessageCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Student, Transaction } from '../types';
import { formatRupiah, formatDateShort, generateWhatsAppGroupLink, cn } from '../utils/format';

export const ReportPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    idSiswa: '',
    kelas: '',
    jenis: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await apiService.getStudents();
      if (response.success) setStudents(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await apiService.getReports(filters);
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareReportGroup = () => {
    if (transactions.length === 0) return;

    let title = '*LAPORAN KAS TABUNGAN*';
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? formatDateShort(filters.startDate) : 'Awal';
      const end = filters.endDate ? formatDateShort(filters.endDate) : 'Akhir';
      title += `\n📅 Periode: ${start} - ${end}`;
    }
    if (filters.kelas) title += `\n🏫 Kelas: ${filters.kelas}`;
    
    let message = `${title}\n\n`;
    
    transactions.forEach((tx, idx) => {
      const typeIcon = tx.jenis === 'SETORAN' ? '📥' : '📤';
      message += `${idx + 1}. ${tx.namaSiswa} (${typeIcon}): ${formatRupiah(tx.nominal)}\n`;
    });
    
    message += `\n*TOTAL REKAPITULASI:*`;
    message += `\nTotal Setoran: ${formatRupiah(summary.totalSetoran)}`;
    message += `\nTotal Penarikan: ${formatRupiah(summary.totalPenarikan)}`;
    message += `\n*Saldo Periode Ini: ${formatRupiah(summary.totalSetoran - summary.totalPenarikan)}*`;
    message += `\n\n_Laporan dikirim melalui Sistem Tabungan Siswa._`;
    
    const link = generateWhatsAppGroupLink(message);
    window.open(link, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Jenis', 'Nominal', 'Keterangan'];
    const rows = transactions.map((tx, idx) => {
      const student = students.find(s => s.id === tx.idSiswa);
      return [
        idx + 1,
        formatDateShort(tx.tanggal),
        tx.namaSiswa,
        student?.kelas || '-',
        tx.jenis,
        tx.nominal,
        tx.keterangan || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Tabungan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = transactions.reduce((acc, tx) => {
    if (tx.jenis === 'SETORAN') {
      acc.totalSetoran += tx.nominal;
    } else {
      acc.totalPenarikan += tx.nominal;
    }
    acc.count += 1;
    return acc;
  }, { totalSetoran: 0, totalPenarikan: 0, count: 0 });

  const kelasList = Array.from(new Set(students.map(s => s.kelas))).sort();

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h2>
          <p className="text-slate-500">Generate laporan tabungan berdasarkan filter tertentu.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="border border-slate-200 bg-white text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Printer size={20} />
            Cetak
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="border border-slate-200 bg-white text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50"
          >
            <Download size={20} />
            Export
          </button>
          <button 
            onClick={handleShareReportGroup}
            disabled={transactions.length === 0}
            className="col-span-2 md:col-span-1 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50 shadow-lg shadow-emerald-100"
          >
            <Share2 size={20} />
            Share Grup
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                name="startDate"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                name="endDate"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Kelas</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="kelas"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                value={filters.kelas}
                onChange={handleFilterChange}
              >
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Siswa</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="idSiswa"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                value={filters.idSiswa}
                onChange={handleFilterChange}
              >
                <option value="">Semua Siswa</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Jenis Transaksi</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="jenis"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                value={filters.jenis}
                onChange={handleFilterChange}
              >
                <option value="">Semua Jenis</option>
                <option value="SETORAN">SETORAN</option>
                <option value="PENARIKAN">PENARIKAN</option>
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 disabled:opacity-50 h-[42px]"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={20} />}
              Generate Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Report Header for Print */}
      <div className="hidden print:block text-center space-y-2 mb-8 border-b-2 border-slate-800 pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight">Laporan Tabungan Siswa</h1>
        <p className="text-lg font-bold">Periode: {filters.startDate || 'Awal'} s/d {filters.endDate || 'Sekarang'}</p>
        <div className="flex justify-center gap-8 mt-4 text-sm font-medium">
          {filters.kelas && <span>Kelas: {filters.kelas}</span>}
          {filters.idSiswa && <span>Siswa: {students.find(s => s.id === filters.idSiswa)?.nama}</span>}
        </div>
      </div>

      {/* Summary Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Setoran</p>
            <h4 className="text-2xl font-black text-emerald-700">{formatRupiah(summary.totalSetoran)}</h4>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl">
            <p className="text-xs font-bold text-orange-600 uppercase mb-1">Total Penarikan</p>
            <h4 className="text-2xl font-black text-orange-700">{formatRupiah(summary.totalPenarikan)}</h4>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Jumlah Transaksi</p>
            <h4 className="text-2xl font-black text-blue-700">{summary.count} Transaksi</h4>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 print:bg-slate-100 border-b border-slate-100 print:border-slate-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider text-right">Nominal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 print:text-slate-900 uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 print:text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDateShort(tx.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      {tx.namaSiswa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase print:bg-transparent print:border",
                        tx.jenis === 'SETORAN' ? "bg-emerald-50 text-emerald-700 print:border-emerald-200" : "bg-orange-50 text-orange-700 print:border-orange-200"
                      )}>
                        {tx.jenis}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                      tx.jenis === 'SETORAN' ? "text-emerald-600" : "text-orange-600"
                    )}>
                      {formatRupiah(tx.nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 italic print:text-slate-500">
                      {tx.keterangan || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    {loading ? 'Sedang mengenerate laporan...' : 'Pilih filter dan tekan tombol Generate Laporan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature for Print */}
      <div className="hidden print:flex justify-end mt-16 pr-12">
        <div className="text-center space-y-16">
          <p className="font-bold">Bendahara Sekolah</p>
          <div className="border-b-2 border-slate-900 w-48"></div>
          <p className="font-medium">( ........................................ )</p>
        </div>
      </div>
    </div>
  );
};
