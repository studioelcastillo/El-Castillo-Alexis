import { Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { PersonType } from '../../database/entities/enums';
import { PeopleService } from '../people/people.service';
import { CreatePersonDto } from '../people/dto/create-person.dto';
import { PeopleQueryDto } from '../people/dto/people-query.dto';
import { UpdatePersonDto } from '../people/dto/update-person.dto';

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class ModelsService {
  constructor(private readonly peopleService: PeopleService) {}

  list(currentUser: CurrentUserContext, query: PeopleQueryDto) {
    return this.peopleService.list(currentUser, { ...query, personType: PersonType.MODEL });
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const response = await this.peopleService.findOne(currentUser, id);
    this.assertModel(response.data.personType);
    return response;
  }

  async create(currentUser: CurrentUserContext, dto: CreatePersonDto, requestMeta?: RequestMeta) {
    const response = await this.peopleService.create(currentUser, { ...dto, personType: PersonType.MODEL }, requestMeta);
    this.assertModel(response.data.personType);
    return response;
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdatePersonDto, requestMeta?: RequestMeta) {
    await this.findOne(currentUser, id);
    const response = await this.peopleService.update(currentUser, id, { ...dto, personType: PersonType.MODEL }, requestMeta);
    this.assertModel(response.data.personType);
    return response;
  }

  private assertModel(personType: PersonType) {
    if (personType !== PersonType.MODEL) {
      throw new NotFoundException('Model not found');
    }
  }
}
