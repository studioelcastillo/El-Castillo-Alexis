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
import { BranchesService } from './branches.service';
import { BranchesQueryDto } from './dto/branches-query.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions('branches.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: BranchesQueryDto) {
    return this.branchesService.list(user, query);
  }

  @Post()
  @RequirePermissions('branches.create')
  @RequireTenantContext({ requireCompanyWide: true })
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreateBranchDto, @Req() req: Request) {
    return this.branchesService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('branches.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('branches.edit')
  @RequireTenantContext({ requireCompanyWide: true })
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBranchDto,
    @Req() req: Request,
  ) {
    return this.branchesService.update(user, id, body, getRequestMeta(req));
  }
}
