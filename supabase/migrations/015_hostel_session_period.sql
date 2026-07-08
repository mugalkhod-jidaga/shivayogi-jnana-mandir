-- Morning / evening hostel attendance sessions (twice daily)
--
-- Safe to re-run if partially applied (column added but unique index failed).
-- Deduplicates existing sessions before creating the new unique index.

ALTER TABLE hostel_attendance_sessions
  ADD COLUMN IF NOT EXISTS session_period VARCHAR(10) NOT NULL DEFAULT 'morning';

ALTER TABLE hostel_attendance_sessions
  DROP CONSTRAINT IF EXISTS chk_hostel_session_period;

ALTER TABLE hostel_attendance_sessions
  ADD CONSTRAINT chk_hostel_session_period
  CHECK (session_period IN ('morning', 'evening'));

DROP INDEX IF EXISTS idx_hostel_attendance_session_day_block;

-- ---------------------------------------------------------------------------
-- Deduplicate sessions per (tenant_id, attendance_date, block) before index
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  grp RECORD;
  sess RECORD;
  att RECORD;
  v_morning_id UUID;
  v_evening_id UUID;
  v_target_id UUID;
  v_rank INT;
BEGIN
  -- Pass 1: assign session_period by created_at order within each day/block group
  FOR grp IN
    SELECT
      s.tenant_id,
      s.attendance_date,
      COALESCE(s.block_id, 0) AS block_key,
      COUNT(*) AS cnt
    FROM hostel_attendance_sessions s
    WHERE s.deleted_at IS NULL
    GROUP BY s.tenant_id, s.attendance_date, COALESCE(s.block_id, 0)
    HAVING COUNT(*) > 1
  LOOP
    v_morning_id := NULL;
    v_evening_id := NULL;
    v_rank := 0;

    FOR sess IN
      SELECT s.id
      FROM hostel_attendance_sessions s
      WHERE s.deleted_at IS NULL
        AND s.tenant_id = grp.tenant_id
        AND s.attendance_date = grp.attendance_date
        AND COALESCE(s.block_id, 0) = grp.block_key
      ORDER BY s.created_at ASC, s.id ASC
    LOOP
      v_rank := v_rank + 1;

      IF grp.cnt = 2 THEN
        UPDATE hostel_attendance_sessions
        SET session_period = CASE WHEN v_rank = 1 THEN 'morning' ELSE 'evening' END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = sess.id;

        IF v_rank = 1 THEN
          v_morning_id := sess.id;
        ELSE
          v_evening_id := sess.id;
        END IF;
      ELSIF v_rank = 1 THEN
        UPDATE hostel_attendance_sessions
        SET session_period = 'morning', updated_at = CURRENT_TIMESTAMP
        WHERE id = sess.id;
        v_morning_id := sess.id;
      ELSIF v_rank = 2 THEN
        UPDATE hostel_attendance_sessions
        SET session_period = 'evening', updated_at = CURRENT_TIMESTAMP
        WHERE id = sess.id;
        v_evening_id := sess.id;
      ELSE
        -- Rank 3+: merge attendance into morning/evening, then soft-delete extra session
        FOR att IN
          SELECT r.id, r.student_id
          FROM hostel_attendance_records r
          WHERE r.session_id = sess.id
            AND r.deleted_at IS NULL
        LOOP
          v_target_id := NULL;

          IF NOT EXISTS (
            SELECT 1 FROM hostel_attendance_records r2
            WHERE r2.session_id = v_morning_id
              AND r2.student_id = att.student_id
              AND r2.deleted_at IS NULL
          ) THEN
            v_target_id := v_morning_id;
          ELSIF NOT EXISTS (
            SELECT 1 FROM hostel_attendance_records r2
            WHERE r2.session_id = v_evening_id
              AND r2.student_id = att.student_id
              AND r2.deleted_at IS NULL
          ) THEN
            v_target_id := v_evening_id;
          END IF;

          IF v_target_id IS NOT NULL THEN
            UPDATE hostel_attendance_records
            SET session_id = v_target_id, updated_at = CURRENT_TIMESTAMP
            WHERE id = att.id;
          ELSE
            UPDATE hostel_attendance_records
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = att.id;
          END IF;
        END LOOP;

        UPDATE hostel_attendance_sessions
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = sess.id;
      END IF;
    END LOOP;
  END LOOP;

  -- Pass 2: safety merge for any remaining duplicates on the unique key
  FOR grp IN
    SELECT
      s.tenant_id,
      s.attendance_date,
      COALESCE(s.block_id, 0) AS block_key,
      s.session_period,
      COUNT(*) AS cnt
    FROM hostel_attendance_sessions s
    WHERE s.deleted_at IS NULL
    GROUP BY s.tenant_id, s.attendance_date, COALESCE(s.block_id, 0), s.session_period
    HAVING COUNT(*) > 1
  LOOP
    v_morning_id := NULL;

    FOR sess IN
      SELECT
        s.id,
        (
          SELECT COUNT(*)
          FROM hostel_attendance_records r
          WHERE r.session_id = s.id AND r.deleted_at IS NULL
        ) AS att_count
      FROM hostel_attendance_sessions s
      WHERE s.deleted_at IS NULL
        AND s.tenant_id = grp.tenant_id
        AND s.attendance_date = grp.attendance_date
        AND COALESCE(s.block_id, 0) = grp.block_key
        AND s.session_period = grp.session_period
      ORDER BY att_count DESC, s.created_at ASC, s.id ASC
    LOOP
      IF v_morning_id IS NULL THEN
        v_morning_id := sess.id;
      ELSE
        FOR att IN
          SELECT r.id, r.student_id
          FROM hostel_attendance_records r
          WHERE r.session_id = sess.id
            AND r.deleted_at IS NULL
        LOOP
          IF NOT EXISTS (
            SELECT 1 FROM hostel_attendance_records r2
            WHERE r2.session_id = v_morning_id
              AND r2.student_id = att.student_id
              AND r2.deleted_at IS NULL
          ) THEN
            UPDATE hostel_attendance_records
            SET session_id = v_morning_id, updated_at = CURRENT_TIMESTAMP
            WHERE id = att.id;
          ELSE
            UPDATE hostel_attendance_records
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = att.id;
          END IF;
        END LOOP;

        UPDATE hostel_attendance_sessions
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = sess.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hostel_attendance_session_unique
  ON hostel_attendance_sessions (
    tenant_id,
    attendance_date,
    COALESCE(block_id, 0),
    session_period
  )
  WHERE deleted_at IS NULL;
