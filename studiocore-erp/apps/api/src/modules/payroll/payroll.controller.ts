import { Body, Controller, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { PayrollPeriodsQueryDto } from './dto/payroll-periods-query.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('payroll/periods')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @RequirePermissions('payroll.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: PayrollPeriodsQueryDto) {
    return this.payrollService.list(user, query);
  }

  @Post()
  @RequirePermissions('payroll.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreatePayrollPeriodDto, @Req() req: Request) {
    return this.payrollService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('payroll.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findOne(user, id);
  }

  @Get(':id/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @RequirePermissions('payroll.export')
  exportCsv(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.payrollService.exportCsv(user, id);
  }

  @Patch(':id')
  @RequirePermissions('payroll.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePayrollPeriodDto,
    @Req() req: Request,
  ) {
    return this.payrollService.update(user, id, body, getRequestMeta(req));
  }

  @Post(':id/calculate')
  @RequirePermissions('payroll.calculate')
  calculate(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.payrollService.calculate(user, id, getRequestMeta(req));
  }

  @Post(':id/close')
  @RequirePermissions('payroll.close')
  close(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.payrollService.close(user, id, getRequestMeta(req));
  }

  @Post(':id/reopen')
  @RequirePermissions('payroll.reopen')
  reopen(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.payrollService.reopen(user, id, getRequestMeta(req));
  }
}
