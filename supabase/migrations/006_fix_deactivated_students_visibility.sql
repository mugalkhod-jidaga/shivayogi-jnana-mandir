-- Deactivated students (Alumni/Discontinued) must remain listable; status change is not a soft delete.
-- Earlier deactivate() incorrectly set deleted_at, hiding records from status filters.

UPDATE students
SET deleted_at = NULL
WHERE status IN ('Alumni', 'Discontinued')
  AND deleted_at IS NOT NULL;
