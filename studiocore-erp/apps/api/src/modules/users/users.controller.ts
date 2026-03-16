import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireTenantContext } from '../../common/decorators/tenant-context.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: UsersQueryDto) {
    return this.usersService.list(user, query);
  }

  @Post()
  @RequirePermissions('users.create')
  @RequireTenantContext({ requireActiveBranch: true })
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('users.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('users.edit')
  @RequireTenantContext({ requireActiveBranch: true })
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(user, id, body, getRequestMeta(req));
  }

  @Post(':id/activate')
  @RequirePermissions('users.activate')
  @RequireTenantContext({ requireActiveBranch: true })
  activate(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.usersService.activate(user, id, getRequestMeta(req));
  }

  @Post(':id/deactivate')
  @RequirePermissions('users.deactivate')
  @RequireTenantContext({ requireActiveBranch: true })
  deactivate(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.usersService.deactivate(user, id, getRequestMeta(req));
  }

  @Post(':id/reset-password')
  @RequirePermissions('users.reset_password')
  @RequireTenantContext({ requireActiveBranch: true })
  resetPassword(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResetUserPasswordDto,
    @Req() req: Request,
  ) {
    return this.usersService.resetPassword(user, id, body, getRequestMeta(req));
  }
}
