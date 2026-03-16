import type {
  BranchRecord,
  CatalogListResponse,
  CreatePersonContractInput,
  CreatePersonDocumentInput,
  CreatePersonInput,
  EnvelopeResponse,
  PaginatedResponse,
  PersonContractRecord,
  PersonDetailRecord,
  PersonDocumentAccessResponse,
  PersonDocumentRecord,
  PersonRecord,
  PersonType,
  UpdatePersonContractInput,
  UpdatePersonDocumentInput,
  UpdatePersonInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  InlineMessage,
  PageHero,
  Panel,
  SectionHeading,
  SelectInput,
  StatusBadge,
  TextAreaInput,
  TextInput,
} from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, ExternalLink, FileText, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { fallbackCatalogGroups, resolveCatalogOptions } from '../lib/catalogs';
import { toNullableString, toOptionalNumber, toOptionalString } from '../lib/forms';
import { formatDate, formatDateTime, pluralize, shortText } from '../lib/format';

type PersonFormState = {
  personType: PersonType;
  firstName: string;
  lastName: string;
  branchId: string;
  documentType: string;
  documentNumber: string;
  issuedIn: string;
  email: string;
  personalEmail: string;
  phone: string;
  address: string;
  birthDate: string;
  sex: string;
  bloodType: string;
  modelCategory: string;
  photoUrl: string;
  bankEntity: string;
  bankAccountType: string;
  bankAccountNumber: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryDocumentType: string;
  status: 'active' | 'inactive';
  notes: string;
};

type ContractFormState = {
  contractType: string;
  contractNumber: string;
  commissionType: string;
  commissionPercent: string;
  goalAmount: string;
  positionName: string;
  areaName: string;
  cityName: string;
  startsAt: string;
  endsAt: string;
  monthlySalary: string;
  biweeklySalary: string;
  dailySalary: string;
  uniformAmount: string;
  hasWithholding: boolean;
  hasSena: boolean;
  hasCompensationBox: boolean;
  hasIcbf: boolean;
  arlRiskLevel: string;
  isActive: boolean;
};

type DocumentFormState = {
  label: string;
  legacyLabel: string;
  documentType: string;
  fileType: string;
  documentNumber: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'inactive';
  notes: string;
};

const defaultDocumentType = 'image';
const defaultStorageBucket = 'el-castillo';

const emptyForm: PersonFormState = {
  personType: 'staff',
  firstName: '',
  lastName: '',
  branchId: '',
  documentType: '',
  documentNumber: '',
  issuedIn: '',
  email: '',
  personalEmail: '',
  phone: '',
  address: '',
  birthDate: '',
  sex: '',
  bloodType: '',
  modelCategory: '',
  photoUrl: '',
  bankEntity: '',
  bankAccountType: '',
  bankAccountNumber: '',
  beneficiaryName: '',
  beneficiaryDocument: '',
  beneficiaryDocumentType: '',
  status: 'active',
  notes: '',
};

const emptyContractForm: ContractFormState = {
  contractType: '',
  contractNumber: '',
  commissionType: '',
  commissionPercent: '',
  goalAmount: '',
  positionName: '',
  areaName: '',
  cityName: '',
  startsAt: '',
  endsAt: '',
  monthlySalary: '',
  biweeklySalary: '',
  dailySalary: '',
  uniformAmount: '',
  hasWithholding: false,
  hasSena: false,
  hasCompensationBox: false,
  hasIcbf: false,
  arlRiskLevel: '',
  isActive: true,
};

const emptyDocumentForm: DocumentFormState = {
  label: '',
  legacyLabel: '',
  documentType: defaultDocumentType,
  fileType: defaultDocumentType,
  documentNumber: '',
  storageBucket: defaultStorageBucket,
  storagePath: '',
  publicUrl: '',
  issuedAt: '',
  expiresAt: '',
  status: 'active',
  notes: '',
};

function toFormState(person?: PersonRecord | null): PersonFormState {
  if (!person) {
    return emptyForm;
  }

  return {
    personType: person.personType,
    firstName: person.firstName,
    lastName: person.lastName,
    branchId: person.branchId ? String(person.branchId) : '',
    documentType: person.documentType ?? '',
    documentNumber: person.documentNumber ?? '',
    issuedIn: person.issuedIn ?? '',
    email: person.email ?? '',
    personalEmail: person.personalEmail ?? '',
    phone: person.phone ?? '',
    address: person.address ?? '',
    birthDate: person.birthDate ?? '',
    sex: person.sex ?? '',
    bloodType: person.bloodType ?? '',
    modelCategory: person.modelCategory ?? '',
    photoUrl: person.photoUrl ?? '',
    bankEntity: person.bankEntity ?? '',
    bankAccountType: person.bankAccountType ?? '',
    bankAccountNumber: person.bankAccountNumber ?? '',
    beneficiaryName: person.beneficiaryName ?? '',
    beneficiaryDocument: person.beneficiaryDocument ?? '',
    beneficiaryDocumentType: person.beneficiaryDocumentType ?? '',
    status: person.status,
    notes: person.notes ?? '',
  };
}

function toContractFormState(contract?: PersonContractRecord | null): ContractFormState {
  if (!contract) {
    return emptyContractForm;
  }

  return {
    contractType: contract.contractType,
    contractNumber: contract.contractNumber ?? '',
    commissionType: contract.commissionType ?? '',
    commissionPercent: contract.commissionPercent ?? '',
    goalAmount: contract.goalAmount ?? '',
    positionName: contract.positionName ?? '',
    areaName: contract.areaName ?? '',
    cityName: contract.cityName ?? '',
    startsAt: contract.startsAt,
    endsAt: contract.endsAt ?? '',
    monthlySalary: contract.monthlySalary ?? '',
    biweeklySalary: contract.biweeklySalary ?? '',
    dailySalary: contract.dailySalary ?? '',
    uniformAmount: contract.uniformAmount ?? '',
    hasWithholding: contract.hasWithholding,
    hasSena: contract.hasSena,
    hasCompensationBox: contract.hasCompensationBox,
    hasIcbf: contract.hasIcbf,
    arlRiskLevel: contract.arlRiskLevel ?? '',
    isActive: contract.isActive,
  };
}

function toDocumentFormState(document?: PersonDocumentRecord | null): DocumentFormState {
  if (!document) {
    return emptyDocumentForm;
  }

  return {
    label: document.label,
    legacyLabel: document.legacyLabel ?? '',
    documentType: document.documentType,
    fileType: document.fileType ?? '',
    documentNumber: document.documentNumber ?? '',
    storageBucket: document.storageBucket ?? '',
    storagePath: document.storagePath ?? '',
    publicUrl: document.publicUrl ?? '',
    issuedAt: document.issuedAt ?? '',
    expiresAt: document.expiresAt ?? '',
    status: document.status,
    notes: document.notes ?? '',
  };
}

function buildDocumentFormData(form: DocumentFormState, file: File) {
  const data = new FormData();
  data.append('file', file);
  data.append('label', form.label.trim());
  data.append('documentType', form.documentType);
  data.append('status', form.status);

  const fields: Array<[string, string]> = [
    ['legacyLabel', form.legacyLabel],
    ['fileType', form.fileType],
    ['documentNumber', form.documentNumber],
    ['storageBucket', form.storageBucket],
    ['storagePath', form.storagePath],
    ['publicUrl', form.publicUrl],
    ['issuedAt', form.issuedAt],
    ['expiresAt', form.expiresAt],
    ['notes', form.notes],
  ];

  for (const [key, value] of fields) {
    const normalized = value.trim();
    if (normalized) {
      data.append(key, normalized);
    }
  }

  return data;
}

function resolveDocumentStorageState(document?: Pick<PersonDocumentRecord, 'storageBucket' | 'storagePath' | 'publicUrl'> | null) {
  if (document?.storageBucket && document?.storagePath) {
    return 'managed';
  }

  if (document?.publicUrl) {
    return 'external';
  }

  return 'unavailable';
}

function getDocumentStorageLabel(state: 'managed' | 'external' | 'unavailable') {
  if (state === 'managed') {
    return 'Storage gestionado';
  }

  if (state === 'external') {
    return 'Referencia externa';
  }

  return 'Sin archivo';
}

export function PeoplePage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('people.create');
  const canEdit = hasPermission('people.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewCatalogs = hasPermission('catalogs.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<PersonFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contractMode, setContractMode] = useState<'create' | 'edit'>('create');
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [contractForm, setContractForm] = useState<ContractFormState>(emptyContractForm);
  const [contractFeedback, setContractFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [documentMode, setDocumentMode] = useState<'create' | 'edit'>('create');
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(emptyDocumentForm);
  const [documentFeedback, setDocumentFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [isMigratingDocument, setIsMigratingDocument] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isResolvingDocumentAccess, setIsResolvingDocumentAccess] = useState(false);

  const peopleQuery = useQuery({
    queryKey: ['people-management', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<PersonRecord>>(`/people?${params.toString()}`);
    },
  });

  const personDetailQuery = useQuery({
    queryKey: ['people-detail', selectedId],
    queryFn: () => api.get<EnvelopeResponse<PersonDetailRecord>>(`/people/${selectedId}`),
    enabled: mode === 'edit' && selectedId !== null,
  });

  const branchesQuery = useQuery({
    queryKey: ['branches-for-people'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const catalogsQuery = useQuery({
    queryKey: ['catalogs-base'],
    queryFn: () => api.get<CatalogListResponse>('/catalogs'),
    enabled: canViewCatalogs,
  });

  const people = peopleQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const catalogGroups = catalogsQuery.data?.items?.length ? catalogsQuery.data.items : fallbackCatalogGroups;
  const usingCatalogFallback = Boolean(!canViewCatalogs || catalogsQuery.isError || (catalogsQuery.data && !catalogsQuery.data.items.length));
  const personTypeOptions = resolveCatalogOptions(catalogGroups, 'person_types');
  const identificationTypeOptions = resolveCatalogOptions(catalogGroups, 'person_identification_types');
  const sexOptions = resolveCatalogOptions(catalogGroups, 'person_sexes');
  const bloodTypeOptions = resolveCatalogOptions(catalogGroups, 'person_blood_types');
  const modelCategoryOptions = resolveCatalogOptions(catalogGroups, 'person_model_categories');
  const bankAccountTypeOptions = resolveCatalogOptions(catalogGroups, 'bank_account_types');
  const contractTypeOptions = resolveCatalogOptions(catalogGroups, 'person_contract_types');
  const commissionTypeOptions = resolveCatalogOptions(catalogGroups, 'person_contract_commission_types');
  const arlRiskLevelOptions = resolveCatalogOptions(catalogGroups, 'person_contract_arl_risk_levels');
  const documentLegacyLabelOptions = resolveCatalogOptions(catalogGroups, 'person_document_legacy_labels');
  const documentTypeOptions = resolveCatalogOptions(catalogGroups, 'person_document_types');
  const storageBucketOptions = resolveCatalogOptions(catalogGroups, 'person_document_storage_buckets');
  const selectedPerson = people.find((person) => person.id === selectedId) ?? null;
  const selectedPersonDetail = personDetailQuery.data?.data ?? null;
  const selectedContracts = selectedPersonDetail?.contracts ?? [];
  const selectedContract = selectedContracts.find((contract) => contract.id === selectedContractId) ?? null;
  const selectedDocuments = selectedPersonDetail?.documents ?? [];
  const selectedDocument = selectedDocuments.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedDocumentStorageState = resolveDocumentStorageState(selectedDocument);
  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])),
    [branches],
  );

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!people.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !people.some((person) => person.id === selectedId)) {
      const first = people[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedPerson));
  }, [mode, people, selectedId, selectedPerson]);

  useEffect(() => {
    setContractMode('create');
    setSelectedContractId(null);
    setContractForm(emptyContractForm);
    setContractFeedback(null);
    setDocumentMode('create');
    setSelectedDocumentId(null);
    setDocumentForm(emptyDocumentForm);
    setDocumentFeedback(null);
    setDocumentFile(null);
  }, [selectedId]);

  async function refreshPeople() {
    setFeedback(null);
    setContractFeedback(null);
    setDocumentFeedback(null);
    const tasks: Array<Promise<unknown>> = [peopleQuery.refetch()];
    if (mode === 'edit' && selectedId !== null) {
      tasks.push(personDetailQuery.refetch());
    }
    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }
    await Promise.all(tasks);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreatePersonInput = {
          personType: form.personType,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          ...(toOptionalNumber(form.branchId) ? { branchId: toOptionalNumber(form.branchId) } : {}),
          ...(toOptionalString(form.documentType) ? { documentType: toOptionalString(form.documentType) } : {}),
          ...(toOptionalString(form.documentNumber) ? { documentNumber: toOptionalString(form.documentNumber) } : {}),
          ...(toOptionalString(form.issuedIn) ? { issuedIn: toOptionalString(form.issuedIn) } : {}),
          ...(toOptionalString(form.email) ? { email: toOptionalString(form.email) } : {}),
          ...(toOptionalString(form.personalEmail) ? { personalEmail: toOptionalString(form.personalEmail) } : {}),
          ...(toOptionalString(form.phone) ? { phone: toOptionalString(form.phone) } : {}),
          ...(toOptionalString(form.address) ? { address: toOptionalString(form.address) } : {}),
          ...(toOptionalString(form.birthDate) ? { birthDate: toOptionalString(form.birthDate) } : {}),
          ...(toOptionalString(form.sex) ? { sex: toOptionalString(form.sex) } : {}),
          ...(toOptionalString(form.bloodType) ? { bloodType: toOptionalString(form.bloodType) } : {}),
          ...(toOptionalString(form.modelCategory) ? { modelCategory: toOptionalString(form.modelCategory) } : {}),
          ...(toOptionalString(form.photoUrl) ? { photoUrl: toOptionalString(form.photoUrl) } : {}),
          ...(toOptionalString(form.bankEntity) ? { bankEntity: toOptionalString(form.bankEntity) } : {}),
          ...(toOptionalString(form.bankAccountType) ? { bankAccountType: toOptionalString(form.bankAccountType) } : {}),
          ...(toOptionalString(form.bankAccountNumber) ? { bankAccountNumber: toOptionalString(form.bankAccountNumber) } : {}),
          ...(toOptionalString(form.beneficiaryName) ? { beneficiaryName: toOptionalString(form.beneficiaryName) } : {}),
          ...(toOptionalString(form.beneficiaryDocument) ? { beneficiaryDocument: toOptionalString(form.beneficiaryDocument) } : {}),
          ...(toOptionalString(form.beneficiaryDocumentType) ? { beneficiaryDocumentType: toOptionalString(form.beneficiaryDocumentType) } : {}),
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<PersonDetailRecord>>('/people', payload);
        await queryClient.invalidateQueries({ queryKey: ['people-management'] });
        await queryClient.invalidateQueries({ queryKey: ['people-detail', response.data.id] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Persona #${response.data.id} creada correctamente.` });
      } else if (selectedPerson) {
        const payload: UpdatePersonInput = {
          personType: form.personType,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          branchId: form.branchId ? Number(form.branchId) : null,
          documentType: toNullableString(form.documentType),
          documentNumber: toNullableString(form.documentNumber),
          issuedIn: toNullableString(form.issuedIn),
          email: toNullableString(form.email),
          personalEmail: toNullableString(form.personalEmail),
          phone: toNullableString(form.phone),
          address: toNullableString(form.address),
          birthDate: toNullableString(form.birthDate),
          sex: toNullableString(form.sex),
          bloodType: toNullableString(form.bloodType),
          modelCategory: toNullableString(form.modelCategory),
          photoUrl: toNullableString(form.photoUrl),
          bankEntity: toNullableString(form.bankEntity),
          bankAccountType: toNullableString(form.bankAccountType),
          bankAccountNumber: toNullableString(form.bankAccountNumber),
          beneficiaryName: toNullableString(form.beneficiaryName),
          beneficiaryDocument: toNullableString(form.beneficiaryDocument),
          beneficiaryDocumentType: toNullableString(form.beneficiaryDocumentType),
          status: form.status,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<PersonDetailRecord>>(`/people/${selectedPerson.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['people-management'] });
        await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPerson.id] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Persona #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la persona.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContractSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPersonDetail) {
      return;
    }

    setContractFeedback(null);
    setIsSavingContract(true);

    try {
      if (contractMode === 'create') {
        const payload: CreatePersonContractInput = {
          contractType: contractForm.contractType,
          ...(toOptionalString(contractForm.contractNumber) ? { contractNumber: toOptionalString(contractForm.contractNumber) } : {}),
          ...(toOptionalString(contractForm.commissionType) ? { commissionType: toOptionalString(contractForm.commissionType) } : {}),
          ...(toOptionalString(contractForm.commissionPercent) ? { commissionPercent: toOptionalString(contractForm.commissionPercent) } : {}),
          ...(toOptionalString(contractForm.goalAmount) ? { goalAmount: toOptionalString(contractForm.goalAmount) } : {}),
          ...(toOptionalString(contractForm.positionName) ? { positionName: toOptionalString(contractForm.positionName) } : {}),
          ...(toOptionalString(contractForm.areaName) ? { areaName: toOptionalString(contractForm.areaName) } : {}),
          ...(toOptionalString(contractForm.cityName) ? { cityName: toOptionalString(contractForm.cityName) } : {}),
          startsAt: contractForm.startsAt,
          ...(toOptionalString(contractForm.endsAt) ? { endsAt: toOptionalString(contractForm.endsAt) } : {}),
          ...(toOptionalString(contractForm.monthlySalary) ? { monthlySalary: toOptionalString(contractForm.monthlySalary) } : {}),
          ...(toOptionalString(contractForm.biweeklySalary) ? { biweeklySalary: toOptionalString(contractForm.biweeklySalary) } : {}),
          ...(toOptionalString(contractForm.dailySalary) ? { dailySalary: toOptionalString(contractForm.dailySalary) } : {}),
          ...(toOptionalString(contractForm.uniformAmount) ? { uniformAmount: toOptionalString(contractForm.uniformAmount) } : {}),
          hasWithholding: contractForm.hasWithholding,
          hasSena: contractForm.hasSena,
          hasCompensationBox: contractForm.hasCompensationBox,
          hasIcbf: contractForm.hasIcbf,
          ...(toOptionalString(contractForm.arlRiskLevel) ? { arlRiskLevel: toOptionalString(contractForm.arlRiskLevel) } : {}),
          isActive: contractForm.isActive,
        };

        const response = await api.post<EnvelopeResponse<PersonContractRecord>>(
          `/people/${selectedPersonDetail.id}/contracts`,
          payload,
        );
        await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPersonDetail.id] });
        setContractMode('edit');
        setSelectedContractId(response.data.id);
        setContractForm(toContractFormState(response.data));
        setContractFeedback({ tone: 'success', message: `Contrato #${response.data.id} creado correctamente.` });
      } else if (selectedContract) {
        const payload: UpdatePersonContractInput = {
          contractType: contractForm.contractType,
          contractNumber: toNullableString(contractForm.contractNumber),
          commissionType: toNullableString(contractForm.commissionType),
          commissionPercent: toNullableString(contractForm.commissionPercent),
          goalAmount: toNullableString(contractForm.goalAmount),
          positionName: toNullableString(contractForm.positionName),
          areaName: toNullableString(contractForm.areaName),
          cityName: toNullableString(contractForm.cityName),
          startsAt: contractForm.startsAt,
          endsAt: toNullableString(contractForm.endsAt),
          monthlySalary: toNullableString(contractForm.monthlySalary),
          biweeklySalary: toNullableString(contractForm.biweeklySalary),
          dailySalary: toNullableString(contractForm.dailySalary),
          uniformAmount: toNullableString(contractForm.uniformAmount),
          hasWithholding: contractForm.hasWithholding,
          hasSena: contractForm.hasSena,
          hasCompensationBox: contractForm.hasCompensationBox,
          hasIcbf: contractForm.hasIcbf,
          arlRiskLevel: toNullableString(contractForm.arlRiskLevel),
          isActive: contractForm.isActive,
        };

        const response = await api.patch<EnvelopeResponse<PersonContractRecord>>(
          `/people/${selectedPersonDetail.id}/contracts/${selectedContract.id}`,
          payload,
        );
        await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPersonDetail.id] });
        setContractForm(toContractFormState(response.data));
        setContractFeedback({ tone: 'success', message: `Contrato #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setContractFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el contrato.',
      });
    } finally {
      setIsSavingContract(false);
    }
  }

  async function handleDocumentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPersonDetail) {
      return;
    }

    setDocumentFeedback(null);
    setIsSavingDocument(true);

    try {
      if (documentMode === 'create') {
        const response = documentFile
          ? await api.request<EnvelopeResponse<PersonDocumentRecord>>(`/people/${selectedPersonDetail.id}/documents/upload`, {
              method: 'POST',
              body: buildDocumentFormData(documentForm, documentFile),
            })
          : await api.post<EnvelopeResponse<PersonDocumentRecord>>(
              `/people/${selectedPersonDetail.id}/documents`,
              {
                label: documentForm.label.trim(),
                ...(toOptionalString(documentForm.legacyLabel) ? { legacyLabel: toOptionalString(documentForm.legacyLabel) } : {}),
                documentType: documentForm.documentType,
                ...(toOptionalString(documentForm.fileType) ? { fileType: toOptionalString(documentForm.fileType) } : {}),
                ...(toOptionalString(documentForm.documentNumber) ? { documentNumber: toOptionalString(documentForm.documentNumber) } : {}),
                ...(toOptionalString(documentForm.storageBucket) ? { storageBucket: toOptionalString(documentForm.storageBucket) } : {}),
                ...(toOptionalString(documentForm.storagePath) ? { storagePath: toOptionalString(documentForm.storagePath) } : {}),
                ...(toOptionalString(documentForm.publicUrl) ? { publicUrl: toOptionalString(documentForm.publicUrl) } : {}),
                ...(toOptionalString(documentForm.issuedAt) ? { issuedAt: toOptionalString(documentForm.issuedAt) } : {}),
                ...(toOptionalString(documentForm.expiresAt) ? { expiresAt: toOptionalString(documentForm.expiresAt) } : {}),
                status: documentForm.status,
                ...(toOptionalString(documentForm.notes) ? { notes: toOptionalString(documentForm.notes) } : {}),
              } satisfies CreatePersonDocumentInput,
            );
        await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPersonDetail.id] });
        setDocumentMode('edit');
        setSelectedDocumentId(response.data.id);
        setDocumentForm(toDocumentFormState(response.data));
        setDocumentFile(null);
        setDocumentFeedback({ tone: 'success', message: `Documento #${response.data.id} agregado a la persona.` });
      } else if (selectedDocument) {
        const payload: UpdatePersonDocumentInput = {
          label: documentForm.label.trim(),
          legacyLabel: toNullableString(documentForm.legacyLabel),
          documentType: documentForm.documentType,
          fileType: toNullableString(documentForm.fileType),
          documentNumber: toNullableString(documentForm.documentNumber),
          storageBucket: toNullableString(documentForm.storageBucket),
          storagePath: toNullableString(documentForm.storagePath),
          publicUrl: toNullableString(documentForm.publicUrl),
          issuedAt: toNullableString(documentForm.issuedAt),
          expiresAt: toNullableString(documentForm.expiresAt),
          status: documentForm.status,
          notes: toNullableString(documentForm.notes),
        };

        const response = await api.patch<EnvelopeResponse<PersonDocumentRecord>>(
          `/people/${selectedPersonDetail.id}/documents/${selectedDocument.id}`,
          payload,
        );
        await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPersonDetail.id] });
        setDocumentForm(toDocumentFormState(response.data));
        setDocumentFeedback({ tone: 'success', message: `Documento #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setDocumentFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el documento.',
      });
    } finally {
      setIsSavingDocument(false);
    }
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm({
      ...emptyForm,
      branchId: !hasCompanyWideAccess && activeBranchId ? String(activeBranchId) : '',
    });
    setFeedback(null);
  }

  function startContractCreate() {
    setContractMode('create');
    setSelectedContractId(null);
    setContractForm(emptyContractForm);
    setContractFeedback(null);
  }

  function startDocumentCreate() {
    setDocumentMode('create');
    setSelectedDocumentId(null);
    setDocumentForm(emptyDocumentForm);
    setDocumentFeedback(null);
    setDocumentFile(null);
  }

  async function openDocument(document: PersonDocumentRecord) {
    try {
      setIsResolvingDocumentAccess(true);
      const response = await api.get<EnvelopeResponse<PersonDocumentAccessResponse>>(
        `/people/${selectedPersonDetail?.id}/documents/${document.id}/access`,
      );
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setDocumentFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible abrir el documento.',
      });
    } finally {
      setIsResolvingDocumentAccess(false);
    }
  }

  async function handleDocumentMigration() {
    if (!selectedPersonDetail || !selectedDocument) {
      return;
    }

    setDocumentFeedback(null);
    setIsMigratingDocument(true);

    try {
      const response = await api.post<EnvelopeResponse<PersonDocumentRecord>>(
        `/people/${selectedPersonDetail.id}/documents/${selectedDocument.id}/migrate-storage`,
        {},
      );
      await queryClient.invalidateQueries({ queryKey: ['people-detail', selectedPersonDetail.id] });
      setDocumentMode('edit');
      setSelectedDocumentId(response.data.id);
      setDocumentForm(toDocumentFormState(response.data));
      setDocumentFeedback({ tone: 'success', message: `Documento #${response.data.id} migrado al storage gestionado.` });
    } catch (error) {
      setDocumentFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible migrar el documento al storage gestionado.',
      });
    } finally {
      setIsMigratingDocument(false);
    }
  }

  const personDetailError = personDetailQuery.error instanceof Error ? personDetailQuery.error.message : null;

  return (
    <PermissionGuard permission="people.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Core organizacional"
          title="Personas"
          description="La ficha ya se alinea con el modelo real de Supabase: identidad, datos bancarios, contratos operativos y documentos legacy del ecosistema actual."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nueva persona
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Personas registradas"
              description={`${people.length} personas visibles para el tenant activo.`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, documento, email o cuenta"
              items={people}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>
                    {item.firstName} {item.lastName}
                  </strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.personType}</p>
                  <p>{shortText(item.documentNumber)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.branchId ? branchNameById.get(item.branchId) || `Sede #${item.branchId}` : 'Global'}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle="No hay personas visibles"
              emptyDescription="Todavia no hay personas registradas o el filtro actual no encontro coincidencias."
              loading={peopleQuery.isPending}
              error={peopleQuery.error instanceof Error ? peopleQuery.error.message : null}
              onRefresh={() => void refreshPeople()}
              onSelect={(item) => {
                setMode('edit');
                setSelectedId(item.id);
                setForm(toFormState(item));
                setFeedback(null);
              }}
              action={
                canCreate ? (
                  <ActionButton variant="secondary" className="small-button" onClick={startCreate}>
                    <Plus size={16} />
                    Alta
                  </ActionButton>
                ) : null
              }
            />
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Ficha"
              title={mode === 'create' ? 'Crear persona' : 'Editar persona'}
              description={
                mode === 'create'
                  ? 'Abre una ficha alineada al esquema real de Supabase para identidad, contacto y banca.'
                  : 'Mantiene sincronizada la identidad canonica y datos operativos de la persona.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewBranches && (canCreate || canEdit) ? (
              <InlineMessage tone="info">Tu sesion no incluye `branches.view`; puedes registrar personas sin ver el catalogo completo de sedes.</InlineMessage>
            ) : null}
            {usingCatalogFallback ? (
              <InlineMessage tone="info">No fue posible sincronizar catalogos desde el API; se usan opciones versionadas locales para mantener el flujo operativo.</InlineMessage>
            ) : null}
            {!hasCompanyWideAccess && activeBranchId ? (
              <InlineMessage tone="info">
                Esta sesion opera la sede {activeBranchId}. Las altas y ediciones de personas quedan amarradas a esa sede hasta cambiar el contexto tenant.
              </InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <SectionHeading eyebrow="Identidad" title="Datos base" description="Replica los campos reales que hoy viven en `users` dentro de Supabase." />

              <div className="field-grid two-columns">
                <Field label="Tipo" htmlFor="person-type">
                  <SelectInput
                    id="person-type"
                    value={form.personType}
                    onChange={(event) => setForm((current) => ({ ...current, personType: event.target.value as PersonType }))}
                    disabled={!canCreate && !canEdit}
                  >
                    {personTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="person-status" hint={mode === 'create' ? 'Se crea activa por defecto.' : 'Puedes inactivar sin borrar la ficha.'}>
                  <SelectInput
                    id="person-status"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}
                    disabled={mode === 'create' || (!canCreate && !canEdit)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectInput>
                </Field>

                <Field label="Nombre" htmlFor="person-first-name">
                  <TextInput id="person-first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Apellido" htmlFor="person-last-name">
                  <TextInput id="person-last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Tipo de identificacion" htmlFor="person-document-type">
                  <SelectInput id="person-document-type" value={form.documentType} onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {identificationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Numero de identificacion" htmlFor="person-document-number">
                  <TextInput id="person-document-number" value={form.documentNumber} onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Expedida en" htmlFor="person-issued-in">
                  <TextInput id="person-issued-in" value={form.issuedIn} onChange={(event) => setForm((current) => ({ ...current, issuedIn: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Sede" htmlFor="person-branch-id">
                  <SelectInput id="person-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess}>
                    <option value="">Sin sede asignada</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? (
                      <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option>
                    ) : null}
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Fecha de nacimiento" htmlFor="person-birth-date">
                  <TextInput id="person-birth-date" type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Sexo" htmlFor="person-sex">
                  <SelectInput id="person-sex" value={form.sex} onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="RH" htmlFor="person-blood-type">
                  <SelectInput id="person-blood-type" value={form.bloodType} onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {bloodTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Categoria modelo" htmlFor="person-model-category">
                  <SelectInput id="person-model-category" value={form.modelCategory} onChange={(event) => setForm((current) => ({ ...current, modelCategory: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {modelCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>
              </div>

              <SectionHeading eyebrow="Contacto" title="Canales y direccion" description="Campos homologados a `user_email`, `user_personal_email`, `user_telephone` y `user_address`." />

              <div className="field-grid two-columns">
                <Field label="Email corporativo" htmlFor="person-email">
                  <TextInput id="person-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Email personal" htmlFor="person-personal-email">
                  <TextInput id="person-personal-email" type="email" value={form.personalEmail} onChange={(event) => setForm((current) => ({ ...current, personalEmail: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Telefono" htmlFor="person-phone">
                  <TextInput id="person-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Foto / URL publica" htmlFor="person-photo-url">
                  <TextInput id="person-photo-url" value={form.photoUrl} onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              </div>

              <Field label="Direccion" htmlFor="person-address">
                <TextAreaInput id="person-address" rows={2} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              <SectionHeading eyebrow="Banca" title="Datos bancarios y beneficiario" description="Replica la informacion financiera real que hoy vive en `users` y `bank_accounts`." />

              <div className="field-grid two-columns">
                <Field label="Entidad bancaria" htmlFor="person-bank-entity">
                  <TextInput id="person-bank-entity" value={form.bankEntity} onChange={(event) => setForm((current) => ({ ...current, bankEntity: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Tipo de cuenta" htmlFor="person-bank-account-type">
                  <SelectInput id="person-bank-account-type" value={form.bankAccountType} onChange={(event) => setForm((current) => ({ ...current, bankAccountType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {bankAccountTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Numero de cuenta" htmlFor="person-bank-account-number">
                  <TextInput id="person-bank-account-number" value={form.bankAccountNumber} onChange={(event) => setForm((current) => ({ ...current, bankAccountNumber: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Nombre beneficiario" htmlFor="person-beneficiary-name">
                  <TextInput id="person-beneficiary-name" value={form.beneficiaryName} onChange={(event) => setForm((current) => ({ ...current, beneficiaryName: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Documento beneficiario" htmlFor="person-beneficiary-document">
                  <TextInput id="person-beneficiary-document" value={form.beneficiaryDocument} onChange={(event) => setForm((current) => ({ ...current, beneficiaryDocument: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Tipo documento beneficiario" htmlFor="person-beneficiary-document-type">
                  <TextInput id="person-beneficiary-document-type" value={form.beneficiaryDocumentType} onChange={(event) => setForm((current) => ({ ...current, beneficiaryDocumentType: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              </div>

              <Field label="Notas" htmlFor="person-notes">
                <TextAreaInput id="person-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedPerson)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear persona' : 'Guardar persona'}
                  </ActionButton>
                  {mode === 'create' && people.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = people[0];
                        setMode('edit');
                        setSelectedId(first.id);
                        setForm(toFormState(first));
                        setFeedback(null);
                      }}
                    >
                      Cancelar
                    </ActionButton>
                  ) : null}
                </div>
              ) : (
                <InlineMessage tone="info">Tu sesion puede consultar personas, pero no editar su configuracion.</InlineMessage>
              )}
            </form>
          </Panel>
        </div>

        {mode === 'edit' && selectedId ? (
          <>
            <div className="two-column-grid">
              <Panel>
                <SectionHeading eyebrow="Detalle" title="Ficha consolidada" description="Resumen operativo alineado al modelo real actual de Supabase." />

                {personDetailError ? <InlineMessage tone="error">{personDetailError}</InlineMessage> : null}
                {personDetailQuery.isPending && !selectedPersonDetail ? (
                  <InlineMessage tone="info">Cargando detalle de la persona...</InlineMessage>
                ) : selectedPersonDetail ? (
                  <div className="detail-list">
                    <div><span>Nombre completo</span><strong>{selectedPersonDetail.fullName}</strong></div>
                    <div><span>Tipo y estado</span><strong>{selectedPersonDetail.personType} / {selectedPersonDetail.status}</strong></div>
                    <div><span>Identificacion</span><strong>{shortText(selectedPersonDetail.documentType)} - {shortText(selectedPersonDetail.documentNumber)}</strong></div>
                    <div><span>Sede actual</span><strong>{selectedPersonDetail.branchName ?? 'Global'}</strong></div>
                    <div><span>Email y telefono</span><strong>{shortText(selectedPersonDetail.email)} / {shortText(selectedPersonDetail.phone)}</strong></div>
                    <div><span>Cuenta bancaria</span><strong>{shortText(selectedPersonDetail.bankEntity)} / {shortText(selectedPersonDetail.bankAccountNumber)}</strong></div>
                    <div><span>Contratos ligados</span><strong>{pluralize(selectedPersonDetail.contracts.length, 'contrato', 'contratos')}</strong></div>
                    <div><span>Documentos ligados</span><strong>{pluralize(selectedPersonDetail.documents.length, 'documento', 'documentos')}</strong></div>
                    <div><span>Ultima actualizacion</span><strong>{formatDateTime(selectedPersonDetail.updatedAt)}</strong></div>
                  </div>
                ) : (
                  <EmptyState title="Sin detalle cargado" description="Selecciona una persona visible para revisar su ficha ampliada." compact />
                )}
              </Panel>

              <Panel>
                <SectionHeading
                  eyebrow="Contratos"
                  title="Relacion laboral y operativa"
                  description={
                    selectedPersonDetail
                      ? `${pluralize(selectedPersonDetail.contracts.length, 'contrato cargado', 'contratos cargados')} para esta persona.`
                      : 'Replica el dominio real de `studios_models` del sistema actual.'
                  }
                  actions={
                    canEdit && selectedPersonDetail ? (
                      <ActionButton variant="secondary" className="small-button" onClick={startContractCreate}>
                        <Plus size={16} />
                        Nuevo contrato
                      </ActionButton>
                    ) : null
                  }
                />

                {contractFeedback ? <InlineMessage tone={contractFeedback.tone}>{contractFeedback.message}</InlineMessage> : null}

                {selectedPersonDetail?.contracts.length ? (
                  <div className="entity-card-list">
                    {selectedPersonDetail.contracts.map((contract) => (
                      <button
                        key={contract.id}
                        type="button"
                        className={`entity-card ${selectedContractId === contract.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          setContractMode('edit');
                          setSelectedContractId(contract.id);
                          setContractForm(toContractFormState(contract));
                          setContractFeedback(null);
                        }}
                      >
                        <div className="entity-card__header">
                          <strong>{contract.contractType}</strong>
                          <StatusBadge value={contract.isActive ? 'active' : 'inactive'} />
                        </div>
                        <div className="entity-card__body">
                          <p>{shortText(contract.positionName)}</p>
                          <p>{formatDate(contract.startsAt)} - {contract.endsAt ? formatDate(contract.endsAt) : 'vigente'}</p>
                        </div>
                        <div className="entity-card__meta">
                          <span>{contract.branchId ? branchNameById.get(contract.branchId) || `Sede #${contract.branchId}` : 'Global'}</span>
                          <span>{formatDateTime(contract.updatedAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : selectedPersonDetail ? (
                  <EmptyState title="Sin contratos" description="Todavia no hay contratos operativos vinculados a esta persona." icon={<BriefcaseBusiness size={22} />} compact />
                ) : null}

                {selectedPersonDetail ? (
                  <form className="editor-form" onSubmit={handleContractSubmit}>
                    <SectionHeading eyebrow="Editor" title={contractMode === 'create' ? 'Registrar contrato' : 'Editar contrato'} description="Los campos siguen la estructura real usada hoy en `studios_models`." />

                    <div className="field-grid two-columns">
                      <Field label="Tipo de contrato" htmlFor="person-contract-type">
                        <SelectInput id="person-contract-type" value={contractForm.contractType} onChange={(event) => setContractForm((current) => ({ ...current, contractType: event.target.value }))} disabled={!canEdit} required>
                          <option value="">Selecciona</option>
                          {contractTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>

                      <Field label="Numero de contrato" htmlFor="person-contract-number">
                        <TextInput id="person-contract-number" value={contractForm.contractNumber} onChange={(event) => setContractForm((current) => ({ ...current, contractNumber: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Cargo" htmlFor="person-contract-position">
                        <TextInput id="person-contract-position" value={contractForm.positionName} onChange={(event) => setContractForm((current) => ({ ...current, positionName: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Area" htmlFor="person-contract-area">
                        <TextInput id="person-contract-area" value={contractForm.areaName} onChange={(event) => setContractForm((current) => ({ ...current, areaName: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Ciudad" htmlFor="person-contract-city">
                        <TextInput id="person-contract-city" value={contractForm.cityName} onChange={(event) => setContractForm((current) => ({ ...current, cityName: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Tipo de comision" htmlFor="person-contract-commission-type">
                        <SelectInput id="person-contract-commission-type" value={contractForm.commissionType} onChange={(event) => setContractForm((current) => ({ ...current, commissionType: event.target.value }))} disabled={!canEdit}>
                          {commissionTypeOptions.map((option) => <option key={option.value || 'blank'} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>

                      <Field label="Porcentaje" htmlFor="person-contract-commission-percent">
                        <TextInput id="person-contract-commission-percent" value={contractForm.commissionPercent} onChange={(event) => setContractForm((current) => ({ ...current, commissionPercent: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Meta" htmlFor="person-contract-goal-amount">
                        <TextInput id="person-contract-goal-amount" value={contractForm.goalAmount} onChange={(event) => setContractForm((current) => ({ ...current, goalAmount: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Inicio" htmlFor="person-contract-starts-at">
                        <TextInput id="person-contract-starts-at" type="date" value={contractForm.startsAt} onChange={(event) => setContractForm((current) => ({ ...current, startsAt: event.target.value }))} disabled={!canEdit} required />
                      </Field>

                      <Field label="Fin" htmlFor="person-contract-ends-at">
                        <TextInput id="person-contract-ends-at" type="date" value={contractForm.endsAt} onChange={(event) => setContractForm((current) => ({ ...current, endsAt: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Salario mensual" htmlFor="person-contract-monthly-salary">
                        <TextInput id="person-contract-monthly-salary" value={contractForm.monthlySalary} onChange={(event) => setContractForm((current) => ({ ...current, monthlySalary: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Salario quincenal" htmlFor="person-contract-biweekly-salary">
                        <TextInput id="person-contract-biweekly-salary" value={contractForm.biweeklySalary} onChange={(event) => setContractForm((current) => ({ ...current, biweeklySalary: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Salario diario" htmlFor="person-contract-daily-salary">
                        <TextInput id="person-contract-daily-salary" value={contractForm.dailySalary} onChange={(event) => setContractForm((current) => ({ ...current, dailySalary: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Dotacion" htmlFor="person-contract-uniform-amount">
                        <TextInput id="person-contract-uniform-amount" value={contractForm.uniformAmount} onChange={(event) => setContractForm((current) => ({ ...current, uniformAmount: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Riesgo ARL" htmlFor="person-contract-arl-risk-level">
                        <SelectInput id="person-contract-arl-risk-level" value={contractForm.arlRiskLevel} onChange={(event) => setContractForm((current) => ({ ...current, arlRiskLevel: event.target.value }))} disabled={!canEdit}>
                          <option value="">Selecciona</option>
                          {arlRiskLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>
                    </div>

                    <div className="field-grid two-columns">
                      <CheckboxField checked={contractForm.hasWithholding} onChange={(checked) => setContractForm((current) => ({ ...current, hasWithholding: checked }))} label="Aplica retefuente" disabled={!canEdit} />
                      <CheckboxField checked={contractForm.hasSena} onChange={(checked) => setContractForm((current) => ({ ...current, hasSena: checked }))} label="Aporta SENA" disabled={!canEdit} />
                      <CheckboxField checked={contractForm.hasCompensationBox} onChange={(checked) => setContractForm((current) => ({ ...current, hasCompensationBox: checked }))} label="Caja de compensacion" disabled={!canEdit} />
                      <CheckboxField checked={contractForm.hasIcbf} onChange={(checked) => setContractForm((current) => ({ ...current, hasIcbf: checked }))} label="Aporta ICBF" disabled={!canEdit} />
                      <CheckboxField checked={contractForm.isActive} onChange={(checked) => setContractForm((current) => ({ ...current, isActive: checked }))} label="Contrato activo" disabled={!canEdit} />
                    </div>

                    {canEdit ? (
                      <div className="form-actions-row">
                        <ActionButton type="submit" disabled={isSavingContract}>
                          <Save size={16} />
                          {isSavingContract ? 'Guardando...' : contractMode === 'create' ? 'Agregar contrato' : 'Guardar contrato'}
                        </ActionButton>
                        {contractMode === 'edit' ? <ActionButton variant="secondary" onClick={startContractCreate}>Nuevo</ActionButton> : null}
                      </div>
                    ) : null}
                  </form>
                ) : null}
              </Panel>
            </div>

            <div className="two-column-grid">
              <Panel>
                <SectionHeading
                  eyebrow="Documentos"
                  title="Soportes y referencias legacy"
                  description={
                    selectedPersonDetail
                      ? `${pluralize(selectedPersonDetail.documents.length, 'documento cargado', 'documentos cargados')} para esta persona.`
                      : 'Gestiona metadata alineada al esquema real `documents` del sistema actual.'
                  }
                  actions={
                    canEdit && selectedPersonDetail ? (
                      <ActionButton variant="secondary" className="small-button" onClick={startDocumentCreate}>
                        <Plus size={16} />
                        Nuevo documento
                      </ActionButton>
                    ) : null
                  }
                />

                {documentFeedback ? <InlineMessage tone={documentFeedback.tone}>{documentFeedback.message}</InlineMessage> : null}

                {selectedPersonDetail?.documents.length ? (
                  <div className="entity-card-list">
                    {selectedPersonDetail.documents.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        className={`entity-card ${selectedDocumentId === document.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          setDocumentMode('edit');
                          setSelectedDocumentId(document.id);
                          setDocumentForm(toDocumentFormState(document));
                          setDocumentFeedback(null);
                          setDocumentFile(null);
                        }}
                      >
                        <div className="entity-card__header">
                          <strong>{document.label}</strong>
                          <StatusBadge value={document.status} />
                        </div>
                        <div className="entity-card__body">
                          <p>{shortText(document.legacyLabel)}</p>
                          <p>{shortText(document.documentType)}</p>
                          <p>{getDocumentStorageLabel(resolveDocumentStorageState(document))}</p>
                        </div>
                        <div className="entity-card__meta">
                          <span>{document.expiresAt ? `Vence ${formatDate(document.expiresAt)}` : 'Sin vencimiento'}</span>
                          <span>{formatDateTime(document.updatedAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : selectedPersonDetail ? (
                  <EmptyState title="Sin documentos" description="Todavia no hay soportes vinculados a esta persona en el backend nuevo." icon={<FileText size={22} />} compact />
                ) : null}

                {selectedPersonDetail ? (
                  <form className="editor-form" onSubmit={handleDocumentSubmit}>
                    <SectionHeading
                      eyebrow="Editor"
                      title={documentMode === 'create' ? 'Registrar documento' : 'Editar documento'}
                      description="Los uploads nuevos viven en el storage del greenfield; las referencias legacy pueden quedar solo con URL publica mientras se migra el binario."
                    />

                    {selectedDocument ? (
                      <InlineMessage tone="info">
                        {selectedDocumentStorageState === 'managed'
                          ? 'Este documento ya vive en el storage gestionado del greenfield.'
                          : selectedDocumentStorageState === 'external'
                            ? 'Este documento sigue apuntando a una referencia externa legacy. Puedes migrarlo sin editar la metadata principal.'
                            : 'Este documento aun no tiene un archivo resolvible asociado.'}
                      </InlineMessage>
                    ) : null}

                    <div className="field-grid two-columns">
                      <Field label="Etiqueta interna" htmlFor="person-document-label">
                        <TextInput id="person-document-label" value={documentForm.label} onChange={(event) => setDocumentForm((current) => ({ ...current, label: event.target.value }))} disabled={!canEdit} required />
                      </Field>

                      <Field label="Codigo legacy" htmlFor="person-document-legacy-label">
                        <SelectInput id="person-document-legacy-label" value={documentForm.legacyLabel} onChange={(event) => setDocumentForm((current) => ({ ...current, legacyLabel: event.target.value }))} disabled={!canEdit}>
                          <option value="">Selecciona</option>
                          {documentLegacyLabelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>

                      <Field label="Tipo documental" htmlFor="person-document-type-detail">
                        <SelectInput id="person-document-type-detail" value={documentForm.documentType} onChange={(event) => setDocumentForm((current) => ({ ...current, documentType: event.target.value }))} disabled={!canEdit}>
                          {documentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>

                      <Field label="Tipo de archivo" htmlFor="person-document-file-type">
                        <TextInput id="person-document-file-type" value={documentForm.fileType} onChange={(event) => setDocumentForm((current) => ({ ...current, fileType: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Numero o referencia" htmlFor="person-document-number-detail">
                        <TextInput id="person-document-number-detail" value={documentForm.documentNumber} onChange={(event) => setDocumentForm((current) => ({ ...current, documentNumber: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Bucket" htmlFor="person-document-storage-bucket">
                        <SelectInput id="person-document-storage-bucket" value={documentForm.storageBucket} onChange={(event) => setDocumentForm((current) => ({ ...current, storageBucket: event.target.value }))} disabled={!canEdit}>
                          <option value="">Selecciona</option>
                          {storageBucketOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SelectInput>
                      </Field>

                      <Field label="Storage path" htmlFor="person-document-storage-path">
                        <TextInput id="person-document-storage-path" value={documentForm.storagePath} onChange={(event) => setDocumentForm((current) => ({ ...current, storagePath: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="URL publica" htmlFor="person-document-public-url">
                        <TextInput id="person-document-public-url" value={documentForm.publicUrl} onChange={(event) => setDocumentForm((current) => ({ ...current, publicUrl: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field
                        label="Archivo"
                        htmlFor="person-document-file-upload"
                        hint="Si adjuntas un archivo nuevo, se sube al bucket real y se registra con metadata legacy."
                      >
                        <TextInput
                          id="person-document-file-upload"
                          type="file"
                          onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                          disabled={!canEdit || documentMode === 'edit'}
                        />
                      </Field>

                      <Field label="Emitido el" htmlFor="person-document-issued-at">
                        <TextInput id="person-document-issued-at" type="date" value={documentForm.issuedAt} onChange={(event) => setDocumentForm((current) => ({ ...current, issuedAt: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Vence el" htmlFor="person-document-expires-at">
                        <TextInput id="person-document-expires-at" type="date" value={documentForm.expiresAt} onChange={(event) => setDocumentForm((current) => ({ ...current, expiresAt: event.target.value }))} disabled={!canEdit} />
                      </Field>

                      <Field label="Estado documental" htmlFor="person-document-status">
                        <SelectInput id="person-document-status" value={documentForm.status} onChange={(event) => setDocumentForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} disabled={!canEdit}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </SelectInput>
                      </Field>
                    </div>

                    <Field label="Notas" htmlFor="person-document-notes">
                      <TextAreaInput id="person-document-notes" rows={3} value={documentForm.notes} onChange={(event) => setDocumentForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canEdit} />
                    </Field>

                    {canEdit ? (
                      <div className="form-actions-row">
                        <ActionButton type="submit" disabled={isSavingDocument}>
                          <Save size={16} />
                          {isSavingDocument ? 'Guardando...' : documentMode === 'create' ? 'Agregar documento' : 'Guardar documento'}
                        </ActionButton>
                        {selectedDocument && selectedDocumentStorageState === 'external' ? (
                          <ActionButton
                            variant="secondary"
                            onClick={() => void handleDocumentMigration()}
                            disabled={isMigratingDocument}
                          >
                            <Save size={16} />
                            {isMigratingDocument ? 'Migrando...' : 'Migrar a storage'}
                          </ActionButton>
                        ) : null}
                        {selectedDocument && (selectedDocument.publicUrl || selectedDocument.storagePath) ? (
                          <ActionButton
                            variant="secondary"
                            onClick={() => void openDocument(selectedDocument)}
                            disabled={isResolvingDocumentAccess}
                          >
                            <ExternalLink size={16} />
                            {isResolvingDocumentAccess ? 'Abriendo...' : 'Ver archivo'}
                          </ActionButton>
                        ) : null}
                        {documentMode === 'edit' ? <ActionButton variant="secondary" onClick={startDocumentCreate}>Nuevo</ActionButton> : null}
                      </div>
                    ) : null}
                  </form>
                ) : null}
              </Panel>

              <Panel>
                <SectionHeading eyebrow="Historial" title="Linea de tiempo de la ficha" description="Eventos auditados de la persona, sus contratos y sus documentos." />

                {personDetailError ? <InlineMessage tone="error">{personDetailError}</InlineMessage> : null}
                {personDetailQuery.isPending && !selectedPersonDetail ? (
                  <InlineMessage tone="info">Cargando historial de la persona...</InlineMessage>
                ) : selectedPersonDetail?.history.length ? (
                  <div className="timeline-list">
                    {selectedPersonDetail.history.map((item) => (
                      <article key={item.id} className="timeline-item">
                        <div>
                          <strong>{item.summary}</strong>
                          <p>
                            {item.module}.{item.action}
                            {item.userId ? ` · usuario #${item.userId}` : ''}
                          </p>
                        </div>
                        <div className="timeline-meta">
                          <span>{formatDateTime(item.createdAt)}</span>
                          <StatusBadge value={item.status ?? (item.branchId ? `sede ${item.branchId}` : 'global')} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sin eventos visibles" description="Todavia no hay trazas adicionales para la persona seleccionada." compact />
                )}
              </Panel>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
