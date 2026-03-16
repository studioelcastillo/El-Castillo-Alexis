import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [PeopleModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
