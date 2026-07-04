import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminUsers, deleteAdminUser } from '../../api/client';
import type { User } from '../../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  function loadUsers() {
    setLoading(true);
    fetchAdminUsers()
      .then((res) => setUsers(res.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleDelete(id: number) {
    try {
      await deleteAdminUser(id);
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Manage Users</h1>
        <p className="text-sm text-muted mt-1">View, edit, or remove user accounts</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">ID</th>
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Email</th>
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Role</th>
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">BTC</th>
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">USDT</th>
              <th className="text-left text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Joined</th>
              <th className="text-right text-xs text-muted font-medium uppercase tracking-wider py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors">
                <td className="py-3 px-4 text-sm text-zinc-400 font-mono">{user.id}</td>
                <td className="py-3 px-4 text-sm text-zinc-300">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    user.role === 'admin'
                      ? 'text-accent-green bg-accent-green/5 border border-accent-green/10'
                      : 'text-zinc-400 bg-zinc-800 border border-zinc-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-mono text-zinc-300">{user.balanceBtc.toFixed(4)}</td>
                <td className="py-3 px-4 text-sm font-mono text-zinc-300">{user.balanceUsdt.toFixed(2)}</td>
                <td className="py-3 px-4 text-sm text-zinc-400">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
                    >
                      Edit
                    </button>
                    {confirmDelete === user.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-xs text-accent-red hover:text-white transition-colors px-2 py-1"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="text-xs text-zinc-500 hover:text-accent-red transition-colors px-2 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
