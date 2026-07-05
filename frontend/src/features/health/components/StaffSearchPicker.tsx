import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHealthStaffSearch } from '@/hooks/useHealth';
import type { HealthStaffOption } from '@/types/health';
import { cn } from '@/lib/utils';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

type Props = {
  value: string;
  onChange: (name: string) => void;
  className?: string;
};

export function StaffSearchPicker({ value, onChange, className }: Props) {
  const { t } = useTranslation('health');
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: results = [], isFetching } = useHealthStaffSearch(open ? query : '');

  const handleSelect = (staff: HealthStaffOption) => {
    const name = formatName(staff.firstName, staff.lastName);
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div className={cn('relative space-y-1', className)}>
      <Label>{t('record.treatedBy')}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('record.treatedByPlaceholder')}
          className="pl-9"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-md">
          {isFetching && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('loading')}</li>
          )}
          {!isFetching && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('record.noStaffResults')}</li>
          )}
          {results.map((staff) => (
            <li key={staff.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(staff)}
              >
                <span className="font-medium">{formatName(staff.firstName, staff.lastName)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
