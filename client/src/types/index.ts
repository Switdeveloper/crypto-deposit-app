export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  balanceBtc: number;
  balanceUsdt: number;
  createdAt?: string;
}

export interface Transaction {
  id: number;
  user_id?: number;
  user_email?: string;
  type: string;
  currency: string;
  amount: number;
  deposit_address?: string;
  network?: string;
  tx_hash?: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  admin_confirmed_by?: number | null;
  created_at: string;
  confirmed_at?: string | null;
  failed_at?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
  seedPhrase?: string;
  expiresIn: number;
}

export interface BalanceResponse {
  btc: number;
  usdt: number;
}

export interface DepositResponse {
  address: string;
  network: string;
  currency: string;
  depositMessage: string;
}
