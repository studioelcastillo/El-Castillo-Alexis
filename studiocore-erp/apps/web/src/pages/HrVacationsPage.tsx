import { HrRequestsPage } from './HrRequestsPage';

export function HrVacationsPage() {
  return (
    <HrRequestsPage
      endpoint="/hr/vacations"
      title="Vacaciones"
      description="Gestiona vacaciones pagas o no pagas con sincronizacion base hacia nomina cuando la solicitud queda aprobada."
      singularLabel="Vacacion"
      emptyTitle="Sin vacaciones visibles"
      emptyDescription="Todavia no hay vacaciones para el filtro actual."
      showIsPaid
    />
  );
}
