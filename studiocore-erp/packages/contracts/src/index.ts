export type RecordStatus = 'active' | 'inactive';
export type UserStatus = 'active' | 'inactive' | 'blocked';
export type PersonType = 'model' | 'staff' | 'contractor' | 'other';
export type CatalogScope = 'system' | 'company';
export type OperationShiftStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';
export type AbsenceStatus = 'reported' | 'approved' | 'rejected';
export type GoalStatus = 'draft' | 'active' | 'closed';
export type OnlineSessionStatus = 'open' | 'closed' | 'cancelled';
export type PayrollPeriodStatus = 'draft' | 'calculated' | 'closed';
export type PayrollNoveltyType = 'bonus' | 'deduction' | 'allowance' | 'incident';
export type PayrollNoveltyStatus = 'pending' | 'approved' | 'rejected';
export type HrRequestStatus = 'requested' | 'approved' | 'rejected';
export type HrDisciplinaryActionType = 'warning' | 'sanction';
export type FinancialAccountType = 'bank' | 'cash' | 'platform' | 'other';
export type FinancialTransactionType = 'income' | 'expense' | 'transfer';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EnvelopeResponse<T> {
  data: T;
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
  activeBranchId: number | null;
  defaultBranchId: number | null;
  branchIds: number[];
  roles: string[];
  permissions: string[];
  hasCompanyWideAccess: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
}

export interface AuthSessionResponse {
  user: CurrentUser;
  tokens: AuthTokens;
}

export interface MeResponse {
  user: CurrentUser;
}

export interface CompanyRecord {
  id: number;
  name: string;
  legalName: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCompanyInput {
  name: string;
  legalName: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  legalName?: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface BranchRecord {
  id: number;
  companyId: number;
  name: string;
  code: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CatalogOptionRecord {
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
}

export interface CatalogGroupRecord {
  id: number | null;
  companyId: number | null;
  key: string;
  label: string;
  description: string;
  scope: CatalogScope;
  items: CatalogOptionRecord[];
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface CatalogListResponse {
  items: CatalogGroupRecord[];
}

export interface CreateCatalogOptionInput {
  value: string;
  label?: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface CreateCatalogGroupInput {
  key: string;
  label: string;
  description?: string | null;
  items: CreateCatalogOptionInput[];
}

export interface UpdateCatalogGroupInput {
  key?: string;
  label?: string;
  description?: string | null;
  items?: CreateCatalogOptionInput[];
}

export interface CreateBranchInput {
  name: string;
  code: string;
  city?: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface PersonRecord {
  id: number;
  companyId: number;
  branchId: number | null;
  personType: PersonType;
  firstName: string;
  lastName: string;
  documentType: string | null;
  documentNumber: string | null;
  issuedIn: string | null;
  email: string | null;
  personalEmail: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  sex: string | null;
  bloodType: string | null;
  modelCategory: string | null;
  photoUrl: string | null;
  bankEntity: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  beneficiaryName: string | null;
  beneficiaryDocument: string | null;
  beneficiaryDocumentType: string | null;
  status: RecordStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PersonContractRecord {
  id: number;
  personId: number;
  companyId: number;
  branchId: number | null;
  contractType: string;
  contractNumber: string | null;
  commissionType: string | null;
  commissionPercent: string | null;
  goalAmount: string | null;
  positionName: string | null;
  areaName: string | null;
  cityName: string | null;
  startsAt: string;
  endsAt: string | null;
  monthlySalary: string | null;
  biweeklySalary: string | null;
  dailySalary: string | null;
  uniformAmount: string | null;
  hasWithholding: boolean;
  hasSena: boolean;
  hasCompensationBox: boolean;
  hasIcbf: boolean;
  arlRiskLevel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PersonDocumentRecord {
  id: number;
  personId: number;
  companyId: number;
  branchId: number | null;
  label: string;
  legacyLabel: string | null;
  documentType: string;
  fileType: string | null;
  documentNumber: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: RecordStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PersonHistoryRecord {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  branchId: number | null;
  userId: number | null;
  status: RecordStatus | null;
  summary: string;
  createdAt: string;
}

export interface PersonDetailRecord extends PersonRecord {
  fullName: string;
  branchName: string | null;
  contracts: PersonContractRecord[];
  documents: PersonDocumentRecord[];
  history: PersonHistoryRecord[];
}

export interface PersonDocumentAccessResponse {
  url: string;
  expiresIn: number | null;
}

export interface CreatePersonInput {
  personType: PersonType;
  firstName: string;
  lastName: string;
  branchId?: number | null;
  documentType?: string;
  documentNumber?: string;
  issuedIn?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  sex?: string;
  bloodType?: string;
  modelCategory?: string;
  photoUrl?: string;
  bankEntity?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  beneficiaryName?: string;
  beneficiaryDocument?: string;
  beneficiaryDocumentType?: string;
  notes?: string;
}

export interface UpdatePersonInput {
  personType?: PersonType;
  firstName?: string;
  lastName?: string;
  branchId?: number | null;
  documentType?: string | null;
  documentNumber?: string | null;
  issuedIn?: string | null;
  email?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  bloodType?: string | null;
  modelCategory?: string | null;
  photoUrl?: string | null;
  bankEntity?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  beneficiaryName?: string | null;
  beneficiaryDocument?: string | null;
  beneficiaryDocumentType?: string | null;
  status?: RecordStatus;
  notes?: string | null;
}

export interface OperationShiftRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  platformName: string | null;
  roomLabel: string | null;
  goalAmount: string | null;
  status: OperationShiftStatus;
  notes: string | null;
  personName: string;
  personType: PersonType;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateOperationShiftInput {
  branchId: number;
  personId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  platformName?: string;
  roomLabel?: string;
  goalAmount?: string;
  status?: OperationShiftStatus;
  notes?: string;
}

export interface UpdateOperationShiftInput {
  branchId?: number;
  personId?: number;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  platformName?: string | null;
  roomLabel?: string | null;
  goalAmount?: string | null;
  status?: OperationShiftStatus;
  notes?: string | null;
}

export interface AttendanceRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  shiftId: number | null;
  attendanceDate: string;
  status: AttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  notes: string | null;
  personName: string;
  personType: PersonType;
  shiftTitle: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAttendanceInput {
  branchId: number;
  personId: number;
  shiftId?: number | null;
  attendanceDate: string;
  status?: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
}

export interface UpdateAttendanceInput {
  branchId?: number;
  personId?: number;
  shiftId?: number | null;
  attendanceDate?: string;
  status?: AttendanceStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  notes?: string | null;
}

export interface AbsenceRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  shiftId: number | null;
  startsAt: string;
  endsAt: string | null;
  reason: string;
  status: AbsenceStatus;
  supportUrl: string | null;
  notes: string | null;
  personName: string;
  personType: PersonType;
  shiftTitle: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAbsenceInput {
  branchId: number;
  personId: number;
  shiftId?: number | null;
  startsAt: string;
  endsAt?: string;
  reason: string;
  status?: AbsenceStatus;
  supportUrl?: string;
  notes?: string;
}

export interface UpdateAbsenceInput {
  branchId?: number;
  personId?: number;
  shiftId?: number | null;
  startsAt?: string;
  endsAt?: string | null;
  reason?: string;
  status?: AbsenceStatus;
  supportUrl?: string | null;
  notes?: string | null;
}

export interface GoalRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  shiftId: number | null;
  title: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: string;
  achievedAmount: string | null;
  bonusAmount: string | null;
  status: GoalStatus;
  notes: string | null;
  personName: string;
  personType: PersonType;
  shiftTitle: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OnlineSessionRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  shiftId: number | null;
  label: string;
  platformName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  tokenCount: number | null;
  grossAmount: string | null;
  status: OnlineSessionStatus;
  notes: string | null;
  personName: string;
  personType: PersonType;
  shiftTitle: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateOnlineSessionInput {
  branchId: number;
  personId: number;
  shiftId?: number | null;
  label: string;
  platformName?: string;
  startedAt: string;
  endedAt?: string;
  tokenCount?: number;
  grossAmount?: string;
  status?: OnlineSessionStatus;
  notes?: string;
}

export interface UpdateOnlineSessionInput {
  branchId?: number;
  personId?: number;
  shiftId?: number | null;
  label?: string;
  platformName?: string | null;
  startedAt?: string;
  endedAt?: string | null;
  tokenCount?: number | null;
  grossAmount?: string | null;
  status?: OnlineSessionStatus;
  notes?: string | null;
}

export interface PayrollRunSummaryItemRecord {
  personId: number;
  personName: string;
  personType: PersonType;
  fixedCompensationAmount: string | null;
  attendanceCount: number;
  lateCount: number;
  absenceCount: number;
  approvedAbsenceCount: number;
  pendingAbsenceCount: number;
  onlineSessionCount: number;
  onlineMinutes: number;
  tokenCount: number;
  grossAmount: string;
  noveltyCount: number;
  approvedNoveltyCount: number;
  pendingCriticalNoveltyCount: number;
  noveltyAmount: string;
  goalTargetAmount: string;
  goalAchievedAmount: string;
  goalBonusAmount: string;
  projectedCompensationAmount: string;
  components: PayrollRunItemComponentRecord[];
  alerts: PayrollRunItemAlertRecord[];
}

export interface PayrollRunItemComponentRecord {
  code: string;
  label: string;
  amount: string;
  direction: 'earning' | 'deduction';
  sourceType: 'contract' | 'goal' | 'novelty';
  sourceId: number | null;
  detail: string | null;
}

export interface PayrollRunItemAlertRecord {
  code: string;
  label: string;
  severity: 'warning';
  sourceType: 'absence' | 'novelty';
  sourceId: number | null;
}

export interface PayrollRunTotalsRecord {
  peopleCount: number;
  attendanceCount: number;
  lateCount: number;
  absenceCount: number;
  approvedAbsenceCount: number;
  pendingAbsenceCount: number;
  onlineSessionCount: number;
  onlineMinutes: number;
  tokenCount: number;
  grossAmount: string;
  noveltyCount: number;
  approvedNoveltyCount: number;
  pendingCriticalNoveltyCount: number;
  noveltyAmount: string;
  goalBonusAmount: string;
  fixedCompensationAmount: string;
  projectedCompensationAmount: string;
}

export interface PayrollRunRecord {
  id: number;
  periodId: number;
  companyId: number;
  branchId: number;
  runNumber: number;
  totals: PayrollRunTotalsRecord;
  items: PayrollRunSummaryItemRecord[];
  generatedAt: string;
}

export interface PayrollPeriodRecord {
  id: number;
  companyId: number;
  branchId: number;
  code: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollPeriodStatus;
  notes: string | null;
  lastCalculatedAt: string | null;
  closedAt: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PayrollPeriodDetailRecord extends PayrollPeriodRecord {
  latestRun: PayrollRunRecord | null;
}

export interface CreatePayrollPeriodInput {
  branchId: number;
  code: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

export interface UpdatePayrollPeriodInput {
  branchId?: number;
  code?: string;
  label?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string | null;
}

export interface PayrollNoveltyRecord {
  id: number;
  periodId: number;
  companyId: number;
  branchId: number;
  personId: number;
  noveltyType: PayrollNoveltyType;
  title: string;
  amount: string;
  signedAmount: string;
  effectiveDate: string;
  status: PayrollNoveltyStatus;
  isCritical: boolean;
  notes: string | null;
  personName: string;
  personType: PersonType;
  branchName: string | null;
  periodLabel: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePayrollNoveltyInput {
  periodId: number;
  personId: number;
  noveltyType: PayrollNoveltyType;
  title: string;
  amount: string;
  effectiveDate: string;
  status?: PayrollNoveltyStatus;
  isCritical?: boolean;
  notes?: string;
}

export interface UpdatePayrollNoveltyInput {
  periodId?: number;
  personId?: number;
  noveltyType?: PayrollNoveltyType;
  title?: string;
  amount?: string;
  effectiveDate?: string;
  status?: PayrollNoveltyStatus;
  isCritical?: boolean;
  notes?: string | null;
}

export interface HrIncapacityRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  reason: string;
  startsAt: string;
  endsAt: string;
  dayCount: number;
  supportUrl: string | null;
  status: HrRequestStatus;
  notes: string | null;
  payrollNoveltyId: number | null;
  payrollPeriodLabel: string | null;
  personName: string;
  personType: PersonType;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateHrIncapacityInput {
  branchId: number;
  personId: number;
  reason: string;
  startsAt: string;
  endsAt: string;
  supportUrl?: string;
  status?: HrRequestStatus;
  notes?: string;
}

export interface UpdateHrIncapacityInput {
  branchId?: number;
  personId?: number;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  supportUrl?: string | null;
  status?: HrRequestStatus;
  notes?: string | null;
}

export interface HrVacationRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  reason: string;
  startsAt: string;
  endsAt: string;
  dayCount: number;
  isPaid: boolean;
  status: HrRequestStatus;
  notes: string | null;
  payrollNoveltyId: number | null;
  payrollPeriodLabel: string | null;
  personName: string;
  personType: PersonType;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface HrDisciplinaryActionRecord {
  id: number;
  companyId: number;
  branchId: number;
  personId: number;
  actionType: HrDisciplinaryActionType;
  title: string;
  effectiveDate: string;
  supportUrl: string | null;
  payrollImpactAmount: string | null;
  status: HrRequestStatus;
  notes: string | null;
  payrollNoveltyId: number | null;
  payrollPeriodLabel: string | null;
  personName: string;
  personType: PersonType;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateHrDisciplinaryActionInput {
  branchId: number;
  personId: number;
  actionType: HrDisciplinaryActionType;
  title: string;
  effectiveDate: string;
  supportUrl?: string;
  payrollImpactAmount?: string;
  status?: HrRequestStatus;
  notes?: string;
}

export interface UpdateHrDisciplinaryActionInput {
  branchId?: number;
  personId?: number;
  actionType?: HrDisciplinaryActionType;
  title?: string;
  effectiveDate?: string;
  supportUrl?: string | null;
  payrollImpactAmount?: string | null;
  status?: HrRequestStatus;
  notes?: string | null;
}

export interface CreateHrVacationInput {
  branchId: number;
  personId: number;
  reason: string;
  startsAt: string;
  endsAt: string;
  isPaid?: boolean;
  status?: HrRequestStatus;
  notes?: string;
}

export interface UpdateHrVacationInput {
  branchId?: number;
  personId?: number;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  isPaid?: boolean;
  status?: HrRequestStatus;
  notes?: string | null;
}

export interface CreateGoalInput {
  branchId: number;
  personId: number;
  shiftId?: number | null;
  title: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: string;
  achievedAmount?: string;
  bonusAmount?: string;
  status?: GoalStatus;
  notes?: string;
}

export interface UpdateGoalInput {
  branchId?: number;
  personId?: number;
  shiftId?: number | null;
  title?: string;
  periodStart?: string;
  periodEnd?: string;
  targetAmount?: string;
  achievedAmount?: string | null;
  bonusAmount?: string | null;
  status?: GoalStatus;
  notes?: string | null;
}

export interface CreatePersonContractInput {
  contractType: string;
  contractNumber?: string;
  commissionType?: string;
  commissionPercent?: string;
  goalAmount?: string;
  positionName?: string;
  areaName?: string;
  cityName?: string;
  startsAt: string;
  endsAt?: string;
  monthlySalary?: string;
  biweeklySalary?: string;
  dailySalary?: string;
  uniformAmount?: string;
  hasWithholding?: boolean;
  hasSena?: boolean;
  hasCompensationBox?: boolean;
  hasIcbf?: boolean;
  arlRiskLevel?: string;
  isActive?: boolean;
}

export interface UpdatePersonContractInput {
  contractType?: string;
  contractNumber?: string | null;
  commissionType?: string | null;
  commissionPercent?: string | null;
  goalAmount?: string | null;
  positionName?: string | null;
  areaName?: string | null;
  cityName?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  monthlySalary?: string | null;
  biweeklySalary?: string | null;
  dailySalary?: string | null;
  uniformAmount?: string | null;
  hasWithholding?: boolean;
  hasSena?: boolean;
  hasCompensationBox?: boolean;
  hasIcbf?: boolean;
  arlRiskLevel?: string | null;
  isActive?: boolean;
}

export interface CreatePersonDocumentInput {
  label: string;
  legacyLabel?: string;
  documentType: string;
  fileType?: string;
  documentNumber?: string;
  storageBucket?: string;
  storagePath?: string;
  publicUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  status?: RecordStatus;
  notes?: string;
}

export interface UpdatePersonDocumentInput {
  label?: string;
  legacyLabel?: string | null;
  documentType?: string;
  fileType?: string | null;
  documentNumber?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status?: RecordStatus;
  notes?: string | null;
}

export interface UserRecord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
  activeBranchId: number | null;
  defaultBranchId: number | null;
  branchIds: number[];
  roles: string[];
  permissions: string[];
  hasCompanyWideAccess: boolean;
}

export interface UserRoleAssignmentRecord {
  roleId: number;
  roleName: string;
  branchId: number | null;
}

export interface UserManagementRecord extends UserRecord {
  phone: string | null;
  status: UserStatus;
  lastLoginAt: string | Date | null;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  roleAssignments: UserRoleAssignmentRecord[];
}

export interface UserRoleAssignmentInput {
  roleId: number;
  branchId?: number | null;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  defaultBranchId?: number | null;
  roleAssignments: UserRoleAssignmentInput[];
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  defaultBranchId?: number | null;
  status?: UserStatus;
  roleAssignments?: UserRoleAssignmentInput[];
}

export interface ResetUserPasswordInput {
  newPassword?: string;
}

export interface ResetUserPasswordResponse {
  success: boolean;
  temporaryPassword: string;
  data: UserManagementRecord;
}

export interface RolePermissionLink {
  id: number;
  key: string;
}

export interface RoleRecord {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionIds: number[];
  permissions: RolePermissionLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionIds?: number[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  isSystem?: boolean;
  permissionIds?: number[];
}

export interface PermissionRecord {
  id: number;
  moduleKey: string;
  actionKey: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionMatrixItem {
  id: number;
  actionKey: string;
  description: string;
}

export type PermissionMatrix = Record<string, PermissionMatrixItem[]>;

export interface PermissionMatrixResponse {
  items: PermissionMatrix;
}

export interface AuditLogRecord {
  id: string;
  companyId: number | null;
  branchId: number | null;
  userId: number | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface FinancialAccountRecord {
  id: number;
  companyId: number;
  branchId: number | null;
  name: string;
  type: FinancialAccountType;
  currency: string;
  balance: string;
  bankName: string | null;
  accountNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateFinancialAccountInput {
  branchId?: number;
  name: string;
  type?: FinancialAccountType;
  currency?: string;
  bankName?: string;
  accountNumber?: string;
  notes?: string;
}

export interface FinancialTransactionRecord {
  id: number;
  companyId: number;
  branchId: number | null;
  accountId: number;
  type: FinancialTransactionType;
  amount: string;
  transactionDate: string;
  description: string;
  personId: number | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialTransactionInput {
  accountId: number;
  type: FinancialTransactionType;
  amount: string;
  transactionDate?: string;
  description: string;
  personId?: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
}
