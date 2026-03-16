type BaseCatalogItem = {
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
};

type BaseCatalogGroup = {
  key: string;
  label: string;
  description: string;
  scope: 'system';
  items: BaseCatalogItem[];
};

type BaseCatalogItemSeed = {
  value: string;
  label?: string;
  description?: string | null;
  isDefault?: boolean;
};

function createGroup(
  key: string,
  label: string,
  description: string,
  items: BaseCatalogItemSeed[],
): BaseCatalogGroup {
  return {
    key,
    label,
    description,
    scope: 'system',
    items: items.map((item, index) => ({
      value: item.value,
      label: item.label ?? item.value,
      description: item.description ?? null,
      sortOrder: index + 1,
      isDefault: item.isDefault ?? index === 0,
    })),
  };
}

export const BASE_CATALOG_GROUPS: BaseCatalogGroup[] = [
  createGroup('person_types', 'Tipos de persona', 'Clasificacion base para personas, modelos, staff y contratistas.', [
    { value: 'staff', label: 'Staff', isDefault: true },
    { value: 'model', label: 'Modelo' },
    { value: 'contractor', label: 'Contratista' },
    { value: 'other', label: 'Otro' },
  ]),
  createGroup('person_identification_types', 'Tipos de identificacion', 'Documentos base homologados al modelo legacy.', [
    { value: 'CEDULA DE CIUDADANIA', isDefault: true },
    { value: 'CEDULA DE EXTRANJERIA' },
    { value: 'PASAPORTE' },
    { value: 'NIT' },
    { value: 'PEP' },
  ]),
  createGroup('person_sexes', 'Sexos', 'Catalogo inicial para identidad biografica y demografica.', [
    { value: 'MASCULINO', isDefault: true },
    { value: 'FEMENINO' },
    { value: 'OTRO' },
  ]),
  createGroup('person_blood_types', 'Grupos RH', 'Opciones base para el dato clinico RH.', [
    { value: 'A +' },
    { value: 'A -' },
    { value: 'B +' },
    { value: 'B -' },
    { value: 'AB +' },
    { value: 'AB -' },
    { value: 'O +', isDefault: true },
    { value: 'O -' },
  ]),
  createGroup('person_model_categories', 'Categorias de modelo', 'Taxonomia inicial tomada del ecosistema actual.', [
    { value: 'HETEROSEXUAL', isDefault: true },
    { value: 'HOMOSEXUAL' },
    { value: 'TRANSEXUAL' },
    { value: 'PAREJA' },
  ]),
  createGroup('bank_account_types', 'Tipos de cuenta bancaria', 'Tipos de cuenta usados en banca y dispersion.', [
    { value: 'CORRIENTE' },
    { value: 'AHORRO', isDefault: true },
  ]),
  createGroup('person_contract_types', 'Tipos de contrato', 'Contratos laborales y comerciales usados por people.', [
    { value: 'APRENDIZAJE' },
    { value: 'CIVIL POR PRESTACION DE SERVICIOS' },
    { value: 'MANDANTE - MODELO' },
    { value: 'OBRA O LABOR' },
    { value: 'OCASIONAL DE TRABAJO' },
    { value: 'TERMINO FIJO', isDefault: true },
    { value: 'TERMINO INDEFINIDO' },
  ]),
  createGroup('person_contract_commission_types', 'Tipos de comision', 'Esquemas comerciales base para contratos y metas.', [
    { value: '', label: 'Sin comision', isDefault: true },
    { value: 'PRESENCIAL' },
    { value: 'SATELITE' },
    { value: 'FIJO' },
  ]),
  createGroup('person_contract_arl_risk_levels', 'Niveles de riesgo ARL', 'Escala normativa usada por el contrato operativo.', [
    { value: 'I', isDefault: true },
    { value: 'II' },
    { value: 'III' },
    { value: 'IV' },
    { value: 'V' },
  ]),
  createGroup('person_document_legacy_labels', 'Codigos legacy de documento', 'Etiquetas historicas compatibles con el storage/documentos actual.', [
    { value: 'IMG_ID_FRONT', isDefault: true },
    { value: 'IMG_ID_BACK' },
    { value: 'IMG_ID_HAND' },
    { value: 'IMG_ID_FRONTBACK' },
    { value: 'IMG_PROFILE' },
    { value: 'IMG_OTHER' },
  ]),
  createGroup('person_document_types', 'Tipos documentales', 'Tipologia inicial para soportes en storage gestionado o referencias externas.', [
    { value: 'image', label: 'Imagen', isDefault: true },
    { value: 'video', label: 'Video' },
    { value: 'multimedia', label: 'Multimedia' },
    { value: 'contract', label: 'Contrato' },
    { value: 'certification', label: 'Certificacion' },
    { value: 'bank_letter', label: 'Carta bancaria' },
    { value: 'code_conduct', label: 'Codigo de conducta' },
    { value: 'habeas_data', label: 'Habeas data' },
  ]),
  createGroup('person_document_storage_buckets', 'Buckets de storage', 'Buckets habilitados por defecto para documentos gestionados.', [
    { value: 'el-castillo', label: 'el-castillo', isDefault: true },
  ]),
];

export function cloneBaseCatalogGroups() {
  return BASE_CATALOG_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item })),
  }));
}

export function cloneBaseCatalogGroup(key: string) {
  const group = BASE_CATALOG_GROUPS.find((item) => item.key === key);
  if (!group) {
    return null;
  }

  return {
    ...group,
    items: group.items.map((item) => ({ ...item })),
  };
}
