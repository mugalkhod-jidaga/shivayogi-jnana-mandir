export interface UserProfileRow {
  id: string;
  tenant_id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  email: string | null;
  status: string;
  must_reset_password: boolean;
  created_at: string;
  updated_at: string;
}
