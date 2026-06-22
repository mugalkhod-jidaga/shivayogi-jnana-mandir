import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { usersRepository } from '../../auth/repositories/users.repository';
import { auditLogService } from '../../system/services/auditLog.service';
import type {
  DocumentConfirmInput,
  DocumentPresignInput,
  DocumentVerifyInput,
} from '../schemas/document.schemas';
import { documentsRepository, type DocumentRow } from '../repositories/documents.repository';
import { getDownloadUrl, getUploadUrl } from '../services/presignedUrl.service';

const FINANCE_ALLOWED_DOC_TYPES = ['Income Certificate', 'BPL Card'];

function serializeDocument(doc: DocumentRow) {
  return {
    id: doc.id,
    studentId: doc.student_id,
    documentType: doc.document_type ?? null,
    originalFilename: doc.original_filename,
    mimeType: doc.mime_type,
    fileSize: doc.file_size,
    status: doc.status,
    expiryDate: doc.expiry_date,
    uploadedBy: doc.uploaded_by,
    verifiedBy: doc.verified_by,
    uploadedAt: doc.uploaded_at,
  };
}

async function validateDocumentType(documentTypeId: number, tenantId: number) {
  const { data, error } = await supabase
    .from('lookup_document_types')
    .select('id, value')
    .eq('id', documentTypeId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new AppError(400, 'Invalid document type for this tenant');
  }

  return data;
}

function assertDocumentKey(key: string, tenantId: number, studentId: string) {
  const expectedPrefix = `tenant_${tenantId}/student_${studentId}/documents/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new AppError(400, 'Invalid document key for this student');
  }
}

async function filterDocumentsForRole(
  docs: DocumentRow[],
  userId: string,
  permissions: string[],
): Promise<DocumentRow[]> {
  const roles = await usersRepository.findRoles(userId);
  const roleNames = roles.map((r) => r.name);

  const isFinanceOnly =
    roleNames.includes('Finance') && !permissions.includes('system:manage_roles');

  if (!isFinanceOnly) return docs;

  return docs.filter((doc) => {
    const value = doc.document_type?.value;
    return value ? FINANCE_ALLOWED_DOC_TYPES.includes(value) : false;
  });
}

export const documentService = {
  async listByStudent(studentId: string, tenantId: number, userId: string, permissions: string[]) {
    const docs = await documentsRepository.listByStudent(studentId, tenantId);
    const filtered = await filterDocumentsForRole(docs, userId, permissions);
    return filtered.map(serializeDocument);
  },

  async presign(studentId: string, tenantId: number, input: DocumentPresignInput) {
    await documentsRepository.assertStudentInTenant(studentId, tenantId);
    await validateDocumentType(input.documentTypeId, tenantId);
    return getUploadUrl(tenantId, studentId, input.filename, 'documents');
  },

  async confirm(
    studentId: string,
    tenantId: number,
    input: DocumentConfirmInput,
    userId: string,
  ) {
    assertDocumentKey(input.key, tenantId, studentId);
    await validateDocumentType(input.documentTypeId, tenantId);

    const doc = await documentsRepository.create(studentId, tenantId, {
      document_type_id: input.documentTypeId,
      file_url: input.key,
      original_filename: input.originalFilename ?? null,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      expiry_date: input.expiryDate ?? null,
      uploaded_by: userId,
    });

    return serializeDocument(doc);
  },

  async getDownloadUrl(
    documentId: string,
    tenantId: number,
    userId: string,
    permissions: string[],
    ipAddress?: string,
  ) {
    const doc = await documentsRepository.findById(documentId, tenantId);
    if (!doc) throw new AppError(404, 'Document not found');

    const filtered = await filterDocumentsForRole([doc], userId, permissions);
    if (filtered.length === 0) {
      throw new AppError(403, 'Permission denied');
    }

    const { downloadUrl } = await getDownloadUrl(doc.file_url);

    await auditLogService.record(
      userId,
      tenantId,
      'student_documents',
      documentId,
      'download',
      null,
      ipAddress,
    );

    return { downloadUrl };
  },

  async verify(
    documentId: string,
    tenantId: number,
    input: DocumentVerifyInput,
    userId: string,
    permissions: string[],
  ) {
    const existing = await documentsRepository.findById(documentId, tenantId);
    if (!existing) throw new AppError(404, 'Document not found');

    const filtered = await filterDocumentsForRole([existing], userId, permissions);
    if (filtered.length === 0) {
      throw new AppError(403, 'Permission denied');
    }

    const doc = await documentsRepository.verify(documentId, tenantId, userId, input.status);
    return serializeDocument(doc);
  },
};
