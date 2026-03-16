import { EmptyState, Panel } from '@studiocore/ui';
import type { PropsWithChildren } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../lib/auth';

type PermissionGuardProps = PropsWithChildren<{
  permission?: string;
}>;

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!permission || hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <Panel className="danger-panel">
      <EmptyState
        title="Acceso restringido"
        description={`Tu sesion actual no incluye el permiso "${permission}".`}
        icon={<LockKeyhole size={20} />}
        compact
      />
    </Panel>
  );
}
