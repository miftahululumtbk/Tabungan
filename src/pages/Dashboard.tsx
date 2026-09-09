import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { DashboardStats, Transaction } from '../types';
import { formatRupiah, formatDate, cn } from '../utils/format';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: React.ElementType, color: string, subtext?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiService.getDashboard();
        if (response.success) {
          setStats(response.data);
          setRecentTransactions(response.data.recentTransactions || []);
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Users size={24} />
        </div>
        <h3 className="text-lg font-bold mb-2">Terjadi Kesalahan</h3>
        <p className="max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ringkasan Tabungan</h2>
        <p className="text-slate-500">Selamat datang di sistem manajemen keuangan siswa.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Jumlah Siswa" 
          value={stats?.jumlahSiswa || 0} 
          icon={Users} 
          color="bg-blue-600" 
          subtext="Total siswa terdaftar"
        />
        <StatCard 
          title="Total Saldo" 
          value={formatRupiah(stats?.totalSaldo || 0)} 
          icon={Wallet} 
          color="bg-emerald-600"
          subtext="Saldo mengendap di kas"
        />
        <StatCard 
          title="Total Setoran" 
          value={formatRupiah(stats?.totalSetoran || 0)} 
          icon={TrendingUp} 
          color="bg-indigo-600"
          subtext="Kumulatif setoran siswa"
        />
        <StatCard 
          title="Total Penarikan" 
          value={formatRupiah(stats?.totalPenarikan || 0)} 
          icon={TrendingDown} 
          color="bg-orange-600"
          subtext="Kumulatif penarikan siswa"
        />
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Transaksi Terbaru</h3>
          <Link to="/transaksi" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group">
            Lihat Semua <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(tx.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{tx.namaSiswa}</div>
                      <div className="text-xs text-slate-500">{tx.idSiswa}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        tx.jenis === 'SETORAN' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {tx.jenis}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                      tx.jenis === 'SETORAN' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {tx.jenis === 'SETORAN' ? '+' : '-'} {formatRupiah(tx.nominal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                    Belum ada transaksi terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
