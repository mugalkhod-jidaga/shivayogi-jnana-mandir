import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  useHostelAttendanceRecords,
  useHostelAttendanceSession,
  useHostelSessionRoster,
  useUpsertAttendanceRecords,
} from '@/hooks/useHostel';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { cn } from '@/lib/utils';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function HostelAttendanceMarkPage() {
  const { t } = useTranslation('hostel');
  const { sessionId } = useParams();
  const { hostelAttendanceStatuses } = usePhase2Lookups();
  const { data: session, isLoading: sessionLoading } = useHostelAttendanceSession(sessionId);
  const { data: roster, isLoading: rosterLoading } = useHostelSessionRoster(sessionId);
  const { data: existingRecords } = useHostelAttendanceRecords(sessionId);
  const upsert = useUpsertAttendanceRecords(sessionId ?? '');

  const [statusByStudent, setStatusByStudent] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [showChangedOnly, setShowChangedOnly] = useState(false);

  const presentStatusId = useMemo(
    () => hostelAttendanceStatuses.find((s) => s.value === 'Present')?.id,
    [hostelAttendanceStatuses],
  );

  useEffect(() => {
    if (!roster || !presentStatusId) return;
    const saved = new Map((existingRecords ?? []).map((r) => [r.studentId, r.status.id]));
    const next: Record<string, number> = {};
    for (const row of roster) {
      next[row.studentId] = saved.get(row.studentId) ?? presentStatusId;
    }
    setStatusByStudent(next);
  }, [roster, existingRecords, presentStatusId]);

  const filteredRoster = useMemo(() => {
    let rows = roster ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.admissionNumber.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          (r.lastName?.toLowerCase().includes(q) ?? false),
      );
    }
    if (showChangedOnly && presentStatusId) {
      rows = rows.filter((r) => statusByStudent[r.studentId] !== presentStatusId);
    }
    return rows;
  }, [roster, search, showChangedOnly, statusByStudent, presentStatusId]);

  if (!sessionId) return <Navigate to="/hostel/attendance" replace />;

  const isLoading = sessionLoading || rosterLoading;
  const periodLabel =
    session?.sessionPeriod === 'evening' ? t('attendance.evening') : t('attendance.morning');

  const handleSave = async () => {
    if (!roster || !presentStatusId) return;
    const records = roster.map((row) => ({
      studentId: row.studentId,
      statusId: statusByStudent[row.studentId] ?? presentStatusId,
    }));
    await upsert.mutateAsync(records);
  };

  const absentCount =
    presentStatusId != null
      ? (roster ?? []).filter((r) => statusByStudent[r.studentId] !== presentStatusId).length
      : 0;

  return (
    <div className="space-y-4">
      {session && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{session.attendanceDate}</span>
          <span>·</span>
          <span>{periodLabel}</span>
          <span>·</span>
          <span>{session.block?.name ?? t('attendance.allBlocks')}</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t('attendance.defaultPresentHint')}</p>

      {isLoading && <p className="text-sm text-muted-foreground">{t('attendance.loadingRoster')}</p>}

      {!isLoading && (roster?.length ?? 0) === 0 && (
        <div className="space-y-3 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('attendance.noRoster')}</p>
        </div>
      )}

      {!isLoading && (roster?.length ?? 0) > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="mark-search">{t('roster.search')}</Label>
              <Input
                id="mark-search"
                placeholder={t('roster.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={showChangedOnly}
                onChange={(e) => setShowChangedOnly(e.target.checked)}
              />
              {t('attendance.showChangedOnly')}
            </label>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('attendance.markSummary', {
              total: roster?.length ?? 0,
              absent: absentCount,
              showing: filteredRoster.length,
            })}
          </p>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3">{t('attendance.columns.student')}</th>
                  <th className="px-4 py-3">{t('attendance.columns.bed')}</th>
                  <th className="px-4 py-3">{t('attendance.columns.room')}</th>
                  <th className="px-4 py-3">{t('attendance.columns.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((row) => (
                  <tr
                    key={row.studentId}
                    className={cn(
                      'border-t',
                      presentStatusId &&
                        statusByStudent[row.studentId] !== presentStatusId &&
                        'bg-red-50/50 dark:bg-red-950/20',
                    )}
                  >
                    <td className="px-4 py-3">
                      {formatName(row.firstName, row.lastName)}
                      <div className="text-xs text-muted-foreground">{row.admissionNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.isAssigned ? (
                        row.bedLabel
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          {t('attendance.unassigned')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.isAssigned ? (
                        <>
                          {row.blockName} / {row.roomNumber}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Label className="sr-only">{t('attendance.columns.status')}</Label>
                      <Select
                        value={String(statusByStudent[row.studentId] ?? presentStatusId ?? '')}
                        onChange={(e) =>
                          setStatusByStudent((prev) => ({
                            ...prev,
                            [row.studentId]: Number(e.target.value),
                          }))
                        }
                      >
                        {hostelAttendanceStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.value}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={upsert.isPending || isLoading || (roster?.length ?? 0) === 0}
        >
          {t('attendance.saveAll', { count: roster?.length ?? 0 })}
        </Button>
        <Button asChild variant="outline">
          <Link to="/hostel/attendance">{t('actions.backToAttendance')}</Link>
        </Button>
      </div>
    </div>
  );
}
