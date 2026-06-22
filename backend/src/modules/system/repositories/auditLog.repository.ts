import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

class AuditLogRepository {
  async list(tenantId: number, page: number, limit: number, search?: string) {
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`entity_type.ilike.%${search}%,action_type.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);

    return {
      data: (data ?? []).map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actionType: row.action_type,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
      })),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }
}

export const auditLogRepository = new AuditLogRepository();
