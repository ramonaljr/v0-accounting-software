/**
 * Encryption Utilities
 *
 * Field-level encryption for sensitive financial data.
 * Uses AES-256-GCM for encryption with proper key derivation.
 *
 * IMPORTANT:
 * - Store ENCRYPTION_KEY in environment variables (32 bytes, base64 encoded)
 * - Never log or expose encrypted data keys
 * - Use for: bank tokens, tax IDs, payment credentials, PII
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto';

// Algorithm constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get or derive the encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;

  if (!keyEnv) {
    // In development, use a derived key (NOT FOR PRODUCTION)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[CRYPTO WARNING] Using derived key for development. Set ENCRYPTION_KEY in production!'
      );
      const devSecret = process.env.NEXTAUTH_SECRET || 'dev-secret-key-do-not-use-in-production';
      return scryptSync(devSecret, 'accunza-dev-salt', KEY_LENGTH);
    }
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const key = Buffer.from(keyEnv, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`);
  }

  return key;
}

/**
 * Encrypt a string value
 *
 * Output format: base64(iv + authTag + ciphertext)
 *
 * @example
 * const encrypted = encrypt('sensitive-bank-token');
 * // Store encrypted value in database
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext
  const combined = Buffer.concat([iv, authTag, ciphertext]);
  return combined.toString('base64');
}

/**
 * Decrypt a string value
 *
 * @example
 * const decrypted = decrypt(encryptedValue);
 * // Use decrypted value
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract iv, authTag, and ciphertext
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);

  return plaintext.toString('utf8');
}

/**
 * Encrypt an object (JSON serializable)
 *
 * @example
 * const encrypted = encryptObject({ apiKey: 'xxx', secret: 'yyy' });
 */
export function encryptObject(data: Record<string, unknown>): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt an object
 *
 * @example
 * const credentials = decryptObject<BankCredentials>(encrypted);
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedData: string): T {
  return JSON.parse(decrypt(encryptedData)) as T;
}

/**
 * Hash a value (one-way, for verification)
 *
 * Uses SHA-256 with a salt for security.
 * Good for storing things like API key hashes for verification.
 *
 * @example
 * const hash = hashValue('api-key-to-verify');
 * // Store hash, compare later
 */
export function hashValue(value: string, salt?: string): string {
  const useSalt = salt || process.env.HASH_SALT || 'accunza-default-salt';
  return createHash('sha256').update(value + useSalt).digest('hex');
}

/**
 * Verify a value against a hash
 *
 * @example
 * const isValid = verifyHash('api-key', storedHash);
 */
export function verifyHash(value: string, hash: string, salt?: string): boolean {
  return hashValue(value, salt) === hash;
}

/**
 * Generate a secure random token
 *
 * @example
 * const token = generateSecureToken(32); // 64 hex chars
 */
export function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure API key
 *
 * Format: prefix_base64token
 *
 * @example
 * const apiKey = generateApiKey('acc'); // acc_aBcDeFgHiJkLmNoPqRsTuVwXyZ...
 */
export function generateApiKey(prefix: string = 'acc'): string {
  const token = randomBytes(24).toString('base64url');
  return `${prefix}_${token}`;
}

/**
 * Mask sensitive data for logging/display
 *
 * @example
 * maskSensitiveData('1234-5678-9012-3456'); // '****-****-****-3456'
 * maskSensitiveData('user@email.com'); // 'u***@email.com'
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }

  // Handle email addresses
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    const maskedLocal = local[0] + '*'.repeat(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  // Handle credit card numbers and similar
  if (value.includes('-')) {
    const parts = value.split('-');
    const maskedParts = parts.map((part, i) =>
      i === parts.length - 1 ? part : '*'.repeat(part.length)
    );
    return maskedParts.join('-');
  }

  // Default: show last N characters
  const masked = '*'.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

/**
 * Encrypted field wrapper for database models
 *
 * Use this to mark fields that should be encrypted before storage.
 *
 * @example
 * interface BankConnection {
 *   id: string;
 *   accessToken: EncryptedField; // Marked for encryption
 * }
 */
export interface EncryptedField {
  _encrypted: true;
  value: string;
}

/**
 * Create an encrypted field value
 */
export function createEncryptedField(plaintext: string): EncryptedField {
  return {
    _encrypted: true,
    value: encrypt(plaintext),
  };
}

/**
 * Read an encrypted field value
 */
export function readEncryptedField(field: EncryptedField): string {
  return decrypt(field.value);
}

/**
 * Check if a value is an encrypted field
 */
export function isEncryptedField(value: unknown): value is EncryptedField {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_encrypted' in value &&
    (value as EncryptedField)._encrypted === true
  );
}

/**
 * Encrypt specific fields in an object
 *
 * @example
 * const data = encryptFields(bankData, ['accessToken', 'refreshToken']);
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fieldsToEncrypt) {
    const value = result[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }

  return result;
}

/**
 * Decrypt specific fields in an object
 *
 * @example
 * const data = decryptFields(dbRecord, ['accessToken', 'refreshToken']);
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fieldsToDecrypt) {
    const value = result[field];
    if (typeof value === 'string') {
      try {
        (result as Record<string, unknown>)[field as string] = decrypt(value);
      } catch {
        // Field might not be encrypted, leave as is
        console.warn(`Failed to decrypt field: ${String(field)}`);
      }
    }
  }

  return result;
}

/**
 * Sensitive fields that should always be encrypted
 */
export const SENSITIVE_FIELDS = [
  'accessToken',
  'refreshToken',
  'apiKey',
  'apiSecret',
  'clientSecret',
  'taxId',
  'ssn',
  'bankAccountNumber',
  'routingNumber',
  'cardNumber',
  'cvv',
  'password',
  'privateKey',
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/**
 * Check if a field name is sensitive and should be encrypted
 */
export function isSensitiveField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(
    (sensitive) =>
      lowerName === sensitive.toLowerCase() ||
      lowerName.includes(sensitive.toLowerCase())
  );
}

/**
 * Auto-encrypt all sensitive fields in an object
 */
export function autoEncryptSensitiveFields<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && isSensitiveField(key)) {
      (result as Record<string, unknown>)[key] = encrypt(value);
    }
  }

  return result;
}
