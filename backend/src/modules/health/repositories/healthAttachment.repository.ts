import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

type KindRow = {
  id: number;
  code: string;
  value: string;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  upload_status: string;
  attachment_kind_id?: number;
  kind?: KindRow | KindRow[] | null;
};

function serializeKind(kind: KindRow | KindRow[] | null | undefined) {
  const row = Array.isArray(kind) ? kind[0] : kind;
  if (!row) return null;
  return { id: row.id, code: row.code, value: row.value };
}

export function serializeAttachment(row: AttachmentRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadStatus: row.upload_status,
    kind: serializeKind(row.kind),
  };
}

const ATTACHMENT_SELECT =
  'id, file_name, file_url, mime_type, size_bytes, upload_status, attachment_kind_id, kind:lookup_health_attachment_kinds(id, code, value)';

export const healthAttachmentRepository = {
  async createMany(
    tenantId: number,
    healthVisitId: string,
    studentId: string,
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      mimeType?: string;
      sizeBytes?: number;
      attachmentKindId: number;
    }>,
  ) {
    if (!attachments.length) return [];

    const rows = attachments.map((a) => ({
      tenant_id: tenantId,
      health_visit_id: healthVisitId,
      student_id: studentId,
      file_name: a.fileName,
      file_url: a.fileUrl,
      mime_type: a.mimeType ?? null,
      size_bytes: a.sizeBytes ?? null,
      attachment_kind_id: a.attachmentKindId,
      upload_status: 'synced',
    }));

    const { data, error } = await supabase
      .from('health_visit_attachments')
      .insert(rows)
      .select(ATTACHMENT_SELECT);
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeAttachment(row as unknown as AttachmentRow));
  },

  async listByVisitIds(visitIds: string[], tenantId: number) {
    if (!visitIds.length) return new Map<string, ReturnType<typeof serializeAttachment>[]>();

    const { data, error } = await supabase
      .from('health_visit_attachments')
      .select(`id, health_visit_id, file_name, file_url, mime_type, size_bytes, upload_status, attachment_kind_id, kind:lookup_health_attachment_kinds(id, code, value)`)
      .eq('tenant_id', tenantId)
      .in('health_visit_id', visitIds)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);

    const map = new Map<string, ReturnType<typeof serializeAttachment>[]>();
    for (const row of data ?? []) {
      const visitId = row.health_visit_id as string;
      const list = map.get(visitId) ?? [];
      list.push(serializeAttachment(row as unknown as AttachmentRow));
      map.set(visitId, list);
    }
    return map;
  },

  async findById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('health_visit_attachments')
      .select(
        'id, file_name, file_url, mime_type, size_bytes, upload_status, student_id, health_visit_id, attachment_kind_id, kind:lookup_health_attachment_kinds(id, code, value)',
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data as
      | (AttachmentRow & { student_id: string; health_visit_id: string })
      | null;
  },

  async assertKindExists(kindId: number) {
    const { data, error } = await supabase
      .from('lookup_health_attachment_kinds')
      .select('id')
      .eq('id', kindId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    if (!data) throw new AppError(400, 'Invalid attachment kind');
  },
};

export function assertHealthAttachmentKey(key: string, tenantId: number, studentId: string) {
  const expectedPrefix = `tenant_${tenantId}/student_${studentId}/health-visits/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new AppError(400, 'Invalid attachment key for this student');
  }
}
