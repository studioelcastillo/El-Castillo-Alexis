import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';

@Module({
  imports: [PeopleModule],
  controllers: [ModelsController],
  providers: [ModelsService],
})
export class ModelsModule {}
