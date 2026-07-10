import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { StudentSearchPicker } from '@/components/students/StudentSearchPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MedicineRowForm } from '@/features/health/components/MedicineRowForm';
import { PhotoCapture, emptyPendingPhotos } from '@/features/health/components/PhotoCapture';
import { StaffSearchPicker } from '@/features/health/components/StaffSearchPicker';
import { VisitHistoryPanel } from '@/features/health/components/VisitHistoryPanel';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import {
  useCreateHealthVisit,
  uploadPendingPhotos,
  useHealthVisit,
  useStudentHealthSummary,
  useStudentHealthVisits,
} from '@/hooks/useHealth';
import { useStudent } from '@/hooks/useStudent';
import { EMPTY_SCHEDULE, useHealthLookups } from '@/hooks/useHealthLookups';
import type { MedicineRowInput, PendingPhoto, StudentHealthStatus } from '@/types/health';
import type { StudentSummary } from '@/types/student';
import { HealthStatusBadge } from '@/features/health/components/HealthStatusBadge';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function defaultOutcomeForSeverity(code: string | undefined): StudentHealthStatus {
  return code === 'normal' ? 'recovering' : 'sick';
}

function emptyMedicine(): MedicineRowInput {
  return {
    medicineName: '',
    doseAmount: '1',
    doseUnitId: 0,
    foodTimingId: 0,
    schedule: EMPTY_SCHEDULE(),
    schedulePresetId: 0,
    medicineNotes: '',
  };
}

export function RecordVisitPage() {
  const { t } = useTranslation('health');
  const [searchParams] = useSearchParams();
  const presetStudentId = searchParams.get('studentId');
  const { data: presetStudent } = useStudent(presetStudentId ?? undefined);
  const { severities, issueTypes, doseUnits, foodTimings, schedulePresets, isLoading: lookupsLoading } =
    useHealthLookups();
  const createVisit = useCreateHealthVisit();

  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [presetApplied, setPresetApplied] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [customIssue, setCustomIssue] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [symptoms, setSymptoms] = useState('');
  const [severityId, setSeverityId] = useState('');
  const [healthStatus, setHealthStatus] = useState<StudentHealthStatus>('recovering');
  const [treatedBy, setTreatedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [showVitals, setShowVitals] = useState(false);
  const [medicines, setMedicines] = useState<MedicineRowInput[]>([emptyMedicine()]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>(emptyPendingPhotos());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: summaryData } = useStudentHealthSummary(studentId || undefined);
  const { data: historyData, isLoading: historyLoading } = useStudentHealthVisits(studentId || undefined, {
    limit: 10,
  });
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  useEffect(() => {
    if (presetStudent && !presetApplied) {
      setStudentId(presetStudent.id);
      setSelectedStudent(presetStudent);
      setPresetApplied(true);
    }
  }, [presetStudent, presetApplied]);

  const defaultSeverityId = severities.find((s) => s.code === 'normal')?.id;
  const defaultDoseUnitId = doseUnits.find((u) => u.code === 'tablet')?.id ?? doseUnits[0]?.id;
  const defaultFoodTimingId = foodTimings.find((f) => f.code === 'after_food')?.id ?? foodTimings[0]?.id;
  const defaultPresetId =
    schedulePresets.find((p) => p.code === 'twice_daily')?.id ?? schedulePresets[0]?.id;

  const resolvedSeverityId = Number(severityId || defaultSeverityId);
  const selectedSeverity = severities.find((s) => s.id === resolvedSeverityId);

  useEffect(() => {
    setHealthStatus(defaultOutcomeForSeverity(selectedSeverity?.code));
  }, [selectedSeverity?.code]);

  const handleStudentChange = (id: string, student: StudentSummary | null) => {
    setStudentId(id);
    setSelectedStudent(student);
    setSuccess(false);
  };

  const toggleIssue = (value: string) => {
    setSelectedIssues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const issueTypeValue = [...selectedIssues, customIssue.trim()].filter(Boolean).join(', ');
  const issueTypesList = [...selectedIssues, customIssue.trim()].filter(Boolean);

  const resetForm = () => {
    setStudentId('');
    setSelectedStudent(null);
    setSelectedIssues([]);
    setCustomIssue('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setSymptoms('');
    setSeverityId('');
    setHealthStatus('recovering');
    setTreatedBy('');
    setNotes('');
    setTemperature('');
    setBloodPressure('');
    setOxygenLevel('');
    setMedicines([
      {
        ...emptyMedicine(),
        doseUnitId: defaultDoseUnitId ?? 0,
        foodTimingId: defaultFoodTimingId ?? 0,
        schedulePresetId: defaultPresetId ?? 0,
      },
    ]);
    pendingPhotos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPendingPhotos(emptyPendingPhotos());
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError(t('record.errors.studentRequired'));
      return;
    }
    if (!issueTypeValue) {
      setError(t('record.errors.issueRequired'));
      return;
    }
    if (!symptoms.trim()) {
      setError(t('record.errors.symptomsRequired'));
      return;
    }

    if (!resolvedSeverityId) {
      setError(t('record.errors.severityRequired'));
      return;
    }

    try {
      setUploading(true);
      const attachments =
        pendingPhotos.length > 0 ? await uploadPendingPhotos(studentId, pendingPhotos) : undefined;

      await createVisit.mutateAsync({
        studentId,
        visitDate,
        issueType: issueTypeValue,
        symptoms: symptoms.trim(),
        severityId: resolvedSeverityId,
        healthStatus,
        treatedBy: treatedBy.trim() || undefined,
        notes: notes.trim() || undefined,
        temperature: temperature.trim() || undefined,
        bloodPressure: bloodPressure.trim() || undefined,
        oxygenLevel: oxygenLevel.trim() || undefined,
        attachments,
        medicines: medicines.map((m) => ({
          ...m,
          doseUnitId: m.doseUnitId || defaultDoseUnitId!,
          foodTimingId: m.foodTimingId || defaultFoodTimingId!,
          schedulePresetId: m.schedulePresetId || defaultPresetId!,
        })),
      });
      pendingPhotos.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      setPendingPhotos(emptyPendingPhotos());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('record.errors.saveFailed'));
    } finally {
      setUploading(false);
    }
  };

  if (lookupsLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <ModuleSectionCard title={t('record.successTitle')} description={t('record.successDescription')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={resetForm}>
              {t('record.recordAnother')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/health/visits">{t('record.viewRecent')}</Link>
            </Button>
          </div>
        </ModuleSectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-sm text-muted-foreground">{t('record.description')}</p>

      <form className="space-y-8" onSubmit={(e) => void handleSubmit(e)}>
        <section className="space-y-4 rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50/30 to-transparent p-4 dark:border-teal-900/30 dark:from-teal-950/15">
          <h2 className="font-semibold">{t('record.sections.findStudent')}</h2>
          <StudentSearchPicker
            value={studentId}
            onChange={handleStudentChange}
            label={t('record.studentSearch')}
          />

          {selectedStudent && (
            <div className="rounded-md bg-muted/50 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{formatName(selectedStudent.firstName, selectedStudent.lastName)}</p>
                <HealthStatusBadge status={selectedStudent.healthStatus} />
              </div>
              <p className="text-muted-foreground">
                {selectedStudent.admissionNumber}
                {selectedStudent.currentEnrollment?.standard?.value &&
                  ` · ${t('record.class')} ${selectedStudent.currentEnrollment.standard.value}`}
                {selectedStudent.bloodGroup?.value && ` · ${selectedStudent.bloodGroup.value}`}
              </p>
            </div>
          )}

          {studentId && (
            <VisitHistoryPanel
              summary={summaryData}
              visits={historyData?.data ?? []}
              loading={historyLoading}
              onVisitClick={setSelectedVisitId}
            />
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t('record.sections.visitDetails')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('record.visitDate')}</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
            </div>
            <div>
              <Label>{t('record.severity')}</Label>
              <Select
                value={severityId || String(defaultSeverityId ?? '')}
                onChange={(e) => setSeverityId(e.target.value)}
                required
              >
                {severities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.value}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>{t('record.healthOutcome')}</Label>
              <Select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as StudentHealthStatus)}
                required
              >
                <option value="sick">{t('record.healthOutcomeOptions.sick')}</option>
                <option value="recovering">{t('record.healthOutcomeOptions.recovering')}</option>
                <option value="healthy">{t('record.healthOutcomeOptions.healthy')}</option>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{t('record.healthOutcomeHelp')}</p>
            </div>
          </div>

          <div>
            <Label>{t('record.issueType')}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {issueTypes.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    selectedIssues.includes(issue.value)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  onClick={() => toggleIssue(issue.value)}
                >
                  {issue.value}
                </button>
              ))}
            </div>
            <Input
              className="mt-2"
              placeholder={t('record.customIssue')}
              value={customIssue}
              onChange={(e) => setCustomIssue(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('record.symptoms')}</Label>
            <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required rows={3} />
          </div>

          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setShowVitals((v) => !v)}
          >
            {showVitals ? t('record.hideVitals') : t('record.showVitals')}
          </button>

          {showVitals && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>{t('record.temperature')}</Label>
                <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="101°F" />
              </div>
              <div>
                <Label>{t('record.bloodPressure')}</Label>
                <Input value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="120/80" />
              </div>
              <div>
                <Label>{t('record.oxygenLevel')}</Label>
                <Input value={oxygenLevel} onChange={(e) => setOxygenLevel(e.target.value)} placeholder="98%" />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t('record.sections.treatment')}</h2>
          {medicines.map((med, index) => (
            <MedicineRowForm
              key={index}
              index={index}
              medicine={med}
              issueTypes={issueTypesList}
              canRemove={medicines.length > 1}
              doseUnits={doseUnits}
              foodTimings={foodTimings}
              schedulePresets={schedulePresets}
              onChange={(next) =>
                setMedicines((prev) => prev.map((row, i) => (i === index ? next : row)))
              }
              onRemove={() => setMedicines((prev) => prev.filter((_, i) => i !== index))}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setMedicines((prev) => [
                ...prev,
                {
                  ...emptyMedicine(),
                  doseUnitId: defaultDoseUnitId ?? 0,
                  foodTimingId: defaultFoodTimingId ?? 0,
                  schedulePresetId: defaultPresetId ?? 0,
                },
              ])
            }
          >
            {t('record.addMedicine')}
          </Button>

          <StaffSearchPicker value={treatedBy} onChange={setTreatedBy} />
          <div>
            <Label>{t('record.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">{t('record.sections.photos')}</h2>
          <PhotoCapture
            photos={pendingPhotos}
            onChange={setPendingPhotos}
            disabled={!studentId || uploading || createVisit.isPending}
          />
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={createVisit.isPending || uploading}
        >
          {uploading || createVisit.isPending ? t('record.saving') : t('record.saveVisit')}
        </Button>
      </form>

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
