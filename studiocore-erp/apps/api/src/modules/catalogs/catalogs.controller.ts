import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
import { CreateCatalogGroupDto } from './dto/create-catalog-group.dto';
import { UpdateCatalogGroupDto } from './dto/update-catalog-group.dto';
import { CatalogsService } from './catalogs.service';

@ApiTags('catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get()
  @RequirePermissions('catalogs.view')
  list(@CurrentUser() user: CurrentUserContext) {
    return this.catalogsService.list(user);
  }

  @Post('groups')
  @RequirePermissions('catalogs.create')
  @RequireTenantContext({ requireCompanyWide: true })
  create(
    @CurrentUser() user: CurrentUserContext,
    @Body() body: CreateCatalogGroupDto,
    @Req() req: Request,
  ) {
    return this.catalogsService.create(user, body, getRequestMeta(req));
  }

  @Get('groups/:id')
  @RequirePermissions('catalogs.view')
  findCustomGroup(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.catalogsService.findCustomGroup(user, id);
  }

  @Patch('groups/:id')
  @RequirePermissions('catalogs.edit')
  @RequireTenantContext({ requireCompanyWide: true })
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCatalogGroupDto,
    @Req() req: Request,
  ) {
    return this.catalogsService.update(user, id, body, getRequestMeta(req));
  }

  @Delete('groups/:id')
  @RequirePermissions('catalogs.edit')
  @RequireTenantContext({ requireCompanyWide: true })
  remove(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.catalogsService.remove(user, id, getRequestMeta(req));
  }

  @Get(':key')
  @RequirePermissions('catalogs.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('key') key: string) {
    return this.catalogsService.findOne(user, key);
  }
}
