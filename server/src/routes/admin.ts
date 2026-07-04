import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { dbGet, dbAll, dbRun } from '../db';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// GET /api/admin/users — list all users
router.get('/users', (req: Request, res: Response) => {
  const users = dbAll<{
    id: number; email: string; role: string;
    balance_btc: number; balance_usdt: number; created_at: string;
  }>(
    'SELECT id, email, role, balance_btc, balance_usdt, created_at FROM users ORDER BY id ASC'
  );

  res.json({ users });
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  balance_btc: z.number().min(0).optional(),
  balance_usdt: z.number().min(0).optional(),
});

// PUT /api/admin/users/:id — update user details (cannot change password or seed phrase)
router.put('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = updateUserSchema.parse(req.body);

    const user = dbGet<{ id: number }>('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email.toLowerCase().trim());
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      params.push(data.role);
    }
    if (data.balance_btc !== undefined) {
      updates.push('balance_btc = ?');
      params.push(data.balance_btc);
    }
    if (data.balance_usdt !== undefined) {
      updates.push('balance_usdt = ?');
      params.push(data.balance_usdt);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      dbRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Audit log: record admin action
    dbRun(
      'INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user!.userId, 'update_user', 'user', id, JSON.stringify(data)]
    );

    const updated = dbGet<{ id: number; email: string; role: string; balance_btc: number; balance_usdt: number }>(
      'SELECT id, email, role, balance_btc, balance_usdt FROM users WHERE id = ?', [id]
    );

    res.json({
      user: {
        id: updated!.id,
        email: updated!.email,
        role: updated!.role,
        balanceBtc: updated!.balance_btc,
        balanceUsdt: updated!.balance_usdt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id — permanently delete a user and their transactions
router.delete('/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);

  const user = dbGet<{ id: number; email: string }>('SELECT id, email FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Prevent admin from deleting themselves
  if (id === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  // Audit log before deletion
  dbRun(
    'INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
    [req.user!.userId, 'delete_user', 'user', id, JSON.stringify({ email: user.email })]
  );

  dbRun('DELETE FROM transactions WHERE user_id = ?', [id]);
  dbRun('DELETE FROM users WHERE id = ?', [id]);

  res.json({ success: true });
});

// GET /api/admin/transactions — get all transactions, optional status filter
router.get('/transactions', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;

  let query = `SELECT t.*, u.email as user_email FROM transactions t JOIN users u ON t.user_id = u.id`;
  const params: unknown[] = [];

  if (status && ['pending', 'confirmed', 'failed'].includes(status)) {
    query += ' WHERE t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC';

  const txns = dbAll<Record<string, unknown>>(query, params);

  res.json({ transactions: txns });
});

// POST /api/admin/transactions/:id/confirm — confirm a pending deposit, update user balance
router.post('/transactions/:id/confirm', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);

  const txn = dbGet<{
    id: number; user_id: number; currency: string; amount: number; status: string;
  }>('SELECT id, user_id, currency, amount, status FROM transactions WHERE id = ?', [id]);

  if (!txn) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  if (txn.status !== 'pending') {
    res.status(400).json({ error: 'Transaction is not pending' });
    return;
  }

  // Update transaction to confirmed
  dbRun(
    'UPDATE transactions SET status = ?, admin_confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['confirmed', req.user!.userId, id]
  );

  // Update the user's balance based on the deposit currency
  if (txn.currency === 'BTC') {
    dbRun('UPDATE users SET balance_btc = balance_btc + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [txn.amount, txn.user_id]);
  } else if (txn.currency === 'USDT') {
    dbRun('UPDATE users SET balance_usdt = balance_usdt + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [txn.amount, txn.user_id]);
  }

  // Audit log
  dbRun(
    'INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
    [req.user!.userId, 'confirm_deposit', 'transaction', id, JSON.stringify({ currency: txn.currency, amount: txn.amount })]
  );

  const updated = dbGet<Record<string, unknown>>(
    'SELECT t.*, u.email as user_email FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?', [id]
  );

  res.json({ transaction: updated });
});

// POST /api/admin/transactions/:id/reject — reject a pending deposit
router.post('/transactions/:id/reject', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);

  const txn = dbGet<{ id: number; status: string }>('SELECT id, status FROM transactions WHERE id = ?', [id]);

  if (!txn) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  if (txn.status !== 'pending') {
    res.status(400).json({ error: 'Transaction is not pending' });
    return;
  }

  dbRun('UPDATE transactions SET status = ?, failed_at = CURRENT_TIMESTAMP WHERE id = ?', ['failed', id]);

  dbRun(
    'INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
    [req.user!.userId, 'reject_deposit', 'transaction', id, '{}']
  );

  res.json({ success: true });
});

export default router;
