import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { hashPassword, comparePassword, generateToken, generateSeedPhrase, hashSeedPhrase, validateSeedPhrase, compareSeedPhrase } from '../auth';
import { dbGet, dbRun } from '../db';

const router = Router();

// Validation schemas using Zod for request body validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const recoverSchema = z.object({
  email: z.string().email('Invalid email address'),
  seedPhrase: z.string().min(1, 'Seed phrase is required'),
});

// POST /api/auth/register — create a new user account with BIP39 seed phrase
router.post('/register', (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = dbGet<{ id: number }>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = hashPassword(data.password);
    const seedPhrase = generateSeedPhrase();
    const seedHash = hashSeedPhrase(seedPhrase);
    const result = dbRun(
      'INSERT INTO users (email, password_hash, seed_phrase_hash) VALUES (?, ?, ?)',
      [email, passwordHash, seedHash]
    );

    const user = dbGet<{ id: number; email: string; role: string; balance_btc: number; balance_usdt: number }>(
      'SELECT id, email, role, balance_btc, balance_usdt FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    const token = generateToken(user!.id, user!.role);

    res.status(201).json({
      token,
      user: {
        id: user!.id,
        email: user!.email,
        role: user!.role,
        balanceBtc: user!.balance_btc,
        balanceUsdt: user!.balance_usdt,
      },
      seedPhrase,
      expiresIn: 24 * 60 * 60,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login — authenticate with email and password
router.post('/login', (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const user = dbGet<{ id: number; email: string; password_hash: string; role: string; balance_btc: number; balance_usdt: number }>(
      'SELECT id, email, password_hash, role, balance_btc, balance_usdt FROM users WHERE email = ?',
      [email]
    );

    if (!user || !comparePassword(data.password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        balanceBtc: user.balance_btc,
        balanceUsdt: user.balance_usdt,
      },
      expiresIn: 24 * 60 * 60,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/recover — recover account using email + 12-word seed phrase
router.post('/recover', (req: Request, res: Response) => {
  try {
    const data = recoverSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const phrase = data.seedPhrase.trim().toLowerCase();

    // Validate the seed phrase is a well-formed BIP39 mnemonic
    if (!validateSeedPhrase(phrase)) {
      res.status(400).json({ error: 'Invalid seed phrase. Please check your 12 words and try again.' });
      return;
    }

    const user = dbGet<{ id: number; email: string; role: string; seed_phrase_hash: string; balance_btc: number; balance_usdt: number }>(
      'SELECT id, email, role, seed_phrase_hash, balance_btc, balance_usdt FROM users WHERE email = ?',
      [email]
    );

    if (!user || !user.seed_phrase_hash) {
      res.status(401).json({ error: 'Account not found or recovery not available' });
      return;
    }

    if (!compareSeedPhrase(phrase, user.seed_phrase_hash)) {
      res.status(401).json({ error: 'Seed phrase does not match this account' });
      return;
    }

    // Mark the recovery timestamp
    dbRun('UPDATE users SET seed_recovered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        balanceBtc: user.balance_btc,
        balanceUsdt: user.balance_usdt,
      },
      expiresIn: 24 * 60 * 60,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Recover error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
