import { useState } from 'react';

interface SeedPhraseBackupProps {
  seedPhrase: string;
  onConfirmed: () => void;
}

export default function SeedPhraseBackup({ seedPhrase, onConfirmed }: SeedPhraseBackupProps) {
  const [backedUp, setBackedUp] = useState(false);
  const words = seedPhrase.split(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Back Up Your Seed Phrase</h1>
          <p className="text-sm text-muted mt-2">
            Write down these 12 words in order. This is the only way to recover your account if you lose access.
          </p>
        </div>

        {/* Seed phrase grid — displayed once, not stored in localStorage */}
        <div className="card mb-6">
          <div className="grid grid-cols-3 gap-3">
            {words.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5"
              >
                <span className="text-xs text-muted font-mono w-5 text-right">{i + 1}</span>
                <span className="text-sm font-mono text-white tracking-wide">{word}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accent-red/5 border border-accent-red/10 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-accent-red font-medium">Warning</p>
          <p className="text-xs text-zinc-400 mt-1">
            Never share your seed phrase. GStack Deposit will never ask for it. Anyone with these words can access your account.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={backedUp}
            onChange={(e) => setBackedUp(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-600"
          />
          <span className="text-sm text-zinc-400">
            I have written down my seed phrase and stored it safely.
          </span>
        </label>

        <button
          onClick={onConfirmed}
          disabled={!backedUp}
          className="btn-primary w-full"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
