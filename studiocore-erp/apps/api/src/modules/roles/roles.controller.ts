import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
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
import { CreateRoleDto } from './dto/create-role.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import { RolesQueryDto } from './dto/roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: RolesQueryDto) {
    return this.rolesService.list(user, query);
  }

  @Post()
  @RequirePermissions('roles.create')
  @RequireTenantContext({ requireCompanyWide: true })
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateRoleDto, @Req() req: Request) {
    return this.rolesService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('roles.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('roles.edit')
  @RequireTenantContext({ requireCompanyWide: true })
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoleDto,
    @Req() req: Request,
  ) {
    return this.rolesService.update(user, id, body, getRequestMeta(req));
  }

  @Put(':id/permissions')
  @RequirePermissions('roles.manage_permissions')
  @RequireTenantContext({ requireCompanyWide: true })
  replacePermissions(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReplaceRolePermissionsDto,
    @Req() req: Request,
  ) {
    return this.rolesService.replacePermissions(user, id, body, getRequestMeta(req));
  }
}
