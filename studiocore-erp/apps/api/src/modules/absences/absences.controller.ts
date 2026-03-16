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
import { AbsencesService } from './absences.service';
import { AbsencesQueryDto } from './dto/absences-query.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';

@ApiTags('absences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('absences')
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Get()
  @RequirePermissions('absences.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: AbsencesQueryDto) {
    return this.absencesService.list(user, query);
  }

  @Post()
  @RequirePermissions('absences.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateAbsenceDto, @Req() req: Request) {
    return this.absencesService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('absences.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.absencesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('absences.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAbsenceDto,
    @Req() req: Request,
  ) {
    return this.absencesService.update(user, id, body, getRequestMeta(req));
  }
}
