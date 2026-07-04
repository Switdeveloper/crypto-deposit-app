import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { fetchProfile } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gstack_token'));
  const [loading, setLoading] = useState(true);

  // On mount, validate existing token by fetching the user profile
  useEffect(() => {
    if (token) {
      fetchProfile()
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('gstack_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function setAuth(newToken: string, newUser: User) {
    localStorage.setItem('gstack_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('gstack_token');
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const res = await fetchProfile();
      setUser(res.user);
    } catch {
      logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
