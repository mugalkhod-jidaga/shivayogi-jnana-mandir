import { supabase } from '../../../config/supabase';

type AuditMetadata = Record<string, unknown> | null;

export const auditLogService = {
  async record(
    userId: string,
    tenantId: number,
    entityType: string,
    entityId: string,
    actionType: string,
    metadata: AuditMetadata = null,
    ipAddress?: string,
  ): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action_type: actionType,
      metadata,
      ip_address: ipAddress ?? null,
    });

    if (error) {
      console.error('Failed to write audit log:', error.message);
    }
  },
};
