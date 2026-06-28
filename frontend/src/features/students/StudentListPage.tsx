import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdmissionCategorySelect } from '@/components/lookups/AdmissionCategorySelect';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { AcademicYearSelect } from '@/components/lookups/AcademicYearSelect';
import { PageHeader } from '@/components/PageHeader';
import { RequirePermission } from '@/components/RequirePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StudentInitialsAvatar } from '@/features/students/components/StudentInitialsAvatar';
import { useStudentsList } from '@/hooks/useStudents';
import { formatDobDisplay } from '@/lib/date';
import type { StudentStatus } from '@/types/student';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function StudentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const statusParam = (searchParams.get('status') as StudentStatus | null) ?? undefined;
  const standardIdParam = searchParams.get('standardId') ?? '';
  const academicYearIdParam = searchParams.get('academicYearId') ?? '';
  const categoryIdParam = searchParams.get('admissionCategoryId') ?? '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState(statusParam ?? '');
  const [standardFilter, setStandardFilter] = useState(standardIdParam);
  const [academicYearFilter, setAcademicYearFilter] = useState(academicYearIdParam);
  const [categoryFilter, setCategoryFilter] = useState(categoryIdParam);

  useEffect(() => {
    setSearchInput(searchParam);
    setStatusFilter(statusParam ?? '');
    setStandardFilter(standardIdParam);
    setAcademicYearFilter(academicYearIdParam);
    setCategoryFilter(categoryIdParam);
  }, [searchParam, statusParam, standardIdParam, academicYearIdParam, categoryIdParam]);

  const { data, isLoading, isError } = useStudentsList({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam,
    status: statusParam,
    standardId: standardIdParam ? Number(standardIdParam) : undefined,
    academicYearId: academicYearIdParam ? Number(academicYearIdParam) : undefined,
    admissionCategoryId: categoryIdParam ? Number(categoryIdParam) : undefined,
  });

  const students = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('search', searchInput.trim());
    if (statusFilter) next.set('status', statusFilter);
    if (standardFilter) next.set('standardId', standardFilter);
    if (academicYearFilter) next.set('academicYearId', academicYearFilter);
    if (categoryFilter) next.set('admissionCategoryId', categoryFilter);
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Search, filter, and manage student records."
      >
        <RequirePermission permission="students:create">
          <Button asChild>
            <Link to="/students/new">
              <Plus className="size-4" />
              Add student
            </Link>
          </Button>
        </RequirePermission>
      </PageHeader>

      <form
        className="space-y-3 rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or admission number"
              className="pl-9"
            />
          </div>
          <Button type="submit">Apply</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Alumni">Alumni</option>
            <option value="Discontinued">Discontinued</option>
          </Select>
          <AcademicStandardSelect value={standardFilter} onChange={setStandardFilter} />
          <AcademicYearSelect value={academicYearFilter} onChange={setAcademicYearFilter} />
          <AdmissionCategorySelect value={categoryFilter} onChange={setCategoryFilter} />
        </div>
      </form>

      {isError && (
        <p className="text-sm text-destructive">Could not load students. Is the backend running?</p>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-14 px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Admission #</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Standard</th>
              <th className="px-4 py-3 font-medium">Roll #</th>
              <th className="px-4 py-3 font-medium">Admission date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading students…
                </td>
              </tr>
            )}

            {!isLoading && students.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No students found.
                </td>
              </tr>
            )}

            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-4 py-3">
                  <StudentInitialsAvatar
                    firstName={student.firstName}
                    lastName={student.lastName}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs">{student.admissionNumber}</td>
                <td className="px-4 py-3">{formatName(student.firstName, student.lastName)}</td>
                <td className="px-4 py-3">{student.currentEnrollment?.standard?.value ?? '—'}</td>
                <td className="px-4 py-3">{student.currentEnrollment?.rollNumber ?? '—'}</td>
                <td className="px-4 py-3">{formatDobDisplay(student.admissionDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/students/${student.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
