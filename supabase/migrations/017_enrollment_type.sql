-- Track fresh-joinee vs. promoted (vs. transferred/repeated) per academic-year
-- enrollment, and enforce one enrollment row per student per academic year.
--
-- Background: `student_enrollments` already has one row per (student, year)
-- in principle, but nothing recorded *why* a row exists, and nothing
-- enforced uniqueness per year. This migration adds that. It does NOT
-- change how enrollments are written — the repository/service split that
-- makes "advance to a new year" actually insert a new row (instead of
-- mutating the current one) is a separate, application-layer change.
--
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS throughout.

ALTER TABLE student_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) NOT NULL DEFAULT 'NEW';

ALTER TABLE student_enrollments
  DROP CONSTRAINT IF EXISTS chk_student_enrollments_type;

ALTER TABLE student_enrollments
  ADD CONSTRAINT chk_student_enrollments_type
  CHECK (enrollment_type IN ('NEW', 'PROMOTED', 'TRANSFERRED', 'REPEATED'));

COMMENT ON COLUMN student_enrollments.enrollment_type IS
  'How the student entered this academic year''s enrollment row: '
  'NEW = first admission to the school, PROMOTED = advanced from the '
  'previous standard, TRANSFERRED = joined mid-stream from elsewhere at '
  'this standard, REPEATED = held back in the same standard. Existing '
  'rows were backfilled to NEW since no prior history distinguishes them '
  '— only rows created after this migration (and the promotion feature '
  'built on top of it) are meaningful for the fresh-vs-promoted report.';

-- ---------------------------------------------------------------------------
-- Deduplicate any existing (student_id, academic_year_id) collisions before
-- adding the unique index. Current app logic only ever keeps one row per
-- student, so this should be a no-op in practice — kept for safety, same
-- pattern as migration 015.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  grp RECORD;
  keep_id UUID;
BEGIN
  FOR grp IN
    SELECT student_id, academic_year_id
    FROM student_enrollments
    WHERE deleted_at IS NULL
    GROUP BY student_id, academic_year_id
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM student_enrollments
    WHERE student_id = grp.student_id
      AND academic_year_id = grp.academic_year_id
      AND deleted_at IS NULL
    ORDER BY is_current DESC, updated_at DESC, created_at DESC
    LIMIT 1;

    UPDATE student_enrollments
    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, is_current = FALSE
    WHERE student_id = grp.student_id
      AND academic_year_id = grp.academic_year_id
      AND deleted_at IS NULL
      AND id <> keep_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_enrollments_student_year
  ON student_enrollments (student_id, academic_year_id)
  WHERE deleted_at IS NULL;

-- Supports the fresh-vs-promoted report: GROUP BY academic_year_id,
-- standard_id, enrollment_type over non-deleted enrollments.
CREATE INDEX IF NOT EXISTS idx_student_enrollments_year_standard_type
  ON student_enrollments (academic_year_id, standard_id, enrollment_type)
  WHERE deleted_at IS NULL;
