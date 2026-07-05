import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import { useRecentHealthVisits } from '@/hooks/useHealth';

export function RecentVisitsPage() {
  const { t } = useTranslation('health');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const { data: visits, isLoading } = useRecentHealthVisits(appliedSearch || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t('recent.title')} description={t('recent.description')} />
        <Button asChild>
          <Link to="/health/record-visit">{t('recent.recordVisit')}</Link>
        </Button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(search);
        }}
      >
        <Input
          placeholder={t('recent.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit">{t('recent.search')}</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}

      {!isLoading && (visits ?? []).length === 0 && (
        <p className="text-muted-foreground">{t('recent.empty')}</p>
      )}

      <div className="space-y-3">
        {(visits ?? []).map((visit) => (
          <article key={visit.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{formatStudentName(visit)}</span>
              <span className="text-sm text-muted-foreground">{visit.student.admissionNumber}</span>
              <span className="text-sm text-muted-foreground">· {visit.visitDate}</span>
              <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
            </div>
            <p className="mt-1 text-sm font-medium">{visit.issueType}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{visit.symptoms}</p>
            {visit.medicines.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {visit.medicines.map((m) => m.medicineName).join(', ')}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
