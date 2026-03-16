import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PayrollNovelty } from '../../database/entities/payroll-novelty.entity';
import { PayrollPeriod } from '../../database/entities/payroll-period.entity';
import { Person } from '../../database/entities/person.entity';
import { PayrollNoveltiesController } from './payroll-novelties.controller';
import { PayrollNoveltiesService } from './payroll-novelties.service';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollNovelty, PayrollPeriod, Person]), AuditLogsModule],
  controllers: [PayrollNoveltiesController],
  providers: [PayrollNoveltiesService],
})
export class PayrollNoveltiesModule {}
