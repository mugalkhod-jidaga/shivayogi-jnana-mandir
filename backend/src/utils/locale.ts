export type SupportedLocale = 'en' | 'kn';

export function parseLocale(raw?: string | null): SupportedLocale {
  if (!raw) return 'en';
  const normalized = raw.toLowerCase().split('-')[0];
  return normalized === 'kn' ? 'kn' : 'en';
}

export function resolveLocalizedLabel(
  labels: Record<string, string> | null | undefined,
  fallbackValue: string,
  locale: SupportedLocale,
): string {
  if (!labels) return fallbackValue;
  return labels[locale] ?? labels.en ?? fallbackValue;
}
