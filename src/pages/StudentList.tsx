import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Filter,
  X,
  Save,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  MessageSquare,
  CheckSquare,
  Square
} from 'lucide-react';
import { apiService } from '../services/api';
import { Student, StudentStatus } from '../types';
import { cn } from '../utils/format';
import Papa from 'papaparse';

const BROADCAST_TEMPLATES = [
  { id: 'custom', label: 'Pesan Kustom', text: '' },
  { id: 'info', label: 'Informasi Umum', text: 'Assalamu\'alaikum Bapak/Ibu Wali Murid dari [nama], menginformasikan bahwa...' },
  { id: 'reminder', label: 'Pengingat Tabungan', text: 'Assalamu\'alaikum Bapak/Ibu Wali Murid dari [nama], mohon kesediaannya untuk mengisi saldo tabungan putra/putri Bapak/Ibu. Terima kasih.' },
];

export const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleOpenBroadcast = () => {
    if (selectedIds.size === 0) return;
    setIsBroadcastModalOpen(true);
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.noWa) return;
    const message = broadcastMessage.replace('[nama]', student.nama);
    const waUrl = `https://wa.me/${student.noWa.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadTemplate = () => {
    // Menambahkan BOM (\ufeff) agar Excel mengenali UTF-8
    // Menggunakan semicolon (;) karena standar Excel di Indonesia sering menggunakan semicolon sebagai pemisah kolom
    const headers = ["nama", "kelas", "noWa"];
    const rows = [
      ["Budi Santoso", "7A", "081234567890"],
      ["Siti Aminah", "7B", "081222333444"]
    ];
    
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_upload_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      // Auto-detect delimiter (comma or semicolon)
      complete: async (results) => {
        try {
          const students = results.data.map((row: any) => ({
            nama: row.nama,
            kelas: row.kelas,
            noWa: row.noWa || ''
          })).filter(s => s.nama && s.kelas);

          if (students.length === 0) {
            alert('Format file tidak sesuai atau data kosong.');
            return;
          }

          const response = await apiService.addBulkStudents(students);
          if (response.success) {
            alert(`Berhasil menambahkan ${response.data.count} siswa.`);
            setIsUploadModalOpen(false);
            fetchStudents();
          } else {
            alert(response.message);
          }
        } catch (err: any) {
          alert(err.message);
        } finally {
          setUploadLoading(false);
          // Reset input
          e.target.value = '';
        }
      },
      error: (error) => {
        alert('Gagal membaca file: ' + error.message);
        setUploadLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getStudents();
      if (response.success) {
        setStudents(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSiswa = () => {
    setCurrentStudent({
      status: 'AKTIF' as StudentStatus,
    });
    setIsModalOpen(true);
  };

  const handleEditSiswa = (student: Student) => {
    setCurrentStudent(student);
    setIsModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const handleDeleteSiswa = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSiswa = async () => {
    if (!studentToDelete) return;
    
    setLoading(true);
    setIsDeleteModalOpen(false);
    try {
      const response = await apiService.deleteStudent(studentToDelete);
      if (response.success) {
        fetchStudents();
        alert(response.message || 'Siswa berhasil dihapus.');
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      setStudentToDelete(null);
    }
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let response;
      if (currentStudent?.id) {
        response = await apiService.updateStudent(currentStudent.id, currentStudent);
      } else {
        response = await apiService.addStudent(currentStudent as any);
      }

      if (response.success) {
        setIsModalOpen(false);
        fetchStudents();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKelas = filterKelas === '' || s.kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  const kelasList = Array.from(new Set(students.map(s => s.kelas))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Siswa</h2>
          <p className="text-slate-500">Kelola informasi data diri siswa dan orang tua.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDownloadTemplate}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 font-bold border border-slate-200"
            title="Download Template CSV"
          >
            <Download size={20} />
            Template
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-bold border border-blue-200"
          >
            <Upload size={20} />
            Upload
          </button>
          <button 
            onClick={handleAddSiswa}
            className="col-span-2 md:col-span-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            Tambah Siswa
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-blue-600 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg shadow-blue-100">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <CheckSquare size={20} />
            </div>
            <div>
              <p className="font-bold">{selectedIds.size} Siswa Terpilih</p>
              <p className="text-xs text-blue-100">Pilih aksi untuk siswa yang dipilih</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-colors font-bold text-sm"
            >
              Batal
            </button>
            <button 
              onClick={handleOpenBroadcast}
              className="bg-white text-blue-600 px-6 py-2 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <MessageSquare size={18} />
              Kirim WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama siswa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(kelas => (
              <option key={kelas} value={kelas}>{kelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Memuat data siswa...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center px-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4">
              <AlertCircle size={24} />
            </div>
            <p className="text-slate-600 font-medium">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="pl-6 py-4 w-10">
                    <button 
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Orang Tua</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        className={cn(
                          "hover:bg-slate-50 transition-colors cursor-pointer",
                          selectedIds.has(student.id) && "bg-blue-50/50"
                        )}
                        onClick={() => toggleSelectStudent(student.id)}
                      >
                        <td className="pl-6 py-4">
                          <div className={cn(
                            "text-slate-300",
                            selectedIds.has(student.id) && "text-blue-600"
                          )}>
                            {selectedIds.has(student.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{student.nama}</div>
                        <div className="text-xs text-slate-400 font-medium">ID: {student.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {student.kelas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {student.noWa || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          student.status === 'AKTIF' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSiswa(student);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSiswa(student.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Tidak ada data siswa yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">
                {currentStudent?.id ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSiswa} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentStudent?.nama || ''}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, nama: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Kelas / Rombel</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentStudent?.kelas || ''}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, kelas: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Nomor WhatsApp Orang Tua (Contoh: 0812...)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentStudent?.noWa || ''}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, noWa: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Status</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentStudent?.status || 'AKTIF'}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, status: e.target.value as StudentStatus })}
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="TIDAK_AKTIF">TIDAK AKTIF</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Siswa?</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Siswa akan dihapus permanen dari sistem. <br/>
                <strong>Catatan:</strong> Penghapusan hanya bisa dilakukan jika siswa tidak memiliki riwayat transaksi keuangan.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeleteSiswa}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Upload Data Siswa</h3>
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
                    Gunakan file CSV sesuai template untuk mengunggah data siswa secara massal.
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
                  <li>Kolom wajib: <strong>nama, kelas</strong></li>
                  <li>Kolom opsional: <strong>noWa</strong></li>
                  <li>Jangan mengubah nama kolom (header)</li>
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

      {/* Modal Broadcast */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-900">Broadcast WhatsApp ({selectedIds.size})</h3>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Pilih Template Pesan</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {BROADCAST_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setBroadcastMessage(template.text);
                        }}
                        className={cn(
                          "px-4 py-2 text-xs font-bold rounded-xl border transition-all text-center",
                          selectedTemplate === template.id 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"
                        )}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Isi Pesan</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-slate-700"
                    rows={4}
                    placeholder="Ketik pesan Anda di sini... Gunakan [nama] untuk menyebut nama siswa."
                    value={broadcastMessage}
                    onChange={(e) => {
                      setBroadcastMessage(e.target.value);
                      setSelectedTemplate('custom');
                    }}
                  />
                  <p className="text-[10px] text-slate-400 italic">* Gunakan tag <strong>[nama]</strong> untuk menyapa siswa secara personal.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Antrean Pengiriman</label>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                  {students.filter(s => selectedIds.has(s.id)).map(student => (
                    <div key={student.id} className="px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {student.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{student.nama}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{student.noWa || 'No WhatsApp Belum Ada'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => sendWhatsApp(student)}
                        disabled={!student.noWa}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          student.noWa 
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" 
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                        )}
                      >
                        <MessageSquare size={14} />
                        Kirim
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="bg-amber-50 p-3 rounded-xl flex items-start gap-3 text-amber-700 text-[10px] mb-4 font-medium">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Catatan: Karena kebijakan WhatsApp, pesan harus dikirim secara manual satu per satu melalui jendela baru. Klik "Kirim" pada setiap antrean untuk membuka WhatsApp.</p>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
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
