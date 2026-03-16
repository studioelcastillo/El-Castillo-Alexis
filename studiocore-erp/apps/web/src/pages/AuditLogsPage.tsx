import type { AuditLogRecord } from '@studiocore/contracts';
import { StatusBadge } from '@studiocore/ui';
import { ResourcePage, type ResourceColumn } from '../components/ResourcePage';
import { PermissionGuard } from '../components/PermissionGuard';
import { formatDateTime, shortText } from '../lib/format';

const columns: Array<ResourceColumn<AuditLogRecord>> = [
  {
    key: 'when',
    header: 'Fecha',
    cell: (item) => formatDateTime(item.createdAt),
  },
  {
    key: 'event',
    header: 'Evento',
    cell: (item) => (
      <div>
        <strong>
          {item.module}.{item.action}
        </strong>
        <p>{item.entityType}</p>
      </div>
    ),
  },
  {
    key: 'entity',
    header: 'Entidad',
    cell: (item) => shortText(item.entityId ? `${item.entityType} #${item.entityId}` : item.entityType),
  },
  {
    key: 'scope',
    header: 'Scope',
    cell: (item) => <StatusBadge value={item.branchId ? `sede ${item.branchId}` : 'global'} />,
  },
  {
    key: 'ip',
    header: 'Red',
    cell: (item) => shortText(item.ipAddress),
  },
];

export function AuditLogsPage() {
  return (
    <PermissionGuard permission="audit.view">
      <ResourcePage<AuditLogRecord>
        eyebrow="Auditoria"
        title="Trazabilidad"
        description="Ultimos eventos sensibles registrados por el backend nuevo. La meta es que toda accion critica del ERP termine aqui."
        queryKey={['audit']}
        buildPath={(search) => {
          const params = new URLSearchParams({ page: '1', pageSize: '20' });
          if (search) {
            params.set('search', search);
          }
          return `/audit-logs?${params.toString()}`;
        }}
        columns={columns}
        emptyTitle="No hay trazas visibles"
        emptyDescription="La empresa activa todavia no tiene eventos auditados o el filtro actual no encontro coincidencias."
        searchPlaceholder="Buscar por modulo, accion o entidad"
        totalLabel={{ singular: 'evento', plural: 'eventos' }}
      />
    </PermissionGuard>
  );
}
