import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { CreateFinancialTransferDto } from './dto/create-financial-transfer.dto';
import { FinanceReportQueryDto } from './dto/finance-report-query.dto';
import { FinancialAccountsQueryDto } from './dto/financial-accounts-query.dto';
import { FinancialTransactionsQueryDto } from './dto/financial-transactions-query.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { VoidFinancialTransactionDto } from './dto/void-financial-transaction.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  @RequirePermissions('finance.view')
  listAccounts(@CurrentUser() currentUser: CurrentUserContext, @Query() query: FinancialAccountsQueryDto) {
    return this.financeService.listAccounts(currentUser, query);
  }

  @Post('accounts')
  @RequirePermissions('finance.create')
  createAccount(@CurrentUser() currentUser: CurrentUserContext, @Body() dto: CreateFinancialAccountDto, @Req() req: Request) {
    return this.financeService.createAccount(currentUser, dto, getRequestMeta(req));
  }

  @Get('accounts/:id')
  @RequirePermissions('finance.view')
  findAccount(@CurrentUser() currentUser: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.financeService.findAccount(currentUser, id);
  }

  @Patch('accounts/:id')
  @RequirePermissions('finance.edit')
  updateAccount(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialAccountDto,
    @Req() req: Request,
  ) {
    return this.financeService.updateAccount(currentUser, id, dto, getRequestMeta(req));
  }

  @Get('reports/summary')
  @RequirePermissions('finance.view')
  getReportSummary(@CurrentUser() currentUser: CurrentUserContext, @Query() query: FinanceReportQueryDto) {
    return this.financeService.getReportSummary(currentUser, query);
  }

  @Get('transactions')
  @RequirePermissions('finance.view')
  listTransactions(@CurrentUser() currentUser: CurrentUserContext, @Query() query: FinancialTransactionsQueryDto) {
    return this.financeService.listTransactions(currentUser, query);
  }

  @Post('transactions')
  @RequirePermissions('finance.create')
  createTransaction(@CurrentUser() currentUser: CurrentUserContext, @Body() dto: CreateFinancialTransactionDto, @Req() req: Request) {
    return this.financeService.createTransaction(currentUser, dto, getRequestMeta(req));
  }

  @Get('transactions/:id')
  @RequirePermissions('finance.view')
  findTransaction(@CurrentUser() currentUser: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.financeService.findTransaction(currentUser, id);
  }

  @Patch('transactions/:id')
  @RequirePermissions('finance.edit')
  updateTransaction(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialTransactionDto,
    @Req() req: Request,
  ) {
    return this.financeService.updateTransaction(currentUser, id, dto, getRequestMeta(req));
  }

  @Post('transactions/:id/void')
  @RequirePermissions('finance.edit')
  voidTransaction(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidFinancialTransactionDto,
    @Req() req: Request,
  ) {
    return this.financeService.voidTransaction(currentUser, id, dto, getRequestMeta(req));
  }

  @Post('transfers')
  @RequirePermissions('finance.create')
  createTransfer(@CurrentUser() currentUser: CurrentUserContext, @Body() dto: CreateFinancialTransferDto, @Req() req: Request) {
    return this.financeService.createTransfer(currentUser, dto, getRequestMeta(req));
  }
}
