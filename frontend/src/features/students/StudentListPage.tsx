import { Plus, Search, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SocialCategorySelect } from '@/components/lookups/SocialCategorySelect';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { AcademicYearSelect } from '@/components/lookups/AcademicYearSelect';
import { RequirePermission } from '@/components/RequirePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StudentInitialsAvatar } from '@/features/students/components/StudentInitialsAvatar';
import { useStudentsList } from '@/hooks/useStudents';
import { formatDobDisplay } from '@/lib/date';
import { pdfExports } from '@/lib/pdfDownload';
import type { StudentStatus } from '@/types/student';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function StudentListPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const statusParam = (searchParams.get('status') as StudentStatus | null) ?? undefined;
  const standardIdParam = searchParams.get('standardId') ?? '';
  const academicYearIdParam = searchParams.get('academicYearId') ?? '';
  const socialCategoryIdParam = searchParams.get('socialCategoryId') ?? '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState(statusParam ?? '');
  const [standardFilter, setStandardFilter] = useState(standardIdParam);
  const [academicYearFilter, setAcademicYearFilter] = useState(academicYearIdParam);
  const [socialCategoryFilter, setSocialCategoryFilter] = useState(socialCategoryIdParam);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setSearchInput(searchParam);
    setStatusFilter(statusParam ?? '');
    setStandardFilter(standardIdParam);
    setAcademicYearFilter(academicYearIdParam);
    setSocialCategoryFilter(socialCategoryIdParam);
  }, [searchParam, statusParam, standardIdParam, academicYearIdParam, socialCategoryIdParam]);

  const { data, isLoading, isError } = useStudentsList({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam,
    status: statusParam,
    standardId: standardIdParam ? Number(standardIdParam) : undefined,
    academicYearId: academicYearIdParam ? Number(academicYearIdParam) : undefined,
    socialCategoryId: socialCategoryIdParam ? Number(socialCategoryIdParam) : undefined,
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
    if (socialCategoryFilter) next.set('socialCategoryId', socialCategoryFilter);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('list.description')}</p>
        <div className="flex gap-2">
          <RequirePermission permission="exports:pdf">
            <Button
              type="button"
              variant="outline"
              disabled={pdfLoading}
              className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
              onClick={() => {
                setPdfLoading(true);
                void pdfExports
                  .students({
                    search: searchParam || undefined,
                    status: statusParam,
                    standardId: standardIdParam || undefined,
                    academicYearId: academicYearIdParam || undefined,
                    socialCategoryId: socialCategoryIdParam || undefined,
                  })
                  .finally(() => setPdfLoading(false));
              }}
            >
              <Download className="size-4" />
              PDF
            </Button>
          </RequirePermission>
          <RequirePermission permission="students:create">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/students/new">
                <Plus className="size-4" />
                {t('list.addStudent')}
              </Link>
            </Button>
          </RequirePermission>
        </div>
      </div>

      <form
        className="space-y-3 rounded-xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/40 via-transparent to-sky-50/40 p-4 shadow-sm dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-sky-950/15"
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
              placeholder={t('list.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <Button type="submit">{tc('actions.apply')}</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">{t('list.allStatuses')}</option>
            <option value="Active">{tc('status.active')}</option>
            <option value="Alumni">{tc('status.alumni')}</option>
            <option value="Discontinued">{tc('status.discontinued')}</option>
          </Select>
          <AcademicStandardSelect value={standardFilter} onChange={setStandardFilter} />
          <AcademicYearSelect value={academicYearFilter} onChange={setAcademicYearFilter} />
          <SocialCategorySelect
            value={socialCategoryFilter}
            onChange={setSocialCategoryFilter}
            placeholder={t('list.allSocialCategories')}
          />
        </div>
      </form>

      {isError && <p className="text-sm text-destructive">{tc('errors.loadStudents')}</p>}

      <div className="overflow-x-auto rounded-xl border border-indigo-100 shadow-sm dark:border-indigo-900/30">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gradient-to-r from-indigo-50/80 to-sky-50/60 text-left dark:from-indigo-950/40 dark:to-sky-950/20">
            <tr>
              <th className="w-14 px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">{t('list.columns.admissionNumber')}</th>
              <th className="px-4 py-3 font-medium">{t('list.columns.name')}</th>
              <th className="px-4 py-3 font-medium">{t('list.columns.standard')}</th>
              <th className="px-4 py-3 font-medium">{t('list.columns.socialCategory')}</th>
              <th className="px-4 py-3 font-medium">{t('list.columns.admissionDate')}</th>
              <th className="px-4 py-3 font-medium">{t('list.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {t('list.loading')}
                </td>
              </tr>
            )}

            {!isLoading && students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {t('list.noResults')}
                </td>
              </tr>
            )}

            {students.map((student) => (
              <tr
                key={student.id}
                className="cursor-pointer border-t transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                onClick={() =>
                  navigate(`/students/${student.id}`, {
                    state: { from: `${location.pathname}${location.search}` },
                  })
                }
              >
                <td className="px-4 py-3">
                  <StudentInitialsAvatar
                    firstName={student.firstName}
                    lastName={student.lastName}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs">{student.admissionNumber}</td>
                <td className="px-4 py-3">{formatName(student.firstName, student.lastName)}</td>
                <td className="px-4 py-3">{student.currentEnrollment?.standard?.value ?? '—'}</td>
                <td className="px-4 py-3">{student.socialCategory?.value ?? '—'}</td>
                <td className="px-4 py-3">{formatDobDisplay(student.admissionDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={student.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {t('list.pageOf', {
              page: meta.page,
              totalPages,
              total: meta.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
