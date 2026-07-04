import { useEffect, useState, useCallback } from 'react';
import { fetchAdminTransactions, confirmTransaction, rejectTransaction } from '../../api/client';
import type { Transaction } from '../../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminTransactions() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const status = filter === 'all' ? undefined : filter;
    fetchAdminTransactions(status)
      .then((res) => setTxns(res.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm(id: number) {
    setActionLoading(id);
    try {
      await confirmTransaction(id);
      load();
    } catch (err) {
      console.error('Confirm error:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: number) {
    setActionLoading(id);
    try {
      await rejectTransaction(id);
      load();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && txns.length === 0) return <LoadingSpinner />;

  const pendingCount = txns.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Transaction Management</h1>
          <p className="text-sm text-muted mt-1">Review and confirm deposits</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-accent-amber bg-accent-amber/5 border border-accent-amber/10 rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1">
        {['all', 'pending', 'confirmed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors capitalize ${
              filter === s ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {s}
            {s === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 text-xs text-accent-amber">({pendingCount})</span>
            )}
          </button>
        ))}
      </div>

      {txns.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">ID</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">User</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Currency</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Amount</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Network</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-right text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3 px-4 text-sm text-zinc-400 font-mono">{tx.id}</td>
                  <td className="py-3 px-4 text-sm text-zinc-300">{tx.user_email || `#${tx.user_id}`}</td>
                  <td className="py-3 px-4 text-sm text-zinc-300">{tx.currency}</td>
                  <td className="py-3 px-4 text-sm font-mono text-zinc-300">
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-400">{tx.network || '-'}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center text-sm capitalize ${
                      tx.status === 'confirmed' ? 'text-accent-green' :
                      tx.status === 'pending' ? 'text-accent-amber' :
                      'text-accent-red'
                    }`}>
                      <span className={`status-dot ${
                        tx.status === 'confirmed' ? 'status-confirmed' :
                        tx.status === 'pending' ? 'status-pending' :
                        'status-failed'
                      }`} />
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {tx.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConfirm(tx.id)}
                          disabled={actionLoading === tx.id}
                          className="text-xs text-accent-green hover:text-white transition-colors px-3 py-1.5 border border-accent-green/20 rounded-lg hover:bg-accent-green/10 disabled:opacity-50"
                        >
                          {actionLoading === tx.id ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleReject(tx.id)}
                          disabled={actionLoading === tx.id}
                          className="text-xs text-accent-red hover:text-white transition-colors px-3 py-1.5 border border-accent-red/20 rounded-lg hover:bg-accent-red/10 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {tx.status !== 'pending' && (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
