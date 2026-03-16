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
import { CreateHrDisciplinaryActionDto } from './dto/create-hr-disciplinary-action.dto';
import { CreateHrIncapacityDto } from './dto/create-hr-incapacity.dto';
import { CreateHrVacationDto } from './dto/create-hr-vacation.dto';
import { HrRequestsQueryDto } from './dto/hr-requests-query.dto';
import { UpdateHrDisciplinaryActionDto } from './dto/update-hr-disciplinary-action.dto';
import { UpdateHrIncapacityDto } from './dto/update-hr-incapacity.dto';
import { UpdateHrVacationDto } from './dto/update-hr-vacation.dto';
import { HrService } from './hr.service';

@ApiTags('hr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('incapacities')
  @RequirePermissions('hr.view')
  listIncapacities(@CurrentUser() user: CurrentUserContext, @Query() query: HrRequestsQueryDto) {
    return this.hrService.listIncapacities(user, query);
  }

  @Post('incapacities')
  @RequirePermissions('hr.create')
  createIncapacity(@CurrentUser() user: CurrentUserContext, @Body() body: CreateHrIncapacityDto, @Req() req: Request) {
    return this.hrService.createIncapacity(user, body, getRequestMeta(req));
  }

  @Get('incapacities/:id')
  @RequirePermissions('hr.view')
  findIncapacity(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.hrService.findIncapacity(user, id);
  }

  @Patch('incapacities/:id')
  @RequirePermissions('hr.edit')
  updateIncapacity(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHrIncapacityDto,
    @Req() req: Request,
  ) {
    return this.hrService.updateIncapacity(user, id, body, getRequestMeta(req));
  }

  @Get('vacations')
  @RequirePermissions('hr.view')
  listVacations(@CurrentUser() user: CurrentUserContext, @Query() query: HrRequestsQueryDto) {
    return this.hrService.listVacations(user, query);
  }

  @Post('vacations')
  @RequirePermissions('hr.create')
  createVacation(@CurrentUser() user: CurrentUserContext, @Body() body: CreateHrVacationDto, @Req() req: Request) {
    return this.hrService.createVacation(user, body, getRequestMeta(req));
  }

  @Get('vacations/:id')
  @RequirePermissions('hr.view')
  findVacation(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.hrService.findVacation(user, id);
  }

  @Patch('vacations/:id')
  @RequirePermissions('hr.edit')
  updateVacation(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHrVacationDto,
    @Req() req: Request,
  ) {
    return this.hrService.updateVacation(user, id, body, getRequestMeta(req));
  }

  @Get('disciplinary-actions')
  @RequirePermissions('hr.view')
  listDisciplinaryActions(@CurrentUser() user: CurrentUserContext, @Query() query: HrRequestsQueryDto) {
    return this.hrService.listDisciplinaryActions(user, query);
  }

  @Post('disciplinary-actions')
  @RequirePermissions('hr.create')
  createDisciplinaryAction(@CurrentUser() user: CurrentUserContext, @Body() body: CreateHrDisciplinaryActionDto, @Req() req: Request) {
    return this.hrService.createDisciplinaryAction(user, body, getRequestMeta(req));
  }

  @Get('disciplinary-actions/:id')
  @RequirePermissions('hr.view')
  findDisciplinaryAction(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.hrService.findDisciplinaryAction(user, id);
  }

  @Patch('disciplinary-actions/:id')
  @RequirePermissions('hr.edit')
  updateDisciplinaryAction(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHrDisciplinaryActionDto,
    @Req() req: Request,
  ) {
    return this.hrService.updateDisciplinaryAction(user, id, body, getRequestMeta(req));
  }
}
