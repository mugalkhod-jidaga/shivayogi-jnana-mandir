import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  useHostelAttendanceRecords,
  useHostelAttendanceSession,
  useRoomAllocations,
  useUpsertAttendanceRecords,
} from '@/hooks/useHostel';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function HostelAttendanceMarkPage() {
  const { t } = useTranslation('hostel');
  const { sessionId } = useParams();
  const { hostelAttendanceStatuses } = usePhase2Lookups();
  const { data: session } = useHostelAttendanceSession(sessionId);
  const blockId = session?.blockId ?? undefined;
  const { data: allocationsData } = useRoomAllocations({
    activeOnly: true,
    page: 1,
    limit: 500,
    blockId,
  });
  const allocations = useMemo(() => allocationsData?.data ?? [], [allocationsData?.data]);
  const { data: existingRecords } = useHostelAttendanceRecords(sessionId);
  const upsert = useUpsertAttendanceRecords(sessionId ?? '');

  const [statusByStudent, setStatusByStudent] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!existingRecords) return;
    const next: Record<string, number> = {};
    for (const record of existingRecords) {
      next[record.studentId] = record.status.id;
    }
    setStatusByStudent(next);
  }, [existingRecords]);

  if (!sessionId) return <Navigate to="/hostel/attendance" replace />;

  const defaultStatusId = hostelAttendanceStatuses[0]?.id;

  const handleSave = async () => {
    const records = allocations.map((alloc) => ({
      studentId: alloc.studentId,
      statusId: statusByStudent[alloc.studentId] ?? defaultStatusId,
    }));
    await upsert.mutateAsync(records.filter((r) => r.statusId));
  };

  return (
    <div className="space-y-6">
      {session && (
        <p className="text-sm text-muted-foreground">
          {session.attendanceDate} · {session.block?.name ?? t('attendance.allBlocks')}
        </p>
      )}

      {allocations.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('attendance.emptyRoster')}</p>
      )}

      {allocations.length > 0 && (
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
              {allocations.map((alloc) => (
                <tr key={alloc.id} className="border-t">
                  <td className="px-4 py-3">
                    {formatName(alloc.student.firstName, alloc.student.lastName)}
                    <div className="text-xs text-muted-foreground">{alloc.student.admissionNumber}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {alloc.bed?.bedLabel ?? alloc.student.admissionNumber}
                  </td>
                  <td className="px-4 py-3">
                    {alloc.room.block.name} / {alloc.room.roomNumber}
                  </td>
                  <td className="px-4 py-3">
                    <Label className="sr-only">{t('attendance.columns.status')}</Label>
                    <Select
                      value={String(statusByStudent[alloc.studentId] ?? defaultStatusId ?? '')}
                      onChange={(e) =>
                        setStatusByStudent((prev) => ({
                          ...prev,
                          [alloc.studentId]: Number(e.target.value),
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
      )}

      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={upsert.isPending || allocations.length === 0}
      >
        {t('attendance.save')}
      </Button>
    </div>
  );
}
