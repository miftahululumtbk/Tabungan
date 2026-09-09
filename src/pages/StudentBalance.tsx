import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  FileText,
  Printer,
  History
} from 'lucide-react';
import { apiService } from '../services/api';
import { Student, StudentBalance as IStudentBalance, Transaction } from '../types';
import { formatRupiah, formatDateShort, generateWhatsAppLink, cn } from '../utils/format';

export const StudentBalance = () => {
  const [balances, setBalances] = useState<IStudentBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<{ student: Student; balance: IStudentBalance; history: Transaction[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const response = await apiService.getBalances();
      if (response.success) {
        setBalances(response.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedStudentId(id);
    try {
      const response = await apiService.getStudentDetail(id);
      if (response.success) {
        setStudentDetail(response.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredBalances = balances.filter(b => 
    b.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStudentId && studentDetail) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedStudentId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium group"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          Kembali ke Daftar Saldo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Wallet size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{studentDetail.student.nama}</h3>
                  <p className="text-slate-500 font-medium">Kelas {studentDetail.student.kelas}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">ID Siswa</span>
                  <span className="text-sm font-bold text-slate-900">{studentDetail.student.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">WhatsApp</span>
                  <span className="text-sm font-bold text-slate-900">{studentDetail.student.noWa || '-'}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-600 rounded-xl text-white">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Saldo Saat Ini</p>
                <h4 className="text-2xl font-black">{formatRupiah(studentDetail.balance.saldo)}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Setoran</p>
                  <p className="text-sm font-bold text-emerald-700">{formatRupiah(studentDetail.balance.totalSetoran)}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Total Penarikan</p>
                  <p className="text-sm font-bold text-orange-700">{formatRupiah(studentDetail.balance.totalPenarikan)}</p>
                </div>
              </div>

              {studentDetail.student.noWa ? (
                <a 
                  href={generateWhatsAppLink(
                    studentDetail.student.noWa,
                    `Assalamu'alaikum Bapak/Ibu Wali dari ${studentDetail.student.nama}.\n\nBerikut adalah rekap saldo tabungan siswa saat ini:\n\nNama: ${studentDetail.student.nama}\nKelas: ${studentDetail.student.kelas}\n\nTotal Setoran: ${formatRupiah(studentDetail.balance.totalSetoran)}\nTotal Penarikan: ${formatRupiah(studentDetail.balance.totalPenarikan)}\nSALDO SAAT INI: ${formatRupiah(studentDetail.balance.saldo)}\n\nRiwayat Terakhir:\n${studentDetail.history.slice(0, 5).map(h => `- ${formatDateShort(h.tanggal)}: ${h.jenis} ${formatRupiah(h.nominal)}`).join('\n')}${studentDetail.history.length > 5 ? '\n... (dan lainnya)' : ''}\n\nTerima kasih.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-6 bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-100"
                >
                  <MessageCircle size={20} />
                  Kirim Rekap WA
                </a>
              ) : (
                <button 
                  disabled
                  className="w-full mt-6 bg-slate-100 text-slate-400 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold cursor-not-allowed border border-slate-200"
                >
                  <MessageCircle size={20} />
                  WA Tidak Tersedia
                </button>
              )}
            </div>
          </div>

          {/* History Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-blue-600" />
                  Riwayat Tabungan
                </h3>
                <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Cetak Riwayat">
                  <Printer size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Setoran</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Penarikan</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentDetail.history.length > 0 ? (
                      studentDetail.history.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDateShort(h.tanggal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                              h.jenis === 'SETORAN' ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                            )}>
                              {h.jenis}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                            {h.jenis === 'SETORAN' ? formatRupiah(h.nominal) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600 text-right">
                            {h.jenis === 'PENARIKAN' ? formatRupiah(h.nominal) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 italic">
                            {h.keterangan || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          Belum ada riwayat transaksi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Saldo Tabungan Siswa</h2>
        <p className="text-slate-500">Pantau akumulasi saldo dan riwayat detail masing-masing siswa.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari siswa berdasarkan nama..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Menghitung saldo siswa...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Setoran</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Penarikan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBalances.length > 0 ? (
                  filteredBalances.map((b, index) => (
                    <tr 
                      key={b.idSiswa} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => fetchStudentDetail(b.idSiswa)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{b.namaSiswa}</div>
                        <div className="text-xs text-slate-500 font-medium">ID: {b.idSiswa}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {b.kelas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                        {formatRupiah(b.totalSetoran)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600 text-right">
                        {formatRupiah(b.totalPenarikan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-base font-extrabold text-blue-600">
                          {formatRupiah(b.saldo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300 group-hover:text-blue-400 transition-colors">
                        <ChevronRight size={20} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                      Data saldo tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-bold">Memuat detail siswa...</p>
          </div>
        </div>
      )}
    </div>
  );
};
