import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { FinanceService } from './finance.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { FinancialAccountsQueryDto } from './dto/financial-accounts-query.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  @RequirePermissions('finance.view')
  async listAccounts(@CurrentUser() currentUser: CurrentUserContext, @Query() query: FinancialAccountsQueryDto) {
    return this.financeService.listAccounts(currentUser, query);
  }

  @Post('accounts')
  @RequirePermissions('finance.create')
  async createAccount(@CurrentUser() currentUser: CurrentUserContext, @Body() dto: CreateFinancialAccountDto, @Req() req: Request) {
    const meta = getRequestMeta(req);
    return this.financeService.createAccount(currentUser, dto, {
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent || undefined,
    });
  }

  @Get('accounts/:id')
  @RequirePermissions('finance.view')
  async findAccount(@CurrentUser() currentUser: CurrentUserContext, @Param('id') id: number) {
    return { data: await this.financeService.findAccountOrFail(currentUser, id) };
  }

  @Post('transactions')
  @RequirePermissions('finance.create')
  async createTransaction(@CurrentUser() currentUser: CurrentUserContext, @Body() dto: CreateFinancialTransactionDto, @Req() req: Request) {
    const meta = getRequestMeta(req);
    return this.financeService.createTransaction(currentUser, dto, {
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent || undefined,
    });
  }
}
