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
import { CreateOnlineSessionDto } from './dto/create-online-session.dto';
import { OnlineTimeQueryDto } from './dto/online-time-query.dto';
import { UpdateOnlineSessionDto } from './dto/update-online-session.dto';
import { OnlineTimeService } from './online-time.service';

@ApiTags('online-time')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('online-time')
export class OnlineTimeController {
  constructor(private readonly onlineTimeService: OnlineTimeService) {}

  @Get()
  @RequirePermissions('online_time.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: OnlineTimeQueryDto) {
    return this.onlineTimeService.list(user, query);
  }

  @Post()
  @RequirePermissions('online_time.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateOnlineSessionDto, @Req() req: Request) {
    return this.onlineTimeService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('online_time.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.onlineTimeService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('online_time.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOnlineSessionDto,
    @Req() req: Request,
  ) {
    return this.onlineTimeService.update(user, id, body, getRequestMeta(req));
  }
}
