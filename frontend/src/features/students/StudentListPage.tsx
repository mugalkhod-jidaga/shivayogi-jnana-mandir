import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { RequirePermission } from '@/components/RequirePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentInitialsAvatar } from '@/features/students/components/StudentInitialsAvatar';
import { useStudentsList } from '@/hooks/useStudents';
import { formatDobDisplay } from '@/lib/date';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function StudentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading, isError } = useStudentsList({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam,
  });

  const students = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applySearch = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('search', searchInput.trim());
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
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or admission number"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
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
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading students…
                </td>
              </tr>
            )}

            {!isLoading && students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
                <td className="px-4 py-3">{formatDobDisplay(student.dob)}</td>
                <td className="px-4 py-3">{student.gender}</td>
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
