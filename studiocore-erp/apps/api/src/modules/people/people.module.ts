import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectStorageService } from '../../common/services/object-storage.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Branch } from '../../database/entities/branch.entity';
import { PersonContract } from '../../database/entities/person-contract.entity';
import { Person } from '../../database/entities/person.entity';
import { PersonDocument } from '../../database/entities/person-document.entity';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, Branch, PersonContract, PersonDocument, AuditLog]), AuditLogsModule],
  controllers: [PeopleController],
  providers: [PeopleService, ObjectStorageService],
  exports: [PeopleService],
})
export class PeopleModule {}
