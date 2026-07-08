-- Hostel beds (physical slots per room) + allocation bed_id

CREATE TABLE hostel_beds (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    room_id INT REFERENCES hostel_rooms(id) NOT NULL,
    slot_number SMALLINT NOT NULL CHECK (slot_number >= 1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (room_id, slot_number)
);

CREATE INDEX idx_hostel_beds_tenant ON hostel_beds (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_hostel_beds_room ON hostel_beds (room_id) WHERE deleted_at IS NULL AND is_active = TRUE;

ALTER TABLE room_allocations ADD COLUMN IF NOT EXISTS bed_id INT REFERENCES hostel_beds(id) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_allocations_active_bed
    ON room_allocations (bed_id)
    WHERE allocated_to IS NULL AND deleted_at IS NULL AND bed_id IS NOT NULL;

-- Provision beds for existing rooms
INSERT INTO hostel_beds (tenant_id, room_id, slot_number)
SELECT r.tenant_id, r.id, gs.slot
FROM hostel_rooms r
CROSS JOIN LATERAL generate_series(1, r.capacity) AS gs(slot)
WHERE r.deleted_at IS NULL
ON CONFLICT (room_id, slot_number) DO NOTHING;

-- Assign active allocations to first free bed in their room
DO $$
DECLARE
    alloc RECORD;
    v_bed_id INT;
BEGIN
    FOR alloc IN
        SELECT ra.id, ra.room_id
        FROM room_allocations ra
        WHERE ra.deleted_at IS NULL
          AND ra.allocated_to IS NULL
          AND ra.bed_id IS NULL
    LOOP
        SELECT hb.id INTO v_bed_id
        FROM hostel_beds hb
        WHERE hb.room_id = alloc.room_id
          AND hb.deleted_at IS NULL
          AND hb.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM room_allocations ra2
              WHERE ra2.bed_id = hb.id
                AND ra2.deleted_at IS NULL
                AND ra2.allocated_to IS NULL
          )
        ORDER BY hb.slot_number
        LIMIT 1;

        IF v_bed_id IS NOT NULL THEN
            UPDATE room_allocations SET bed_id = v_bed_id, updated_at = CURRENT_TIMESTAMP WHERE id = alloc.id;
        END IF;
    END LOOP;
END $$;
