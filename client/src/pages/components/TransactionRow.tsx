import type { Transaction } from '../../types';

interface TransactionRowProps {
  transaction: Transaction;
  showUser?: boolean;
}

export default function TransactionRow({ transaction, showUser }: TransactionRowProps) {
  const statusColors: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    failed: 'status-failed',
  };

  const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <tr className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors">
      {showUser && (
        <td className="py-3 px-4 text-sm text-zinc-300">{transaction.user_email || `User #${transaction.user_id}`}</td>
      )}
      <td className="py-3 px-4 text-sm text-zinc-300 capitalize">{transaction.type}</td>
      <td className="py-3 px-4 text-sm text-zinc-300">{transaction.currency}</td>
      <td className="py-3 px-4 text-sm text-zinc-300 font-mono">
        {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
      </td>
      <td className="py-3 px-4 text-sm text-zinc-400">{date}</td>
      <td className="py-3 px-4">
        <span className="flex items-center text-sm">
          <span className={`status-dot ${statusColors[transaction.status] || 'bg-zinc-600'}`} />
          <span className="capitalize">{transaction.status}</span>
        </span>
      </td>
    </tr>
  );
}
