import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEnsureAttendanceSession, useHostelBlocks, useHostelDailyBoard } from '@/hooks/useHostel';

export function HostelAttendancePage() {
  const { t } = useTranslation('hostel');
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockId, setBlockId] = useState('');
  const blockFilter = blockId ? Number(blockId) : undefined;

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];
  const { data: board, isLoading } = useHostelDailyBoard(date, blockFilter);
  const ensureSession = useEnsureAttendanceSession();

  const openMark = async (period: 'morning' | 'evening') => {
    const session = await ensureSession.mutateAsync({
      attendanceDate: date,
      sessionPeriod: period,
      blockId: blockFilter,
    });
    navigate(`/hostel/attendance/${session.id}`);
  };

  const renderSlot = (period: 'morning' | 'evening', icon: React.ReactNode, label: string) => {
    const slot = board?.slots[period];
    const marked = slot?.markedCount ?? 0;
    const total = slot?.rosterCount ?? board?.rosterCount ?? 0;
    const complete = total > 0 && marked >= total;

    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h2 className="font-semibold">{label}</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? '…'
                : total === 0
                  ? t('attendance.noRoster')
                  : complete
                    ? t('attendance.slotComplete', { marked, total })
                    : slot?.hasSession
                      ? t('attendance.slotProgress', { marked, total })
                      : t('attendance.slotNotStarted', { total })}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={ensureSession.isPending || total === 0}
          onClick={() => void openMark(period)}
        >
          {slot?.hasSession ? t('attendance.continueMarking') : t('attendance.startMarking')}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('attendance.quickDescription')}</p>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <Label htmlFor="attendance-date">{t('attendance.date')}</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="attendance-block">{t('attendance.block')}</Label>
          <select
            id="attendance-block"
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {renderSlot('morning', <Sun className="size-5" />, t('attendance.morning'))}
        {renderSlot('evening', <Moon className="size-5" />, t('attendance.evening'))}
      </div>

      <p className="text-xs text-muted-foreground">{t('attendance.defaultPresentHint')}</p>
    </div>
  );
}
