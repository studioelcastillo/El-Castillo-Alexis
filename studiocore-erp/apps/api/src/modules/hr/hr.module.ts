import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Branch } from '../../database/entities/branch.entity';
import { HrDisciplinaryAction } from '../../database/entities/hr-disciplinary-action.entity';
import { HrIncapacity } from '../../database/entities/hr-incapacity.entity';
import { HrVacation } from '../../database/entities/hr-vacation.entity';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { Person } from '../../database/entities/person.entity';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [TypeOrmModule.forFeature([HrDisciplinaryAction, HrIncapacity, HrVacation, Branch, Person, PayrollPeriod, PayrollNovelty]), AuditLogsModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
