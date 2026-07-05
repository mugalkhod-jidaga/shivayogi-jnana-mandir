const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_DATE_REGEX = /^(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{4})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function assertValidCalendarDate(year: number, month: number, day: number): void {
  if (year < 1900 || year > new Date().getFullYear()) {
    throw new Error('Enter a valid year');
  }
  if (month < 1 || month > 12) {
    throw new Error('Enter a valid month');
  }
  if (day < 1 || day > 31) {
    throw new Error('Enter a valid day');
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Enter a valid date');
  }
}

/** Parse DD/MM/YYYY, DD-MM-YYYY, DD MM YYYY, or YYYY-MM-DD → ISO date string. */
export function parseDobToIso(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Date of birth is required');
  }

  const isoMatch = trimmed.match(ISO_DATE_REGEX);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    assertValidCalendarDate(year, month, day);
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dmyMatch = trimmed.match(DMY_DATE_REGEX);
  if (!dmyMatch) {
    throw new Error('Use DD/MM/YYYY (e.g. 15/05/2010)');
  }

  const day = Number(dmyMatch[1]);
  const month = Number(dmyMatch[2]);
  const year = Number(dmyMatch[3]);
  assertValidCalendarDate(year, month, day);

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

const MIGRATION_DOB_FALLBACK = '2000-01-01';
const MIGRATION_ADMISSION_FALLBACK = '2026-06-01';

/** Lenient date parsing for bulk CSV import — fixes common typos, falls back instead of failing. */
export function parseMigrationDate(
  input: string | undefined,
  fallback = MIGRATION_DOB_FALLBACK,
): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return fallback;

  const candidates = [trimmed];

  const ddmmSlashYyyy = trimmed.match(/^(\d{2})(\d{2})\/(\d{4})$/);
  if (ddmmSlashYyyy) {
    candidates.push(`${ddmmSlashYyyy[1]}/${ddmmSlashYyyy[2]}/${ddmmSlashYyyy[3]}`);
  }

  const ddMmExtraYyyy = trimmed.match(/^(\d{1,2})\/(\d{2})\d(\d{4})$/);
  if (ddMmExtraYyyy) {
    candidates.push(`${ddMmExtraYyyy[1]}/${ddMmExtraYyyy[2]}/${ddMmExtraYyyy[4]}`);
  }

  const ddMmmSlashYyyy = trimmed.match(/^(\d{2})\/(\d{2})\d\/(\d{4})$/);
  if (ddMmmSlashYyyy) {
    candidates.push(`${ddMmmSlashYyyy[1]}/${ddMmmSlashYyyy[2]}/${ddMmmSlashYyyy[3]}`);
  }

  for (const candidate of candidates) {
    try {
      return parseDobToIso(candidate);
    } catch {
      /* try next candidate */
    }
  }

  return fallback;
}
