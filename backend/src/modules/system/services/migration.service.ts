import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { normalizeIndianPhone, phoneSchema } from '../../../utils/validators';
import { parseSpreadsheet, type RawCsvRow } from '../../../utils/spreadsheet';
import type { MigrationCommitRow } from '../schemas/migration.schemas';
import { migrationCsvRowSchema } from '../schemas/migration.schemas';

interface LookupMaps {
  bloodGroups: Map<string, number>;
  admissionCategories: Map<string, number>;
}

interface ParseErrorRow {
  row: number;
  error: string;
}

export interface MigrationPreviewRow extends MigrationCommitRow {
  row: number;
}

export interface MigrationParseResult {
  validRows: number;
  errorRows: ParseErrorRow[];
  preview: MigrationPreviewRow[];
}

async function loadLookupMaps(tenantId: number): Promise<LookupMaps> {
  const [bloodRes, categoryRes] = await Promise.all([
    supabase.from('lookup_blood_groups').select('id, value').eq('is_active', true),
    supabase
      .from('lookup_admission_categories')
      .select('id, value')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
  ]);

  if (bloodRes.error) throw new AppError(500, bloodRes.error.message);
  if (categoryRes.error) throw new AppError(500, categoryRes.error.message);

  const bloodGroups = new Map<string, number>();
  for (const row of bloodRes.data ?? []) {
    bloodGroups.set(row.value.toLowerCase(), row.id);
  }

  const admissionCategories = new Map<string, number>();
  for (const row of categoryRes.data ?? []) {
    admissionCategories.set(row.value.toLowerCase(), row.id);
  }

  return { bloodGroups, admissionCategories };
}

async function findExistingAdmissionNumbers(
  tenantId: number,
  admissionNumbers: string[],
): Promise<Set<string>> {
  if (admissionNumbers.length === 0) return new Set();

  const { data, error } = await supabase
    .from('students')
    .select('admission_number')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .in('admission_number', admissionNumbers);

  if (error) throw new AppError(500, error.message);
  return new Set((data ?? []).map((row) => row.admission_number));
}

function mapRow(
  raw: RawCsvRow,
  rowNumber: number,
  maps: LookupMaps,
): { ok: true; value: MigrationPreviewRow } | { ok: false; error: string } {
  const parsed = migrationCsvRowSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed';
    return { ok: false, error: firstError };
  }

  const row = parsed.data;

  let primaryContact: string;
  try {
    primaryContact = normalizeIndianPhone(row.primary_contact);
    phoneSchema.parse(primaryContact);
  } catch {
    return { ok: false, error: `Invalid phone number: ${row.primary_contact}` };
  }

  const bloodGroupId = maps.bloodGroups.get(row.blood_group.toLowerCase());
  if (!bloodGroupId) {
    return { ok: false, error: `Invalid blood group: ${row.blood_group}` };
  }

  const admissionCategoryId = maps.admissionCategories.get(row.admission_category.toLowerCase());
  if (!admissionCategoryId) {
    return { ok: false, error: `Invalid admission category: ${row.admission_category}` };
  }

  return {
    ok: true,
    value: {
      row: rowNumber,
      admission_number: row.admission_number,
      first_name: row.first_name,
      last_name: row.last_name,
      dob: row.dob,
      gender: row.gender ?? 'Male',
      blood_group_id: bloodGroupId,
      admission_category_id: admissionCategoryId,
      father_name: row.father_name,
      mother_name: row.mother_name,
      parent_status: 'Both Alive',
      primary_contact: primaryContact,
      village_town: row.village_town,
      taluk_mandal: row.taluk_mandal,
      district: row.district,
      pincode: row.pincode,
    },
  };
}

export const migrationService = {
  async parseFile(tenantId: number, buffer: Buffer, filename: string): Promise<MigrationParseResult> {
    const rows = parseSpreadsheet(buffer, filename);
    if (rows.length === 0) {
      throw new AppError(400, 'File is empty or has no data rows');
    }

    const maps = await loadLookupMaps(tenantId);
    const errorRows: ParseErrorRow[] = [];
    const preview: MigrationPreviewRow[] = [];
    const seenInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // header is row 1
      const result = mapRow(rows[i], rowNumber, maps);

      if (!result.ok) {
        errorRows.push({ row: rowNumber, error: result.error });
        continue;
      }

      const admissionNumber = result.value.admission_number;
      if (seenInFile.has(admissionNumber)) {
        errorRows.push({ row: rowNumber, error: `Duplicate admission number in file: ${admissionNumber}` });
        continue;
      }
      seenInFile.add(admissionNumber);
      preview.push(result.value);
    }

    const existing = await findExistingAdmissionNumbers(
      tenantId,
      preview.map((p) => p.admission_number),
    );

    const dedupedPreview: MigrationPreviewRow[] = [];
    for (const row of preview) {
      if (existing.has(row.admission_number)) {
        errorRows.push({
          row: row.row,
          error: `Admission number already exists: ${row.admission_number}`,
        });
      } else {
        dedupedPreview.push(row);
      }
    }

    return {
      validRows: dedupedPreview.length,
      errorRows,
      preview: dedupedPreview,
    };
  },

  async commit(tenantId: number, userId: string, students: MigrationCommitRow[]) {
    const payload = students.map((student) => {
      const { row: _row, ...rest } = student as MigrationCommitRow & { row?: number };
      return rest;
    });

    const { data, error } = await supabase.rpc('bulk_insert_students', {
      p_tenant_id: tenantId,
      p_created_by: userId,
      p_students: payload,
    });

    if (error) throw new AppError(500, error.message);

    const result = data as {
      success?: boolean;
      inserted?: number;
      error?: string;
      inserted_before_failure?: number;
    };

    if (!result?.success) {
      throw new AppError(
        400,
        result?.error ?? 'Bulk insert failed',
      );
    }

    return { inserted: result.inserted ?? 0 };
  },
};
