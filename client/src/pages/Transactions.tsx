import { useEffect, useState } from 'react';
import { fetchTransactions } from '../api/client';
import type { Transaction } from '../types';
import TransactionRow from './components/TransactionRow';
import LoadingSpinner from './components/LoadingSpinner';

export default function Transactions() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions()
      .then((res) => setTxns(res.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? txns : txns.filter((t) => t.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Transaction History</h1>
        <p className="text-sm text-muted mt-1">View all your deposit transactions</p>
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
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Type</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Currency</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Amount</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
