import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { generateSeedPhrase, hashSeedPhrase } from './auth';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.join(import.meta.dirname, '../data');
    fs.mkdirSync(dbDir, { recursive: true });
    db = new Database(path.join(dbDir, 'app.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function dbAll<T = Record<string, unknown>>(query: string, params: unknown[] = []): T[] {
  return getDb().prepare(query).all(...params) as T[];
}

export function dbGet<T = Record<string, unknown>>(query: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(query).get(...params) as T | undefined;
}

export function dbRun(query: string, params: unknown[] = []): Database.RunResult {
  return getDb().prepare(query).run(...params);
}

export function dbInit(): void {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      seed_phrase_hash TEXT,
      seed_recovered_at DATETIME,
      role TEXT NOT NULL DEFAULT 'user',
      balance_btc REAL DEFAULT 0,
      balance_usdt REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      deposit_address TEXT,
      network TEXT,
      tx_hash TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_confirmed_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      failed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS deposit_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      currency TEXT NOT NULL,
      network TEXT NOT NULL,
      address TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = dbGet<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE email = ?', ['admin@gstack.com']);
  if (!existing || existing.count === 0) {
    const adminHash = bcrypt.hashSync('admin123', 12);
    d.prepare('INSERT INTO users (email, password_hash, role, balance_btc, balance_usdt) VALUES (?, ?, ?, ?, ?)').run(
      'admin@gstack.com', adminHash, 'admin', 0, 0
    );

    const userHash = bcrypt.hashSync('user123', 12);
    d.prepare('INSERT INTO users (email, password_hash, role, balance_btc, balance_usdt) VALUES (?, ?, ?, ?, ?)').run(
      'user@gstack.com', userHash, 'user', 0, 0
    );

    console.log('Seeded test users: admin@gstack.com / admin123 | user@gstack.com / user123');
  }
}
