/**
 * Parse 2026-27 hostel admission .docx → Excel + migration CSV.
 *
 * Usage: npm run parse:hostel-docx
 */
import 'dotenv/config';

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const DOCX = path.join(
  __dirname,
  '../../data/2026-27 ನೇ ಸಾಲಿನ ಹೊಸ ವಿದ್ಯಾರ್ಥಿಗಳ ವಿವರ.docx',
);
const OUT_XLSX = path.join(__dirname, '../../data/2026-27-students-import.xlsx');
const OUT_CSV = path.join(__dirname, '../../data/2026-27-students-migration.csv');
const OUT_REVIEW = path.join(__dirname, '../../data/2026-27-students-parse-review.json');

const ACADEMIC_YEAR = '2026-27';
const ADMISSION_DATE = '01/06/2026';
const DEFAULT_STATE = 'Karnataka';
const DEFAULT_PINCODE = '585302';
const DEFAULT_BLOOD_GROUP = 'O+';
const DEFAULT_ADMISSION_CATEGORY = 'BPL';
const DEFAULT_MOTHER_TONGUE = 'Kannada';
const DEFAULT_GENDER = 'Male';

interface ParsedRow {
  table_index: number;
  serial_in_standard: string;
  admission_number: string;
  student_name: string;
  sats_id: string;
  father_name: string;
  mother_name: string;
  dob: string;
  standard: string;
  caste: string;
  social_category: string;
  rd_number: string;
  rd_number_secondary: string;
  aadhaar_number: string;
  guardian_phone: string;
  village_town: string;
  taluk_mandal: string;
  district: string;
  state: string;
  warnings: string[];
}

interface MigrationRow {
  admission_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  admission_category: string;
  admission_date: string;
  mother_tongue: string;
  aadhaar_number: string;
  academic_year: string;
  standard: string;
  section: string;
  roll_number: string;
  previous_school: string;
  last_class_studied: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  father_name: string;
  mother_name: string;
  primary_contact: string;
  village_town: string;
  taluk_mandal: string;
  district: string;
  pincode: string;
  caste: string;
  social_category: string;
  rd_number: string;
  rd_number_secondary: string;
  sats_id: string;
  parse_warnings: string;
}

function cellText(cellXml: string): string {
  const parts: string[] = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cellXml)) !== null) {
    if (m[0] === '<w:tab/>' || m[0] === '<w:br/>') parts.push(' ');
    else parts.push(m[1]);
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
}

function parseDocxTables(xml: string): string[][][] {
  const tables: string[][][] = [];
  for (const chunk of xml.split(/<w:tbl>/).slice(1)) {
    const tbl = chunk.split('</w:tbl>')[0];
    const rowXml = tbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) ?? [];
    const rows = rowXml.map((row) => {
      const cells = row.match(/<w:tc[\s\S]*?<\/w:tc>/g) ?? [];
      return cells.map(cellText);
    });
    if (rows.length > 1) tables.push(rows);
  }
  return tables;
}

function normalizeStandard(raw: string): string {
  const m = raw.match(/(\d+)/);
  return m ? m[1] : raw.trim();
}

function normalizeCategory(raw: string): string {
  const t = raw
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .toUpperCase();

  if (/\bST\b|S\s*T|ಪ್ರಬಲ/.test(t)) return 'st';
  if (/\bSC\b|S\s*C|ಪಂಚಮ/.test(t)) return 'sc';
  if (/\bGM\b|GENERAL/.test(t)) return 'gm';
  if (/3\s*A|CAT\s*3A|ವರ್ಗ\s*3A/.test(t)) return 'cat_3a';
  if (/3\s*B|CAT\s*3B|ವರ್ಗ\s*3B/.test(t)) return 'cat_3b';
  if (/2\s*B|CAT\s*2B|ವರ್ಗ\s*2B/.test(t)) return 'cat_2b';
  if (/2\s*A|2\s*ಎ|CAT\s*2A|ವರ್ಗ\s*2A/.test(t)) return 'cat_2a';
  if (/C\s*-\s*I|CAT\s*1|ವರ್ಗ\s*1|\b1\b/.test(t)) return 'cat_1';
  return '';
}

function parseCasteCategory(cell: string): { caste: string; category: string } {
  const match = cell.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { caste: match[1].trim(), category: normalizeCategory(match[2]) };
  }
  const inline = cell.match(/^(.+?)(cat_\w+|st|sc|gm|\d\s*[ABಎ])/i);
  if (inline) {
    return { caste: inline[1].trim(), category: normalizeCategory(cell) };
  }
  return { caste: cell.trim(), category: normalizeCategory(cell) };
}

const MOTHER_SUFFIXES =
  /(ಲಕ್ಷ್ಮ[ೀಿ]?|ಕವಿತಾ|ರಾಧಾ|ನಿಲ್ಲ?[ಮ]?|ಗಂಗ?[ಮ]?|ಪ್ರಿಯ?[ಾ]?|ಧಾನ?[ಮ]?|ಶ್ರ?[ೀಿ]?|ರೇ?[ಣ]?|ರಾಜ?[ೇ]?|ಅಂ?[ಬ]?|ಚ?[ಾ]?|ಸ?[ಂ]?|ಮ?[ಹ]?|ಸ?[ು]?|ಕ?[ಾ]?|ಶ?[ರ]?|ನ?[ಾ]?|ಸ?[ವ]?|ಗ?[ು]?|ರ?[ು]?|ಮ?[ೀ]?|ಬ?[ಾ]?|ದ?[ೇ]?|ಹ?[ೇ]?|ಸ?[ೀ]?|ಪ?[ಾ]?|ಯ?[ಾ]?|ಕ?[ಸ]?|ಅ?[ಶ]?|ಇ?[ಟ]?|ಬ?[ಾ]?|ಸ?[ು]?|ರ?[ೇ]?|ಪ?[ಿ]?|ವ?[ಿ]?|ಶ?[ಿ]?|ಮ?[ಾ]?|ಕ?[ಾ]?|ತ?[ಾ]?|ಬ?[ಾ]?|ಗ?[ಾ]?|ದ?[ೇ]?|ವ?[ಿ]?|ಶ?[ಿ]?|ಮ?[ಾ]?|ಕ?[ಾ]?)$/;

function splitParentNames(raw: string): { father: string; mother: string; warning?: string } {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { father: '', mother: '', warning: 'Missing parent names' };

  if (text.includes('/')) {
    const [f, m] = text.split('/').map((s) => s.trim());
    return { father: f ?? '', mother: m ?? '' };
  }

  const spaceParts = text.split(' ');
  if (spaceParts.length >= 3) {
    const mother = spaceParts[spaceParts.length - 1];
    const father = spaceParts.slice(0, -1).join(' ');
    if (mother.length >= 2 && father.length >= 2) {
      return { father, mother };
    }
  }

  for (let i = Math.max(4, text.length - 12); i < text.length - 2; i++) {
    const mother = text.slice(i).trim();
    const father = text.slice(0, i).trim();
    if (mother.length >= 3 && father.length >= 3 && MOTHER_SUFFIXES.test(mother)) {
      return { father, mother };
    }
  }

  const mid = Math.floor(text.length * 0.55);
  for (let i = mid; i < text.length - 2; i++) {
    const mother = text.slice(i).trim();
    const father = text.slice(0, i).trim();
    if (mother.length >= 3 && father.length >= 4) {
      return { father, mother, warning: 'Parent names split heuristically — please verify' };
    }
  }

  return { father: text, mother: '', warning: 'Could not split father/mother names' };
}

function extractSatsFromName(raw: string): { name: string; sats: string } {
  const satsMatch = raw.match(/(\d{3}\s+\d{3}\s+\d{3}|\d{9,12})/);
  if (!satsMatch) return { name: raw.trim(), sats: '' };
  const sats = satsMatch[1].replace(/\s+/g, '');
  const name = raw.replace(satsMatch[0], '').replace(/\s+/g, ' ').trim();
  return { name: name || raw.trim(), sats: sats.length === 9 ? sats : sats.slice(0, 9) };
}

function splitStudentName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { first: full.trim(), last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function normalizeDob(raw: string): { dob: string; warning?: string } {
  let t = raw.trim().replace(/-/g, '/');
  const broken = t.match(/^(\d{1,2})(\d{2})(\d{4})$/);
  if (broken) t = `${broken[1]}/${broken[2]}/${broken[3]}`;

  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { dob: t, warning: `Invalid DOB: ${raw}` };
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return { dob: `${dd}/${mm}/${m[3]}` };
}

function extractRdNumbers(raw: string): { primary: string; secondary: string } {
  const matches = [...raw.matchAll(/RD\s*([A-Z0-9]+)/gi)].map((m) => `RD${m[1].replace(/\s+/g, '')}`);
  return { primary: matches[0] ?? '', secondary: matches[1] ?? '' };
}

function normalizeAadhaar(raw: string): string {
  const digits = raw.replace(/\s+/g, '');
  return digits.length === 12 ? digits : raw.trim();
}

function normalizePhone(raw: string): { phone: string; warning?: string } {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return { phone: `+91${digits}` };
  if (digits.length === 12 && digits.startsWith('91')) return { phone: `+${digits}` };
  if (digits.length >= 10) return { phone: `+91${digits.slice(-10)}`, warning: 'Phone normalized from extra digits' };
  return { phone: raw.trim(), warning: `Invalid phone: ${raw}` };
}

function parseAddress(raw: string): {
  village: string;
  taluk: string;
  district: string;
  warning?: string;
} {
  const text = raw.replace(/\s+/g, ' ').trim();
  const village =
    text.match(/ಮ[uu]?[\s:]*([^ತ]+?)(?=ತಾ|$)/i)?.[1]?.trim() ??
    text.match(/ಮ[\s:]*([^,]+)/)?.[1]?.trim() ??
    '';
  const taluk =
    text.match(/ತಾ[\s:]*([^ಜ]+?)(?=ಜಿ|$)/i)?.[1]?.trim() ?? '';
  const district = text.match(/ಜಿ[\s:]*(.+)$/i)?.[1]?.trim() ?? '';

  if (!village || !taluk || !district) {
    return { village, taluk, district, warning: `Address parse incomplete: ${raw}` };
  }
  return { village, taluk, district };
}

function admissionNumber(globalIndex: number): string {
  return `SJM${String(globalIndex).padStart(5, '0')}`;
}

function parseRow(cells: string[], tableIndex: number, globalIndex: number): ParsedRow {
  const warnings: string[] = [];
  const serial = cells[0]?.trim() ?? '';
  const nameCell = cells[1] ?? '';
  const { name: studentName, sats } = extractSatsFromName(nameCell);
  if (sats) warnings.push('SATS found in name column');

  const parents = splitParentNames(cells[2] ?? '');
  if (parents.warning) warnings.push(parents.warning);

  const dobResult = normalizeDob(cells[3] ?? '');
  if (dobResult.warning) warnings.push(dobResult.warning);

  const standard = normalizeStandard(cells[4] ?? '');
  const { caste, category } = parseCasteCategory(cells[5] ?? '');
  if (!category) warnings.push(`Unmapped social category: ${cells[5] ?? ''}`);

  const rd = extractRdNumbers(cells[6] ?? '');
  const aadhaar = normalizeAadhaar(cells[7] ?? '');
  if (aadhaar.replace(/\s/g, '').length !== 12 && aadhaar) {
    warnings.push(`Aadhaar may be invalid: ${cells[7]}`);
  }

  const phoneResult = normalizePhone(cells[8] ?? '');
  if (phoneResult.warning) warnings.push(phoneResult.warning);

  const address = parseAddress(cells[9] ?? '');
  if (address.warning) warnings.push(address.warning);

  return {
    table_index: tableIndex,
    serial_in_standard: serial,
    admission_number: admissionNumber(globalIndex),
    student_name: studentName,
    sats_id: sats,
    father_name: parents.father,
    mother_name: parents.mother,
    dob: dobResult.dob,
    standard,
    caste,
    social_category: category,
    rd_number: rd.primary,
    rd_number_secondary: rd.secondary,
    aadhaar_number: aadhaar,
    guardian_phone: phoneResult.phone,
    village_town: address.village,
    taluk_mandal: address.taluk,
    district: address.district,
    state: DEFAULT_STATE,
    warnings,
  };
}

function toMigrationRow(row: ParsedRow): MigrationRow {
  const { first, last } = splitStudentName(row.student_name);
  const emergencyName = row.father_name || row.mother_name || row.student_name;
  return {
    admission_number: row.admission_number,
    first_name: first,
    last_name: last,
    dob: row.dob,
    gender: DEFAULT_GENDER,
    blood_group: DEFAULT_BLOOD_GROUP,
    admission_category: DEFAULT_ADMISSION_CATEGORY,
    admission_date: ADMISSION_DATE,
    mother_tongue: DEFAULT_MOTHER_TONGUE,
    aadhaar_number: row.aadhaar_number.replace(/\s+/g, ''),
    academic_year: ACADEMIC_YEAR,
    standard: row.standard,
    section: '',
    roll_number: row.serial_in_standard.padStart(2, '0'),
    previous_school: '',
    last_class_studied: '',
    emergency_contact_name: emergencyName,
    emergency_contact_relationship: 'Parent/Guardian',
    emergency_contact_phone: row.guardian_phone,
    father_name: row.father_name,
    mother_name: row.mother_name,
    primary_contact: row.guardian_phone,
    village_town: row.village_town,
    taluk_mandal: row.taluk_mandal,
    district: row.district,
    pincode: DEFAULT_PINCODE,
    caste: row.caste,
    social_category: row.social_category,
    rd_number: row.rd_number,
    rd_number_secondary: row.rd_number_secondary,
    sats_id: row.sats_id,
    parse_warnings: row.warnings.join('; '),
  };
}

function main(): void {
  if (!fs.existsSync(DOCX)) {
    throw new Error(`Docx not found: ${DOCX}`);
  }

  const xml = execSync(`unzip -p "${DOCX}" word/document.xml`, {
    encoding: 'utf8',
    maxBuffer: 15 * 1024 * 1024,
  });

  const tables = parseDocxTables(xml);
  const parsed: ParsedRow[] = [];
  let globalIndex = 0;

  const tableStandards = ['6', '7', '8', '9', '10'];

  tables.forEach((rows, tableIndex) => {
    for (const row of rows.slice(1)) {
      if (row.length < 8 || !row[0]?.match(/^\d+$/)) continue;
      globalIndex += 1;
      parsed.push(parseRow(row, tableIndex, globalIndex));
    }
  });

  const migrationRows = parsed.map(toMigrationRow);

  const wb = XLSX.utils.book_new();
  const fullSheet = XLSX.utils.json_to_sheet(migrationRows);
  XLSX.utils.book_append_sheet(wb, fullSheet, 'Import Data');

  const byStandard = tableStandards.map((std, i) => {
    const rows = migrationRows.filter((r) => r.standard === std);
    return { std, count: rows.length, tableIndex: i };
  });
  const summary = [
    ['Sheet', 'Students', 'Standard'],
    ...byStandard.map((b) => [`Table ${b.tableIndex + 1}`, b.count, b.std]),
    ['Total', parsed.length, ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  const warnRows = migrationRows.filter((r) => r.parse_warnings);
  if (warnRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        warnRows.map((r) => ({
          admission_number: r.admission_number,
          student: `${r.first_name} ${r.last_name}`.trim(),
          standard: r.standard,
          warnings: r.parse_warnings,
        })),
      ),
      'Review Needed',
    );
  }

  XLSX.writeFile(wb, OUT_XLSX);

  const csvHeaders = Object.keys(migrationRows[0] ?? {});
  const csvLines = [
    csvHeaders.join(','),
    ...migrationRows.map((row) =>
      csvHeaders
        .map((h) => {
          const v = String((row as unknown as Record<string, string>)[h] ?? '');
          return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(','),
    ),
  ];
  fs.writeFileSync(OUT_CSV, csvLines.join('\n'), 'utf8');

  const review = {
    source: path.basename(DOCX),
    total_students: parsed.length,
    by_standard: Object.fromEntries(byStandard.map((b) => [b.std, b.count])),
    rows_with_warnings: warnRows.length,
    defaults: {
      state: DEFAULT_STATE,
      pincode: DEFAULT_PINCODE,
      blood_group: DEFAULT_BLOOD_GROUP,
      admission_category: DEFAULT_ADMISSION_CATEGORY,
      gender: DEFAULT_GENDER,
      academic_year: ACADEMIC_YEAR,
      admission_date: ADMISSION_DATE,
    },
    notes: [
      'Admission numbers are globally sequential SJM00001.. across all standards (serial resets per class in source doc).',
      'Migration CSV includes caste/social_category/rd/sats columns for review; bulk import RPC does not persist those yet.',
      'Father/mother split uses heuristics — check Review Needed sheet.',
    ],
  };
  fs.writeFileSync(OUT_REVIEW, JSON.stringify(review, null, 2), 'utf8');

  console.log(JSON.stringify(review, null, 2));
  console.log(`\nWrote ${OUT_XLSX}`);
  console.log(`Wrote ${OUT_CSV}`);
}

main();
