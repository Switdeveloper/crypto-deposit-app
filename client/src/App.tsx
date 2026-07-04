import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Recover from './pages/Recover';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEditUser from './pages/admin/AdminEditUser';
import AdminTransactions from './pages/admin/AdminTransactions';
import Layout from './pages/components/Layout';
import LoadingSpinner from './pages/components/LoadingSpinner';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/recover" element={<PublicRoute><Recover /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/deposit" element={<ProtectedRoute><Layout><Deposit /></Layout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><Layout><AdminUsers /></Layout></ProtectedRoute>} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute adminOnly><Layout><AdminEditUser /></Layout></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><Layout><AdminTransactions /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
