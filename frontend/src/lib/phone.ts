/** Normalize 10-digit Indian mobile or +91… to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  throw new Error('Enter a valid 10-digit mobile number');
}

export function formatPhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}
