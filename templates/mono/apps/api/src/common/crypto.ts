// Passwords and session tokens with node:crypto only: scrypt for passwords, random
// 32-byte bearer tokens stored as sha256 hashes.
import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  const [scheme, salt, hash] = stored?.split('$') ?? [];
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = await scrypt(
    password,
    Buffer.from(salt, 'base64url'),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}

export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const newId = (prefix: string) =>
  `${prefix}_${randomBytes(6).toString('hex')}`;
