const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const env = {
  supabaseUrl: supabaseUrl ?? '',
  supabaseAnonKey: supabaseAnonKey ?? '',
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:4000/api/v1',
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey && apiBaseUrl),
} as const;
