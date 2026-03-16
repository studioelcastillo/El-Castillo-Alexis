import 'reflect-metadata';
import { Pool } from 'pg';
import { In, IsNull, Repository } from 'typeorm';
import { AppDataSource } from './data-source';
import { Branch } from './entities/branch.entity';
import { Company } from './entities/company.entity';
import { PersonContract } from './entities/person-contract.entity';
import { PersonDocument } from './entities/person-document.entity';
import { Person } from './entities/person.entity';
import { PersonType, RecordStatus } from './entities/enums';

type LegacyUserRow = {
  user_id: number;
  std_id: number | null;
  prof_name: string | null;
  user_identification_type: string | null;
  user_identification: string | null;
  user_name: string | null;
  user_name2: string | null;
  user_surname: string | null;
  user_surname2: string | null;
  user_email: string | null;
  user_personal_email: string | null;
  user_telephone: string | null;
  user_address: string | null;
  user_birthdate: string | null;
  user_sex: string | null;
  user_rh: string | null;
  user_issued_in: string | null;
  user_model_category: string | null;
  user_active: boolean | number | null;
  user_photo_url: string | null;
  user_bank_entity: string | null;
  user_bank_account: string | null;
  user_bank_account_type: string | null;
  user_beneficiary_name: string | null;
  user_beneficiary_document: string | null;
  user_beneficiary_document_type: string | null;
};

type LegacyContractRow = {
  stdmod_id: number;
  user_id_model: number;
  std_id: number | null;
  stdmod_start_at: string | null;
  stdmod_finish_at: string | null;
  stdmod_active: boolean | number | null;
  stdmod_contract_type: string | null;
  stdmod_contract_number: string | null;
  stdmod_commission_type: string | null;
  stdmod_percent: string | number | null;
  stdmod_goal: string | number | null;
  stdmod_rtefte: boolean | number | null;
  stdmod_monthly_salary: string | number | null;
  stdmod_biweekly_salary: string | number | null;
  stdmod_daily_salary: string | number | null;
  stdmod_dotacion_amount: string | number | null;
  stdmod_has_sena: boolean | number | null;
  stdmod_has_caja_compensacion: boolean | number | null;
  stdmod_has_icbf: boolean | number | null;
  stdmod_arl_risk_level: string | null;
  stdmod_position: string | null;
  stdmod_area: string | null;
  city_name: string | null;
};

type LegacyDocumentRow = {
  doc_id: number;
  user_id: number;
  doc_url: string | null;
  doc_label: string | null;
  doc_type: string | null;
  created_at: string | null;
};

const LEGACY_DOC_LABEL_NAMES: Record<string, string> = {
  IMG_ID_FRONT: 'Identificacion Frente',
  IMG_ID_BACK: 'Identificacion Reverso',
  IMG_ID_HAND: 'Identificacion en Mano',
  IMG_ID_FRONTBACK: 'Identificacion Frente y Reverso',
  IMG_PROFILE: 'Foto Perfil',
  IMG_OTHER: 'Otro Documento / Foto con Fecha',
};

async function run() {
  const legacyDatabaseUrl = process.env.LEGACY_DATABASE_URL;
  const targetCompanyId = Number(process.env.LEGACY_TARGET_COMPANY_ID);

  if (!legacyDatabaseUrl) {
    throw new Error('LEGACY_DATABASE_URL is required');
  }

  if (!Number.isInteger(targetCompanyId) || targetCompanyId <= 0) {
    throw new Error('LEGACY_TARGET_COMPANY_ID must be a positive integer');
  }

  const dryRun = process.env.LEGACY_IMPORT_DRY_RUN !== 'false';
  const studioId = parseOptionalNumber(process.env.LEGACY_STUDIO_ID);
  const userLimit = parseOptionalNumber(process.env.LEGACY_USER_LIMIT);
  const defaultBranchId = parseOptionalNumber(process.env.LEGACY_DEFAULT_BRANCH_ID);
  const documentBaseUrl = normalizeString(process.env.LEGACY_DOCUMENT_PUBLIC_BASE_URL);
  const branchMap = parseBranchMap(process.env.LEGACY_BRANCH_MAP_JSON);

  const legacyPool = new Pool({ connectionString: legacyDatabaseUrl, ssl: legacyDatabaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined });

  try {
    await AppDataSource.initialize();

    const companyRepository = AppDataSource.getRepository(Company);
    const branchRepository = AppDataSource.getRepository(Branch);
    const personRepository = AppDataSource.getRepository(Person);
    const contractRepository = AppDataSource.getRepository(PersonContract);
    const documentRepository = AppDataSource.getRepository(PersonDocument);

    const company = await companyRepository.findOne({ where: { id: targetCompanyId, deletedAt: IsNull() } });
    if (!company) {
      throw new Error(`Target company ${targetCompanyId} was not found`);
    }

    await validateBranchTargets(branchRepository, targetCompanyId, defaultBranchId, branchMap);

    const users = await fetchLegacyUsers(legacyPool, studioId, userLimit);
    const userIds = users.map((user) => user.user_id);
    const contracts = userIds.length ? await fetchLegacyContracts(legacyPool, userIds, studioId) : [];
    const documents = userIds.length ? await fetchLegacyDocuments(legacyPool, userIds) : [];

    const contractsByUser = groupBy(contracts, (item) => item.user_id_model);
    const documentsByUser = groupBy(documents, (item) => item.user_id);

    let createdPeople = 0;
    let updatedPeople = 0;
    let createdContracts = 0;
    let updatedContracts = 0;
    let createdDocuments = 0;
    let updatedDocuments = 0;

    for (const legacyUser of users) {
      const personPayload = mapLegacyUserToPerson(legacyUser, targetCompanyId, resolveBranchId(branchMap, defaultBranchId, legacyUser.std_id));
      const existingPerson = await findExistingPerson(personRepository, targetCompanyId, personPayload.documentNumber, personPayload.email, personPayload.personalEmail);

      let person = existingPerson;
      if (!dryRun) {
        if (existingPerson) {
          await personRepository.update({ id: existingPerson.id }, personPayload);
          person = await personRepository.findOneByOrFail({ id: existingPerson.id });
          updatedPeople += 1;
        } else {
          person = await personRepository.save(personRepository.create(personPayload));
          createdPeople += 1;
        }
      }

      const resolvedPerson = person ?? personRepository.create(personPayload);
      const legacyContracts = contractsByUser.get(legacyUser.user_id) ?? [];
      const legacyDocuments = documentsByUser.get(legacyUser.user_id) ?? [];

      for (const legacyContract of legacyContracts) {
        const contractPayload = mapLegacyContractToPersonContract(legacyContract, resolvedPerson.id, targetCompanyId, resolveBranchId(branchMap, defaultBranchId, legacyContract.std_id));
        const existingContract = resolvedPerson.id
          ? await findExistingContract(contractRepository, resolvedPerson.id, contractPayload.contractNumber, contractPayload.contractType, contractPayload.startsAt)
          : null;

        if (!dryRun && resolvedPerson.id) {
          if (existingContract) {
            await contractRepository.update({ id: existingContract.id }, contractPayload);
            updatedContracts += 1;
          } else {
            await contractRepository.save(contractRepository.create(contractPayload));
            createdContracts += 1;
          }
        }
      }

      for (const legacyDocument of legacyDocuments) {
        const documentPayload = mapLegacyDocumentToPersonDocument(
          legacyDocument,
          resolvedPerson.id,
          targetCompanyId,
          resolveBranchId(branchMap, defaultBranchId, legacyUser.std_id),
          documentBaseUrl,
        );
        const existingDocument = resolvedPerson.id
          ? await findExistingDocument(documentRepository, resolvedPerson.id, documentPayload.legacyLabel, documentPayload.storagePath, documentPayload.publicUrl)
          : null;

        if (!dryRun && resolvedPerson.id) {
          if (existingDocument) {
            await documentRepository.update({ id: existingDocument.id }, documentPayload);
            updatedDocuments += 1;
          } else {
            await documentRepository.save(documentRepository.create(documentPayload));
            createdDocuments += 1;
          }
        }
      }
    }

    process.stdout.write(`${dryRun ? '[DRY RUN] ' : ''}Legacy import analyzed ${users.length} users\n`);
    process.stdout.write(`People created=${createdPeople} updated=${updatedPeople}\n`);
    process.stdout.write(`Contracts created=${createdContracts} updated=${updatedContracts}\n`);
    process.stdout.write(`Documents created=${createdDocuments} updated=${updatedDocuments}\n`);
  } finally {
    await legacyPool.end();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function fetchLegacyUsers(pool: Pool, studioId: number | null, userLimit: number | null) {
  const params: Array<number> = [];
  const filters: string[] = [];

  if (studioId) {
    params.push(studioId);
    filters.push(`(
      u.std_id = $${params.length}
      OR EXISTS (
        SELECT 1
        FROM studios_models sm
        WHERE sm.user_id_model = u.user_id
          AND sm.std_id = $${params.length}
      )
    )`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const limitClause = userLimit ? `LIMIT ${userLimit}` : '';
  const result = await pool.query<LegacyUserRow>(`
    SELECT
      u.user_id,
      u.std_id,
      p.prof_name,
      u.user_identification_type,
      u.user_identification,
      u.user_name,
      u.user_name2,
      u.user_surname,
      u.user_surname2,
      u.user_email,
      u.user_personal_email,
      u.user_telephone,
      u.user_address,
      u.user_birthdate,
      u.user_sex,
      u.user_rh,
      u.user_issued_in,
      u.user_model_category,
      u.user_active,
      u.user_photo_url,
      u.user_bank_entity,
      u.user_bank_account,
      u.user_bank_account_type,
      u.user_beneficiary_name,
      u.user_beneficiary_document,
      u.user_beneficiary_document_type
    FROM users u
    LEFT JOIN profiles p ON p.prof_id = u.prof_id
    ${whereClause}
    ORDER BY u.user_id ASC
    ${limitClause}
  `, params);

  return result.rows;
}

async function fetchLegacyContracts(pool: Pool, userIds: number[], studioId: number | null) {
  const params: unknown[] = [userIds];
  const studioFilter = studioId ? `AND sm.std_id = $2` : '';
  if (studioId) {
    params.push(studioId);
  }

  const result = await pool.query<LegacyContractRow>(`
    SELECT
      sm.stdmod_id,
      sm.user_id_model,
      sm.std_id,
      sm.stdmod_start_at,
      sm.stdmod_finish_at,
      sm.stdmod_active,
      sm.stdmod_contract_type,
      sm.stdmod_contract_number,
      sm.stdmod_commission_type,
      sm.stdmod_percent,
      sm.stdmod_goal,
      sm.stdmod_rtefte,
      sm.stdmod_monthly_salary,
      sm.stdmod_biweekly_salary,
      sm.stdmod_daily_salary,
      sm.stdmod_dotacion_amount,
      sm.stdmod_has_sena,
      sm.stdmod_has_caja_compensacion,
      sm.stdmod_has_icbf,
      sm.stdmod_arl_risk_level,
      sm.stdmod_position,
      sm.stdmod_area,
      c.city_name
    FROM studios_models sm
    LEFT JOIN cities c ON c.city_id = sm.city_id
    WHERE sm.user_id_model = ANY($1)
    ${studioFilter}
    ORDER BY sm.stdmod_id ASC
  `, params);

  return result.rows;
}

async function fetchLegacyDocuments(pool: Pool, userIds: number[]) {
  const result = await pool.query<LegacyDocumentRow>(`
    SELECT doc_id, user_id, doc_url, doc_label, doc_type, created_at
    FROM documents
    WHERE user_id = ANY($1)
    ORDER BY doc_id ASC
  `, [userIds]);

  return result.rows;
}

function mapLegacyUserToPerson(legacyUser: LegacyUserRow, companyId: number, branchId: number | null) {
  const firstName = [legacyUser.user_name, legacyUser.user_name2].map(normalizeString).filter(Boolean).join(' ');
  const lastName = [legacyUser.user_surname, legacyUser.user_surname2].map(normalizeString).filter(Boolean).join(' ');

  return {
    companyId,
    branchId,
    personType: mapLegacyProfileToPersonType(legacyUser.prof_name),
    firstName: firstName || 'Sin nombre',
    lastName: lastName || 'Sin apellido',
    documentType: normalizeString(legacyUser.user_identification_type),
    documentNumber: normalizeString(legacyUser.user_identification),
    issuedIn: normalizeString(legacyUser.user_issued_in),
    email: normalizeEmail(legacyUser.user_email),
    personalEmail: normalizeEmail(legacyUser.user_personal_email),
    phone: normalizeString(legacyUser.user_telephone),
    address: normalizeString(legacyUser.user_address),
    birthDate: normalizeString(legacyUser.user_birthdate),
    sex: normalizeString(legacyUser.user_sex),
    bloodType: normalizeString(legacyUser.user_rh),
    modelCategory: normalizeString(legacyUser.user_model_category),
    photoUrl: normalizeString(legacyUser.user_photo_url),
    bankEntity: normalizeString(legacyUser.user_bank_entity),
    bankAccountType: normalizeString(legacyUser.user_bank_account_type),
    bankAccountNumber: normalizeString(legacyUser.user_bank_account),
    beneficiaryName: normalizeString(legacyUser.user_beneficiary_name),
    beneficiaryDocument: normalizeString(legacyUser.user_beneficiary_document),
    beneficiaryDocumentType: normalizeString(legacyUser.user_beneficiary_document_type),
    status: isTruthy(legacyUser.user_active) ? RecordStatus.ACTIVE : RecordStatus.INACTIVE,
    notes: `Importado desde legacy users.user_id=${legacyUser.user_id}`,
  };
}

function mapLegacyContractToPersonContract(legacyContract: LegacyContractRow, personId: number, companyId: number, branchId: number | null) {
  return {
    personId,
    companyId,
    branchId,
    contractType: normalizeString(legacyContract.stdmod_contract_type) || 'SIN TIPO',
    contractNumber: normalizeString(legacyContract.stdmod_contract_number) || `LEGACY-${legacyContract.stdmod_id}`,
    commissionType: normalizeString(legacyContract.stdmod_commission_type),
    commissionPercent: normalizeNumeric(legacyContract.stdmod_percent),
    goalAmount: normalizeNumeric(legacyContract.stdmod_goal),
    positionName: normalizeString(legacyContract.stdmod_position),
    areaName: normalizeString(legacyContract.stdmod_area),
    cityName: normalizeString(legacyContract.city_name),
    startsAt: normalizeString(legacyContract.stdmod_start_at) || new Date().toISOString().slice(0, 10),
    endsAt: normalizeString(legacyContract.stdmod_finish_at),
    monthlySalary: normalizeNumeric(legacyContract.stdmod_monthly_salary),
    biweeklySalary: normalizeNumeric(legacyContract.stdmod_biweekly_salary),
    dailySalary: normalizeNumeric(legacyContract.stdmod_daily_salary),
    uniformAmount: normalizeNumeric(legacyContract.stdmod_dotacion_amount),
    hasWithholding: isTruthy(legacyContract.stdmod_rtefte),
    hasSena: isTruthy(legacyContract.stdmod_has_sena),
    hasCompensationBox: isTruthy(legacyContract.stdmod_has_caja_compensacion),
    hasIcbf: isTruthy(legacyContract.stdmod_has_icbf),
    arlRiskLevel: normalizeString(legacyContract.stdmod_arl_risk_level),
    isActive: isTruthy(legacyContract.stdmod_active),
  };
}

function mapLegacyDocumentToPersonDocument(
  legacyDocument: LegacyDocumentRow,
  personId: number,
  companyId: number,
  branchId: number | null,
  documentBaseUrl: string | null,
) {
  const documentUrl = buildLegacyDocumentUrl(documentBaseUrl, legacyDocument.doc_url);
  const legacyLabel = normalizeString(legacyDocument.doc_label);
  return {
    personId,
    companyId,
    branchId,
    label: legacyLabel ? LEGACY_DOC_LABEL_NAMES[legacyLabel] || legacyLabel : `Documento legacy ${legacyDocument.doc_id}`,
    legacyLabel,
    documentType: normalizeString(legacyDocument.doc_type) || 'legacy_document',
    fileType: normalizeString(legacyDocument.doc_type),
    documentNumber: null,
    storageBucket: null,
    storagePath: normalizeString(legacyDocument.doc_url),
    publicUrl: documentUrl,
    issuedAt: null,
    expiresAt: null,
    status: RecordStatus.ACTIVE,
    notes: `Importado desde legacy documents.doc_id=${legacyDocument.doc_id} como referencia externa; el binario no se copio al storage nuevo.`,
  };
}

async function findExistingPerson(
  repository: Repository<Person>,
  companyId: number,
  documentNumber: string | null,
  email: string | null,
  personalEmail: string | null,
) {
  const qb = repository.createQueryBuilder('person');
  qb.where('person.company_id = :companyId', { companyId })
    .andWhere('person.deleted_at IS NULL');

  if (documentNumber) {
    qb.andWhere('person.document_number = :documentNumber', { documentNumber });
    return qb.getOne();
  }

  const emails = [email, personalEmail].filter((value): value is string => Boolean(value));
  if (emails.length) {
    qb.andWhere('(person.email IN (:...emails) OR person.personal_email IN (:...emails))', { emails });
    return qb.getOne();
  }

  return null;
}

async function findExistingContract(
  repository: Repository<PersonContract>,
  personId: number,
  contractNumber: string | null,
  contractType: string,
  startsAt: string,
) {
  if (contractNumber) {
    return repository.findOne({ where: { personId, contractNumber, deletedAt: IsNull() } });
  }

  return repository.findOne({ where: { personId, contractType, startsAt, deletedAt: IsNull() } });
}

async function findExistingDocument(
  repository: Repository<PersonDocument>,
  personId: number,
  legacyLabel: string | null,
  storagePath: string | null,
  publicUrl: string | null,
) {
  const qb = repository.createQueryBuilder('document');
  qb.where('document.person_id = :personId', { personId })
    .andWhere('document.deleted_at IS NULL');

  if (legacyLabel) {
    qb.andWhere('document.legacy_label = :legacyLabel', { legacyLabel });
  }

  if (storagePath) {
    qb.andWhere('document.storage_path = :storagePath', { storagePath });
    return qb.getOne();
  }

  if (publicUrl) {
    qb.andWhere('document.public_url = :publicUrl', { publicUrl });
    return qb.getOne();
  }

  return qb.getOne();
}

async function validateBranchTargets(
  branchRepository: Repository<Branch>,
  companyId: number,
  defaultBranchId: number | null,
  branchMap: Map<number, number>,
) {
  const branchIds = [defaultBranchId, ...branchMap.values()].filter((value): value is number => value !== null);
  if (!branchIds.length) {
    return;
  }

  const branches = await branchRepository.find({ where: { id: In(branchIds), companyId, deletedAt: IsNull() } });
  const existing = new Set(branches.map((branch) => branch.id));
  for (const branchId of branchIds) {
    if (!existing.has(branchId)) {
      throw new Error(`Branch ${branchId} does not belong to target company ${companyId}`);
    }
  }
}

function groupBy<T, TKey>(items: T[], getKey: (item: T) => TKey) {
  const map = new Map<TKey, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return map;
}

function parseBranchMap(raw: string | undefined) {
  const map = new Map<number, number>();
  if (!raw) {
    return map;
  }

  const parsed = JSON.parse(raw) as Record<string, number>;
  for (const [legacyKey, branchId] of Object.entries(parsed)) {
    const legacyStudioId = Number(legacyKey);
    if (Number.isInteger(legacyStudioId) && Number.isInteger(branchId)) {
      map.set(legacyStudioId, branchId);
    }
  }
  return map;
}

function resolveBranchId(branchMap: Map<number, number>, defaultBranchId: number | null, legacyStudioId: number | null) {
  if (legacyStudioId && branchMap.has(legacyStudioId)) {
    return branchMap.get(legacyStudioId) ?? null;
  }

  return defaultBranchId;
}

function mapLegacyProfileToPersonType(profileName: string | null) {
  const normalized = normalizeString(profileName)?.toUpperCase();
  if (normalized === 'MODEL' || normalized === 'MODEL_SATELITE') {
    return PersonType.MODEL;
  }

  if (normalized === 'RRHH' || normalized === 'MONITOR' || normalized === 'COORDINATOR' || normalized === 'ADMIN') {
    return PersonType.STAFF;
  }

  return PersonType.OTHER;
}

function buildLegacyDocumentUrl(baseUrl: string | null, docUrl: string | null) {
  const normalized = normalizeString(docUrl);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, '')}/images/models/documents/${normalized.replace(/^\//, '')}`;
}

function normalizeString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizeNumeric(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function isTruthy(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
