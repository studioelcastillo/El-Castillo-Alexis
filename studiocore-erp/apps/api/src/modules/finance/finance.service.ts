import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { FinancialAccount } from '../../database/entities/financial-account.entity';
import { FinancialTransaction } from '../../database/entities/financial-transaction.entity';
import { FinancialTransactionType } from '../../database/entities/enums';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { FinancialAccountsQueryDto } from './dto/financial-accounts-query.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { FinancialTransactionsQueryDto } from './dto/financial-transactions-query.dto';
import { CreateFinancialTransferDto } from './dto/create-financial-transfer.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(FinancialAccount)
    private readonly accountRepository: Repository<FinancialAccount>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
  ) {}

  async listAccounts(currentUser: CurrentUserContext, query: FinancialAccountsQueryDto) {
    const qb = this.accountRepository.createQueryBuilder('account');
    qb.where('account.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('account.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId ? Number(query.branchId) : undefined);
    if (branchId !== null) {
      qb.andWhere('account.branch_id = :branchId', { branchId });
    }

    if (query.type) {
      qb.andWhere('account.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere('(account.name ILIKE :search OR account.bank_name ILIKE :search OR account.account_number ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    qb.orderBy('account.name', 'ASC').skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async createAccount(currentUser: CurrentUserContext, dto: CreateFinancialAccountDto, requestMeta?: { ipAddress?: string; userAgent?: string }) {
    const branchId = resolveWritableBranchId(currentUser, dto.branchId);
    
    const account = await this.accountRepository.save(
      this.accountRepository.create({
        companyId: currentUser.companyId,
        branchId,
        name: dto.name.trim(),
        type: dto.type,
        currency: dto.currency || 'COP',
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        notes: dto.notes,
        balance: '0',
      }),
    );

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_account',
      entityId: String(account.id),
      afterData: account as any,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: account };
  }

  async listTransactions(currentUser: CurrentUserContext, query: FinancialTransactionsQueryDto) {
    const qb = this.transactionRepository.createQueryBuilder('tx');
    qb.where('tx.company_id = :companyId', { companyId: currentUser.companyId });

    const branchId = resolveBranchFilter(currentUser, query.branchId ? Number(query.branchId) : undefined);
    if (branchId !== null) {
      qb.andWhere('tx.branch_id = :branchId', { branchId });
    }

    if (query.accountId) {
      qb.andWhere('tx.account_id = :accountId', { accountId: query.accountId });
    }

    if (query.type) {
      qb.andWhere('tx.type = :type', { type: query.type });
    }

    if (query.from) {
      qb.andWhere('tx.transaction_date >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('tx.transaction_date <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere('tx.description ILIKE :search', { search: `%${query.search}%` });
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    qb.orderBy('tx.transaction_date', 'DESC')
      .addOrderBy('tx.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async createTransaction(currentUser: CurrentUserContext, dto: CreateFinancialTransactionDto, requestMeta?: { ipAddress?: string; userAgent?: string }) {
    if (dto.type === FinancialTransactionType.TRANSFER) {
      throw new BadRequestException('Use the transfers endpoint for account-to-account moves');
    }

    const account = await this.findAccountOrFail(currentUser, dto.accountId);
    
    const amountNum = Number(dto.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    let balanceChange = amountNum;
    if (dto.type === FinancialTransactionType.EXPENSE) {
      balanceChange = -amountNum;
    }

    const transaction = await this.accountRepository.manager.transaction(async (manager) => {
      const tx = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: account.branchId,
          accountId: account.id,
          type: dto.type,
          amount: dto.amount,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          description: dto.description.trim(),
          personId: dto.personId,
          relatedEntityType: dto.relatedEntityType,
          relatedEntityId: dto.relatedEntityId,
          createdById: currentUser.id,
        }),
      );

      const newBalance = Number(account.balance) + balanceChange;
      await manager.update(FinancialAccount, { id: account.id }, { balance: String(newBalance) });

      return tx;
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? account.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: String(transaction.id),
      afterData: transaction as any,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: transaction };
  }

  async createTransfer(currentUser: CurrentUserContext, dto: CreateFinancialTransferDto, requestMeta?: { ipAddress?: string; userAgent?: string }) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('Source and destination accounts must be different');
    }

    const sourceAccount = await this.findAccountOrFail(currentUser, dto.sourceAccountId);
    const destinationAccount = await this.findAccountOrFail(currentUser, dto.destinationAccountId);

    if (sourceAccount.currency !== destinationAccount.currency) {
      throw new BadRequestException('Transfers between different currencies are not supported yet');
    }

    const amountNum = Number(dto.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const result = await this.accountRepository.manager.transaction(async (manager) => {
      // 1. Create expense transaction for source
      const expenseTx = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: sourceAccount.branchId,
          accountId: sourceAccount.id,
          type: FinancialTransactionType.EXPENSE,
          amount: dto.amount,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          description: `Transferencia a ${destinationAccount.name}: ${dto.description}`,
          createdById: currentUser.id,
        }),
      );

      // 2. Create income transaction for destination
      const incomeTx = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: destinationAccount.branchId,
          accountId: destinationAccount.id,
          type: FinancialTransactionType.INCOME,
          amount: dto.amount,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          description: `Transferencia desde ${sourceAccount.name}: ${dto.description}`,
          createdById: currentUser.id,
        }),
      );

      // 3. Update balances
      await manager.update(FinancialAccount, { id: sourceAccount.id }, { 
        balance: String(Number(sourceAccount.balance) - amountNum) 
      });
      await manager.update(FinancialAccount, { id: destinationAccount.id }, { 
        balance: String(Number(destinationAccount.balance) + amountNum) 
      });

      return { expenseTx, incomeTx };
    });

    // Record audit for both
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? sourceAccount.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: String(result.expenseTx.id),
      afterData: result.expenseTx as any,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? destinationAccount.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: String(result.incomeTx.id),
      afterData: result.incomeTx as any,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: result };
  }

  async findAccountOrFail(currentUser: CurrentUserContext, id: number) {
    const account = await this.accountRepository.findOne({
      where: { id, companyId: currentUser.companyId, deletedAt: IsNull() },
    });

    if (!account) {
      throw new NotFoundException('Financial account not found');
    }

    if (account.branchId !== null) {
      assertBranchAccess(currentUser, account.branchId, 'Financial account not found');
    }

    return account;
  }
}
