import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { ObjectStorageService } from '../../common/services/object-storage.service';
import {
  assertBranchAccess,
  resolveBranchFilter,
  resolveWritableBranchId,
} from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Branch } from '../../database/entities/branch.entity';
import { PersonContract } from '../../database/entities/person-contract.entity';
import { PersonDocument } from '../../database/entities/person-document.entity';
import { Person } from '../../database/entities/person.entity';
import { RecordStatus } from '../../database/entities/enums';
import { CreatePersonContractDto } from './dto/create-person-contract.dto';
import { CreatePersonDocumentDto } from './dto/create-person-document.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { PeopleQueryDto } from './dto/people-query.dto';
import {
  buildPersonDocumentStoragePath,
  extractDocumentFileExtension,
  extractDocumentFileNameFromUrl,
  mergeDocumentNotes,
  resolvePersonDocumentStorageState,
} from './person-document-storage';
import { UpdatePersonContractDto } from './dto/update-person-contract.dto';
import { UpdatePersonDocumentDto } from './dto/update-person-document.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type UploadedBinaryFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class PeopleService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly objectStorageService: ObjectStorageService,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(PersonContract)
    private readonly personContractRepository: Repository<PersonContract>,
    @InjectRepository(PersonDocument)
    private readonly personDocumentRepository: Repository<PersonDocument>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async list(currentUser: CurrentUserContext, query: PeopleQueryDto) {
    const qb = this.personRepository.createQueryBuilder('person');
    qb.where('person.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('person.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('person.branch_id = :branchId', { branchId });
    }

    if (query.personType) {
      qb.andWhere('person.person_type = :personType', { personType: query.personType });
    }

    if (query.status) {
      qb.andWhere('person.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        `(
          person.first_name ILIKE :search
          OR person.last_name ILIKE :search
          OR person.document_number ILIKE :search
          OR person.email ILIKE :search
          OR person.personal_email ILIKE :search
          OR person.bank_account_number ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('person.created_at', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializePersonRecord(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const person = await this.findPersonOrFail(currentUser, id);
    return { data: await this.buildPersonDetail(person) };
  }

  async create(currentUser: CurrentUserContext, dto: CreatePersonDto, requestMeta?: RequestMeta) {
    const branchId = resolveWritableBranchId(currentUser, dto.branchId);
    await this.ensureBranch(currentUser.companyId, branchId);

    const person = await this.personRepository.save(
      this.personRepository.create({
        companyId: currentUser.companyId,
        branchId,
        personType: dto.personType,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        documentType: this.normalizeString(dto.documentType),
        documentNumber: this.normalizeString(dto.documentNumber),
        issuedIn: this.normalizeString(dto.issuedIn),
        email: this.normalizeEmail(dto.email),
        personalEmail: this.normalizeEmail(dto.personalEmail),
        phone: this.normalizeString(dto.phone),
        address: this.normalizeString(dto.address),
        birthDate: dto.birthDate || null,
        sex: this.normalizeString(dto.sex),
        bloodType: this.normalizeString(dto.bloodType),
        modelCategory: this.normalizeString(dto.modelCategory),
        photoUrl: this.normalizeString(dto.photoUrl),
        bankEntity: this.normalizeString(dto.bankEntity),
        bankAccountType: this.normalizeString(dto.bankAccountType),
        bankAccountNumber: this.normalizeString(dto.bankAccountNumber),
        beneficiaryName: this.normalizeString(dto.beneficiaryName),
        beneficiaryDocument: this.normalizeString(dto.beneficiaryDocument),
        beneficiaryDocumentType: this.normalizeString(dto.beneficiaryDocumentType),
        status: RecordStatus.ACTIVE,
        notes: this.normalizeString(dto.notes),
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people',
      action: 'create',
      entityType: 'person',
      entityId: String(person.id),
      afterData: this.serializePersonRecord(person),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    const createdPerson = await this.findPersonOrFail(currentUser, person.id);
    return { data: await this.buildPersonDetail(createdPerson) };
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdatePersonDto, requestMeta?: RequestMeta) {
    const existing = await this.findPersonOrFail(currentUser, id);

    const nextBranchId = dto.branchId !== undefined
      ? resolveWritableBranchId(currentUser, dto.branchId)
      : existing.branchId;

    if (dto.branchId !== undefined) {
      await this.ensureBranch(currentUser.companyId, nextBranchId);
    }

    const before = this.serializePersonRecord(existing);

    await this.personRepository.update(
      { id },
      {
        ...(dto.branchId !== undefined ? { branchId: nextBranchId } : {}),
        ...(dto.personType !== undefined ? { personType: dto.personType } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
        ...(dto.documentType !== undefined ? { documentType: this.normalizeString(dto.documentType) } : {}),
        ...(dto.documentNumber !== undefined ? { documentNumber: this.normalizeString(dto.documentNumber) } : {}),
        ...(dto.issuedIn !== undefined ? { issuedIn: this.normalizeString(dto.issuedIn) } : {}),
        ...(dto.email !== undefined ? { email: this.normalizeEmail(dto.email) } : {}),
        ...(dto.personalEmail !== undefined ? { personalEmail: this.normalizeEmail(dto.personalEmail) } : {}),
        ...(dto.phone !== undefined ? { phone: this.normalizeString(dto.phone) } : {}),
        ...(dto.address !== undefined ? { address: this.normalizeString(dto.address) } : {}),
        ...(dto.birthDate !== undefined ? { birthDate: dto.birthDate || null } : {}),
        ...(dto.sex !== undefined ? { sex: this.normalizeString(dto.sex) } : {}),
        ...(dto.bloodType !== undefined ? { bloodType: this.normalizeString(dto.bloodType) } : {}),
        ...(dto.modelCategory !== undefined ? { modelCategory: this.normalizeString(dto.modelCategory) } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: this.normalizeString(dto.photoUrl) } : {}),
        ...(dto.bankEntity !== undefined ? { bankEntity: this.normalizeString(dto.bankEntity) } : {}),
        ...(dto.bankAccountType !== undefined ? { bankAccountType: this.normalizeString(dto.bankAccountType) } : {}),
        ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: this.normalizeString(dto.bankAccountNumber) } : {}),
        ...(dto.beneficiaryName !== undefined ? { beneficiaryName: this.normalizeString(dto.beneficiaryName) } : {}),
        ...(dto.beneficiaryDocument !== undefined ? { beneficiaryDocument: this.normalizeString(dto.beneficiaryDocument) } : {}),
        ...(dto.beneficiaryDocumentType !== undefined ? { beneficiaryDocumentType: this.normalizeString(dto.beneficiaryDocumentType) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const person = await this.findPersonOrFail(currentUser, id);

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people',
      action: 'edit',
      entityType: 'person',
      entityId: String(id),
      beforeData: before,
      afterData: this.serializePersonRecord(person),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: await this.buildPersonDetail(person) };
  }

  async createContract(currentUser: CurrentUserContext, personId: number, dto: CreatePersonContractDto, requestMeta?: RequestMeta) {
    const person = await this.findPersonOrFail(currentUser, personId);

    const contract = await this.personContractRepository.save(
      this.personContractRepository.create({
        personId: person.id,
        companyId: person.companyId,
        branchId: person.branchId,
        contractType: dto.contractType.trim(),
        contractNumber: this.normalizeString(dto.contractNumber),
        commissionType: this.normalizeString(dto.commissionType),
        commissionPercent: this.normalizeNumericString(dto.commissionPercent),
        goalAmount: this.normalizeNumericString(dto.goalAmount),
        positionName: this.normalizeString(dto.positionName),
        areaName: this.normalizeString(dto.areaName),
        cityName: this.normalizeString(dto.cityName),
        startsAt: dto.startsAt,
        endsAt: dto.endsAt || null,
        monthlySalary: this.normalizeNumericString(dto.monthlySalary),
        biweeklySalary: this.normalizeNumericString(dto.biweeklySalary),
        dailySalary: this.normalizeNumericString(dto.dailySalary),
        uniformAmount: this.normalizeNumericString(dto.uniformAmount),
        hasWithholding: Boolean(dto.hasWithholding),
        hasSena: Boolean(dto.hasSena),
        hasCompensationBox: Boolean(dto.hasCompensationBox),
        hasIcbf: Boolean(dto.hasIcbf),
        arlRiskLevel: this.normalizeString(dto.arlRiskLevel),
        isActive: dto.isActive ?? true,
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_contracts',
      action: 'create',
      entityType: 'person_contract',
      entityId: String(contract.id),
      afterData: this.serializePersonContract(contract),
      meta: { personId },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonContract(contract) };
  }

  async updateContract(
    currentUser: CurrentUserContext,
    personId: number,
    contractId: number,
    dto: UpdatePersonContractDto,
    requestMeta?: RequestMeta,
  ) {
    const person = await this.findPersonOrFail(currentUser, personId);
    const existing = await this.personContractRepository.findOne({
      where: { id: contractId, personId: person.id, companyId: currentUser.companyId, deletedAt: IsNull() },
    });
    if (!existing) {
      throw new NotFoundException('Person contract not found');
    }

    const before = this.serializePersonContract(existing);

    await this.personContractRepository.update(
      { id: contractId },
      {
        ...(dto.contractType !== undefined ? { contractType: dto.contractType.trim() } : {}),
        ...(dto.contractNumber !== undefined ? { contractNumber: this.normalizeString(dto.contractNumber) } : {}),
        ...(dto.commissionType !== undefined ? { commissionType: this.normalizeString(dto.commissionType) } : {}),
        ...(dto.commissionPercent !== undefined ? { commissionPercent: this.normalizeNumericString(dto.commissionPercent) } : {}),
        ...(dto.goalAmount !== undefined ? { goalAmount: this.normalizeNumericString(dto.goalAmount) } : {}),
        ...(dto.positionName !== undefined ? { positionName: this.normalizeString(dto.positionName) } : {}),
        ...(dto.areaName !== undefined ? { areaName: this.normalizeString(dto.areaName) } : {}),
        ...(dto.cityName !== undefined ? { cityName: this.normalizeString(dto.cityName) } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt || null } : {}),
        ...(dto.monthlySalary !== undefined ? { monthlySalary: this.normalizeNumericString(dto.monthlySalary) } : {}),
        ...(dto.biweeklySalary !== undefined ? { biweeklySalary: this.normalizeNumericString(dto.biweeklySalary) } : {}),
        ...(dto.dailySalary !== undefined ? { dailySalary: this.normalizeNumericString(dto.dailySalary) } : {}),
        ...(dto.uniformAmount !== undefined ? { uniformAmount: this.normalizeNumericString(dto.uniformAmount) } : {}),
        ...(dto.hasWithholding !== undefined ? { hasWithholding: dto.hasWithholding } : {}),
        ...(dto.hasSena !== undefined ? { hasSena: dto.hasSena } : {}),
        ...(dto.hasCompensationBox !== undefined ? { hasCompensationBox: dto.hasCompensationBox } : {}),
        ...(dto.hasIcbf !== undefined ? { hasIcbf: dto.hasIcbf } : {}),
        ...(dto.arlRiskLevel !== undefined ? { arlRiskLevel: this.normalizeString(dto.arlRiskLevel) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    );

    const contract = await this.personContractRepository.findOneByOrFail({ id: contractId });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_contracts',
      action: 'edit',
      entityType: 'person_contract',
      entityId: String(contract.id),
      beforeData: before,
      afterData: this.serializePersonContract(contract),
      meta: { personId },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonContract(contract) };
  }

  async createDocument(currentUser: CurrentUserContext, personId: number, dto: CreatePersonDocumentDto, requestMeta?: RequestMeta) {
    const person = await this.findPersonOrFail(currentUser, personId);

    const document = await this.personDocumentRepository.save(
      this.personDocumentRepository.create({
        personId: person.id,
        companyId: person.companyId,
        branchId: person.branchId,
        label: dto.label.trim(),
        legacyLabel: this.normalizeString(dto.legacyLabel),
        documentType: dto.documentType.trim(),
        fileType: this.normalizeString(dto.fileType),
        documentNumber: this.normalizeString(dto.documentNumber),
        storageBucket: this.normalizeString(dto.storageBucket),
        storagePath: this.normalizeString(dto.storagePath),
        publicUrl: this.normalizeString(dto.publicUrl),
        issuedAt: dto.issuedAt || null,
        expiresAt: dto.expiresAt || null,
        status: dto.status ?? RecordStatus.ACTIVE,
        notes: this.normalizeString(dto.notes),
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_documents',
      action: 'create',
      entityType: 'person_document',
      entityId: String(document.id),
      afterData: this.serializePersonDocument(document),
      meta: { personId },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonDocument(document) };
  }

  async updateDocument(
    currentUser: CurrentUserContext,
    personId: number,
    documentId: number,
    dto: UpdatePersonDocumentDto,
    requestMeta?: RequestMeta,
  ) {
    const person = await this.findPersonOrFail(currentUser, personId);
    const existing = await this.personDocumentRepository.findOne({
      where: { id: documentId, personId: person.id, companyId: currentUser.companyId, deletedAt: IsNull() },
    });
    if (!existing) {
      throw new NotFoundException('Person document not found');
    }

    const before = this.serializePersonDocument(existing);

    await this.personDocumentRepository.update(
      { id: documentId },
      {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.legacyLabel !== undefined ? { legacyLabel: this.normalizeString(dto.legacyLabel) } : {}),
        ...(dto.documentType !== undefined ? { documentType: dto.documentType.trim() } : {}),
        ...(dto.fileType !== undefined ? { fileType: this.normalizeString(dto.fileType) } : {}),
        ...(dto.documentNumber !== undefined ? { documentNumber: this.normalizeString(dto.documentNumber) } : {}),
        ...(dto.storageBucket !== undefined ? { storageBucket: this.normalizeString(dto.storageBucket) } : {}),
        ...(dto.storagePath !== undefined ? { storagePath: this.normalizeString(dto.storagePath) } : {}),
        ...(dto.publicUrl !== undefined ? { publicUrl: this.normalizeString(dto.publicUrl) } : {}),
        ...(dto.issuedAt !== undefined ? { issuedAt: dto.issuedAt || null } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeString(dto.notes) } : {}),
      },
    );

    const document = await this.personDocumentRepository.findOneByOrFail({ id: documentId });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_documents',
      action: 'edit',
      entityType: 'person_document',
      entityId: String(document.id),
      beforeData: before,
      afterData: this.serializePersonDocument(document),
      meta: { personId },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonDocument(document) };
  }

  async uploadDocument(
    currentUser: CurrentUserContext,
    personId: number,
    file: UploadedBinaryFile | undefined,
    dto: CreatePersonDocumentDto,
    requestMeta?: RequestMeta,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const person = await this.findPersonOrFail(currentUser, personId);
    const storageKey = buildPersonDocumentStoragePath({
      companyId: person.companyId,
      personId: person.id,
      label: dto.legacyLabel ?? dto.label,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
    });
    const upload = await this.objectStorageService.uploadObject({
      bucket: dto.storageBucket || this.objectStorageService.getDefaultBucket(),
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${file.originalname}"`,
    });

    const document = await this.personDocumentRepository.save(
      this.personDocumentRepository.create({
        personId: person.id,
        companyId: person.companyId,
        branchId: person.branchId,
        label: dto.label.trim(),
        legacyLabel: this.normalizeString(dto.legacyLabel),
        documentType: dto.documentType.trim(),
        fileType: this.normalizeString(dto.fileType) || file.mimetype,
        documentNumber: this.normalizeString(dto.documentNumber),
        storageBucket: upload.bucket,
        storagePath: upload.key,
        publicUrl: dto.publicUrl?.trim() || upload.publicUrl,
        issuedAt: dto.issuedAt || null,
        expiresAt: dto.expiresAt || null,
        status: dto.status ?? RecordStatus.ACTIVE,
        notes: this.normalizeString(dto.notes),
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_documents',
      action: 'upload',
      entityType: 'person_document',
      entityId: String(document.id),
      afterData: this.serializePersonDocument(document),
      meta: {
        personId,
        uploadedFileName: file.originalname,
        storageBucket: upload.bucket,
        storagePath: upload.key,
      },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonDocument(document) };
  }

  async migrateDocumentToManagedStorage(
    currentUser: CurrentUserContext,
    personId: number,
    documentId: number,
    requestMeta?: RequestMeta,
  ) {
    const person = await this.findPersonOrFail(currentUser, personId);
    const document = await this.findPersonDocumentOrFail(person.id, currentUser.companyId, documentId);

    if (resolvePersonDocumentStorageState(document) === 'managed') {
      throw new BadRequestException('Person document already lives in managed storage');
    }

    if (!document.publicUrl) {
      throw new BadRequestException('Person document has no external source URL to migrate');
    }

    const before = this.serializePersonDocument(document);
    const downloaded = await this.downloadExternalDocument(document.publicUrl, document);
    const storageKey = buildPersonDocumentStoragePath({
      companyId: person.companyId,
      personId: person.id,
      documentId: document.id,
      label: document.legacyLabel ?? document.label,
      originalFileName: downloaded.originalname,
      mimeType: downloaded.mimetype,
    });
    const upload = await this.objectStorageService.uploadObject({
      bucket: this.objectStorageService.getDefaultBucket(),
      key: storageKey,
      body: downloaded.buffer,
      contentType: downloaded.mimetype,
      contentDisposition: `inline; filename="${downloaded.originalname}"`,
    });

    await this.personDocumentRepository.update(
      { id: document.id },
      {
        storageBucket: upload.bucket,
        storagePath: upload.key,
        publicUrl: upload.publicUrl ?? document.publicUrl,
        fileType: this.normalizeString(document.fileType) || downloaded.mimetype,
        notes: this.normalizeString(
          mergeDocumentNotes(document.notes, 'Migrado a storage gestionado desde referencia externa.'),
        ),
      },
    );

    const migratedDocument = await this.personDocumentRepository.findOneByOrFail({ id: document.id });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'people_documents',
      action: 'migrate_storage',
      entityType: 'person_document',
      entityId: String(migratedDocument.id),
      beforeData: before,
      afterData: this.serializePersonDocument(migratedDocument),
      meta: {
        personId,
        sourceUrl: document.publicUrl,
        uploadedFileName: downloaded.originalname,
        storageBucket: upload.bucket,
        storagePath: upload.key,
      },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: this.serializePersonDocument(migratedDocument) };
  }

  async getDocumentAccess(currentUser: CurrentUserContext, personId: number, documentId: number) {
    const person = await this.findPersonOrFail(currentUser, personId);
    const document = await this.findPersonDocumentOrFail(person.id, currentUser.companyId, documentId);

    if (document.storageBucket && document.storagePath) {
      const url = await this.objectStorageService.getSignedObjectUrl(document.storageBucket, document.storagePath);
      return { data: { url, expiresIn: 900 } };
    }

    if (document.publicUrl) {
      return { data: { url: document.publicUrl, expiresIn: null } };
    }

    throw new NotFoundException('Document has no resolvable file source');
  }

  private async findPersonOrFail(currentUser: CurrentUserContext, id: number) {
    const person = await this.personRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
      relations: { branch: true },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    assertBranchAccess(currentUser, person.branchId, 'Person not found');
    return person;
  }

  private async buildPersonDetail(person: Person) {
    const [contracts, documents, history] = await Promise.all([
      this.personContractRepository.find({
        where: { personId: person.id, companyId: person.companyId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      }),
      this.personDocumentRepository.find({
        where: { personId: person.id, companyId: person.companyId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      }),
      this.listPersonHistory(person.companyId, person.id),
    ]);

    return {
      ...this.serializePersonRecord(person),
      fullName: `${person.firstName} ${person.lastName}`.trim(),
      branchName: person.branch ? `${person.branch.name} (${person.branch.code})` : null,
      contracts: contracts.map((contract) => this.serializePersonContract(contract)),
      documents: documents.map((document) => this.serializePersonDocument(document)),
      history,
    };
  }

  private async listPersonHistory(companyId: number, personId: number) {
    const history = await this.auditLogRepository.find({
      where: { companyId, module: In(['people', 'people_contracts', 'people_documents']) },
      order: { createdAt: 'DESC' },
    });

    return history
      .filter((item) => this.matchesPersonHistory(item, personId))
      .slice(0, 40)
      .map((item) => this.serializePersonHistory(item));
  }

  private matchesPersonHistory(item: AuditLog, personId: number) {
    if (item.entityType === 'person') {
      return item.entityId === String(personId);
    }

    if (item.entityType === 'person_contract' || item.entityType === 'person_document') {
      return this.readNumericMeta(item.meta, 'personId') === personId;
    }

    return false;
  }

  private serializePersonHistory(item: AuditLog) {
    const beforeStatus = this.readStatus(item.beforeData);
    const afterStatus = this.readStatus(item.afterData);
    const documentLabel = this.readStringField(item.afterData, 'label') ?? this.readStringField(item.beforeData, 'label');
    const contractType = this.readStringField(item.afterData, 'contractType') ?? this.readStringField(item.beforeData, 'contractType');

    let summary = `${item.module}.${item.action}`;
    if (item.entityType === 'person') {
      if (item.action === 'create') {
        summary = 'Persona creada';
      } else if (beforeStatus && afterStatus && beforeStatus !== afterStatus) {
        summary = `Estado actualizado de ${beforeStatus} a ${afterStatus}`;
      } else if (item.action === 'edit') {
        summary = 'Ficha de persona actualizada';
      }
    }

    if (item.entityType === 'person_contract') {
      const label = contractType ?? 'Contrato';
      if (item.action === 'create') {
        summary = `${label} creado`;
      } else if (item.action === 'edit') {
        summary = `${label} actualizado`;
      }
    }

    if (item.entityType === 'person_document') {
      const label = documentLabel ?? 'Documento';
      if (item.action === 'create' || item.action === 'upload') {
        summary = `${label} registrado`;
      } else if (item.action === 'migrate_storage') {
        summary = `${label} migrado a storage`;
      } else if (beforeStatus && afterStatus && beforeStatus !== afterStatus) {
        summary = `${label} cambio de ${beforeStatus} a ${afterStatus}`;
      } else if (item.action === 'edit') {
        summary = `${label} actualizado`;
      }
    }

    return {
      id: item.id,
      module: item.module,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      branchId: item.branchId,
      userId: item.userId,
      status: afterStatus ?? beforeStatus,
      summary,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private serializePersonRecord(person: Person) {
    return {
      id: person.id,
      companyId: person.companyId,
      branchId: person.branchId,
      personType: person.personType,
      firstName: person.firstName,
      lastName: person.lastName,
      documentType: person.documentType,
      documentNumber: person.documentNumber,
      issuedIn: person.issuedIn,
      email: person.email,
      personalEmail: person.personalEmail,
      phone: person.phone,
      address: person.address,
      birthDate: person.birthDate,
      sex: person.sex,
      bloodType: person.bloodType,
      modelCategory: person.modelCategory,
      photoUrl: person.photoUrl,
      bankEntity: person.bankEntity,
      bankAccountType: person.bankAccountType,
      bankAccountNumber: person.bankAccountNumber,
      beneficiaryName: person.beneficiaryName,
      beneficiaryDocument: person.beneficiaryDocument,
      beneficiaryDocumentType: person.beneficiaryDocumentType,
      status: person.status,
      notes: person.notes,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    };
  }

  private serializePersonContract(contract: PersonContract) {
    return {
      id: contract.id,
      personId: contract.personId,
      companyId: contract.companyId,
      branchId: contract.branchId,
      contractType: contract.contractType,
      contractNumber: contract.contractNumber,
      commissionType: contract.commissionType,
      commissionPercent: contract.commissionPercent,
      goalAmount: contract.goalAmount,
      positionName: contract.positionName,
      areaName: contract.areaName,
      cityName: contract.cityName,
      startsAt: contract.startsAt,
      endsAt: contract.endsAt,
      monthlySalary: contract.monthlySalary,
      biweeklySalary: contract.biweeklySalary,
      dailySalary: contract.dailySalary,
      uniformAmount: contract.uniformAmount,
      hasWithholding: contract.hasWithholding,
      hasSena: contract.hasSena,
      hasCompensationBox: contract.hasCompensationBox,
      hasIcbf: contract.hasIcbf,
      arlRiskLevel: contract.arlRiskLevel,
      isActive: contract.isActive,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      deletedAt: contract.deletedAt,
    };
  }

  private serializePersonDocument(document: PersonDocument) {
    return {
      id: document.id,
      personId: document.personId,
      companyId: document.companyId,
      branchId: document.branchId,
      label: document.label,
      legacyLabel: document.legacyLabel,
      documentType: document.documentType,
      fileType: document.fileType,
      documentNumber: document.documentNumber,
      storageBucket: document.storageBucket,
      storagePath: document.storagePath,
      publicUrl: document.publicUrl,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
      status: document.status,
      notes: document.notes,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  private async downloadExternalDocument(sourceUrl: string, document: PersonDocument): Promise<UploadedBinaryFile> {
    let response: Response;

    try {
      response = await fetch(sourceUrl);
    } catch (error) {
      throw new BadGatewayException(
        `External document download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `External document download failed with status ${response.status} ${response.statusText}`.trim(),
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new BadGatewayException('External document is empty');
    }

    const contentType = response.headers.get('content-type')?.split(';')[0].trim() || document.fileType || 'application/octet-stream';
    const originalname = this.resolveExternalDocumentName(sourceUrl, document, contentType);

    return {
      buffer,
      originalname,
      mimetype: contentType,
    };
  }

  private resolveExternalDocumentName(sourceUrl: string, document: PersonDocument, mimeType: string) {
    const fromUrl = extractDocumentFileNameFromUrl(sourceUrl);
    if (fromUrl) {
      return fromUrl;
    }

    const extension = extractDocumentFileExtension(null, mimeType);
    const normalizedLabel = (document.legacyLabel || document.label || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'document';
    return `${normalizedLabel}.${extension}`;
  }

  private normalizeString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeEmail(value?: string | null) {
    const normalized = value?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  private normalizeNumericString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async findPersonDocumentOrFail(personId: number, companyId: number, documentId: number) {
    const document = await this.personDocumentRepository.findOne({
      where: { id: documentId, personId, companyId, deletedAt: IsNull() },
    });
    if (!document) {
      throw new NotFoundException('Person document not found');
    }

    return document;
  }

  private readNumericMeta(meta: Record<string, unknown> | null, key: string) {
    const value = meta?.[key];
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private readStringField(data: Record<string, unknown> | null, key: string) {
    const value = data?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private readStatus(data: Record<string, unknown> | null) {
    const value = data?.status;
    return value === RecordStatus.ACTIVE || value === RecordStatus.INACTIVE ? value : null;
  }

  private async ensureBranch(companyId: number, branchId: number | null | undefined) {
    if (branchId === null || branchId === undefined) {
      return;
    }

    const branch = await this.branchRepository.findOne({ where: { id: branchId, companyId, deletedAt: IsNull() } });
    if (!branch) {
      throw new BadRequestException('Branch is invalid for this company');
    }
  }
}
