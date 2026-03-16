import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AbsenceRecordEntity } from '../../database/entities/absence-record.entity';
import { Branch } from '../../database/entities/branch.entity';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { AbsencesController } from './absences.controller';
import { AbsencesService } from './absences.service';

@Module({
  imports: [TypeOrmModule.forFeature([AbsenceRecordEntity, Branch, Person, OperationShift]), AuditLogsModule],
  controllers: [AbsencesController],
  providers: [AbsencesService],
})
export class AbsencesModule {}
