import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions('companies.view')
  list(@CurrentUser() user: CurrentUserContext) {
    return this.companiesService.list(user);
  }

  @Post()
  @RequirePermissions('companies.create')
  @RequireTenantContext({ requireCompanyWide: true })
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateCompanyDto, @Req() req: Request) {
    return this.companiesService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('companies.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('companies.edit')
  @RequireTenantContext({ requireCompanyWide: true })
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCompanyDto,
    @Req() req: Request,
  ) {
    return this.companiesService.update(user, id, body, getRequestMeta(req));
  }
}
