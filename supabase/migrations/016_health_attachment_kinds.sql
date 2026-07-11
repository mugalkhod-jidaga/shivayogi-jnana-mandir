-- Health visit attachment kinds (photo, prescription, lab report, scan, other)
-- + Eye test medical record type for longitudinal vision screening

CREATE TABLE lookup_health_attachment_kinds (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    value VARCHAR(80) NOT NULL,
    labels JSONB NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO lookup_health_attachment_kinds (code, value, labels, sort_order) VALUES
    ('photo', 'Photo', '{"en":"Photo","kn":"ಫೋಟೋ"}'::jsonb, 1),
    ('prescription', 'Prescription', '{"en":"Prescription","kn":"ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್"}'::jsonb, 2),
    ('lab_report', 'Lab report', '{"en":"Lab report","kn":"ಲ್ಯಾಬ್ ವರದಿ"}'::jsonb, 3),
    ('scan', 'Scan / imaging', '{"en":"Scan / imaging","kn":"ಸ್ಕ್ಯಾನ್"}'::jsonb, 4),
    ('other', 'Other', '{"en":"Other","kn":"ಇತರೆ"}'::jsonb, 5);

ALTER TABLE health_visit_attachments
    ADD COLUMN attachment_kind_id INT REFERENCES lookup_health_attachment_kinds(id);

UPDATE health_visit_attachments hva
SET attachment_kind_id = k.id
FROM lookup_health_attachment_kinds k
WHERE k.code = 'photo'
  AND hva.attachment_kind_id IS NULL;

ALTER TABLE health_visit_attachments
    ALTER COLUMN attachment_kind_id SET NOT NULL;

CREATE INDEX idx_health_visit_attachments_kind
    ON health_visit_attachments (attachment_kind_id)
    WHERE deleted_at IS NULL;

-- Allow empty investigation notes (UI no longer requires symptoms)
ALTER TABLE health_visits
    ALTER COLUMN symptoms SET DEFAULT '';

-- Eye test / vision screening under Student Medical (longitudinal)
INSERT INTO lookup_medical_record_types (tenant_id, value, labels)
SELECT t.id, 'Eye test', '{"en":"Eye test","kn":"ಕಣ್ಣಿನ ಪರೀಕ್ಷೆ"}'::jsonb
FROM tenants t
WHERE t.deleted_at IS NULL
ON CONFLICT (tenant_id, value) DO NOTHING;
