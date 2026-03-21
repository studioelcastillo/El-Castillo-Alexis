import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { assertBranchAccess, resolveBranchFilter, resolveWritableBranchId } from '../../common/utils/tenant-scope';
import { FinancialAccount } from '../../database/entities/financial-account.entity';
import { FinancialTransaction } from '../../database/entities/financial-transaction.entity';
import { FinancialTransactionStatus, FinancialTransactionType } from '../../database/entities/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { CreateFinancialTransferDto } from './dto/create-financial-transfer.dto';
import { FinanceReportQueryDto } from './dto/finance-report-query.dto';
import { FinancialAccountsQueryDto } from './dto/financial-accounts-query.dto';
import { FinancialTransactionsQueryDto } from './dto/financial-transactions-query.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { VoidFinancialTransactionDto } from './dto/void-financial-transaction.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

const TRANSFER_RELATION_TYPE = 'finance_transfer';

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
    return { items: items.map((item) => this.serializeAccount(item)), total, page, pageSize };
  }

  async findAccount(currentUser: CurrentUserContext, id: number) {
    const account = await this.findAccountOrFail(currentUser, id);
    return { data: this.serializeAccount(account) };
  }

  async createAccount(currentUser: CurrentUserContext, dto: CreateFinancialAccountDto, requestMeta?: RequestMeta) {
    const branchId = resolveWritableBranchId(currentUser, dto.branchId);

    const account = await this.accountRepository.save(
      this.accountRepository.create({
        companyId: currentUser.companyId,
        branchId,
        name: this.requireText(dto.name, 'Account name'),
        type: dto.type,
        currency: this.normalizeCurrency(dto.currency),
        bankName: this.normalizeNullableText(dto.bankName),
        accountNumber: this.normalizeNullableText(dto.accountNumber),
        notes: this.normalizeNullableText(dto.notes),
        balance: '0',
      }),
    );

    const serialized = this.serializeAccount(account);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_account',
      entityId: String(account.id),
      afterData: serialized,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: serialized };
  }

  async updateAccount(currentUser: CurrentUserContext, id: number, dto: UpdateFinancialAccountDto, requestMeta?: RequestMeta) {
    const account = await this.findAccountOrFail(currentUser, id);
    const before = this.serializeAccount(account);
    const nextCurrency = dto.currency !== undefined ? this.normalizeCurrency(dto.currency) : account.currency;

    if (nextCurrency !== account.currency) {
      const movementCount = await this.transactionRepository.count({
        where: { accountId: account.id, status: FinancialTransactionStatus.POSTED },
      });

      if (movementCount > 0 || Number(account.balance) !== 0) {
        throw new BadRequestException('Account currency cannot change after movements exist');
      }
    }

    await this.accountRepository.update(
      { id: account.id },
      {
        ...(dto.name !== undefined ? { name: this.requireText(dto.name, 'Account name') } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.currency !== undefined ? { currency: nextCurrency } : {}),
        ...(dto.bankName !== undefined ? { bankName: this.normalizeNullableText(dto.bankName) } : {}),
        ...(dto.accountNumber !== undefined ? { accountNumber: this.normalizeNullableText(dto.accountNumber) } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeNullableText(dto.notes) } : {}),
      },
    );

    const updated = await this.findAccountOrFail(currentUser, id);
    const serialized = this.serializeAccount(updated);

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? updated.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'edit',
      entityType: 'financial_account',
      entityId: String(updated.id),
      beforeData: before,
      afterData: serialized,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: serialized };
  }

  async listTransactions(currentUser: CurrentUserContext, query: FinancialTransactionsQueryDto) {
    const qb = this.transactionRepository.createQueryBuilder('tx');
    qb.where('tx.company_id = :companyId', { companyId: currentUser.companyId });

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      qb.andWhere('tx.branch_id = :branchId', { branchId });
    }

    if (query.accountId) {
      qb.andWhere('tx.account_id = :accountId', { accountId: query.accountId });
    }

    if (query.type) {
      qb.andWhere('tx.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('tx.status = :status', { status: query.status });
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

    qb.orderBy('tx.transaction_date', 'DESC')
      .addOrderBy('tx.id', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.serializeTransaction(item)), total, page: query.page, pageSize: query.pageSize };
  }

  async findTransaction(currentUser: CurrentUserContext, id: number) {
    const transaction = await this.findTransactionOrFail(currentUser, id);
    return { data: await this.buildTransactionDetail(currentUser, transaction) };
  }

  async createTransaction(currentUser: CurrentUserContext, dto: CreateFinancialTransactionDto, requestMeta?: RequestMeta) {
    if (dto.type === FinancialTransactionType.TRANSFER) {
      throw new BadRequestException('Use the transfers endpoint for account-to-account moves');
    }

    const account = await this.findAccountOrFail(currentUser, dto.accountId);
    const amount = this.parsePositiveAmount(dto.amount, 'Amount');
    const type = dto.type;
    const description = this.requireText(dto.description, 'Description');
    const transactionDate = this.parseTransactionDate(dto.transactionDate);

    const created = await this.accountRepository.manager.transaction(async (manager) => {
      const transaction = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: account.branchId,
          accountId: account.id,
          type,
          amount: this.toAmountString(amount),
          status: FinancialTransactionStatus.POSTED,
          transactionDate,
          description,
          personId: dto.personId ?? null,
          relatedEntityType: this.normalizeNullableText(dto.relatedEntityType),
          relatedEntityId: this.normalizeNullableText(dto.relatedEntityId),
          createdById: currentUser.id,
          voidReason: null,
          voidedAt: null,
          voidedById: null,
        }),
      );

      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, account.id, this.resolveSignedAmount(type, amount));
      await this.applyBalanceChanges(manager, balanceChanges);
      return transaction;
    });

    const serialized = this.serializeTransaction(created);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? account.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: String(created.id),
      afterData: serialized,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: serialized };
  }

  async updateTransaction(currentUser: CurrentUserContext, id: number, dto: UpdateFinancialTransactionDto, requestMeta?: RequestMeta) {
    const existing = await this.findTransactionOrFail(currentUser, id);
    if (existing.status === FinancialTransactionStatus.VOIDED) {
      throw new BadRequestException('Voided transactions cannot be edited');
    }

    if (this.isTransferTransaction(existing)) {
      return this.updateTransfer(currentUser, existing, dto, requestMeta);
    }

    if (dto.destinationAccountId !== undefined) {
      throw new BadRequestException('Destination account is only valid for transfer updates');
    }

    const nextType = dto.type ?? existing.type;
    if (nextType === FinancialTransactionType.TRANSFER) {
      throw new BadRequestException('Use the transfer flow for account-to-account moves');
    }

    const nextAccount = dto.accountId !== undefined ? await this.findAccountOrFail(currentUser, dto.accountId) : await this.findAccountOrFail(currentUser, existing.accountId);
    const nextAmount = dto.amount !== undefined ? this.parsePositiveAmount(dto.amount, 'Amount') : Number(existing.amount);
    const nextDescription = dto.description !== undefined ? this.requireText(dto.description, 'Description') : existing.description;
    const nextTransactionDate = dto.transactionDate !== undefined ? this.parseTransactionDate(dto.transactionDate) : existing.transactionDate;
    const before = await this.buildTransactionDetail(currentUser, existing);

    await this.accountRepository.manager.transaction(async (manager) => {
      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, existing.accountId, -this.resolveSignedAmount(existing.type, Number(existing.amount)));
      this.accumulateBalanceChange(balanceChanges, nextAccount.id, this.resolveSignedAmount(nextType, nextAmount));
      await this.applyBalanceChanges(manager, balanceChanges);

      await manager.update(FinancialTransaction, { id: existing.id }, {
        accountId: nextAccount.id,
        branchId: nextAccount.branchId,
        type: nextType,
        amount: this.toAmountString(nextAmount),
        transactionDate: nextTransactionDate,
        description: nextDescription,
        ...(dto.personId !== undefined ? { personId: dto.personId ?? null } : {}),
        ...(dto.relatedEntityType !== undefined ? { relatedEntityType: this.normalizeNullableText(dto.relatedEntityType) } : {}),
        ...(dto.relatedEntityId !== undefined ? { relatedEntityId: this.normalizeNullableText(dto.relatedEntityId) } : {}),
      });
    });

    const updated = await this.findTransactionOrFail(currentUser, id);
    const after = await this.buildTransactionDetail(currentUser, updated);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? updated.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'edit',
      entityType: 'financial_transaction',
      entityId: String(updated.id),
      beforeData: before,
      afterData: after,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: after };
  }

  async voidTransaction(currentUser: CurrentUserContext, id: number, dto: VoidFinancialTransactionDto, requestMeta?: RequestMeta) {
    const transaction = await this.findTransactionOrFail(currentUser, id);
    if (transaction.status === FinancialTransactionStatus.VOIDED) {
      throw new BadRequestException('Transaction is already voided');
    }

    if (this.isTransferTransaction(transaction)) {
      return this.voidTransfer(currentUser, transaction, dto, requestMeta);
    }

    const reason = this.requireText(dto.reason, 'Void reason');
    const before = await this.buildTransactionDetail(currentUser, transaction);
    await this.accountRepository.manager.transaction(async (manager) => {
      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, transaction.accountId, -this.resolveSignedAmount(transaction.type, Number(transaction.amount)));
      await this.applyBalanceChanges(manager, balanceChanges);

      await manager.update(FinancialTransaction, { id: transaction.id }, {
        status: FinancialTransactionStatus.VOIDED,
        voidReason: reason,
        voidedAt: new Date(),
        voidedById: currentUser.id,
      });
    });

    const updated = await this.findTransactionOrFail(currentUser, id);
    const after = await this.buildTransactionDetail(currentUser, updated);
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? updated.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'void',
      entityType: 'financial_transaction',
      entityId: String(updated.id),
      beforeData: before,
      afterData: after,
      meta: { reason },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: after };
  }

  async createTransfer(currentUser: CurrentUserContext, dto: CreateFinancialTransferDto, requestMeta?: RequestMeta) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('Source and destination accounts must be different');
    }

    const sourceAccount = await this.findAccountOrFail(currentUser, dto.sourceAccountId);
    const destinationAccount = await this.findAccountOrFail(currentUser, dto.destinationAccountId);
    this.assertCompatibleTransferAccounts(sourceAccount, destinationAccount);

    const amount = this.parsePositiveAmount(dto.amount, 'Amount');
    const description = this.requireText(dto.description, 'Description');
    const transactionDate = this.parseTransactionDate(dto.transactionDate);
    const transferId = randomUUID();

    const result = await this.accountRepository.manager.transaction(async (manager) => {
      const expenseTx = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: sourceAccount.branchId,
          accountId: sourceAccount.id,
          type: FinancialTransactionType.EXPENSE,
          amount: this.toAmountString(amount),
          status: FinancialTransactionStatus.POSTED,
          transactionDate,
          description: this.buildTransferDescription('expense', sourceAccount.name, destinationAccount.name, description),
          relatedEntityType: TRANSFER_RELATION_TYPE,
          relatedEntityId: transferId,
          createdById: currentUser.id,
          voidReason: null,
          voidedAt: null,
          voidedById: null,
        }),
      );

      const incomeTx = await manager.save(
        manager.create(FinancialTransaction, {
          companyId: currentUser.companyId,
          branchId: destinationAccount.branchId,
          accountId: destinationAccount.id,
          type: FinancialTransactionType.INCOME,
          amount: this.toAmountString(amount),
          status: FinancialTransactionStatus.POSTED,
          transactionDate,
          description: this.buildTransferDescription('income', sourceAccount.name, destinationAccount.name, description),
          relatedEntityType: TRANSFER_RELATION_TYPE,
          relatedEntityId: transferId,
          createdById: currentUser.id,
          voidReason: null,
          voidedAt: null,
          voidedById: null,
        }),
      );

      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, sourceAccount.id, -amount);
      this.accumulateBalanceChange(balanceChanges, destinationAccount.id, amount);
      await this.applyBalanceChanges(manager, balanceChanges);

      return { expenseTx, incomeTx };
    });

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? sourceAccount.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'create',
      entityType: 'financial_transfer',
      entityId: transferId,
      afterData: {
        transferId,
        expenseTx: this.serializeTransaction(result.expenseTx),
        incomeTx: this.serializeTransaction(result.incomeTx),
      },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return {
      data: {
        transferId,
        expenseTx: this.serializeTransaction(result.expenseTx),
        incomeTx: this.serializeTransaction(result.incomeTx),
      },
    };
  }

  async getReportSummary(currentUser: CurrentUserContext, query: FinanceReportQueryDto) {
    const accountsQb = this.accountRepository.createQueryBuilder('account');
    accountsQb.where('account.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('account.deleted_at IS NULL');

    const branchId = resolveBranchFilter(currentUser, query.branchId);
    if (branchId !== null) {
      accountsQb.andWhere('account.branch_id = :branchId', { branchId });
    }

    if (query.accountId) {
      accountsQb.andWhere('account.id = :accountId', { accountId: query.accountId });
    }

    accountsQb.orderBy('account.name', 'ASC');
    const accounts = await accountsQb.getMany();

    if (query.accountId && accounts.length === 0) {
      throw new NotFoundException('Financial account not found');
    }

    if (!accounts.length) {
      return {
        data: {
          filters: {
            branchId: branchId ?? null,
            accountId: query.accountId ?? null,
            from: query.from ?? null,
            to: query.to ?? null,
          },
          totals: {
            accountCount: 0,
            totalBalance: '0',
            negativeBalanceCount: 0,
            postedTransactionCount: 0,
            voidedTransactionCount: 0,
            operationalIncomeAmount: '0',
            operationalExpenseAmount: '0',
            netOperationalAmount: '0',
            transferVolumeAmount: '0',
          },
          accountSummaries: [],
          dailySummaries: [],
          recentTransactions: [],
          alerts: ['No hay cuentas visibles para el filtro seleccionado.'],
        },
      };
    }

    const accountIds = accounts.map((account) => account.id);
    const txQb = this.transactionRepository.createQueryBuilder('tx');
    txQb.where('tx.company_id = :companyId', { companyId: currentUser.companyId })
      .andWhere('tx.account_id IN (:...accountIds)', { accountIds });

    if (query.from) {
      txQb.andWhere('tx.transaction_date >= :from', { from: query.from });
    }

    if (query.to) {
      txQb.andWhere('tx.transaction_date <= :to', { to: query.to });
    }

    txQb.orderBy('tx.transaction_date', 'DESC').addOrderBy('tx.id', 'DESC');
    const transactions = await txQb.getMany();

    const accountSummaryMap = new Map(
      accounts.map((account) => [
        account.id,
        {
          accountId: account.id,
          name: account.name,
          currency: account.currency,
          balance: this.toAmountString(Number(account.balance)),
          operationalIncomeAmount: '0',
          operationalExpenseAmount: '0',
          netOperationalAmount: '0',
          transferInAmount: '0',
          transferOutAmount: '0',
          postedTransactionCount: 0,
          voidedTransactionCount: 0,
        },
      ]),
    );
    const dailySummaryMap = new Map<string, { date: string; operationalIncomeAmount: number; operationalExpenseAmount: number; netOperationalAmount: number; transferVolumeAmount: number }>();

    let operationalIncomeAmount = 0;
    let operationalExpenseAmount = 0;
    let transferVolumeAmount = 0;
    let postedTransactionCount = 0;
    let voidedTransactionCount = 0;

    for (const transaction of transactions) {
      const summary = accountSummaryMap.get(transaction.accountId);
      if (!summary) {
        continue;
      }

      const amount = Number(transaction.amount);
      if (transaction.status === FinancialTransactionStatus.VOIDED) {
        summary.voidedTransactionCount += 1;
        voidedTransactionCount += 1;
        continue;
      }

      const dateKey = transaction.transactionDate.toISOString().slice(0, 10);
      const dailySummary = dailySummaryMap.get(dateKey) ?? {
        date: dateKey,
        operationalIncomeAmount: 0,
        operationalExpenseAmount: 0,
        netOperationalAmount: 0,
        transferVolumeAmount: 0,
      };

      summary.postedTransactionCount += 1;
      postedTransactionCount += 1;

      if (this.isTransferTransaction(transaction)) {
        if (transaction.type === FinancialTransactionType.EXPENSE) {
          transferVolumeAmount += amount;
          dailySummary.transferVolumeAmount += amount;
          summary.transferOutAmount = this.toAmountString(Number(summary.transferOutAmount) + amount);
        } else if (transaction.type === FinancialTransactionType.INCOME) {
          summary.transferInAmount = this.toAmountString(Number(summary.transferInAmount) + amount);
        }
      } else if (transaction.type === FinancialTransactionType.INCOME) {
        operationalIncomeAmount += amount;
        dailySummary.operationalIncomeAmount += amount;
        dailySummary.netOperationalAmount += amount;
        summary.operationalIncomeAmount = this.toAmountString(Number(summary.operationalIncomeAmount) + amount);
      } else if (transaction.type === FinancialTransactionType.EXPENSE) {
        operationalExpenseAmount += amount;
        dailySummary.operationalExpenseAmount += amount;
        dailySummary.netOperationalAmount -= amount;
        summary.operationalExpenseAmount = this.toAmountString(Number(summary.operationalExpenseAmount) + amount);
      }

      dailySummaryMap.set(dateKey, dailySummary);
      summary.netOperationalAmount = this.toAmountString(Number(summary.operationalIncomeAmount) - Number(summary.operationalExpenseAmount));
    }

    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
    const negativeBalanceCount = accounts.filter((account) => Number(account.balance) < 0).length;
    const alerts: string[] = [];
    if (negativeBalanceCount > 0) {
      alerts.push(`Hay ${negativeBalanceCount} cuenta(s) con balance negativo que requieren conciliacion.`);
    }
    if (voidedTransactionCount > 0) {
      alerts.push(`Se detectaron ${voidedTransactionCount} movimiento(s) anulados dentro del filtro actual.`);
    }
    if (postedTransactionCount === 0) {
      alerts.push('No hay movimientos contabilizados en el rango seleccionado.');
    }

    const accountSummaries = Array.from(accountSummaryMap.values()).map((summary) => ({
      ...summary,
      netOperationalAmount: this.toAmountString(Number(summary.operationalIncomeAmount) - Number(summary.operationalExpenseAmount)),
    }));
    const dailySummaries = Array.from(dailySummaryMap.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((summary) => ({
        date: summary.date,
        operationalIncomeAmount: this.toAmountString(summary.operationalIncomeAmount),
        operationalExpenseAmount: this.toAmountString(summary.operationalExpenseAmount),
        netOperationalAmount: this.toAmountString(summary.netOperationalAmount),
        transferVolumeAmount: this.toAmountString(summary.transferVolumeAmount),
      }));

    return {
      data: {
        filters: {
          branchId: branchId ?? null,
          accountId: query.accountId ?? null,
          from: query.from ?? null,
          to: query.to ?? null,
        },
        totals: {
          accountCount: accounts.length,
          totalBalance: this.toAmountString(totalBalance),
          negativeBalanceCount,
          postedTransactionCount,
          voidedTransactionCount,
          operationalIncomeAmount: this.toAmountString(operationalIncomeAmount),
          operationalExpenseAmount: this.toAmountString(operationalExpenseAmount),
          netOperationalAmount: this.toAmountString(operationalIncomeAmount - operationalExpenseAmount),
          transferVolumeAmount: this.toAmountString(transferVolumeAmount),
        },
        accountSummaries,
        dailySummaries,
        recentTransactions: transactions.slice(0, 8).map((transaction) => this.serializeTransaction(transaction)),
        alerts,
      },
    };
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

  private async updateTransfer(currentUser: CurrentUserContext, transaction: FinancialTransaction, dto: UpdateFinancialTransactionDto, requestMeta?: RequestMeta) {
    const { sourceTransaction, destinationTransaction } = await this.findTransferPairOrFail(currentUser, transaction);
    const before = {
      expenseTransaction: await this.buildTransactionDetail(currentUser, sourceTransaction),
      incomeTransaction: await this.buildTransactionDetail(currentUser, destinationTransaction),
    };

    const nextSourceAccount = dto.accountId !== undefined ? await this.findAccountOrFail(currentUser, dto.accountId) : await this.findAccountOrFail(currentUser, sourceTransaction.accountId);
    const nextDestinationAccount = dto.destinationAccountId !== undefined
      ? await this.findAccountOrFail(currentUser, dto.destinationAccountId)
      : await this.findAccountOrFail(currentUser, destinationTransaction.accountId);

    if (nextSourceAccount.id === nextDestinationAccount.id) {
      throw new BadRequestException('Source and destination accounts must be different');
    }

    this.assertCompatibleTransferAccounts(nextSourceAccount, nextDestinationAccount);

    const nextAmount = dto.amount !== undefined ? this.parsePositiveAmount(dto.amount, 'Amount') : Number(sourceTransaction.amount);
    const nextTransactionDate = dto.transactionDate !== undefined ? this.parseTransactionDate(dto.transactionDate) : sourceTransaction.transactionDate;
    const nextDescription = dto.description !== undefined
      ? this.requireText(dto.description, 'Description')
      : this.extractTransferBaseDescription(sourceTransaction.description, nextSourceAccount.name, nextDestinationAccount.name);

    await this.accountRepository.manager.transaction(async (manager) => {
      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, sourceTransaction.accountId, Number(sourceTransaction.amount));
      this.accumulateBalanceChange(balanceChanges, destinationTransaction.accountId, -Number(destinationTransaction.amount));
      this.accumulateBalanceChange(balanceChanges, nextSourceAccount.id, -nextAmount);
      this.accumulateBalanceChange(balanceChanges, nextDestinationAccount.id, nextAmount);
      await this.applyBalanceChanges(manager, balanceChanges);

      await manager.update(FinancialTransaction, { id: sourceTransaction.id }, {
        accountId: nextSourceAccount.id,
        branchId: nextSourceAccount.branchId,
        amount: this.toAmountString(nextAmount),
        transactionDate: nextTransactionDate,
        description: this.buildTransferDescription('expense', nextSourceAccount.name, nextDestinationAccount.name, nextDescription),
      });

      await manager.update(FinancialTransaction, { id: destinationTransaction.id }, {
        accountId: nextDestinationAccount.id,
        branchId: nextDestinationAccount.branchId,
        amount: this.toAmountString(nextAmount),
        transactionDate: nextTransactionDate,
        description: this.buildTransferDescription('income', nextSourceAccount.name, nextDestinationAccount.name, nextDescription),
      });
    });

    const refreshedSource = await this.findTransactionOrFail(currentUser, sourceTransaction.id);
    const refreshedDestination = await this.findTransactionOrFail(currentUser, destinationTransaction.id);
    const after = {
      expenseTransaction: await this.buildTransactionDetail(currentUser, refreshedSource),
      incomeTransaction: await this.buildTransactionDetail(currentUser, refreshedDestination),
    };
    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? refreshedSource.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'edit',
      entityType: 'financial_transfer',
      entityId: refreshedSource.relatedEntityId ?? null,
      beforeData: before,
      afterData: after,
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: await this.buildTransactionDetail(currentUser, transaction.type === FinancialTransactionType.EXPENSE ? refreshedSource : refreshedDestination) };
  }

  private async voidTransfer(currentUser: CurrentUserContext, transaction: FinancialTransaction, dto: VoidFinancialTransactionDto, requestMeta?: RequestMeta) {
    const { sourceTransaction, destinationTransaction } = await this.findTransferPairOrFail(currentUser, transaction);
    if (sourceTransaction.status === FinancialTransactionStatus.VOIDED || destinationTransaction.status === FinancialTransactionStatus.VOIDED) {
      throw new BadRequestException('Transfer is already voided');
    }

    const reason = this.requireText(dto.reason, 'Void reason');
    const before = {
      expenseTransaction: await this.buildTransactionDetail(currentUser, sourceTransaction),
      incomeTransaction: await this.buildTransactionDetail(currentUser, destinationTransaction),
    };

    await this.accountRepository.manager.transaction(async (manager) => {
      const balanceChanges = new Map<number, number>();
      this.accumulateBalanceChange(balanceChanges, sourceTransaction.accountId, Number(sourceTransaction.amount));
      this.accumulateBalanceChange(balanceChanges, destinationTransaction.accountId, -Number(destinationTransaction.amount));
      await this.applyBalanceChanges(manager, balanceChanges);

      const voidedAt = new Date();
      await manager.update(FinancialTransaction, { id: In([sourceTransaction.id, destinationTransaction.id]) }, {
        status: FinancialTransactionStatus.VOIDED,
        voidReason: reason,
        voidedAt,
        voidedById: currentUser.id,
      });
    });

    const refreshedSource = await this.findTransactionOrFail(currentUser, sourceTransaction.id);
    const refreshedDestination = await this.findTransactionOrFail(currentUser, destinationTransaction.id);
    const after = {
      expenseTransaction: await this.buildTransactionDetail(currentUser, refreshedSource),
      incomeTransaction: await this.buildTransactionDetail(currentUser, refreshedDestination),
    };

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId ?? refreshedSource.branchId ?? null,
      userId: currentUser.id,
      module: 'finance',
      action: 'void',
      entityType: 'financial_transfer',
      entityId: refreshedSource.relatedEntityId ?? null,
      beforeData: before,
      afterData: after,
      meta: { reason },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { data: await this.buildTransactionDetail(currentUser, transaction.type === FinancialTransactionType.EXPENSE ? refreshedSource : refreshedDestination) };
  }

  private async findTransactionOrFail(currentUser: CurrentUserContext, id: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, companyId: currentUser.companyId },
    });

    if (!transaction) {
      throw new NotFoundException('Financial transaction not found');
    }

    if (transaction.branchId !== null) {
      assertBranchAccess(currentUser, transaction.branchId, 'Financial transaction not found');
    }

    return transaction;
  }

  private async findTransferPairOrFail(currentUser: CurrentUserContext, transaction: FinancialTransaction) {
    if (!this.isTransferTransaction(transaction) || !transaction.relatedEntityId) {
      throw new BadRequestException('Transfer pair not found for this transaction');
    }

    const pair = await this.transactionRepository.find({
      where: {
        companyId: currentUser.companyId,
        relatedEntityType: TRANSFER_RELATION_TYPE,
        relatedEntityId: transaction.relatedEntityId,
      },
      order: { id: 'ASC' },
    });

    const sourceTransaction = pair.find((item) => item.type === FinancialTransactionType.EXPENSE) ?? null;
    const destinationTransaction = pair.find((item) => item.type === FinancialTransactionType.INCOME) ?? null;

    if (!sourceTransaction || !destinationTransaction) {
      throw new BadRequestException('Transfer pair is incomplete');
    }

    if (sourceTransaction.branchId !== null) {
      assertBranchAccess(currentUser, sourceTransaction.branchId, 'Financial transaction not found');
    }
    if (destinationTransaction.branchId !== null) {
      assertBranchAccess(currentUser, destinationTransaction.branchId, 'Financial transaction not found');
    }

    return { sourceTransaction, destinationTransaction };
  }

  private async buildTransactionDetail(currentUser: CurrentUserContext, transaction: FinancialTransaction) {
    const base = this.serializeTransaction(transaction);
    const account = await this.findAccountOrFail(currentUser, transaction.accountId);

    if (!this.isTransferTransaction(transaction)) {
      return {
        ...base,
        accountName: account.name,
        accountCurrency: account.currency,
        isTransfer: false,
        baseDescription: transaction.description,
        sourceAccountId: null,
        sourceAccountName: null,
        destinationAccountId: null,
        destinationAccountName: null,
      };
    }

    const { sourceTransaction, destinationTransaction } = await this.findTransferPairOrFail(currentUser, transaction);
    const sourceAccount = await this.findAccountOrFail(currentUser, sourceTransaction.accountId);
    const destinationAccount = await this.findAccountOrFail(currentUser, destinationTransaction.accountId);

    return {
      ...base,
      accountName: account.name,
      accountCurrency: account.currency,
      isTransfer: true,
      baseDescription: this.extractTransferBaseDescription(sourceTransaction.description, sourceAccount.name, destinationAccount.name),
      sourceAccountId: sourceAccount.id,
      sourceAccountName: sourceAccount.name,
      destinationAccountId: destinationAccount.id,
      destinationAccountName: destinationAccount.name,
    };
  }

  private serializeAccount(account: FinancialAccount) {
    return {
      id: account.id,
      companyId: account.companyId,
      branchId: account.branchId,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      bankName: account.bankName ?? null,
      accountNumber: account.accountNumber ?? null,
      notes: account.notes ?? null,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      deletedAt: account.deletedAt ? account.deletedAt.toISOString() : null,
    };
  }

  private serializeTransaction(transaction: FinancialTransaction) {
    return {
      id: transaction.id,
      companyId: transaction.companyId,
      branchId: transaction.branchId,
      accountId: transaction.accountId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      transactionDate: transaction.transactionDate.toISOString(),
      description: transaction.description,
      personId: transaction.personId ?? null,
      relatedEntityType: transaction.relatedEntityType ?? null,
      relatedEntityId: transaction.relatedEntityId ?? null,
      createdById: transaction.createdById,
      voidReason: transaction.voidReason ?? null,
      voidedAt: transaction.voidedAt ? transaction.voidedAt.toISOString() : null,
      voidedById: transaction.voidedById ?? null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  private isTransferTransaction(transaction: FinancialTransaction) {
    return transaction.relatedEntityType === TRANSFER_RELATION_TYPE && !!transaction.relatedEntityId;
  }

  private assertCompatibleTransferAccounts(sourceAccount: FinancialAccount, destinationAccount: FinancialAccount) {
    if (sourceAccount.currency !== destinationAccount.currency) {
      throw new BadRequestException('Transfers between different currencies are not supported yet');
    }
  }

  private requireText(value: string, label: string) {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${label} is required`);
    }
    return normalized;
  }

  private normalizeNullableText(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeCurrency(value?: string | null) {
    const normalized = (value?.trim() || 'COP').toUpperCase();
    return normalized || 'COP';
  }

  private parsePositiveAmount(value: string, label: string) {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException(`${label} must be a positive number`);
    }
    return amount;
  }

  private parseTransactionDate(value?: string | null) {
    if (!value) {
      return new Date();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Transaction date is invalid');
    }

    return date;
  }

  private resolveSignedAmount(type: FinancialTransactionType, amount: number) {
    if (type === FinancialTransactionType.INCOME) {
      return amount;
    }

    if (type === FinancialTransactionType.EXPENSE) {
      return -amount;
    }

    throw new BadRequestException('Transfer rows are managed through the transfer flow');
  }

  private accumulateBalanceChange(balanceChanges: Map<number, number>, accountId: number, delta: number) {
    balanceChanges.set(accountId, (balanceChanges.get(accountId) ?? 0) + delta);
  }

  private async applyBalanceChanges(manager: EntityManager, balanceChanges: Map<number, number>) {
    const entries = Array.from(balanceChanges.entries()).filter(([, delta]) => delta !== 0);
    if (!entries.length) {
      return;
    }

    const accountIds = entries.map(([accountId]) => accountId);
    const accounts = await manager.find(FinancialAccount, { where: { id: In(accountIds) } });
    const accountsById = new Map(accounts.map((account) => [account.id, account]));

    for (const [accountId, delta] of entries) {
      const account = accountsById.get(accountId);
      if (!account) {
        throw new NotFoundException('Financial account not found');
      }

      account.balance = this.toAmountString(Number(account.balance) + delta);
    }

    await manager.save(Array.from(accountsById.values()));
  }

  private toAmountString(value: number) {
    return Number(value.toFixed(2)).toString();
  }

  private buildTransferDescription(direction: 'expense' | 'income', sourceAccountName: string, destinationAccountName: string, baseDescription: string) {
    return direction === 'expense'
      ? `Transferencia a ${destinationAccountName}: ${baseDescription}`
      : `Transferencia desde ${sourceAccountName}: ${baseDescription}`;
  }

  private extractTransferBaseDescription(description: string, sourceAccountName: string, destinationAccountName: string) {
    const expensePrefix = `Transferencia a ${destinationAccountName}: `;
    const incomePrefix = `Transferencia desde ${sourceAccountName}: `;

    if (description.startsWith(expensePrefix)) {
      return description.slice(expensePrefix.length).trim();
    }

    if (description.startsWith(incomePrefix)) {
      return description.slice(incomePrefix.length).trim();
    }

    const prefixIndex = description.indexOf(': ');
    if (prefixIndex >= 0) {
      return description.slice(prefixIndex + 2).trim();
    }

    return description;
  }
}
