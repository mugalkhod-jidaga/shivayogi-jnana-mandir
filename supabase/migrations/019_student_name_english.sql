-- Bilingual name search: `students.first_name`/`last_name` are often entered
-- in Kannada script. Add an optional English/transliterated name so a search
-- typed in either script finds the student, and index all three search
-- columns (name search was previously unindexed sequential-scan ILIKE).

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS name_english VARCHAR(255);

COMMENT ON COLUMN students.name_english IS
  'Optional English/Roman-script full name (e.g. "Ramesh Kumar") used as a '
  'search alias when first_name/last_name are entered in Kannada script. '
  'Not shown as a separate identity field — purely to make search bilingual.';

-- pg_trgm powers ILIKE '%term%' with an index instead of a sequential scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_students_first_name_trgm
  ON students USING gin (first_name gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_last_name_trgm
  ON students USING gin (last_name gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_name_english_trgm
  ON students USING gin (name_english gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- admission_number search is a prefix/substring ILIKE too; btree already
-- exists for the tenant+admission_number unique constraint (001_schema.sql)
-- but that only helps prefix matches — trigram covers the "contains" case.
CREATE INDEX IF NOT EXISTS idx_students_admission_number_trgm
  ON students USING gin (admission_number gin_trgm_ops)
  WHERE deleted_at IS NULL;
