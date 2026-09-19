import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HostelProgressRing } from '@/features/hostel/components/HostelProgressRing';
import { HostelSectionCard } from '@/features/hostel/components/HostelSectionCard';
import { useEnsureAttendanceSession, useHostelBlocks, useHostelDailyBoard } from '@/hooks/useHostel';
import { useLookups } from '@/hooks/useLookups';
import { cn } from '@/lib/utils';

export function HostelAttendancePage() {
  const { t } = useTranslation('hostel');
  const navigate = useNavigate();
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [blockId, setBlockId]     = useState('');
  const [standardId, setStandardId] = useState('');
  const [sectionId, setSectionId]   = useState('');

  const blockFilter    = blockId    ? Number(blockId)    : undefined;
  const standardFilter = standardId ? Number(standardId) : undefined;
  const sectionFilter  = sectionId  ? Number(sectionId)  : undefined;

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];
  const { academicStandards, sections } = useLookups();
  const activeSections = sections.filter((s) => s.isActive);

  const { data: board, isLoading } = useHostelDailyBoard(date, blockFilter, standardFilter, sectionFilter);
  const ensureSession = useEnsureAttendanceSession();

  const openMark = async (period: 'morning' | 'evening') => {
    const session = await ensureSession.mutateAsync({
      attendanceDate: date,
      sessionPeriod:  period,
      blockId:    blockFilter,
      standardId: standardFilter,
      sectionId:  sectionFilter,
    });
    navigate(`/hostel/attendance/${session.id}`);
  };

  const renderSlot = (
    period: 'morning' | 'evening',
    icon: React.ReactNode,
    label: string,
    gradient: string,
    ringColor: string,
  ) => {
    const slot = board?.slots[period];
    const marked = slot?.markedCount ?? 0;
    const total = slot?.rosterCount ?? board?.rosterCount ?? 0;
    const complete = total > 0 && marked >= total;

    return (
      <div
        className={cn(
          'relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 shadow-md',
          gradient,
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-white/15 blur-xl" />
        <div className="relative flex items-center gap-4">
          <HostelProgressRing
            value={marked}
            max={total || 1}
            indicatorClassName={ringColor}
            label={total > 0 ? `${marked}/${total}` : '—'}
          />
          <div className="min-w-0 flex-1 text-white">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                {icon}
              </span>
              <h2 className="text-lg font-bold">{label}</h2>
            </div>
            <p className="mt-2 text-sm text-white/90">
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
          variant="secondary"
          className="relative w-full bg-white font-semibold text-foreground shadow hover:bg-white/95"
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
      <HostelSectionCard
        title={t('attendance.title')}
        description={t('attendance.quickDescription')}
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow">
            <Sun className="size-5" />
          </div>
        }
        headerClassName="border-orange-200/40"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="attendance-date">{t('attendance.date')}</Label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-orange-200/50 focus-visible:ring-orange-400"
            />
          </div>
          <div>
            <Label htmlFor="attendance-block">{t('attendance.block')}</Label>
            <select
              id="attendance-block"
              className="flex h-10 min-w-[160px] rounded-md border border-orange-200/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
            >
              <option value="">{t('attendance.allBlocks')}</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="attendance-standard">{t('attendance.standard')}</Label>
            <select
              id="attendance-standard"
              className="flex h-10 min-w-[130px] rounded-md border border-orange-200/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={standardId}
              onChange={(e) => { setStandardId(e.target.value); setSectionId(''); }}
            >
              <option value="">{t('attendance.allStandards')}</option>
              {academicStandards.map((s) => (
                <option key={s.id} value={s.id}>{s.value}</option>
              ))}
            </select>
          </div>
          {activeSections.length > 0 && (
            <div>
              <Label htmlFor="attendance-section">{t('attendance.section')}</Label>
              <select
                id="attendance-section"
                className="flex h-10 min-w-[110px] rounded-md border border-orange-200/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">{t('attendance.allSections')}</option>
                {activeSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.value}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </HostelSectionCard>

      <div className="grid gap-5 md:grid-cols-2">
        {renderSlot(
          'morning',
          <Sun className="size-5" />,
          t('attendance.morning'),
          'border-amber-300/50 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600',
          'text-amber-200',
        )}
        {renderSlot(
          'evening',
          <Moon className="size-5" />,
          t('attendance.evening'),
          'border-indigo-300/50 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
          'text-violet-200',
        )}
      </div>

      <p className="rounded-lg border border-dashed border-orange-200/60 bg-orange-50/50 px-4 py-3 text-center text-xs text-muted-foreground dark:border-orange-900/40 dark:bg-orange-950/20">
        {t('attendance.defaultPresentHint')}
      </p>
    </div>
  );
}
