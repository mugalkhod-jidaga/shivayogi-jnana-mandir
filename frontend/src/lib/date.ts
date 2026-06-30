const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_DATE_REGEX = /^(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{4})$/;

export type DateParseMessages = {
  required: string;
  invalidFormat: string;
  invalidYear: string;
  invalidMonth: string;
  invalidDay: string;
  invalidDate: string;
};

const DEFAULT_DATE_MESSAGES: DateParseMessages = {
  required: 'Date of birth is required',
  invalidFormat: 'Use DD/MM/YYYY (e.g. 15/05/2010)',
  invalidYear: 'Enter a valid year',
  invalidMonth: 'Enter a valid month',
  invalidDay: 'Enter a valid day',
  invalidDate: 'Enter a valid date',
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function assertValidCalendarDate(
  year: number,
  month: number,
  day: number,
  messages: DateParseMessages,
): void {
  if (year < 1900 || year > new Date().getFullYear()) {
    throw new Error(messages.invalidYear);
  }
  if (month < 1 || month > 12) {
    throw new Error(messages.invalidMonth);
  }
  if (day < 1 || day > 31) {
    throw new Error(messages.invalidDay);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(messages.invalidDate);
  }
}

/** Parse DD/MM/YYYY, DD-MM-YYYY, DD MM YYYY, or YYYY-MM-DD → ISO date string. */
export function parseDobToIso(input: string, messages: DateParseMessages = DEFAULT_DATE_MESSAGES): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(messages.required);
  }

  const isoMatch = trimmed.match(ISO_DATE_REGEX);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    assertValidCalendarDate(year, month, day, messages);
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dmyMatch = trimmed.match(DMY_DATE_REGEX);
  if (!dmyMatch) {
    throw new Error(messages.invalidFormat);
  }

  const day = Number(dmyMatch[1]);
  const month = Number(dmyMatch[2]);
  const year = Number(dmyMatch[3]);
  assertValidCalendarDate(year, month, day, messages);

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Format YYYY-MM-DD for display as DD/MM/YYYY. */
export function formatDobDisplay(iso: string): string {
  const match = iso.match(ISO_DATE_REGEX);
  if (!match) return iso;
  return `${Number(match[3])}/${Number(match[2])}/${match[1]}`;
}
