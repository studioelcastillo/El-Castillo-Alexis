import { TalentPage } from './TalentPage';

export function ModelsPage() {
  return (
    <TalentPage
      personType="model"
      endpoint="/models"
      permissionBase="models"
      eyebrow="Operacion"
      title="Modelos"
      description="Vista especializada para gestionar el listado y detalle de modelos usando el backend nuevo y la base canonica de people."
      listTitle="Modelos visibles"
      listDescription="Consulta y opera solo registros del tipo modelo sin mezclar staff ni contratistas."
      emptyTitle="No hay modelos visibles"
      emptyDescription="Todavia no hay modelos que coincidan con el filtro actual."
      formDescription="Registra una nueva modelo sobre el directorio canonico, respetando tenant, sede y catalogos versionados."
      detailDescription="Mantiene la ficha operativa del modelo alineada con people, contratos y documentos existentes."
      highlightLabel="Modelo"
      showModelCategory
    />
  );
}
