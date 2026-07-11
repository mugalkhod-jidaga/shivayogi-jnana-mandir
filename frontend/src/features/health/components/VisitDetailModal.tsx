import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PhotoGallery } from '@/features/health/components/PhotoGallery';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import type { HealthVisit } from '@/types/health';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border-b py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function formatSchedule(visit: HealthVisit['medicines'][0]) {
  const slots: string[] = [];
  if (visit.schedule.morning) slots.push('Morning');
  if (visit.schedule.noon) slots.push('Noon');
  if (visit.schedule.evening) slots.push('Evening');
  if (visit.schedule.night) slots.push('Night');
  return slots.length ? slots.join(', ') : visit.schedulePreset.value;
}

type Props = {
  visit: HealthVisit | null;
  open: boolean;
  onClose: () => void;
};

export function VisitDetailModal({ visit, open, onClose }: Props) {
  const { t } = useTranslation('health');
  const location = useLocation();
  const profileLinkState = { from: `${location.pathname}${location.search}` };

  if (!open || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <Link
              to={`/health/students/${visit.studentId}`}
              state={profileLinkState}
              onClick={onClose}
              className="text-lg font-semibold text-primary hover:underline"
            >
              {formatStudentName(visit)}
            </Link>
            <p className="text-sm text-muted-foreground">{visit.student.admissionNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('visitDetail.close')}
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          <dl>
            <DetailRow label={t('record.visitDate')} value={visit.visitDate} />
            <DetailRow label={t('record.issueType')} value={visit.issueType} />
            <DetailRow label={t('record.symptoms')} value={visit.symptoms} />
          </dl>

          {visit.medicines.length > 0 && (
            <div className="my-4 space-y-3">
              {visit.medicines.map((med, index) => (
                <div key={med.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                  {visit.medicines.length > 1 && (
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      {t('record.medicineNumber', { number: index + 1 })}
                    </p>
                  )}
                  <DetailRow label={t('record.medicineName')} value={med.medicineName} />
                  <DetailRow
                    label={t('record.doseAmount')}
                    value={med.treatmentDoses ?? `${med.doseAmount} ${med.doseUnit.value}`}
                  />
                  <DetailRow label={t('record.schedulePreset')} value={formatSchedule(med)} />
                  <DetailRow label={t('record.foodTiming')} value={med.foodTiming.value} />
                  <DetailRow label={t('record.medicineNotes')} value={med.medicineNotes} />
                </div>
              ))}
            </div>
          )}

          {visit.attachments?.length > 0 && (
            <div className="my-4">
              <PhotoGallery attachments={visit.attachments} />
            </div>
          )}

          <dl>
            <DetailRow label={t('record.treatedBy')} value={visit.treatedBy} />
            <DetailRow label={t('record.temperature')} value={visit.temperature} />
            {/* Blood pressure temporarily hidden
            <DetailRow label={t('record.bloodPressure')} value={visit.bloodPressure} />
            */}
            <DetailRow label={t('record.oxygenLevel')} value={visit.oxygenLevel} />
            <DetailRow label={t('record.notes')} value={visit.notes} />
          </dl>

          <Link
            to={`/health/students/${visit.studentId}`}
            state={profileLinkState}
            onClick={onClose}
            className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
          >
            {t('visitDetail.viewProfile')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
