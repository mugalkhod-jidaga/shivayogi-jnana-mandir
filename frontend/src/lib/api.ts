import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type TokenProvider = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let getToken: TokenProvider = async () => null;
let handleUnauthorized: UnauthorizedHandler = () => {};

export function configureApi(
  tokenProvider: TokenProvider,
  onUnauthorized: UnauthorizedHandler,
): void {
  getToken = tokenProvider;
  handleUnauthorized = onUnauthorized;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; _retried?: boolean } = {},
): Promise<T> {
  const { token: explicitToken, _retried, headers, ...rest } = options;
  const token = explicitToken ?? (await getToken());

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    const errorCode = !body.success ? body.error : undefined;
    const message = errorCode ?? `Request failed (${response.status})`;

    if (
      response.status === 401 &&
      errorCode === 'TOKEN_EXPIRED_OR_INVALID' &&
      !_retried
    ) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        handleUnauthorized();
        throw new ApiError('Session expired', 401, errorCode);
      }

      return apiFetch<T>(path, {
        ...options,
        token: data.session.access_token,
        _retried: true,
      });
    }

    if (response.status === 401) {
      handleUnauthorized();
    }

    throw new ApiError(message, response.status, errorCode);
  }

  return body.data;
}
