export enum RecordStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum PersonType {
  MODEL = 'model',
  STAFF = 'staff',
  CONTRACTOR = 'contractor',
  OTHER = 'other',
}

export enum OperationShiftStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

export enum AbsenceStatus {
  REPORTED = 'reported',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum OnlineSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum PayrollPeriodStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  CLOSED = 'closed',
}

export enum PayrollNoveltyType {
  BONUS = 'bonus',
  DEDUCTION = 'deduction',
  ALLOWANCE = 'allowance',
  INCIDENT = 'incident',
}

export enum PayrollNoveltyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum HrRequestStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum HrDisciplinaryActionType {
  WARNING = 'warning',
  SANCTION = 'sanction',
}

export enum FinancialAccountType {
  BANK = 'bank',
  CASH = 'cash',
  PLATFORM = 'platform',
  OTHER = 'other',
}

export enum FinancialTransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum FinancialTransactionStatus {
  POSTED = 'posted',
  VOIDED = 'voided',
}
