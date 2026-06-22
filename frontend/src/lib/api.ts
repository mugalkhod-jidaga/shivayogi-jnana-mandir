import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ApiResponse, PaginatedList, PaginationMeta } from '@/types/api';

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

type RequestOptions = RequestInit & { token?: string; _retried?: boolean };

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
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

      return apiRequest<T>(path, {
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

  return { data: body.data, meta: body.meta };
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}

export async function apiFetchPaginated<TItem>(
  path: string,
  options: RequestOptions = {},
): Promise<PaginatedList<TItem>> {
  const { data, meta } = await apiRequest<TItem[]>(path, options);
  if (!meta) {
    throw new ApiError('Missing pagination meta', 500);
  }
  return { data, meta };
}

export async function apiFetchWithMeta<TData, TMeta>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: TData; meta: TMeta }> {
  const { data, meta } = await apiRequest<TData>(path, options);
  if (meta === undefined) {
    throw new ApiError('Missing response meta', 500);
  }
  return { data, meta: meta as TMeta };
}

async function parseApiResponse<T>(response: Response): Promise<{ data: T; meta?: PaginationMeta }> {
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    const errorCode = !body.success ? body.error : undefined;
    throw new ApiError(errorCode ?? `Request failed (${response.status})`, response.status, errorCode);
  }

  return { data: body.data, meta: body.meta };
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, 'body' | 'headers'> = {},
): Promise<T> {
  const { token: explicitToken, _retried, ...rest } = options;
  const token = explicitToken ?? (await getToken());

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  try {
    const { data } = await parseApiResponse<T>(response);
    return data;
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === 'TOKEN_EXPIRED_OR_INVALID' &&
      !_retried
    ) {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data.session) {
        handleUnauthorized();
        throw error;
      }

      return apiUpload<T>(path, formData, {
        ...options,
        token: data.session.access_token,
        _retried: true,
      });
    }

    if (error instanceof ApiError && error.status === 401) {
      handleUnauthorized();
    }

    throw error;
  }
}
