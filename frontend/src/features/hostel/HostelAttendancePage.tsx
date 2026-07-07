import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateAttendanceSession,
  useHostelAttendanceSessions,
  useHostelBlocks,
} from '@/hooks/useHostel';

export function HostelAttendancePage() {
  const { t } = useTranslation('hostel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockId, setBlockId] = useState('');
  const [notes, setNotes] = useState('');
  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];
  const { data, isLoading } = useHostelAttendanceSessions({ attendanceDate: date });
  const createSession = useCreateAttendanceSession();
  const sessions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          void createSession.mutateAsync({
            attendanceDate: date,
            blockId: blockId ? Number(blockId) : undefined,
            notes: notes || undefined,
          });
        }}
      >
        <div>
          <Label>{t('attendance.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>{t('attendance.block')}</Label>
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
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
        <div className="md:col-span-2">
          <Label>{t('attendance.notes')}</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={createSession.isPending}>
            {t('attendance.createSession')}
          </Button>
        </div>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('attendance.loading')}</p>}
      <ul className="space-y-2">
        {sessions.map((session) => (
          <li key={session.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{session.attendanceDate}</p>
              <p className="text-sm text-muted-foreground">
                {session.block?.name ?? t('attendance.allBlocks')} ·{' '}
                {[session.takenBy.firstName, session.takenBy.lastName].filter(Boolean).join(' ')}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/hostel/attendance/${session.id}`}>{t('attendance.mark')}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
