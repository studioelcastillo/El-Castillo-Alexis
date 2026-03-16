import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_CONTEXT_KEY, TenantContextOptions } from '../decorators/tenant-context.decorator';
import { CurrentUserContext } from '../interfaces/current-user.interface';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<TenantContextOptions>(TENANT_CONTEXT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserContext | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication context is missing');
    }

    if (required.requireCompanyWide && !user.hasCompanyWideAccess) {
      throw new ForbiddenException('This action requires company-wide access');
    }

    if (required.requireActiveBranch && !user.hasCompanyWideAccess && user.activeBranchId === null) {
      throw new ForbiddenException('This action requires an active branch context');
    }

    return true;
  }
}
