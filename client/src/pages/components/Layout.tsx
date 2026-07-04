import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import AdminSidebar from '../admin/AdminSidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top navigation bar */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/dashboard')} className="text-lg font-semibold tracking-tight text-white hover:text-zinc-300 transition-colors">
              GStack Deposit
            </button>
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => navigate('/dashboard')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${location.pathname === '/dashboard' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}>
                Dashboard
              </button>
              <button onClick={() => navigate('/deposit')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${location.pathname === '/deposit' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}>
                Deposit
              </button>
              <button onClick={() => navigate('/transactions')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${location.pathname === '/transactions' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}>
                Transactions
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isAdminRoute ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}>
                  Admin
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white">{user?.email}</p>
              <p className="text-xs text-muted">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin sidebar — only visible on admin routes */}
        {isAdminRoute && <AdminSidebar />}

        {/* Main content */}
        <main className={`flex-1 ${isAdminRoute ? 'p-8' : 'max-w-5xl mx-auto p-8 w-full'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
