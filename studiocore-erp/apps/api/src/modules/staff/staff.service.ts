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
export class StaffService {
  constructor(private readonly peopleService: PeopleService) {}

  list(currentUser: CurrentUserContext, query: PeopleQueryDto) {
    return this.peopleService.list(currentUser, { ...query, personType: PersonType.STAFF });
  }

  async findOne(currentUser: CurrentUserContext, id: number) {
    const response = await this.peopleService.findOne(currentUser, id);
    this.assertStaff(response.data.personType);
    return response;
  }

  async create(currentUser: CurrentUserContext, dto: CreatePersonDto, requestMeta?: RequestMeta) {
    const response = await this.peopleService.create(currentUser, { ...dto, personType: PersonType.STAFF }, requestMeta);
    this.assertStaff(response.data.personType);
    return response;
  }

  async update(currentUser: CurrentUserContext, id: number, dto: UpdatePersonDto, requestMeta?: RequestMeta) {
    await this.findOne(currentUser, id);
    const response = await this.peopleService.update(currentUser, id, { ...dto, personType: PersonType.STAFF }, requestMeta);
    this.assertStaff(response.data.personType);
    return response;
  }

  private assertStaff(personType: PersonType) {
    if (personType !== PersonType.STAFF) {
      throw new NotFoundException('Staff member not found');
    }
  }
}
