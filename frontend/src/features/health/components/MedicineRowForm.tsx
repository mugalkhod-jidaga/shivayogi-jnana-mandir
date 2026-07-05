import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { EMPTY_SCHEDULE, presetSchedule } from '@/hooks/useHealthLookups';
import type { DoseUnitOption } from '@/types/health';
import type { HealthLookupOption } from '@/types/health';
import type { MedicineRowInput } from '@/types/health';

type Props = {
  index: number;
  medicine: MedicineRowInput;
  canRemove: boolean;
  doseUnits: DoseUnitOption[];
  foodTimings: (HealthLookupOption & { code: string })[];
  schedulePresets: (HealthLookupOption & { code: string })[];
  onChange: (medicine: MedicineRowInput) => void;
  onRemove: () => void;
};

export function MedicineRowForm({
  index,
  medicine,
  canRemove,
  doseUnits,
  foodTimings,
  schedulePresets,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation('health');

  const preset = schedulePresets.find((p) => p.id === medicine.schedulePresetId);
  const isAsNeeded = preset?.code === 'as_needed';

  const handlePresetChange = (presetId: number) => {
    const selected = schedulePresets.find((p) => p.id === presetId);
    onChange({
      ...medicine,
      schedulePresetId: presetId,
      schedule: selected ? presetSchedule(selected.code) : EMPTY_SCHEDULE(),
    });
  };

  const toggleSlot = (slot: keyof MedicineRowInput['schedule']) => {
    onChange({
      ...medicine,
      schedule: { ...medicine.schedule, [slot]: !medicine.schedule[slot] },
      schedulePresetId: schedulePresets.find((p) => p.code === 'custom')?.id ?? medicine.schedulePresetId,
    });
  };

  const doseGroups = [...new Set(doseUnits.map((u) => u.doseGroup))];

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t('record.medicineNumber', { number: index + 1 })}</p>
        {canRemove && (
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            {t('record.removeMedicine')}
          </Button>
        )}
      </div>

      <div>
        <Label>{t('record.medicineName')}</Label>
        <Input
          value={medicine.medicineName}
          onChange={(e) => onChange({ ...medicine, medicineName: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('record.doseAmount')}</Label>
          <Input
            value={medicine.doseAmount}
            onChange={(e) => onChange({ ...medicine, doseAmount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>{t('record.doseUnit')}</Label>
          <Select
            value={String(medicine.doseUnitId || doseUnits[0]?.id || '')}
            onChange={(e) => onChange({ ...medicine, doseUnitId: Number(e.target.value) })}
            required
          >
            {doseGroups.map((group) => (
              <optgroup key={group} label={group}>
                {doseUnits
                  .filter((u) => u.doseGroup === group)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.value}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>{t('record.schedulePreset')}</Label>
        <Select
          value={String(medicine.schedulePresetId || schedulePresets[0]?.id || '')}
          onChange={(e) => handlePresetChange(Number(e.target.value))}
          required
        >
          {schedulePresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.value}
            </option>
          ))}
        </Select>
      </div>

      {!isAsNeeded && (
        <div className="flex flex-wrap gap-2">
          {(['morning', 'noon', 'evening', 'night'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              className={`rounded-md border px-3 py-2 text-sm ${
                medicine.schedule[slot]
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => toggleSlot(slot)}
            >
              {t(`record.schedule.${slot}`)}
            </button>
          ))}
        </div>
      )}

      <div>
        <Label>{t('record.foodTiming')}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {foodTimings.map((timing) => (
            <button
              key={timing.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-sm ${
                medicine.foodTimingId === timing.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => onChange({ ...medicine, foodTimingId: timing.id })}
            >
              {timing.value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t('record.medicineNotes')}</Label>
        <Input
          value={medicine.medicineNotes ?? ''}
          onChange={(e) => onChange({ ...medicine, medicineNotes: e.target.value })}
        />
      </div>
    </div>
  );
}
