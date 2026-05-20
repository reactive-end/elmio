import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import {
  GetOrCreateEnterpriseUseCase,
  GetEnterpriseUseCase,
} from '../../application/get-enterprise.use-case';
import { UpdateEnterpriseUseCase } from '../../application/save-domiciliation.use-case';
import { CompleteOnboardingUseCase } from '../../application/complete-onboarding.use-case';
import { ManageCollaboratorsUseCase } from '../../application/manage-collaborators.use-case';
import { ManageLoanRequestsUseCase } from '../../application/manage-loan-requests.use-case';
import { GetAccountStatementUseCase } from '../../application/get-account-statement.use-case';
import type { LoanRequest } from '../../domain/enterprise';
import {
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
  CreateCollaboratorDto,
  BulkUploadCollaboratorsDto,
  ResolveLoanRequestDto,
} from './dto/enterprise.dto';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../../domain/ports/enterprise-repository.port';
import { DocumentStorageService } from '../../infrastructure/document-storage.service';
import type { ArchivoSubido } from '../../../gallery/domain/gallery-image';

/**
 * Controlador HTTP del modulo empresarial.
 * Todos los endpoints requieren autenticacion.
 */
@Controller('enterprises')
@UseGuards(AuthGuard)
export class EnterpriseController {
  constructor(
    private readonly getOrCreate: GetOrCreateEnterpriseUseCase,
    private readonly getEnterprise: GetEnterpriseUseCase,
    private readonly updateEnterprise: UpdateEnterpriseUseCase,
    private readonly completeOnboarding: CompleteOnboardingUseCase,
    private readonly manageCollaborators: ManageCollaboratorsUseCase,
    private readonly manageRequests: ManageLoanRequestsUseCase,
    private readonly getAccountStatement: GetAccountStatementUseCase,
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly enterpriseRepository: EnterpriseRepositoryPort,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  // --- Enterprise ---

  /** POST /api/enterprises - Crea la empresa del usuario. */
  @Post()
  async create(@Req() req: Request, @Body() body: CreateEnterpriseDto) {
    return this.getOrCreate.execute(
      req.session!.userId,
      body.companyName,
      body.taxId,
    );
  }

  /** GET /api/enterprises/me - Obtiene la empresa del usuario autenticado. */
  @Get('me')
  async getMe(@Req() req: Request) {
    return this.getEnterprise.execute(req.session!.userId);
  }

  /** PATCH /api/enterprises/:id - Actualiza datos de la empresa. */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateEnterpriseDto) {
    return this.updateEnterprise.execute(id, body);
  }

  /** PATCH /api/enterprises/:id/complete-onboarding - Finaliza el onboarding. */
  @Patch(':id/complete-onboarding')
  async onboarding(@Param('id') id: string) {
    return this.completeOnboarding.execute(id);
  }

  // --- Collaborators ---

  /** GET /api/enterprises/:id/collaborators - Lista colaboradores. */
  @Get(':id/collaborators')
  async listCollaborators(@Param('id') id: string) {
    return this.manageCollaborators.list(id);
  }

  /** POST /api/enterprises/:id/collaborators - Crea un colaborador. */
  @Post(':id/collaborators')
  async createCollaborator(
    @Param('id') id: string,
    @Body() body: CreateCollaboratorDto,
  ) {
    return this.manageCollaborators.createOne(id, body);
  }

  /** POST /api/enterprises/:id/collaborators/bulk - Carga masiva. */
  @Post(':id/collaborators/bulk')
  async bulkCollaborators(
    @Param('id') id: string,
    @Body() body: BulkUploadCollaboratorsDto,
  ) {
    return this.manageCollaborators.createBulk(id, body.collaborators);
  }

  /** PATCH /api/enterprises/:id/collaborators/:collabId - Actualiza colaborador. */
  @Patch(':id/collaborators/:collabId')
  async updateCollaborator(
    @Param('collabId') collabId: string,
    @Body()
    body: Partial<
      CreateCollaboratorDto & { status: 'active' | 'suspended' | 'terminated' }
    >,
  ) {
    return this.manageCollaborators.update(collabId, body);
  }

  // --- Loan Requests ---

  /** GET /api/enterprises/:id/requests - Lista solicitudes. */
  @Get(':id/requests')
  async listRequests(
    @Param('id') id: string,
    @Query('status') status?: LoanRequest['status'],
  ) {
    return this.manageRequests.list(id, status);
  }

  /** PATCH /api/enterprises/:id/requests/:reqId - Resuelve solicitud. */
  @Patch(':id/requests/:reqId')
  async resolveRequest(
    @Param('reqId') reqId: string,
    @Body() body: ResolveLoanRequestDto,
  ) {
    return this.manageRequests.resolve(reqId, body.status, body.denialReason);
  }

  // --- Account Statement ---

  /** GET /api/enterprises/:id/account-statement - Resumen de deuda. */
  @Get(':id/account-statement')
  async accountStatement(@Param('id') id: string) {
    return this.getAccountStatement.getLoanSummary(id);
  }

  /** GET /api/enterprises/:id/transactions - Lista transacciones. */
  @Get(':id/transactions')
  async listTransactions(@Param('id') id: string) {
    return this.getAccountStatement.getTransactions(id);
  }

  // --- Onboarding Documents ---

  /**
   * POST /api/enterprises/:id/documentos - Sube un archivo de onboarding para la empresa.
   * Guarda el archivo en enterprise/[taxId]/documentos/[fileName].
   */
  @Post(':id/documentos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: ArchivoSubido | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Debes enviar un archivo.');
    }

    const enterprise = await this.enterpriseRepository.findEnterpriseById(id);
    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const fileName = await this.documentStorage.save(
      enterprise.taxId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const url = `/api/enterprises/documentos/file/${enterprise.taxId}/${fileName}`;
    return { url, fileName };
  }

  /**
   * GET /api/enterprises/documentos/file/:taxId/:fileName - Sirve un documento de onboarding subido.
   * Requiere autenticacion por seguridad de datos.
   */
  @Get('documentos/file/:taxId/:fileName')
  async getDocumentFile(
    @Param('taxId') taxId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const doc = await this.documentStorage.getDocument(taxId, fileName);
    if (!doc) {
      throw new NotFoundException('Documento no encontrado.');
    }

    res.type(doc.mimeType);
    res.send(doc.buffer);
  }
}
