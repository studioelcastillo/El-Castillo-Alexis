import { TalentPage } from './TalentPage';

export function StaffPage() {
  return (
    <TalentPage
      personType="staff"
      endpoint="/staff"
      permissionBase="staff"
      eyebrow="RRHH"
      title="Staff"
      description="Vista especializada para administrativos y equipo interno, separada del flujo de modelos pero reutilizando el nucleo canonico de people."
      listTitle="Staff visible"
      listDescription="Consulta y opera solo registros del tipo staff dentro de la empresa y sede activa."
      emptyTitle="No hay staff visible"
      emptyDescription="Todavia no hay administrativos o personal interno que coincidan con el filtro actual."
      formDescription="Registra un integrante del equipo interno con identidad, contacto, banca y sede operativa."
      detailDescription="Mantiene la ficha administrativa sobre el mismo backend tipado y auditado del greenfield."
      highlightLabel="Staff"
    />
  );
}
