import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  Wallet, 
  FileText, 
  Database, 
  Menu, 
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/format';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}

const SidebarItem = ({ to, icon: Icon, children, onClick }: SidebarItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
      isActive 
        ? "bg-blue-600 text-white shadow-md" 
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
    )}
  >
    <Icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110")} />
    <span className="font-medium">{children}</span>
  </NavLink>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Simple logout, just redirect to login if we had one
    // For now, just a placeholder
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Tabungan</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Siswa Mandiri</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem to="/" icon={LayoutDashboard}>Dashboard</SidebarItem>
          <SidebarItem to="/siswa" icon={Users}>Data Siswa</SidebarItem>
          <SidebarItem to="/transaksi" icon={ArrowLeftRight}>Transaksi</SidebarItem>
          <SidebarItem to="/saldo" icon={Wallet}>Saldo Siswa</SidebarItem>
          <SidebarItem to="/laporan" icon={FileText}>Laporan</SidebarItem>
          <SidebarItem to="/backup" icon={Database}>Backup Data</SidebarItem>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
          >
            <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <h1 className="font-bold text-base">Tabungan Siswa</h1>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Wallet size={24} />
            </div>
            <h1 className="font-bold text-lg">Tabungan</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-4">
          <SidebarItem to="/" icon={LayoutDashboard} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</SidebarItem>
          <SidebarItem to="/siswa" icon={Users} onClick={() => setIsMobileMenuOpen(false)}>Data Siswa</SidebarItem>
          <SidebarItem to="/transaksi" icon={ArrowLeftRight} onClick={() => setIsMobileMenuOpen(false)}>Transaksi</SidebarItem>
          <SidebarItem to="/saldo" icon={Wallet} onClick={() => setIsMobileMenuOpen(false)}>Saldo Siswa</SidebarItem>
          <SidebarItem to="/laporan" icon={FileText} onClick={() => setIsMobileMenuOpen(false)}>Laporan</SidebarItem>
          <SidebarItem to="/backup" icon={Database} onClick={() => setIsMobileMenuOpen(false)}>Backup Data</SidebarItem>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 w-full overflow-x-hidden">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
