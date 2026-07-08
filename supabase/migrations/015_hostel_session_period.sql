-- Morning / evening hostel attendance sessions (twice daily)

ALTER TABLE hostel_attendance_sessions
  ADD COLUMN IF NOT EXISTS session_period VARCHAR(10) NOT NULL DEFAULT 'morning';

ALTER TABLE hostel_attendance_sessions
  DROP CONSTRAINT IF EXISTS chk_hostel_session_period;

ALTER TABLE hostel_attendance_sessions
  ADD CONSTRAINT chk_hostel_session_period
  CHECK (session_period IN ('morning', 'evening'));

DROP INDEX IF EXISTS idx_hostel_attendance_session_day_block;

CREATE UNIQUE INDEX idx_hostel_attendance_session_unique
  ON hostel_attendance_sessions (
    tenant_id,
    attendance_date,
    COALESCE(block_id, 0),
    session_period
  )
  WHERE deleted_at IS NULL;
