import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dbGet, dbAll, dbRun } from '../db';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// Testnet deposit addresses for demo purposes
const DEPOSIT_ADDRESSES: Record<string, { network: string; address: string }[]> = {
  BTC: [
    { network: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjda3s0ehk0d5GKxKBZ6PJfqyn9mu' },
  ],
  USDT: [
    { network: 'Tron (TRC-20)', address: 'TDSSgvT5r3NxFGyu1eYjkxJgcnf6Ao2pS' },
    { network: 'Ethereum (ERC-20)', address: '0x742d35Cc6634C0532925a3b844Bc4349C839e2e8' },
  ],
};

// GET /api/user/profile — return the authenticated user's details
router.get('/profile', (req: Request, res: Response) => {
  const user = dbGet<{ id: number; email: string; role: string; balance_btc: number; balance_usdt: number; created_at: string }>(
    'SELECT id, email, role, balance_btc, balance_usdt, created_at FROM users WHERE id = ?',
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      balanceBtc: user.balance_btc,
      balanceUsdt: user.balance_usdt,
      createdAt: user.created_at,
    },
  });
});

// GET /api/user/balance — return current BTC and USDT balances
router.get('/balance', (req: Request, res: Response) => {
  const user = dbGet<{ balance_btc: number; balance_usdt: number }>(
    'SELECT balance_btc, balance_usdt FROM users WHERE id = ?',
    [req.user!.userId]
  );

  res.json({
    btc: user?.balance_btc ?? 0,
    usdt: user?.balance_usdt ?? 0,
  });
});

// GET /api/user/transactions — return deposit history, newest first
router.get('/transactions', (req: Request, res: Response) => {
  const txns = dbAll<{
    id: number; type: string; currency: string; amount: number;
    network: string; status: string; tx_hash: string | null;
    created_at: string; confirmed_at: string | null;
  }>(
    `SELECT id, type, currency, amount, network, status, tx_hash, created_at, confirmed_at
     FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user!.userId]
  );

  res.json({ transactions: txns });
});

const depositSchema = z.object({
  currency: z.enum(['BTC', 'USDT']),
});

// POST /api/user/deposit — request a new deposit address for a given currency
router.post('/deposit', (req: Request, res: Response) => {
  try {
    const data = depositSchema.parse(req.body);
    const addresses = DEPOSIT_ADDRESSES[data.currency];

    if (!addresses || addresses.length === 0) {
      res.status(400).json({ error: 'Unsupported currency' });
      return;
    }

    // Use the first available address (in production, generate unique per user)
    const addr = addresses[0];
    const mockAmount = 0; // Real amount is set when admin confirms on-chain tx

    // Create a pending transaction record
    dbRun(
      'INSERT INTO transactions (user_id, type, currency, amount, deposit_address, network, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user!.userId, 'deposit', data.currency, mockAmount, addr.address, addr.network, 'pending']
    );

    res.json({
      address: addr.address,
      network: addr.network,
      currency: data.currency,
      depositMessage: `Send only ${data.currency} to this address via the ${addr.network} network. Sending other assets or using the wrong network may result in permanent loss.`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
