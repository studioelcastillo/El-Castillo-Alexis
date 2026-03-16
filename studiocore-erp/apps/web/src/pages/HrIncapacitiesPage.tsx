import { HrRequestsPage } from './HrRequestsPage';

export function HrIncapacitiesPage() {
  return (
    <HrRequestsPage
      endpoint="/hr/incapacities"
      title="Incapacidades"
      description="Gestiona incapacidades, soportes y aprobaciones con sincronizacion base hacia nomina cuando el caso queda aprobado."
      singularLabel="Incapacidad"
      emptyTitle="Sin incapacidades visibles"
      emptyDescription="Todavia no hay incapacidades para el filtro actual."
      showSupportUrl
    />
  );
}
