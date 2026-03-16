import { SetMetadata } from '@nestjs/common';

export type TenantContextOptions = {
  requireCompanyWide?: boolean;
  requireActiveBranch?: boolean;
};

export const TENANT_CONTEXT_KEY = 'tenant_context';

export function RequireTenantContext(options: TenantContextOptions) {
  return SetMetadata(TENANT_CONTEXT_KEY, options);
}
