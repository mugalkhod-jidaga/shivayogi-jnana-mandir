import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudentsList } from '@/hooks/useStudents';
import type { StudentSummary } from '@/types/student';
import { cn } from '@/lib/utils';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

type Props = {
  value: string;
  onChange: (studentId: string, student: StudentSummary | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
};

export function StudentSearchPicker({ value, onChange, label, placeholder, className }: Props) {
  const { t } = useTranslation('students');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const { data, isFetching } = useStudentsList({
    page: 1,
    limit: 10,
    search: query.trim() || undefined,
    status: 'Active',
  });

  const results = data?.data ?? [];

  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    const match = results.find((s) => s.id === value);
    if (match) {
      setSelectedLabel(`${formatName(match.firstName, match.lastName)} (${match.admissionNumber})`);
    }
  }, [value, results]);

  const handleSelect = (student: StudentSummary) => {
    onChange(student.id, student);
    setSelectedLabel(`${formatName(student.firstName, student.lastName)} (${student.admissionNumber})`);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={cn('relative space-y-1', className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange('', null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? t('list.searchPlaceholder')}
          className="pl-9"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-md">
          {isFetching && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('list.loading')}</li>
          )}
          {!isFetching && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('list.noResults')}</li>
          )}
          {results.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => handleSelect(student)}
              >
                <span className="font-medium">{formatName(student.firstName, student.lastName)}</span>
                <span className="ml-2 text-muted-foreground">{student.admissionNumber}</span>
                {student.currentEnrollment?.standard?.value && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {student.currentEnrollment.standard.value}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
