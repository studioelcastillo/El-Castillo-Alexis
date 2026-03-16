import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Branch } from '../../database/entities/branch.entity';
import { GoalRecordEntity } from '../../database/entities/goal-record.entity';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoalRecordEntity, Branch, Person, OperationShift]), AuditLogsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
