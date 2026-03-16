import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AbsenceRecordEntity } from '../../database/entities/absence-record.entity';
import { AttendanceRecordEntity } from '../../database/entities/attendance-record.entity';
import { Branch } from '../../database/entities/branch.entity';
import { GoalRecordEntity } from '../../database/entities/goal-record.entity';
import { OnlineSession } from '../../database/entities/online-session.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollRun } from '../../database/entities/payroll-run.entity';
import { PersonContract } from '../../database/entities/person-contract.entity';
import { Person } from '../../database/entities/person.entity';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollPeriod,
      PayrollRun,
      Branch,
      Person,
      PersonContract,
      AttendanceRecordEntity,
      AbsenceRecordEntity,
      GoalRecordEntity,
      PayrollNovelty,
      OnlineSession,
    ]),
    AuditLogsModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
