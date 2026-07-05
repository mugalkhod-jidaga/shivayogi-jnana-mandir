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
const OUT_MIGRATION_CSV = path.join(__dirname, '../../data/2026-27-students-migration-ready.csv');
const OUT_REVIEW = path.join(__dirname, '../../data/2026-27-students-parse-review.json');

const MIGRATION_ONLY_HEADERS = [
  'admission_number', 'first_name', 'last_name', 'dob', 'gender', 'blood_group',
  'admission_category', 'admission_date', 'mother_tongue', 'aadhaar_number', 'sats_id',
  'academic_year', 'standard', 'section', 'roll_number', 'previous_school', 'last_class_studied',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
  'father_name', 'mother_name', 'primary_contact', 'village_town', 'taluk_mandal', 'district',
  'state', 'pincode', 'caste', 'social_category', 'rd_number', 'rd_number_secondary',
] as const;

const ACADEMIC_YEAR = '2026-27';
const ADMISSION_DATE = '01/06/2026';
const DEFAULT_STATE = 'Karnataka';
const DEFAULT_PINCODE = '585302';
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
  sats_id: string;
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
  state: string;
  pincode: string;
  caste: string;
  social_category: string;
  rd_number: string;
  rd_number_secondary: string;
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

const MOTHER_NAME_ENDINGS = [
  'ಲಕ್ಷ್ಮೀ', 'ಕವಿತಾ', 'ರಾಧಾ', 'ನಿಲ್ಲಮ್ಮ', 'ಗಂಗಮ್ಮ', 'ಪ್ರಿಯಾಂಕ', 'ಧಾನಮ್ಮಾ', 'ಶ್ರೀದೇವಿ',
  'ರೇಣುಕಾ', 'ರಾಜೇಶ್ರೀ', 'ಸಂಗೀತಾ', 'ಅಂಬಿಕಾ', 'ಚಂದ್ರakala', 'ಆಶಾ', 'ಗುರುದೇವಿ', 'ಮಹಾದೇವಿ',
  'ಸವಿತಾ', 'ಸುನೀತಾ', 'ಶರಣಮ್ಮ', 'ರತ್ನಮ್ಮ', 'ನಾಗಮ್ಮ', 'ಲತಾ', 'ಸುರೇಖಾ', 'ಭಾಗ್ಯಶ್ರೀ',
  'ವಿದ್ಯಾಶ್ರೀ', 'ನಿರ್ಮಲಾ', 'ಕಾವೇರಿ', 'ರুক್ಮೀಣಿ', 'ಶಿವಮ್ಮಾ', 'ಮೀನಾಕ್ಷಿ', 'ಹೇಮಾವತಿ',
  'ಯಲ್ಲವ್ವ', 'ಸಿದ್ದಮ್ಮ', 'ಗೋಳಯಲ್ಲವ್ವ', 'ಕಸ್ತೂರಿಬಾಯಿ', 'ಇಟ್ಟಾಬಾಯಿ', 'ಕೊಡಿಸರುಬಾಯಿ',
  'ಪ್ರೇಮಿಲಾ', 'ಭುವನೇಶ್ವರಿ', 'ಪ್ರೇಮಲಾ', 'ಶಿವನಂದಾ', 'ನವರರೂಪಾ', 'ಮಲ್ಲವ್ವ', 'ದೇವಮ್ಮ',
  'ರಂಗಮ್ಮ', 'ಕಾಂಚನಾ', 'ಗುuruಬಾಯi', 'ಮೋಹಿನi', 'ನಾಗರತ್ನ', 'ಸುವರ್ಣಾ', 'ಮಹೇಶ್ವರi', 'ಸುಧಾರಾಣi', 'ಶೃತi',
].sort((a, b) => b.length - a.length);

function splitParentNames(raw: string): { father: string; mother: string; warning?: string } {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { father: '', mother: '', warning: 'Missing parent names' };

  if (text.includes('/')) {
    const [f, m] = text.split('/').map((s) => s.trim());
    return { father: f ?? '', mother: m ?? '' };
  }

  const joined = text.replace(/\s+/g, '');
  for (const ending of MOTHER_NAME_ENDINGS) {
    if (joined.endsWith(ending) && joined.length > ending.length + 2) {
      const mother = ending;
      const father = text.slice(0, text.length - ending.length).trim();
      return { father: father || joined.slice(0, -ending.length), mother };
    }
  }

  const parts = text.split(' ');
  if (parts.length >= 2) {
    const mother = parts[parts.length - 1];
    const father = parts.slice(0, -1).join(' ');
    if (mother.length >= 3 && mother.length <= 20 && father.length >= 3) {
      return { father, mother };
    }
  }

  for (let len = 8; len >= 4; len--) {
    if (text.length > len + 3) {
      const mother = text.slice(-len);
      const father = text.slice(0, -len);
      if (/[\u0C80-\u0CFF]/.test(mother)) {
        return { father, mother, warning: 'Parent names split by length — please verify' };
      }
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
  const m = text.match(
    /ಮ\s*[ುu]?\s*:\s*(.+?)\s*ತ\s*[ಾa]?\s*:\s*(.+?)\s*ಜ\s*[ಿi]?\s*:\s*(.+)$/i,
  );
  if (m) {
    return {
      village: m[1].replace(/\s+/g, ' ').trim(),
      taluk: m[2].replace(/\s+/g, ' ').trim(),
      district: m[3].replace(/\s+/g, ' ').trim(),
    };
  }
  return { village: '', taluk: '', district: '', warning: `Address parse incomplete: ${raw}` };
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
    blood_group: '',
    admission_category: '',
    admission_date: ADMISSION_DATE,
    mother_tongue: DEFAULT_MOTHER_TONGUE,
    aadhaar_number: row.aadhaar_number.replace(/\s+/g, ''),
    sats_id: row.sats_id,
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
    state: row.state,
    pincode: DEFAULT_PINCODE,
    caste: row.caste,
    social_category: row.social_category,
    rd_number: row.rd_number,
    rd_number_secondary: row.rd_number_secondary,
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
  const rawSourceRows: Record<string, string>[] = [];
  let globalIndex = 0;

  const tableStandards = ['6', '7', '8', '9', '10'];

  tables.forEach((rows, tableIndex) => {
    for (const row of rows.slice(1)) {
      if (row.length < 8 || !row[0]?.match(/^\d+$/)) continue;
      globalIndex += 1;
      parsed.push(parseRow(row, tableIndex, globalIndex));
      rawSourceRows.push({
        standard_group: tableStandards[tableIndex] ?? String(tableIndex + 1),
        col_1_serial: row[0] ?? '',
        col_2_student_name: row[1] ?? '',
        col_3_parents: row[2] ?? '',
        col_4_dob: row[3] ?? '',
        col_5_standard: row[4] ?? '',
        col_6_caste_category: row[5] ?? '',
        col_7_rd_numbers: row[6] ?? '',
        col_8_aadhaar: row[7] ?? '',
        col_9_phone: row[8] ?? '',
        col_10_address: row[9] ?? '',
      });
    }
  });

  const migrationRows = parsed.map(toMigrationRow);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawSourceRows), 'Raw Source');
  const fullSheet = XLSX.utils.json_to_sheet(migrationRows);
  XLSX.utils.book_append_sheet(wb, fullSheet, 'Import Data');

  const byStandard = tableStandards.map((std, i) => {
    const rows = migrationRows.filter((r) => r.standard === std);
    return { std, count: rows.length, tableIndex: i };
  });
  const warnRows = migrationRows.filter((r) => r.parse_warnings);
  const summary = [
    ['Field', 'Value'],
    ['Total students', String(parsed.length)],
    ['Academic year', ACADEMIC_YEAR],
    ['Admission date (default)', ADMISSION_DATE],
    ['State (default)', DEFAULT_STATE],
    ['Pincode (default)', DEFAULT_PINCODE],
    ['Gender (default)', DEFAULT_GENDER],
    ['Mother tongue (default)', DEFAULT_MOTHER_TONGUE],
    ['Admission number format', 'SJM00001 global sequence'],
    ['Rows needing review', String(warnRows.length)],
    [],
    ['Standard', 'Count'],
    ...byStandard.map((b) => [b.std, String(b.count)]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

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

  const migrationReadyLines = [
    [...MIGRATION_ONLY_HEADERS].join(','),
    ...migrationRows.map((row) =>
      MIGRATION_ONLY_HEADERS.map((h) => {
        const v = String(row[h] ?? '');
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(','),
    ),
  ];
  fs.writeFileSync(OUT_MIGRATION_CSV, migrationReadyLines.join('\n'), 'utf8');

  const review = {
    source: path.basename(DOCX),
    total_students: parsed.length,
    by_standard: Object.fromEntries(byStandard.map((b) => [b.std, b.count])),
    rows_with_warnings: warnRows.length,
    defaults: {
      state: DEFAULT_STATE,
      pincode: DEFAULT_PINCODE,
      gender: DEFAULT_GENDER,
      mother_tongue: DEFAULT_MOTHER_TONGUE,
      academic_year: ACADEMIC_YEAR,
      admission_date: ADMISSION_DATE,
    },
    notes: [
      'Admission numbers are globally sequential SJM00001.. across all standards (serial resets per class in source doc).',
      'blood_group and admission_category are optional — leave blank when unknown.',
      'caste, social_category, rd_number, rd_number_secondary, and sats_id are imported via bulk migration.',
      'Father/mother split uses heuristics — check Review Needed sheet.',
    ],
  };
  fs.writeFileSync(OUT_REVIEW, JSON.stringify(review, null, 2), 'utf8');

  console.log(JSON.stringify(review, null, 2));
  console.log(`\nWrote ${OUT_XLSX}`);
  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_MIGRATION_CSV}`);
}

main();
