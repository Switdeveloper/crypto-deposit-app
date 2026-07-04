import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBalance, fetchTransactions } from '../api/client';
import type { BalanceResponse, Transaction } from '../types';
import BalanceCard from './components/BalanceCard';
import TransactionRow from './components/TransactionRow';
import LoadingSpinner from './components/LoadingSpinner';

export default function Dashboard() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [bal, txnRes] = await Promise.all([
          fetchBalance(),
          fetchTransactions(),
        ]);
        setBalance(bal);
        setTxns(txnRes.transactions.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Your portfolio overview</p>
      </div>

      {/* Balance cards */}
      <div className="flex flex-wrap gap-6">
        <BalanceCard label="Bitcoin Balance" amount={balance?.btc ?? 0} symbol="BTC" />
        <BalanceCard label="USDT Balance" amount={balance?.usdt ?? 0} symbol="USDT" />
      </div>

      {/* CTA deposit button */}
      <button onClick={() => navigate('/deposit')} className="btn-primary">
        Deposit Crypto
      </button>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">Recent Transactions</h2>
          {txns.length > 0 && (
            <button onClick={() => navigate('/transactions')} className="text-sm text-muted hover:text-white transition-colors">
              View all
            </button>
          )}
        </div>

        {txns.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted text-sm">No transactions yet</p>
            <p className="text-xs text-muted mt-1">Make your first deposit to get started</p>
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
                {txns.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
