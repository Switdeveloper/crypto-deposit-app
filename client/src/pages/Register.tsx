import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/client';
import SeedPhraseBackup from './components/SeedPhraseBackup';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  // Simple password strength indicator
  function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
    if (pw.length === 0) return { label: '', color: '', percent: 0 };
    if (pw.length < 8) return { label: 'Weak', color: 'bg-accent-red', percent: 25 };
    if (pw.length < 12) return { label: 'Fair', color: 'bg-accent-amber', percent: 50 };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    if (score < 2) return { label: 'Good', color: 'bg-accent-amber', percent: 60 };
    return { label: 'Strong', color: 'bg-accent-green', percent: 100 };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await register(email, password);
      setSeedPhrase(res.seedPhrase!);
      setAuth(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Show seed phrase backup immediately after successful registration
  if (seedPhrase) {
    return <SeedPhraseBackup seedPhrase={seedPhrase} onConfirmed={() => navigate('/dashboard')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create Account</h1>
          <p className="text-sm text-muted mt-2">Register to start depositing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <label htmlFor="password" className="block text-sm text-zinc-400 mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setConfirmPassword('');
              }}
              className="input-field"
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.percent}%` }} />
                </div>
                <p className="text-xs text-muted mt-1">{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-zinc-400 mb-1.5">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-zinc-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
