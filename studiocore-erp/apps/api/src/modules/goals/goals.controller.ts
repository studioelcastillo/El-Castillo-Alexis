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
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalsQueryDto } from './dto/goals-query.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @RequirePermissions('goals.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: GoalsQueryDto) {
    return this.goalsService.list(user, query);
  }

  @Post()
  @RequirePermissions('goals.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateGoalDto, @Req() req: Request) {
    return this.goalsService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('goals.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.goalsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('goals.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGoalDto,
    @Req() req: Request,
  ) {
    return this.goalsService.update(user, id, body, getRequestMeta(req));
  }
}
