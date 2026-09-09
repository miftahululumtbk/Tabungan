export type Role = 'ADMIN' | 'BENDAHARA';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: Role;
  status: 'AKTIF' | 'NONAKTIF';
}

export type StudentStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface Student {
  id: string;
  nama: string;
  kelas: string;
  noWa: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'SETORAN' | 'PENARIKAN';

export interface Transaction {
  id: string;
  tanggal: string;
  idSiswa: string;
  namaSiswa: string;
  jenis: TransactionType;
  nominal: number;
  keterangan: string;
  petugas: string;
  createdAt: string;
}

export interface StudentBalance {
  idSiswa: string;
  namaSiswa: string;
  kelas: string;
  totalSetoran: number;
  totalPenarikan: number;
  saldo: number;
}

export interface DashboardStats {
  jumlahSiswa: number;
  totalSaldo: number;
  totalSetoran: number;
  totalPenarikan: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
