import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { CurrentUserContext } from '../interfaces/current-user.interface';

export function requireCompanyWideAccess(
  currentUser: CurrentUserContext,
  message = 'This action requires company-wide access',
) {
  if (!currentUser.hasCompanyWideAccess) {
    throw new ForbiddenException(message);
  }
}

export function resolveActiveBranchId(currentUser: CurrentUserContext) {
  if (currentUser.hasCompanyWideAccess) {
    return null;
  }

  if (currentUser.activeBranchId === null) {
    throw new ForbiddenException('Active branch context is required for this session');
  }

  return currentUser.activeBranchId;
}

export function resolveBranchFilter(
  currentUser: CurrentUserContext,
  requestedBranchId?: number | null,
) {
  if (currentUser.hasCompanyWideAccess) {
    return requestedBranchId ?? null;
  }

  const activeBranchId = resolveActiveBranchId(currentUser);
  if (
    requestedBranchId !== undefined
    && requestedBranchId !== null
    && requestedBranchId !== activeBranchId
  ) {
    throw new ForbiddenException('Requested branch is outside the active branch scope');
  }

  return activeBranchId;
}

export function applyBranchScope<Entity extends object>(
  qb: SelectQueryBuilder<Entity>,
  currentUser: CurrentUserContext,
  columnExpression: string,
) {
  const branchId = resolveBranchFilter(currentUser);
  if (branchId === null) {
    return qb;
  }

  return qb.andWhere(`${columnExpression} = :tenantBranchId`, { tenantBranchId: branchId });
}

export function assertBranchAccess(
  currentUser: CurrentUserContext,
  branchId: number | null | undefined,
  notFoundMessage = 'Resource not found',
) {
  if (currentUser.hasCompanyWideAccess) {
    return;
  }

  const activeBranchId = resolveActiveBranchId(currentUser);
  if (branchId === null || branchId === undefined || branchId !== activeBranchId) {
    throw new NotFoundException(notFoundMessage);
  }
}

export function resolveWritableBranchId(
  currentUser: CurrentUserContext,
  branchId: number | null | undefined,
) {
  if (currentUser.hasCompanyWideAccess) {
    return branchId ?? null;
  }

  const activeBranchId = resolveActiveBranchId(currentUser);
  if (branchId === null) {
    throw new ForbiddenException('Branch-scoped users cannot write global records');
  }

  if (branchId !== undefined && branchId !== activeBranchId) {
    throw new ForbiddenException('You can only operate on the active branch');
  }

  return activeBranchId;
}
