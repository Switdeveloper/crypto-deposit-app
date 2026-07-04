interface BalanceCardProps {
  label: string;
  amount: number;
  symbol: string;
}

export default function BalanceCard({ label, amount, symbol }: BalanceCardProps) {
  return (
    <div className="card flex-1 min-w-[200px]">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className="text-3xl font-light tracking-tight text-white">
        {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
        <span className="text-lg text-muted ml-2">{symbol}</span>
      </p>
    </div>
  );
}
