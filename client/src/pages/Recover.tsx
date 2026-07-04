import { useState, useRef, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recover } from '../api/client';

export default function Recover() {
  const [email, setEmail] = useState('');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const wordRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleWordChange(i: number, value: string) {
    const next = [...words];
    next[i] = value.toLowerCase().replace(/[^a-z]/g, '');
    setWords(next);

    // Auto-advance to next field on 4+ characters
    if (next[i].length >= 4 && i < 11) {
      wordRefs.current[i + 1]?.focus();
    }
  }

  function handleWordKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && words[i] === '' && i > 0) {
      wordRefs.current[i - 1]?.focus();
    }
    if (e.key === 'Enter' && i < 11) {
      wordRefs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text');
    const pastedWords = text.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);

    if (pastedWords.length === 12) {
      e.preventDefault();
      setWords(pastedWords);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const phrase = words.join(' ');
    if (words.some((w) => w.length === 0)) {
      setError('Please enter all 12 words of your seed phrase');
      return;
    }

    setLoading(true);

    try {
      const res = await recover(email, phrase);
      setAuth(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Recover Account</h1>
          <p className="text-sm text-muted mt-2">Enter your email and 12-word seed phrase</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-accent-red bg-accent-red/5 border border-accent-red/10 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-zinc-400 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Seed Phrase (12 words)</label>
            <div className="grid grid-cols-3 gap-2" onPaste={handlePaste}>
              {words.map((word, i) => (
                <input
                  key={i}
                  ref={(el) => { wordRefs.current[i] = el; }}
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(i, e.target.value)}
                  onKeyDown={(e) => handleWordKeyDown(i, e)}
                  className="input-field text-sm font-mono text-center"
                  placeholder={`#${i + 1}`}
                  maxLength={8}
                  autoComplete="off"
                  spellCheck={false}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Recovering...' : 'Recover Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Remember your password?{' '}
          <Link to="/login" className="text-white hover:text-zinc-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
