import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { auditLogService } from '../modules/system/services/auditLog.service';

export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchColumns?: string[];
}

export abstract class BaseRepository {
  constructor(protected tableName: string) {}

  async findAll(tenantId: number, options: ListOptions = {}) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (options.search && options.searchColumns?.length) {
      const orFilter = options.searchColumns
        .map((col) => `${col}.ilike.%${options.search}%`)
        .join(',');
      query = query.or(orFilter);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw new AppError(500, error.message);
    return { data: data ?? [], meta: { total: count ?? 0, page, limit } };
  }

  async update(
    id: string,
    tenantId: number,
    changes: Record<string, unknown>,
    userId: string,
  ) {
    const { data: before } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, this.tableName, id, 'update', {
      before,
      after: data,
    });

    return data;
  }

  async softDelete(id: string, tenantId: number, userId: string) {
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new AppError(500, error.message);

    await auditLogService.record(userId, tenantId, this.tableName, id, 'soft_delete');
  }
}
