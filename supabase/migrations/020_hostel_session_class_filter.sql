-- Allow hostel attendance sessions to be scoped to a standard and/or section.
-- Both columns are nullable — NULL means "all classes" (existing behaviour).
-- The unique index is rebuilt to include the new dimensions so that
-- (date, period, block, standard, section) is the natural key.

ALTER TABLE hostel_attendance_sessions
  ADD COLUMN IF NOT EXISTS standard_id INT REFERENCES lookup_academic_standards(id) NULL,
  ADD COLUMN IF NOT EXISTS section_id  INT REFERENCES lookup_sections(id)           NULL;

-- Drop the old unique index and recreate with the new columns.
DROP INDEX IF EXISTS idx_hostel_attendance_session_unique;

CREATE UNIQUE INDEX idx_hostel_attendance_session_unique
  ON hostel_attendance_sessions (
    tenant_id,
    attendance_date,
    COALESCE(block_id,    0),
    session_period,
    COALESCE(standard_id, 0),
    COALESCE(section_id,  0)
  )
  WHERE deleted_at IS NULL;
