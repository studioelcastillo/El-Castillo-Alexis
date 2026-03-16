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
import { CreatePayrollNoveltyDto } from './dto/create-payroll-novelty.dto';
import { PayrollNoveltiesQueryDto } from './dto/payroll-novelties-query.dto';
import { UpdatePayrollNoveltyDto } from './dto/update-payroll-novelty.dto';
import { PayrollNoveltiesService } from './payroll-novelties.service';

@ApiTags('payroll-novelties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('payroll/novelties')
export class PayrollNoveltiesController {
  constructor(private readonly payrollNoveltiesService: PayrollNoveltiesService) {}

  @Get()
  @RequirePermissions('payroll_novelties.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: PayrollNoveltiesQueryDto) {
    return this.payrollNoveltiesService.list(user, query);
  }

  @Post()
  @RequirePermissions('payroll_novelties.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreatePayrollNoveltyDto, @Req() req: Request) {
    return this.payrollNoveltiesService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('payroll_novelties.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.payrollNoveltiesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('payroll_novelties.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePayrollNoveltyDto,
    @Req() req: Request,
  ) {
    return this.payrollNoveltiesService.update(user, id, body, getRequestMeta(req));
  }
}
