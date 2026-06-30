import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCreateStaffFormSchema } from '@/features/staff/schemas/staffForm.schema';

export function useStaffFormSchemas() {
  const { t, i18n } = useTranslation('staff');

  return useMemo(
    () => ({
      createStaffFormSchema: buildCreateStaffFormSchema({
        firstNameRequired: t('validation.firstNameRequired'),
        phone: t('validation.phone'),
        roleRequired: t('validation.roleRequired'),
      }),
    }),
    [t, i18n.language],
  );
}
