import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useUpdateRemark } from '@/hooks/useRemarks';
import { ApiError } from '@/lib/api';
import type { RemarkSeverity, RemarkSummary } from '@/types/remark';

type Props = {
  open: boolean;
  remark: RemarkSummary | null;
  onOpenChange: (open: boolean) => void;
};

export function EditRemarkDialog({ open, remark, onOpenChange }: Props) {
  const { t } = useTranslation('remarks');
  const { t: tc } = useTranslation();
  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const updateRemark = useUpdateRemark();

  const [remarkTypeId, setRemarkTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<RemarkSeverity | ''>('');

  useEffect(() => {
    if (!remark) return;
    setRemarkTypeId(String(remark.remarkType.id));
    setCategoryId(String(remark.category.id));
    setTitle(remark.title);
    setDescription(remark.description);
    setSeverity(remark.severity ?? '');
  }, [remark]);

  const selectedType = remarkTypes.find((type) => String(type.id) === remarkTypeId);
  const isNegative = selectedType?.value === 'Negative';

  if (!open || !remark) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRemark.mutateAsync({
        id: remark.id,
        input: {
          remarkTypeId: Number(remarkTypeId),
          categoryId: Number(categoryId),
          title,
          description,
          severity: isNegative ? severity || null : null,
        },
      });
      onOpenChange(false);
      toast.success(t('editDialog.success'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('errors.updateFailed');
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('editDialog.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('editDialog.description')}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          {isNegative && (
            <div className="space-y-2">
              <Label>{t('form.severity')}</Label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RemarkSeverity)}
                required
              >
                <option value="">{t('form.selectSeverity')}</option>
                <option value="low">{t('severity.low')}</option>
                <option value="medium">{t('severity.medium')}</option>
                <option value="high">{t('severity.high')}</option>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('form.title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={10} />
          </div>

          <div className="space-y-2">
            <Label>{t('form.description')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" disabled={updateRemark.isPending}>
              {t('actions.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
