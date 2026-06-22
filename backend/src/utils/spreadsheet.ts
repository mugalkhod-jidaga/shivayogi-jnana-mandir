import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export type RawCsvRow = Record<string, string>;

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeRowKeys(row: Record<string, unknown>): RawCsvRow {
  const normalized: RawCsvRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || value === '') continue;
    normalized[normalizeHeader(key)] = String(value).trim();
  }
  return normalized;
}

export function parseSpreadsheet(buffer: Buffer, filename: string): RawCsvRow[] {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rows.map(normalizeRowKeys).filter((row) => Object.keys(row).length > 0);
  }

  const records = parse(buffer, {
    columns: (headers: string[]) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as RawCsvRow[];

  return records.filter((row) => Object.keys(row).length > 0);
}
