import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { cn } from '../utils/format';

export const BackupPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ type: 'BACKUP' | 'RESTORE'; message: string; url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiService.backupData();
      if (response.success) {
        setSuccess({ 
          type: 'BACKUP', 
          message: 'Backup data berhasil dibuat di Google Drive Anda.',
          url: response.data.downloadUrl
        });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupIdInput, setBackupIdInput] = useState('');

  const handleRestore = () => {
    setIsRestoreModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!backupIdInput) {
      setError('Harap masukkan ID Backup.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsRestoreModalOpen(false);
    try {
      const response = await apiService.restoreData(backupIdInput);
      if (response.success) {
        setSuccess({ 
          type: 'RESTORE', 
          message: 'Data berhasil direstore. Silakan muat ulang aplikasi untuk melihat perubahan.' 
        });
        setBackupIdInput('');
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Backup & Keamanan Data</h2>
        <p className="text-slate-500">Amankan data tabungan siswa secara berkala ke Google Drive.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Download size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Backup Data</h3>
            <p className="text-slate-500 mt-2">
              Sistem akan membuat salinan spreadsheet database saat ini ke folder khusus di Google Drive Anda.
            </p>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
              <ShieldCheck size={18} className="text-emerald-500" />
              Data aman di cloud Google
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
              <ShieldCheck size={18} className="text-emerald-500" />
              Mencegah kehilangan data
            </li>
          </ul>
          <button 
            onClick={handleBackup}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Database size={20} />}
            Backup Sekarang
          </button>
        </div>

        {/* Restore Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Restore Data</h3>
            <p className="text-slate-500 mt-2">
              Kembalikan data dari backup sebelumnya. Gunakan fitur ini hanya jika terjadi kesalahan data fatal.
            </p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3 text-orange-800 text-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p>Hati-hati! Proses restore akan menimpa seluruh data yang ada saat ini dengan data lama.</p>
          </div>
          <button 
            onClick={handleRestore}
            disabled={loading}
            className="w-full border border-orange-200 text-orange-600 px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            Restore dari Backup
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-900">Berhasil!</h4>
            <p className="text-emerald-700 mt-1">{success.message}</p>
            {success.url && (
              <a 
                href={success.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-emerald-800 font-bold hover:underline"
              >
                Buka di Google Drive <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900">Gagal</h4>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
      {/* Restore Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRestoreModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Restore Data</h3>
                <button onClick={() => setIsRestoreModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3 text-orange-800 text-sm">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <p>PERINGATAN: Restore data akan menimpa seluruh data saat ini. Tindakan ini tidak dapat dibatalkan.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">ID File Backup (dari Google Drive)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masukkan ID File..."
                  value={backupIdInput}
                  onChange={(e) => setBackupIdInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmRestore}
                  disabled={!backupIdInput}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  Proses Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
