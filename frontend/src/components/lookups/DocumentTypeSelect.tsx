import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type DocumentTypeSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export function DocumentTypeSelect(props: DocumentTypeSelectProps) {
  const { documentTypes, isLoading } = useLookups();

  return <LookupSelect {...props} options={documentTypes} isLoading={isLoading} />;
}
