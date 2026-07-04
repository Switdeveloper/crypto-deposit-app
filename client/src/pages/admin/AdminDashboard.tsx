import { useEffect, useState } from 'react';
import { fetchAdminUsers, fetchAdminTransactions } from '../../api/client';
import type { User, Transaction } from '../../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingTxns, setPendingTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, txnRes] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminTransactions('pending'),
        ]);
        setUsers(userRes.users);
        setPendingTxns(txnRes.transactions);
      } catch (err) {
        console.error('Admin dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBtc = users.reduce((sum, u) => sum + u.balanceBtc, 0);
  const totalUsdt = users.reduce((sum, u) => sum + u.balanceUsdt, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Overview</h1>
        <p className="text-sm text-muted mt-1">System-wide statistics and pending actions</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-muted mb-1">Total Users</p>
          <p className="text-2xl font-light text-white">{users.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted mb-1">Pending Deposits</p>
          <p className="text-2xl font-light text-accent-amber">{pendingTxns.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted mb-1">Total BTC/USDT Volume</p>
          <p className="text-2xl font-light text-white">
            {totalBtc.toFixed(4)} <span className="text-sm text-muted">BTC</span>
          </p>
          <p className="text-lg font-light text-white mt-1">
            {totalUsdt.toFixed(2)} <span className="text-sm text-muted">USDT</span>
          </p>
        </div>
      </div>

      {/* Pending deposits notification */}
      {pendingTxns.length > 0 && (
        <div className="card border-accent-amber/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
            <h2 className="text-lg font-medium text-white">Pending Deposits Requiring Review</h2>
          </div>
          <div className="space-y-2">
            {pendingTxns.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-zinc-300">
                    <span className="font-mono">{tx.amount} {tx.currency}</span>
                  </p>
                  <p className="text-xs text-muted">
                    User #{tx.user_id} &middot; {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs text-accent-amber bg-accent-amber/5 border border-accent-amber/10 rounded px-2 py-1">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
