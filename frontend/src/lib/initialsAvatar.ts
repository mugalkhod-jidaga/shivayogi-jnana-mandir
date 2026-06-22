const AVATAR_PALETTE = [
  { bg: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-amber-100', text: 'text-amber-900' },
  { bg: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-orange-100', text: 'text-orange-900' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  { bg: 'bg-lime-100', text: 'text-lime-900' },
  { bg: 'bg-blue-100', text: 'text-blue-800' },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getInitials(firstName: string, lastName: string | null | undefined): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName?.trim().charAt(0).toUpperCase() ?? '';
  return `${first}${last}` || first || '?';
}

export function getInitialsAvatarStyle(firstName: string, lastName: string | null | undefined) {
  const key = `${firstName.trim().toLowerCase()}|${(lastName ?? '').trim().toLowerCase()}`;
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}
