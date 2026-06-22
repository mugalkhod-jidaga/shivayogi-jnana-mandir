// Shared API response types (FE-2+)

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiError = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PaginatedList<TItem> = {
  data: TItem[];
  meta: PaginationMeta;
};

