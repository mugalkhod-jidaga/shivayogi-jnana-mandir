import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useCreateRemark, useStudentRemarks } from '@/hooks/useRemarks';
import type { RemarkSeverity } from '@/types/remark';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

type Props = {
  studentId: string;
};

export function StudentRemarksTab({ studentId }: Props) {
  const { t } = useTranslation('remarks');
  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const { data, isLoading } = useStudentRemarks(studentId);
  const createRemark = useCreateRemark(studentId);

  const [showForm, setShowForm] = useState(false);
  const [remarkTypeId, setRemarkTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<RemarkSeverity | ''>('');
  const [error, setError] = useState<string | null>(null);

  const remarks = data?.data ?? [];
  const selectedType = remarkTypes.find((t) => String(t.id) === remarkTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createRemark.mutateAsync({
        remarkTypeId: Number(remarkTypeId),
        categoryId: Number(categoryId),
        title,
        description,
        severity: selectedType?.value === 'Negative' && severity ? severity : undefined,
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setRemarkTypeId('');
      setCategoryId('');
      setSeverity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? t('actions.cancel') : t('actions.addRemark')}
        </Button>
      </div>

      {showForm && (
        <form className="space-y-4 rounded-lg border p-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('form.type')}</Label>
              <Select value={remarkTypeId} onChange={(e) => setRemarkTypeId(e.target.value)} required>
                <option value="">{t('form.selectType')}</option>
                {remarkTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.value}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t('form.category')}</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">{t('form.selectCategory')}</option>
                {remarkCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.value}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {selectedType?.value === 'Negative' && (
            <div>
              <Label>{t('form.severity')}</Label>
              <Select value={severity} onChange={(e) => setSeverity(e.target.value as RemarkSeverity)} required>
                <option value="">{t('form.selectSeverity')}</option>
                <option value="low">{t('severity.low')}</option>
                <option value="medium">{t('severity.medium')}</option>
                <option value="high">{t('severity.high')}</option>
              </Select>
            </div>
          )}
          <div>
            <Label>{t('form.title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={10} />
          </div>
          <div>
            <Label>{t('form.description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={createRemark.isPending}>
            {t('actions.saveRemark')}
          </Button>
        </form>
      )}

      {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}
      {!isLoading && remarks.length === 0 && (
        <p className="text-muted-foreground">{t('emptyStudent')}</p>
      )}
      <div className="space-y-3">
        {remarks.map((remark) => (
          <article key={remark.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{new Date(remark.createdAt).toLocaleString('en-IN')}</span>
              <span>·</span>
              <span>{remark.remarkType.value}</span>
              <span>·</span>
              <span>{remark.category.value}</span>
              {remark.severity && (
                <>
                  <span>·</span>
                  <span>{t(`severity.${remark.severity}`)}</span>
                </>
              )}
            </div>
            <h3 className="mt-2 font-medium">{remark.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{remark.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('byAuthor', {
                name: remark.createdBy.roleName
                  ? `${formatName(remark.createdBy.firstName, remark.createdBy.lastName)} (${remark.createdBy.roleName})`
                  : formatName(remark.createdBy.firstName, remark.createdBy.lastName),
              })}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
