import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

type AttachmentRow = {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  upload_status: string;
};

export function serializeAttachment(row: AttachmentRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadStatus: row.upload_status,
  };
}

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
      upload_status: 'synced',
    }));

    const { data, error } = await supabase
      .from('health_visit_attachments')
      .insert(rows)
      .select('id, file_name, file_url, mime_type, size_bytes, upload_status');
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeAttachment(row as AttachmentRow));
  },

  async listByVisitIds(visitIds: string[], tenantId: number) {
    if (!visitIds.length) return new Map<string, ReturnType<typeof serializeAttachment>[]>();

    const { data, error } = await supabase
      .from('health_visit_attachments')
      .select('id, health_visit_id, file_name, file_url, mime_type, size_bytes, upload_status')
      .eq('tenant_id', tenantId)
      .in('health_visit_id', visitIds)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);

    const map = new Map<string, ReturnType<typeof serializeAttachment>[]>();
    for (const row of data ?? []) {
      const visitId = row.health_visit_id as string;
      const list = map.get(visitId) ?? [];
      list.push(serializeAttachment(row as AttachmentRow));
      map.set(visitId, list);
    }
    return map;
  },
};

export function assertHealthAttachmentKey(key: string, tenantId: number, studentId: string) {
  const expectedPrefix = `tenant_${tenantId}/student_${studentId}/health-visits/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new AppError(400, 'Invalid attachment key for this student');
  }
}
