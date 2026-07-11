/** Auth app_metadata used by extractTenantMiddleware to skip a profile DB hit. */
export function staffAppMetadata(tenantId: number, status: 'Active' | 'Inactive') {
  return { tenant_id: tenantId, status };
}

export function readTenantFromAppMetadata(
  appMetadata: Record<string, unknown> | undefined,
): { tenantId: number; status: string } | null {
  if (!appMetadata) return null;

  const rawTenant = appMetadata.tenant_id;
  const tenantId =
    typeof rawTenant === 'number'
      ? rawTenant
      : typeof rawTenant === 'string'
        ? Number(rawTenant)
        : NaN;
  const status = appMetadata.status;

  if (!Number.isFinite(tenantId) || typeof status !== 'string') {
    return null;
  }

  return { tenantId, status };
}
