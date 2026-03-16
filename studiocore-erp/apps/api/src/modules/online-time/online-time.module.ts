import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Branch } from '../../database/entities/branch.entity';
import { OnlineSession } from '../../database/entities/online-session.entity';
import { OperationShift } from '../../database/entities/operation-shift.entity';
import { Person } from '../../database/entities/person.entity';
import { OnlineTimeController } from './online-time.controller';
import { OnlineTimeService } from './online-time.service';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineSession, Branch, Person, OperationShift]), AuditLogsModule],
  controllers: [OnlineTimeController],
  providers: [OnlineTimeService],
})
export class OnlineTimeModule {}
