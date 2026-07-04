import type { AuthResponse, BalanceResponse, DepositResponse, Transaction, User } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('gstack_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// Auth endpoints
export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function recover(email: string, seedPhrase: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/recover', {
    method: 'POST',
    body: JSON.stringify({ email, seedPhrase }),
  });
}

// User endpoints
export function fetchProfile(): Promise<{ user: User }> {
  return request('/user/profile', {}, true);
}

export function fetchBalance(): Promise<BalanceResponse> {
  return request('/user/balance', {}, true);
}

export function fetchTransactions(): Promise<{ transactions: Transaction[] }> {
  return request('/user/transactions', {}, true);
}

export function requestDeposit(currency: 'BTC' | 'USDT'): Promise<DepositResponse> {
  return request('/user/deposit', {
    method: 'POST',
    body: JSON.stringify({ currency }),
  }, true);
}

// Admin endpoints
export function fetchAdminUsers(): Promise<{ users: User[] }> {
  return request('/admin/users', {}, true);
}

export function updateAdminUser(id: number, data: Partial<User>): Promise<{ user: User }> {
  return request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export function deleteAdminUser(id: number): Promise<{ success: boolean }> {
  return request(`/admin/users/${id}`, {
    method: 'DELETE',
  }, true);
}

export function fetchAdminTransactions(status?: string): Promise<{ transactions: Transaction[] }> {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/transactions${query}`, {}, true);
}

export function confirmTransaction(id: number): Promise<{ transaction: Transaction }> {
  return request(`/admin/transactions/${id}/confirm`, {
    method: 'POST',
  }, true);
}

export function rejectTransaction(id: number): Promise<{ success: boolean }> {
  return request(`/admin/transactions/${id}/reject`, {
    method: 'POST',
  }, true);
}
