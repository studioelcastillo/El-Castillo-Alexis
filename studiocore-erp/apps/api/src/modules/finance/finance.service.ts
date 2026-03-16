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

  async createTransaction(currentUser: CurrentUserContext, dto: CreateFinancialTransactionDto, requestMeta?: { ipAddress?: string; userAgent?: string }) {
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
