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
import { CreateOperationShiftDto } from './dto/create-operation-shift.dto';
import { OperationShiftsQueryDto } from './dto/operation-shifts-query.dto';
import { UpdateOperationShiftDto } from './dto/update-operation-shift.dto';
import { OperationsService } from './operations.service';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('operations/shifts')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  @RequirePermissions('operations.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: OperationShiftsQueryDto) {
    return this.operationsService.list(user, query);
  }

  @Post()
  @RequirePermissions('operations.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateOperationShiftDto, @Req() req: Request) {
    return this.operationsService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('operations.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('operations.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOperationShiftDto,
    @Req() req: Request,
  ) {
    return this.operationsService.update(user, id, body, getRequestMeta(req));
  }
}
