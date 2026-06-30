import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAttendanceSession, useHostelAttendanceSessions } from '@/hooks/useHostel';

export function HostelAttendancePage() {
  const { t } = useTranslation('hostel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const { data, isLoading } = useHostelAttendanceSessions({ attendanceDate: date });
  const createSession = useCreateAttendanceSession();
  const sessions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t('attendance.title')} description={t('attendance.description')}>
        <Button asChild variant="outline">
          <Link to="/hostel">{t('actions.backToHostel')}</Link>
        </Button>
      </PageHeader>

      <form
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void createSession.mutateAsync({ attendanceDate: date, notes: notes || undefined });
        }}
      >
        <div>
          <Label>{t('attendance.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
