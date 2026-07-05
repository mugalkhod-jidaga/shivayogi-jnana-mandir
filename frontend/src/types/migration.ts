export type MigrationPreviewRow = {
  row: number;
  admission_number: string;
  first_name: string;
  last_name?: string;
  dob: string;
  gender?: string;
  blood_group_id?: number;
  admission_category_id?: number;
  sats_id?: string;
  social_category_id?: number;
  caste?: string;
  rd_number?: string;
  rd_number_secondary?: string;
  father_name?: string;
  mother_name?: string;
  parent_status?: string;
  primary_contact: string;
  village_town: string;
  taluk_mandal: string;
  district: string;
  state?: string;
  pincode: string;
};

export type MigrationParseError = {
  row: number;
  error: string;
};

export type MigrationParseResult = {
  validRows: number;
  errorRows: MigrationParseError[];
  preview: MigrationPreviewRow[];
};

export type MigrationCommitRow = Omit<MigrationPreviewRow, 'row'>;

export type MigrationCommitResult = {
  inserted: number;
};
