import type { PermissionMatrixResponse, PermissionRecord, PaginatedResponse } from '@studiocore/contracts';
import { EmptyState, PageHero, Panel, SectionHeading, StatusBadge } from '@studiocore/ui';
import { useQuery } from '@tanstack/react-query';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient } from '../lib/auth';

export function PermissionsPage() {
  const api = useApiClient();
  const permissionsQuery = useQuery({
    queryKey: ['permissions', 'list'],
    queryFn: () => api.get<PaginatedResponse<PermissionRecord>>('/permissions'),
  });

  const matrixQuery = useQuery({
    queryKey: ['permissions', 'matrix'],
    queryFn: () => api.get<PermissionMatrixResponse>('/permissions/matrix'),
  });

  const modules = Object.entries(matrixQuery.data?.items || {});

  return (
    <PermissionGuard permission="permissions.view">
      <PageHero
        eyebrow="IAM"
        title="Catalogo de permisos"
        description="Este catalogo ya unifica la semilla base de fase 0 para auth, organizacion, usuarios, roles, permisos y auditoria."
      />

      <section className="two-column-grid">
        <Panel>
          <SectionHeading eyebrow="Matriz" title="Permisos por modulo" />
          {modules.length ? (
            <div className="permission-grid">
              {modules.map(([moduleKey, items]) => (
                <article key={moduleKey} className="permission-card">
                  <strong>{moduleKey}</strong>
                  <div className="pill-wrap">
                    {items.map((item) => (
                      <span key={item.id} className="status-badge neutral">
                        {item.actionKey}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin matriz" description="No hay matriz cargada para mostrar." compact />
          )}
        </Panel>

        <Panel>
          <SectionHeading eyebrow="Inventario" title="Permisos versionados" />
          {permissionsQuery.isSuccess ? (
            <div className="table-wrap compact-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Modulo</th>
                    <th>Accion</th>
                    <th>Clave</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsQuery.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.moduleKey}</td>
                      <td>
                        <StatusBadge value={item.actionKey} />
                      </td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Cargando permisos" description="Cargando catalogo de permisos..." compact />
          )}
        </Panel>
      </section>
    </PermissionGuard>
  );
}
