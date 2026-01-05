import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption Utility', () => {
  const MOCK_SECRET = '2a79d95a007e0a7fa31e45ead7a7782f231dd8180177fd7c06123d4ed73227f7';

  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_SECRET', MOCK_SECRET);
  });

  it('should encrypt and decrypt a string correctly', () => {
    const originalText = 'my-secret-api-key';
    const encrypted = encrypt(originalText);
    
    expect(encrypted).toContain(':');
    expect(encrypted.split(':')).toHaveLength(3);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should produce different ciphertexts for the same input (unique IV)', () => {
    const originalText = 'my-secret-api-key';
    const encrypted1 = encrypt(originalText);
    const encrypted2 = encrypt(originalText);
    
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw an error if ENCRYPTION_SECRET is not set', () => {
    vi.stubEnv('ENCRYPTION_SECRET', '');
    expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET environment variable is not set');
  });

  it('should throw an error for invalid encrypted format', () => {
    expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted text format');
  });

  it('should throw an error if decryption fails (invalid auth tag or key)', () => {
    const encrypted = encrypt('test');
    const [iv, authTag, data] = encrypted.split(':');
    
    // Tamper with data
    const tampered = `${iv}:${authTag}:modified${data}`;
    expect(() => decrypt(tampered)).toThrow();
  });
});
