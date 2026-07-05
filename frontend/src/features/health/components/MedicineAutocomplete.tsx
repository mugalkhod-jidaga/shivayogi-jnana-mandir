import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMedicineCatalogSuggest } from '@/hooks/useHealth';
import type { MedicineCatalogItem } from '@/types/health';

type Props = {
  value: string;
  issueTypes: string[];
  onChange: (value: string) => void;
  onSelectCatalog: (item: MedicineCatalogItem) => void;
};

export function MedicineAutocomplete({ value, issueTypes, onChange, onSelectCatalog }: Props) {
  const { t } = useTranslation('health');
  const [open, setOpen] = useState(false);
  const { data: suggestions = [] } = useMedicineCatalogSuggest(value, issueTypes);

  useEffect(() => {
    if (!value && issueTypes.length > 0) setOpen(true);
  }, [value, issueTypes]);

  return (
    <div className="relative">
      <Label>{t('record.medicineName')}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t('record.medicinePlaceholder')}
        required
      />
      {issueTypes.length > 0 && !value && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t('record.medicineSuggestionsFor', { issues: issueTypes.join(', ') })}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-md">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectCatalog(item);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {t('record.catalogUseCount', { count: item.useCount })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
