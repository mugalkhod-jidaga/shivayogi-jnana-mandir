export const RD_NUMBER_REGEX = /^RD\d{13}$/i;

export const OBC_SOCIAL_CATEGORY_CODES = ['cat_1', 'cat_2a', 'cat_2b', 'cat_3a', 'cat_3b'] as const;
export const SC_ST_SOCIAL_CATEGORY_CODES = ['sc', 'st'] as const;

export type RdValidationMessages = {
  casteRdRequired: string;
  casteRdInvalid: string;
  incomeRdRequired: string;
  incomeRdInvalid: string;
  scStDifferent: string;
  obcIncomeMustMatch: string;
  gmIncomeInvalid: string;
};

const DEFAULT_RD_MESSAGES: RdValidationMessages = {
  casteRdRequired: 'Valid Caste RD number required (e.g. RD1218...)',
  casteRdInvalid: 'Valid Caste RD number required (e.g. RD1218...)',
  incomeRdRequired: 'Valid Income RD number required',
  incomeRdInvalid: 'Valid Income RD number required',
  scStDifferent: 'SC/ST must have different Caste and Income RD numbers',
  obcIncomeMustMatch: 'OBC Income RD must match your Caste RD',
  gmIncomeInvalid: 'Invalid Income RD format',
};

export function normalizeRdInput(value: string): string {
  return value.toUpperCase().replace(/[^RD0-9]/g, '');
}

export function isObcSocialCategory(code: string | undefined): boolean {
  return OBC_SOCIAL_CATEGORY_CODES.includes(code?.toLowerCase() as (typeof OBC_SOCIAL_CATEGORY_CODES)[number]);
}

export function isScStSocialCategory(code: string | undefined): boolean {
  return SC_ST_SOCIAL_CATEGORY_CODES.includes(code?.toLowerCase() as (typeof SC_ST_SOCIAL_CATEGORY_CODES)[number]);
}

export function isGmSocialCategory(code: string | undefined): boolean {
  return code?.toLowerCase() === 'gm';
}

export function validateKarnatakaRdNumbers(
  socialCategoryCode: string | undefined,
  rdNumber: string | undefined,
  rdNumberSecondary: string | undefined,
  messages: RdValidationMessages = DEFAULT_RD_MESSAGES,
): { rdNumber?: string; rdNumberSecondary?: string } {
  const errors: { rdNumber?: string; rdNumberSecondary?: string } = {};
  const category = socialCategoryCode?.toLowerCase() ?? '';
  const casteRd = rdNumber?.trim() ?? '';
  const incomeRd = rdNumberSecondary?.trim() ?? '';

  if (category === 'sc' || category === 'st') {
    if (!casteRd || !RD_NUMBER_REGEX.test(casteRd)) {
      errors.rdNumber = messages.casteRdInvalid;
    }
    if (!incomeRd || !RD_NUMBER_REGEX.test(incomeRd)) {
      errors.rdNumberSecondary = messages.incomeRdRequired;
    }
    if (casteRd && incomeRd && casteRd.toUpperCase() === incomeRd.toUpperCase()) {
      errors.rdNumberSecondary = messages.scStDifferent;
    }
  }

  if (isObcSocialCategory(category)) {
    if (!casteRd || !RD_NUMBER_REGEX.test(casteRd)) {
      errors.rdNumber = messages.casteRdInvalid;
    }
    if (casteRd.toUpperCase() !== incomeRd.toUpperCase()) {
      errors.rdNumberSecondary = messages.obcIncomeMustMatch;
    }
  }

  if (category === 'gm' && incomeRd && !RD_NUMBER_REGEX.test(incomeRd)) {
    errors.rdNumberSecondary = messages.gmIncomeInvalid;
  }

  return errors;
}
