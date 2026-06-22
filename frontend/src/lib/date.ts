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

/** Format YYYY-MM-DD for display as DD/MM/YYYY. */
export function formatDobDisplay(iso: string): string {
  const match = iso.match(ISO_DATE_REGEX);
  if (!match) return iso;
  return `${Number(match[3])}/${Number(match[2])}/${match[1]}`;
}
