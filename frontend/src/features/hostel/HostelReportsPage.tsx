import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHostelBlocks, useHostelDailyReport, useHostelOccupancyReport } from '@/hooks/useHostel';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function HostelReportsPage() {
  const { t } = useTranslation('hostel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockId, setBlockId] = useState('');
  const [appliedDate, setAppliedDate] = useState(date);
  const [appliedBlockId, setAppliedBlockId] = useState('');

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];

  const { data: daily, isLoading: dailyLoading } = useHostelDailyReport(
    appliedDate,
    appliedBlockId ? Number(appliedBlockId) : undefined,
  );
  const { data: occupancy, isLoading: occLoading } = useHostelOccupancyReport(
    appliedBlockId ? Number(appliedBlockId) : undefined,
  );

  return (
    <div className="space-y-8">
      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedDate(date);
          setAppliedBlockId(blockId);
        }}
      >
        <div>
          <Label>{t('reports.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>{t('reports.block')}</Label>
          <select
            className="flex h-10 min-w-[160px] rounded-md border bg-background px-3 text-sm"
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
          >
            <option value="">{t('attendance.allBlocks')}</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{t('reports.apply')}</Button>
      </form>

      <section className="space-y-4">
        <h2 className="font-medium">{t('reports.occupancyTitle')}</h2>
        {occLoading && <p className="text-sm text-muted-foreground">{t('reports.loading')}</p>}
        {occupancy && (
          <>
            <p className="text-sm text-muted-foreground">
              {t('reports.occupancySummary', {
                total: occupancy.summary.totalBeds,
                occupied: occupancy.summary.occupiedBeds,
                vacant: occupancy.summary.vacantBeds,
              })}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2">{t('reports.block')}</th>
                    <th className="px-3 py-2">{t('reports.totalBeds')}</th>
                    <th className="px-3 py-2">{t('reports.occupied')}</th>
                    <th className="px-3 py-2">{t('reports.vacant')}</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancy.blocks.map((b) => (
                    <tr key={b.blockId} className="border-t">
                      <td className="px-3 py-2">{b.blockName}</td>
                      <td className="px-3 py-2">{b.totalBeds}</td>
                      <td className="px-3 py-2">{b.occupiedBeds}</td>
                      <td className="px-3 py-2">{b.vacantBeds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">{t('reports.dailyTitle')}</h2>
        {dailyLoading && <p className="text-sm text-muted-foreground">{t('reports.loading')}</p>}
        {daily && !daily.hasSession && (
          <p className="text-sm text-muted-foreground">{t('reports.noSession')}</p>
        )}
        {daily && daily.hasSession && (
          <>
            <p className="text-sm">
              {t('reports.dailySummary', {
                present: daily.totals.present,
                absent: daily.totals.absent,
                notMarked: daily.totals.notMarked,
                roster: daily.totals.roster,
              })}
            </p>
            {daily.present.length > 0 && (
              <ReportTable title={t('reports.present')} rows={daily.present} t={t} />
            )}
            {daily.absent.length > 0 && (
              <ReportTable title={t('reports.absent')} rows={daily.absent} t={t} />
            )}
            {daily.notMarked.length > 0 && (
              <ReportTable title={t('reports.notMarked')} rows={daily.notMarked} t={t} />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ReportTable({
  title,
  rows,
  t,
}: {
  title: string;
  rows: Array<{
    admissionNumber: string;
    firstName: string;
    lastName: string | null;
    blockName: string;
    roomNumber: string;
    bedSlot: number | null;
    status: string | null;
  }>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">{t('attendance.columns.student')}</th>
              <th className="px-3 py-2">{t('allocations.columns.bed')}</th>
              <th className="px-3 py-2">{t('attendance.columns.room')}</th>
              <th className="px-3 py-2">{t('attendance.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.admissionNumber} className="border-t">
                <td className="px-3 py-2">
                  {formatName(row.firstName, row.lastName)}
                  <div className="text-xs text-muted-foreground">{row.admissionNumber}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.admissionNumber}</td>
                <td className="px-3 py-2">
                  {row.blockName} / {row.roomNumber}
                </td>
                <td className="px-3 py-2">{row.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
