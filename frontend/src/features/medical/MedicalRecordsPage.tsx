import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useMedicalRecordsList } from '@/hooks/useMedical';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function MedicalRecordsPage() {
  const { t } = useTranslation('medical');
  const { t: tc } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeId, setTypeId] = useState('');
  const { medicalRecordTypes } = usePhase2Lookups();

  const { data, isLoading } = useMedicalRecordsList({
    page,
    search: search || undefined,
    typeId: typeId ? Number(typeId) : undefined,
  });

  const records = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader title={t('list.title')} description={t('list.description')} />

      <form
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
        }}
      >
        <Input
          placeholder={tc('actions.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">{t('list.allTypes')}</option>
          {medicalRecordTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.value}
            </option>
          ))}
        </Select>
        <Button type="submit">{tc('actions.apply')}</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">{t('list.columns.date')}</th>
              <th className="px-4 py-3">{t('list.columns.student')}</th>
              <th className="px-4 py-3">{t('list.columns.type')}</th>
              <th className="px-4 py-3">{t('list.columns.title')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t('loading')}
                </td>
              </tr>
            )}
            {!isLoading && records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t('list.empty')}
                </td>
              </tr>
            )}
            {records.map((record) => (
              <tr key={record.id} className="border-t">
                <td className="px-4 py-3">{record.recordedOn}</td>
                <td className="px-4 py-3">
                  <Link className="text-primary hover:underline" to={`/students/${record.student.id}?tab=medical`}>
                    {formatName(record.student.firstName, record.student.lastName)}
                  </Link>
                  <div className="text-xs text-muted-foreground">{record.student.admissionNumber}</div>
                </td>
                <td className="px-4 py-3">{record.recordType.value}</td>
                <td className="px-4 py-3">{record.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('list.pagination', { page: meta.page, totalPages, total: meta.total })}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
