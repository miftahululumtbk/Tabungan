/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/StudentList';
import { TransactionPage } from './pages/TransactionPage';
import { StudentBalance } from './pages/StudentBalance';
import { ReportPage } from './pages/ReportPage';
import { BackupPage } from './pages/BackupPage';
import { LoginPage } from './pages/LoginPage';

// Simple Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/siswa" element={
          <ProtectedRoute>
            <StudentList />
          </ProtectedRoute>
        } />
        
        <Route path="/transaksi" element={
          <ProtectedRoute>
            <TransactionPage />
          </ProtectedRoute>
        } />
        
        <Route path="/saldo" element={
          <ProtectedRoute>
            <StudentBalance />
          </ProtectedRoute>
        } />
        
        <Route path="/laporan" element={
          <ProtectedRoute>
            <ReportPage />
          </ProtectedRoute>
        } />
        
        <Route path="/backup" element={
          <ProtectedRoute>
            <BackupPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

