import { hashPassword, newToken, sha256, verifyPassword } from './crypto.js';

describe('crypto', () => {
  it('verifies the right password only', async () => {
    const stored = await hashPassword('demo1234');
    expect(stored).toMatch(/^scrypt\$/);
    expect(await verifyPassword('demo1234', stored)).toBe(true);
    expect(await verifyPassword('demo12345', stored)).toBe(false);
    expect(await verifyPassword('demo1234', null)).toBe(false);
    expect(await verifyPassword('demo1234', 'plain-text')).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('makes unguessable tokens and stable hashes', () => {
    expect(newToken()).toHaveLength(43);
    expect(newToken()).not.toBe(newToken());
    expect(sha256('a')).toBe(sha256('a'));
  });
});
