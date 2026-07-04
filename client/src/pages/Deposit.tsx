import { useState } from 'react';
import { requestDeposit } from '../api/client';
import type { DepositResponse } from '../types';
import LoadingSpinner from './components/LoadingSpinner';

const CURRENCY_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin', network: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'USDT', label: 'Tether', network: 'Multiple networks', icon: '₮' },
] as const;

export default function Deposit() {
  const [selectedCurrency, setSelectedCurrency] = useState<'BTC' | 'USDT'>('BTC');
  const [deposit, setDeposit] = useState<DepositResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleDeposit() {
    setError('');
    setLoading(true);
    setCopied(false);

    try {
      const res = await requestDeposit(selectedCurrency);
      setDeposit(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  }

  async function copyAddress() {
    if (deposit) {
      try {
        await navigator.clipboard.writeText(deposit.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const el = document.createElement('textarea');
        el.value = deposit.address;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Deposit Crypto</h1>
        <p className="text-sm text-muted mt-1">Choose a currency and network to deposit</p>
      </div>

      {/* Currency selection */}
      <div className="flex gap-4">
        {CURRENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setSelectedCurrency(opt.value as 'BTC' | 'USDT');
              setDeposit(null);
            }}
            className={`card flex-1 text-left transition-all duration-150 ${
              selectedCurrency === opt.value
                ? 'border-white/20 ring-1 ring-white/10'
                : 'opacity-50 hover:opacity-80'
            }`}
          >
            <p className="text-2xl mb-1">{opt.icon}</p>
            <p className="text-white font-medium">{opt.label}</p>
            <p className="text-xs text-muted">{opt.network}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-accent-red bg-accent-red/5 border border-accent-red/10 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <button
        onClick={handleDeposit}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Generating address...' : `Generate ${selectedCurrency} Deposit Address`}
      </button>

      {/* Deposit address display */}
      {deposit && (
        <div className="card space-y-4">
          <h2 className="text-lg font-medium text-white">Deposit Address</h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-muted mb-2">Network: {deposit.network}</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm font-mono text-white break-all bg-zinc-800 rounded px-3 py-2 select-all">
                {deposit.address}
              </code>
              <button
                onClick={copyAddress}
                className="btn-ghost text-sm whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-accent-amber/5 border border-accent-amber/10 rounded-lg px-4 py-3">
            <p className="text-sm text-accent-amber font-medium">Important</p>
            <p className="text-xs text-zinc-400 mt-1">
              {deposit.depositMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
