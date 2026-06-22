import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';

export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('');
}
