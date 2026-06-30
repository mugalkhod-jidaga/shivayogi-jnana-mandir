import { Check, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMe } from '@/hooks/useMe';
import { usePermissions } from '@/hooks/usePermissions';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useCreateRemark, useStudentRemarks, useUpdateRemark } from '@/hooks/useRemarks';
import type { RemarkSeverity, RemarkSummary } from '@/types/remark';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function canEditRemark(remark: RemarkSummary, profileId: string | undefined, canManage: boolean) {
  if (canManage) return true;
  if (!profileId || remark.createdBy.id !== profileId) return false;
  const created = new Date(remark.createdAt).getTime();
  return Date.now() - created <= 24 * 60 * 60 * 1000;
}

type Props = {
  studentId: string;
};

export function StudentRemarksTab({ studentId }: Props) {
  const { t } = useTranslation('remarks');
  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const { data: me } = useMe();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('remarks:manage');
  const { data, isLoading } = useStudentRemarks(studentId);
  const createRemark = useCreateRemark(studentId);
  const updateRemark = useUpdateRemark();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remarkTypeId, setRemarkTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<RemarkSeverity | ''>('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remarks = data?.data ?? [];
  const selectedType = remarkTypes.find((type) => String(type.id) === remarkTypeId);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRemarkTypeId('');
    setCategoryId('');
    setSeverity('');
    setFollowUpNote('');
    setEditingId(null);
    setError(null);
  };

  const startEdit = (remark: RemarkSummary) => {
    setEditingId(remark.id);
    setRemarkTypeId(String(remark.remarkType.id));
    setCategoryId(String(remark.category.id));
    setTitle(remark.title);
    setDescription(remark.description);
    setSeverity(remark.severity ?? '');
    setFollowUpNote(remark.followUpNote ?? '');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateRemark.mutateAsync({
          id: editingId,
          input: {
            title,
            description,
            severity: selectedType?.value === 'Negative' ? severity || null : null,
            followUpNote: followUpNote || undefined,
          },
        });
        resetForm();
        return;
      }

      await createRemark.mutateAsync({
        remarkTypeId: Number(remarkTypeId),
        categoryId: Number(categoryId),
        title,
        description,
        severity: selectedType?.value === 'Negative' && severity ? severity : undefined,
      });
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'));
    }
  };

  const handleResolve = async (remark: RemarkSummary) => {
    await updateRemark.mutateAsync({
      id: remark.id,
      input: { resolved: !remark.resolvedAt },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {editingId && (
          <Button type="button" variant="outline" onClick={resetForm}>
            {t('actions.cancelEdit')}
          </Button>
        )}
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
        >
          {showForm ? t('actions.cancel') : t('actions.addRemark')}
        </Button>
      </div>

      {(showForm || editingId) && (
        <form className="space-y-4 rounded-lg border p-4" onSubmit={(e) => void handleSubmit(e)}>
          {!editingId && (
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
          )}
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
          {editingId && (
            <div>
              <Label>{t('form.followUpNote')}</Label>
              <Textarea value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={createRemark.isPending || updateRemark.isPending}>
            {editingId ? t('actions.saveChanges') : t('actions.saveRemark')}
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
            <div className="flex flex-wrap items-start justify-between gap-2">
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
                {remark.resolvedAt && (
                  <>
                    <span>·</span>
                    <span className="text-green-700">{t('resolved')}</span>
                  </>
                )}
              </div>
              <div className="flex gap-1">
                {canEditRemark(remark, me?.id, canManage) && hasPermission('remarks:edit') && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(remark)}>
                    <Pencil className="size-4" />
                    {t('actions.edit')}
                  </Button>
                )}
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleResolve(remark)}
                    disabled={updateRemark.isPending}
                  >
                    <Check className="size-4" />
                    {remark.resolvedAt ? t('actions.reopen') : t('actions.resolve')}
                  </Button>
                )}
              </div>
            </div>
            <h3 className="mt-2 font-medium">{remark.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{remark.description}</p>
            {remark.followUpNote && (
              <p className="mt-2 text-sm">
                <span className="font-medium">{t('form.followUpNote')}: </span>
                {remark.followUpNote}
              </p>
            )}
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
