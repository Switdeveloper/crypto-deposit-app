import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from 'bip39';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'gstack-dev-secret-change-in-production';
const JWT_EXPIRY_HOURS = 24;

// Hash a plaintext password using bcrypt with cost factor 12
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

// Compare a plaintext password against a bcrypt hash
export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Generate a JWT token for a given user ID and role
export function generateToken(userId: number, role: string, hours: number = JWT_EXPIRY_HOURS): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: `${hours}h` });
}

// Verify and decode a JWT token, returning the payload or null
export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

// Generate a BIP39 12-word seed phrase using cryptographically strong randomness
export function generateSeedPhrase(): string {
  return generateMnemonic(128);
}

// Verify a seed phrase is a valid BIP39 mnemonic
export function validateSeedPhrase(phrase: string): boolean {
  return validateMnemonic(phrase);
}

// Hash a seed phrase for secure storage (bcrypt, not plaintext)
export function hashSeedPhrase(phrase: string): string {
  return bcrypt.hashSync(phrase, 12);
}

// Compare a seed phrase against its stored hash
export function compareSeedPhrase(phrase: string, hash: string): boolean {
  return bcrypt.compareSync(phrase, hash);
}
