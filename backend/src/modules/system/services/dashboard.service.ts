import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

export const dashboardService = {
  async getSummary(tenantId: number) {
    const [totalRes, activeRes, alumniRes, pendingDocsRes, studentsRes, docTypesRes, verifiedDocsRes] =
      await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'Active')
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'Alumni')
          .is('deleted_at', null),
        supabase
          .from('student_documents')
          .select('id, students!inner(tenant_id)', { count: 'exact', head: true })
          .eq('students.tenant_id', tenantId)
          .eq('status', 'Pending Review')
          .is('deleted_at', null),
        supabase
          .from('students')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('status', 'Active')
          .is('deleted_at', null),
        supabase
          .from('lookup_document_types')
          .select('id, value')
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        supabase
          .from('student_documents')
          .select('student_id, document_type_id, students!inner(tenant_id)')
          .eq('students.tenant_id', tenantId)
          .eq('status', 'Verified')
          .is('deleted_at', null),
      ]);

    if (totalRes.error) throw new AppError(500, totalRes.error.message);
    if (activeRes.error) throw new AppError(500, activeRes.error.message);
    if (alumniRes.error) throw new AppError(500, alumniRes.error.message);
    if (pendingDocsRes.error) throw new AppError(500, pendingDocsRes.error.message);
    if (studentsRes.error) throw new AppError(500, studentsRes.error.message);
    if (docTypesRes.error) throw new AppError(500, docTypesRes.error.message);
    if (verifiedDocsRes.error) throw new AppError(500, verifiedDocsRes.error.message);

    const requiredTypeIds = new Set((docTypesRes.data ?? []).map((t) => t.id));
    const requiredTypeCount = requiredTypeIds.size;

    const verifiedByStudent = new Map<string, Set<number>>();
    for (const doc of verifiedDocsRes.data ?? []) {
      const studentId = doc.student_id as string;
      const typeId = doc.document_type_id as number;
      if (!verifiedByStudent.has(studentId)) verifiedByStudent.set(studentId, new Set());
      verifiedByStudent.get(studentId)!.add(typeId);
    }

    let documentsComplete = 0;
    if (requiredTypeCount > 0) {
      for (const student of studentsRes.data ?? []) {
        const verified = verifiedByStudent.get(student.id) ?? new Set<number>();
        if (verified.size >= requiredTypeCount) {
          const hasAll = [...requiredTypeIds].every((id) => verified.has(id));
          if (hasAll) documentsComplete += 1;
        }
      }
    }

    return {
      totalStudents: totalRes.count ?? 0,
      activeStudents: activeRes.count ?? 0,
      alumniCount: alumniRes.count ?? 0,
      documentsComplete,
      documentsPending: pendingDocsRes.count ?? 0,
    };
  },

  async getComplianceReport(tenantId: number) {
    const [studentsRes, docTypesRes, docsRes] = await Promise.all([
      supabase
        .from('students')
        .select('id, admission_number, first_name, last_name')
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .is('deleted_at', null)
        .order('admission_number'),
      supabase
        .from('lookup_document_types')
        .select('id, value')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('value'),
      supabase
        .from('student_documents')
        .select('student_id, document_type_id, lookup_document_types(value), students!inner(tenant_id)')
        .eq('students.tenant_id', tenantId)
        .eq('status', 'Verified')
        .is('deleted_at', null),
    ]);

    if (studentsRes.error) throw new AppError(500, studentsRes.error.message);
    if (docTypesRes.error) throw new AppError(500, docTypesRes.error.message);
    if (docsRes.error) throw new AppError(500, docsRes.error.message);

    const allTypes = docTypesRes.data ?? [];
    const verifiedByStudent = new Map<string, Set<string>>();

    for (const doc of docsRes.data ?? []) {
      const studentId = doc.student_id as string;
      const rawType = doc.lookup_document_types as { value: string } | { value: string }[] | null;
      const typeValue = Array.isArray(rawType) ? rawType[0]?.value : rawType?.value;
      if (!typeValue) continue;
      if (!verifiedByStudent.has(studentId)) verifiedByStudent.set(studentId, new Set());
      verifiedByStudent.get(studentId)!.add(typeValue);
    }

    const report = (studentsRes.data ?? [])
      .map((student) => {
        const verified = verifiedByStudent.get(student.id) ?? new Set<string>();
        const missingDocumentTypes = allTypes
          .filter((t) => !verified.has(t.value))
          .map((t) => t.value);

        return {
          studentId: student.id,
          admissionNumber: student.admission_number,
          name: [student.first_name, student.last_name].filter(Boolean).join(' '),
          missingDocumentTypes,
        };
      })
      .filter((row) => row.missingDocumentTypes.length > 0);

    return report;
  },
};
