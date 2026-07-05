import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildStudentFormSchemas } from '@/features/students/schemas/studentForm.schema';

export function useStudentFormSchemas() {
  const { t, i18n } = useTranslation('students');

  return useMemo(
    () =>
      buildStudentFormSchemas({
        dateRequired: t('validation.dateRequired'),
        invalidDate: t('validation.invalidDate'),
        dobRequired: t('validation.dobRequired'),
        firstNameRequired: t('validation.firstNameRequired'),
        phone: t('validation.phone'),
        contactNameRequired: t('validation.contactNameRequired'),
        relationshipRequired: t('validation.relationshipRequired'),
        rollNumberRequired: t('validation.rollNumberRequired'),
        villageRequired: t('validation.villageRequired'),
        talukRequired: t('validation.talukRequired'),
        districtRequired: t('validation.districtRequired'),
        pincodeRequired: t('validation.pincodeRequired'),
        aadhaar: t('validation.aadhaar'),
        satsId: t('validation.satsId'),
        reasonRequired: t('validation.reasonRequired'),
        admissionNumberRequired: t('validation.admissionNumberRequired'),
        dateParse: {
          required: t('validation.dobRequired'),
          invalidFormat: t('validation.invalidDateFormat'),
          invalidYear: t('validation.invalidYear'),
          invalidMonth: t('validation.invalidMonth'),
          invalidDay: t('validation.invalidDay'),
          invalidDate: t('validation.invalidDateValue'),
        },
        rd: {
          casteRdRequired: t('validation.rd.casteRdRequired'),
          casteRdInvalid: t('validation.rd.casteRdInvalid'),
          incomeRdRequired: t('validation.rd.incomeRdRequired'),
          incomeRdInvalid: t('validation.rd.incomeRdInvalid'),
          scStDifferent: t('validation.rd.scStDifferent'),
          obcIncomeMustMatch: t('validation.rd.obcIncomeMustMatch'),
          gmIncomeInvalid: t('validation.rd.gmIncomeInvalid'),
        },
      }),
    [t, i18n.language],
  );
}
