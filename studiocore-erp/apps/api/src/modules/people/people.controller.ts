import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { CreatePersonContractDto } from './dto/create-person-contract.dto';
import { CreatePersonDocumentDto } from './dto/create-person-document.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { PeopleQueryDto } from './dto/people-query.dto';
import { UpdatePersonContractDto } from './dto/update-person-contract.dto';
import { UpdatePersonDocumentDto } from './dto/update-person-document.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PeopleService } from './people.service';

type UploadedBinaryFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@ApiTags('people')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantContextGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  @RequirePermissions('people.view')
  list(@CurrentUser() user: CurrentUserContext, @Query() query: PeopleQueryDto) {
    return this.peopleService.list(user, query);
  }

  @Post()
  @RequirePermissions('people.create')
  create(@CurrentUser() user: CurrentUserContext, @Body() body: CreatePersonDto, @Req() req: Request) {
    return this.peopleService.create(user, body, getRequestMeta(req));
  }

  @Get(':id')
  @RequirePermissions('people.view')
  findOne(@CurrentUser() user: CurrentUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.peopleService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('people.edit')
  update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePersonDto,
    @Req() req: Request,
  ) {
    return this.peopleService.update(user, id, body, getRequestMeta(req));
  }

  @Post(':id/contracts')
  @RequirePermissions('people.edit')
  createContract(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePersonContractDto,
    @Req() req: Request,
  ) {
    return this.peopleService.createContract(user, id, body, getRequestMeta(req));
  }

  @Patch(':id/contracts/:contractId')
  @RequirePermissions('people.edit')
  updateContract(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() body: UpdatePersonContractDto,
    @Req() req: Request,
  ) {
    return this.peopleService.updateContract(user, id, contractId, body, getRequestMeta(req));
  }

  @Post(':id/documents')
  @RequirePermissions('people.edit')
  createDocument(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePersonDocumentDto,
    @Req() req: Request,
  ) {
    return this.peopleService.createDocument(user, id, body, getRequestMeta(req));
  }

  @Patch(':id/documents/:documentId')
  @RequirePermissions('people.edit')
  updateDocument(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() body: UpdatePersonDocumentDto,
    @Req() req: Request,
  ) {
    return this.peopleService.updateDocument(user, id, documentId, body, getRequestMeta(req));
  }

  @Post(':id/documents/upload')
  @RequirePermissions('people.edit')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedBinaryFile | undefined,
    @Body() body: CreatePersonDocumentDto,
    @Req() req: Request,
  ) {
    return this.peopleService.uploadDocument(user, id, file, body, getRequestMeta(req));
  }

  @Post(':id/documents/:documentId/migrate-storage')
  @RequirePermissions('people.edit')
  migrateDocumentToManagedStorage(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() req: Request,
  ) {
    return this.peopleService.migrateDocumentToManagedStorage(user, id, documentId, getRequestMeta(req));
  }

  @Get(':id/documents/:documentId/access')
  @RequirePermissions('people.view')
  getDocumentAccess(
    @CurrentUser() user: CurrentUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.peopleService.getDocumentAccess(user, id, documentId);
  }
}
