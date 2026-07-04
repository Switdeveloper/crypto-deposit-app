import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAdminUsers, updateAdminUser } from '../../api/client';
import type { User } from '../../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminEditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [balanceBtc, setBalanceBtc] = useState(0);
  const [balanceUsdt, setBalanceUsdt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAdminUsers()
      .then((res) => {
        const found = res.users.find((u) => u.id === parseInt(id || '0', 10));
        if (found) {
          setUser(found);
          setEmail(found.email);
          setRole(found.role);
          setBalanceBtc(found.balanceBtc);
          setBalanceUsdt(found.balanceUsdt);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await updateAdminUser(parseInt(id!, 10), {
        email,
        role,
        balance_btc: balanceBtc,
        balance_usdt: balanceUsdt,
      } as Partial<User>);
      setUser(res.user);
      setSuccess('User updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!user) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted text-sm">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Edit User</h1>
        <p className="text-sm text-muted mt-1">{user.email}</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-5">
        {error && (
          <div className="text-sm text-accent-red bg-accent-red/5 border border-accent-red/10 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-accent-green bg-accent-green/5 border border-accent-green/10 rounded-lg px-4 py-2.5">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="input-field"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">BTC Balance</label>
            <input
              type="number"
              step="0.00000001"
              min="0"
              value={balanceBtc}
              onChange={(e) => setBalanceBtc(parseFloat(e.target.value) || 0)}
              className="input-field font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">USDT Balance</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={balanceUsdt}
              onChange={(e) => setBalanceUsdt(parseFloat(e.target.value) || 0)}
              className="input-field font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/admin/users')} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
