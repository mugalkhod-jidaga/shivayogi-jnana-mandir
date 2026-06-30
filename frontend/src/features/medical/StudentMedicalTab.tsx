import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMedicalRecord, useStudentMedicalRecords } from '@/hooks/useMedical';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';

type Props = {
  studentId: string;
};

export function StudentMedicalTab({ studentId }: Props) {
  const { t } = useTranslation('medical');
  const { medicalRecordTypes } = usePhase2Lookups();
  const { data, isLoading } = useStudentMedicalRecords(studentId);
  const createRecord = useCreateMedicalRecord(studentId);

  const [showForm, setShowForm] = useState(false);
  const [recordTypeId, setRecordTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordedOn, setRecordedOn] = useState(new Date().toISOString().slice(0, 10));
  const [isOngoing, setIsOngoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const records = data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createRecord.mutateAsync({
        recordTypeId: Number(recordTypeId),
        title,
        description,
        recordedOn,
        isOngoing,
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setRecordTypeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? t('actions.cancel') : t('actions.addRecord')}
        </Button>
      </div>

      {showForm && (
        <form className="space-y-4 rounded-lg border p-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('form.type')}</Label>
              <Select value={recordTypeId} onChange={(e) => setRecordTypeId(e.target.value)} required>
                <option value="">{t('form.selectType')}</option>
                {medicalRecordTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.value}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t('form.recordedOn')}</Label>
              <Input type="date" value={recordedOn} onChange={(e) => setRecordedOn(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>{t('form.title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
          </div>
          <div>
            <Label>{t('form.description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={3} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} />
            {t('form.isOngoing')}
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={createRecord.isPending}>
            {t('actions.saveRecord')}
          </Button>
        </form>
      )}

      {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}
      {!isLoading && records.length === 0 && <p className="text-muted-foreground">{t('empty')}</p>}

      <div className="space-y-3">
        {records.map((record) => (
          <article key={record.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{record.recordedOn}</span>
              <span>·</span>
              <span>{record.recordType.value}</span>
              {record.isOngoing && (
                <>
                  <span>·</span>
                  <span>{t('ongoing')}</span>
                </>
              )}
            </div>
            <h3 className="mt-2 font-medium">{record.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{record.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
