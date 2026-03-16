import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { CreatePersonDto } from '../people/dto/create-person.dto';
import { PeopleQueryDto } from '../people/dto/people-query.dto';
import { UpdatePersonDto } from '../people/dto/update-person.dto';
import { ModelsService } from './models.service';

@ApiTags('models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @RequirePermissions('models.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: PeopleQueryDto) {
    return this.modelsService.list(user, query);
  }

  @Post()
  @RequirePermissions('models.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreatePersonDto, @Req() req: Request) {
    return this.modelsService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('models.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.modelsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('models.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePersonDto,
    @Req() req: Request,
  ) {
    return this.modelsService.update(user, id, body, getRequestMeta(req));
  }
}
