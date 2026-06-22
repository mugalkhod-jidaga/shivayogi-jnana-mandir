import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { auditLogService } from '../../system/services/auditLog.service';

export interface DocumentRow {
  id: string;
  student_id: string;
  document_type_id: number;
  file_url: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: string;
  expiry_date: string | null;
  uploaded_by: string | null;
  verified_by: string | null;
  uploaded_at: string;
  document_type?: { id: number; value: string } | null;
}

export interface DocumentRowWithStudent extends DocumentRow {
  student: {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string | null;
    tenant_id: number;
  };
}

const DOCUMENT_SELECT = `
  *,
  document_type:lookup_document_types(id, value)
`;

class DocumentsRepository {
  async assertStudentInTenant(studentId: string, tenantId: number): Promise<void> {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Student not found');
    }
  }

  async listByTenant(
    tenantId: number,
    page: number,
    limit: number,
    options?: { status?: string; search?: string; documentTypeIds?: number[] },
  ): Promise<{ data: DocumentRowWithStudent[]; meta: { total: number; page: number; limit: number } }> {
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let query = supabase
      .from('student_documents')
      .select(
        `${DOCUMENT_SELECT}, student:students!inner(id, admission_number, first_name, last_name, tenant_id)`,
        { count: 'exact' },
      )
      .eq('students.tenant_id', tenantId)
      .is('deleted_at', null);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.documentTypeIds?.length) {
      query = query.in('document_type_id', options.documentTypeIds);
    }

    if (options?.search) {
      const term = options.search.replace(/[%_]/g, '');
      query = query.or(
        `admission_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
        { referencedTable: 'students' },
      );
    }

    const { data, count, error } = await query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + cappedLimit - 1);

    if (error) throw new AppError(500, error.message);

    return {
      data: (data ?? []) as DocumentRowWithStudent[],
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async listByStudent(studentId: string, tenantId: number): Promise<DocumentRow[]> {
    await this.assertStudentInTenant(studentId, tenantId);

    const { data, error } = await supabase
      .from('student_documents')
      .select(DOCUMENT_SELECT)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) throw new AppError(500, error.message);
    return (data ?? []) as DocumentRow[];
  }

  async findById(documentId: string, tenantId: number): Promise<DocumentRow | null> {
    const { data, error } = await supabase
      .from('student_documents')
      .select(`${DOCUMENT_SELECT}, student:students!inner(id, tenant_id)`)
      .eq('id', documentId)
      .eq('students.tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AppError(500, error.message);
    }

    return data as DocumentRow;
  }

  async create(
    studentId: string,
    tenantId: number,
    row: {
      document_type_id: number;
      file_url: string;
      original_filename?: string | null;
      mime_type?: string | null;
      file_size?: number | null;
      expiry_date?: string | null;
      uploaded_by: string;
    },
  ): Promise<DocumentRow> {
    await this.assertStudentInTenant(studentId, tenantId);

    const { data, error } = await supabase
      .from('student_documents')
      .insert({ student_id: studentId, ...row })
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new AppError(500, error.message);
    return data as DocumentRow;
  }

  async verify(
    documentId: string,
    tenantId: number,
    userId: string,
    status: string,
  ): Promise<DocumentRow> {
    const existing = await this.findById(documentId, tenantId);
    if (!existing) throw new AppError(404, 'Document not found');

    const { data, error } = await supabase
      .from('student_documents')
      .update({ status, verified_by: userId })
      .eq('id', documentId)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, 'student_documents', documentId, 'update', {
      before: existing,
      after: data,
    });

    return data as DocumentRow;
  }
}

export const documentsRepository = new DocumentsRepository();
