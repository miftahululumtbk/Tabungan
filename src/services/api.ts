import { ApiResponse, DashboardStats, Student, Transaction, StudentBalance } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL;

async function request<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  if (!API_URL || API_URL.includes('XXXXXXXX')) {
    throw new Error('VITE_API_URL belum dikonfigurasi. Klik ikon Gerigi (Settings) di pojok kiri bawah, lalu masukkan URL Deployment Google Apps Script Anda di bagian Environment Variables.');
  }

  try {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`API request failed (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error('Fetch error:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Koneksi Gagal: Tidak dapat terhubung ke server. Pastikan URL API benar dan sudah di-Deploy sebagai "Anyone" di Google Apps Script.');
    }
    throw err;
  }
}

async function postRequest<T>(action: string, data: any): Promise<ApiResponse<T>> {
  if (!API_URL || API_URL.includes('XXXXXXXX')) {
    throw new Error('VITE_API_URL belum dikonfigurasi. Klik ikon Gerigi (Settings) di pojok kiri bawah, lalu masukkan URL Deployment Google Apps Script Anda di bagian Environment Variables.');
  }

  try {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);

    // We add the action to the body as well for robustness
    const bodyData = { ...data, action };

    const response = await fetch(url.toString(), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      throw new Error(`API request failed (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error('Post fetch error:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Koneksi Gagal: Tidak dapat terhubung ke server. Pastikan URL API benar dan sudah di-Deploy sebagai "Anyone" di Google Apps Script.');
    }
    throw err;
  }
}

export const apiService = {
  // Dashboard
  getDashboard: () => request<DashboardStats & { recentTransactions: Transaction[] }>('getDashboard'),

  // Students
  getStudents: () => request<Student[]>('getStudents'),
  getStudent: (id: string) => request<Student>('getStudent', { id }),
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => postRequest<Student>('addStudent', student),
  addBulkStudents: (students: any[]) => postRequest<{ count: number }>('addBulkStudents', { students }),
  updateStudent: (id: string, student: Partial<Student>) => postRequest<Student>('updateStudent', { id, ...student }),
  deleteStudent: (id: string) => postRequest<void>('deleteStudent', { id }),

  // Transactions
  getTransactions: () => request<Transaction[]>('getTransactions'),
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => postRequest<Transaction>('addTransaction', transaction),
  addBulkTransactions: (transactions: any[]) => postRequest<{ count: number }>('addBulkTransactions', { transactions }),
  updateTransaction: (id: string, transaction: Partial<Transaction>) => postRequest<void>('updateTransaction', { id, ...transaction }),
  deleteTransaction: (id: string) => postRequest<void>('deleteTransaction', { id }),
  
  // Balances
  getBalances: () => request<StudentBalance[]>('getBalances'),
  getStudentDetail: (idSiswa: string) => request<{ student: Student; balance: StudentBalance; history: Transaction[] }>('getStudentDetail', { idSiswa }),

  // Reports
  getReports: (filters: { startDate?: string; endDate?: string; idSiswa?: string; kelas?: string; jenis?: string }) => {
    return request<Transaction[]>('getReports', filters as any);
  },

  // Backup
  backupData: () => postRequest<{ downloadUrl: string }>('backupData', {}),
  restoreData: (backupId: string) => postRequest<void>('restoreData', { backupId }),
};
