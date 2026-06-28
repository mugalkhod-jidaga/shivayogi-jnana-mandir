import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

export const dashboardService = {
  async getSummary(tenantId: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [
      totalStudentsRes,
      activeStudentsRes,
      totalStaffRes,
      activeStaffRes,
      admissionsMonthRes,
      currentYearRes,
      standardsRes,
      enrollmentsRes,
      categoriesRes,
      studentsByCategoryRes,
    ] = await Promise.all([
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
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .is('deleted_at', null),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .gte('admission_date', monthStart)
        .is('deleted_at', null),
      supabase
        .from('lookup_academic_years')
        .select('id, label, start_date')
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('lookup_academic_standards')
        .select('id, value, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .neq('value', 'Unassigned')
        .order('sort_order'),
      supabase
        .from('student_enrollments')
        .select('standard_id, students!inner(tenant_id, status)')
        .eq('students.tenant_id', tenantId)
        .eq('students.status', 'Active')
        .eq('is_current', true)
        .is('deleted_at', null),
      supabase
        .from('lookup_admission_categories')
        .select('id, value')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('value'),
      supabase
        .from('students')
        .select('admission_category_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .is('deleted_at', null),
    ]);

    for (const res of [
      totalStudentsRes,
      activeStudentsRes,
      totalStaffRes,
      activeStaffRes,
      admissionsMonthRes,
      standardsRes,
      enrollmentsRes,
      categoriesRes,
      studentsByCategoryRes,
    ]) {
      if (res.error) throw new AppError(500, res.error.message);
    }

    const standardCounts = new Map<number, number>();
    for (const row of enrollmentsRes.data ?? []) {
      const standardId = row.standard_id as number;
      standardCounts.set(standardId, (standardCounts.get(standardId) ?? 0) + 1);
    }

    const studentsByStandard = (standardsRes.data ?? []).map((standard) => ({
      standardId: standard.id,
      label: standard.value,
      count: standardCounts.get(standard.id) ?? 0,
    }));

    const categoryCounts = new Map<number, number>();
    for (const row of studentsByCategoryRes.data ?? []) {
      const categoryId = row.admission_category_id as number | null;
      if (categoryId == null) continue;
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }

    const studentsByCategory = (categoriesRes.data ?? []).map((category) => ({
      categoryId: category.id,
      label: category.value,
      count: categoryCounts.get(category.id) ?? 0,
    }));

    let admissionsThisAcademicYear = 0;
    if (currentYearRes.data) {
      const yearStart = currentYearRes.data.start_date as string;
      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'Active')
        .gte('admission_date', yearStart)
        .is('deleted_at', null);

      if (error) throw new AppError(500, error.message);
      admissionsThisAcademicYear = count ?? 0;
    }

    return {
      totalStudents: totalStudentsRes.count ?? 0,
      activeStudents: activeStudentsRes.count ?? 0,
      totalStaff: totalStaffRes.count ?? 0,
      activeStaff: activeStaffRes.count ?? 0,
      admissionsThisMonth: admissionsMonthRes.count ?? 0,
      admissionsThisAcademicYear,
      currentAcademicYear: currentYearRes.data?.label ?? null,
      studentsByStandard,
      studentsByCategory,
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
