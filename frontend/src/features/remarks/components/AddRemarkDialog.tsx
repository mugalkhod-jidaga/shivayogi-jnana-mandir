import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { StudentSearchPicker } from '@/components/students/StudentSearchPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useCreateRemark } from '@/hooks/useRemarks';
import { ApiError } from '@/lib/api';
import type { RemarkSeverity } from '@/types/remark';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddRemarkDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation('remarks');
  const { t: tc } = useTranslation();
  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const createRemark = useCreateRemark();

  const [studentId, setStudentId] = useState('');
  const [remarkTypeId, setRemarkTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<RemarkSeverity | ''>('');

  const selectedType = remarkTypes.find((type) => String(type.id) === remarkTypeId);
  const isNegative = selectedType?.value === 'Negative';

  const reset = () => {
    setStudentId('');
    setRemarkTypeId('');
    setCategoryId('');
    setTitle('');
    setDescription('');
    setSeverity('');
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      await createRemark.mutateAsync({
        studentId,
        input: {
          remarkTypeId: Number(remarkTypeId),
          categoryId: Number(categoryId),
          title,
          description,
          severity: isNegative && severity ? severity : undefined,
        },
      });
      reset();
      onOpenChange(false);
      toast.success(t('addDialog.success'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('errors.createFailed');
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('addDialog.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('addDialog.description')}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <StudentSearchPicker
            value={studentId}
            onChange={(id) => setStudentId(id)}
            label={t('addDialog.student')}
            placeholder={t('addDialog.studentPlaceholder')}
          />

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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" disabled={createRemark.isPending || !studentId}>
              {t('actions.saveRemark')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
