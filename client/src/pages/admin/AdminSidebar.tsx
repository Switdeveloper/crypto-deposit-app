import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/admin', label: 'Overview', icon: '◉' },
  { path: '/admin/users', label: 'Manage Users', icon: '◎' },
  { path: '/admin/transactions', label: 'Transactions', icon: '◈' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-56 border-r border-zinc-800 min-h-[calc(100vh-3.5rem)] p-4 hidden md:block">
      <nav className="space-y-1">
        <p className="text-xs text-muted uppercase tracking-wider font-medium px-3 pb-2">Admin Panel</p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'text-white bg-zinc-800'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
