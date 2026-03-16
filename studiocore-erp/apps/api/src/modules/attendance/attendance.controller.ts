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
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @RequirePermissions('attendance.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.list(user, query);
  }

  @Post()
  @RequirePermissions('attendance.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateAttendanceDto, @Req() req: Request) {
    return this.attendanceService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('attendance.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('attendance.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttendanceDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.update(user, id, body, getRequestMeta(req));
  }
}
