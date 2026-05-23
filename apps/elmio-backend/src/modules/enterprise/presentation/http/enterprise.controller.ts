import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { ManageContractsUseCase } from '../../application/manage-contracts.use-case';
import type { LoanRequest } from '../../domain/enterprise';
import {
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
  CreateCollaboratorDto,
  BulkUploadCollaboratorsDto,
  ResolveLoanRequestDto,
  CreateTransactionDto,
  CreateContractDto,
  UpdateContractDto,
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
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly manageContracts: ManageContractsUseCase,
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
      body.sector,
      body.employeeCount,
      body.phone,
      body.email,
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

  // --- Contracts ---

  /** GET /api/enterprises/:id/contracts - Lista contratos de la empresa. */
  @Get(':id/contracts')
  async listContracts(@Param('id') id: string) {
    return this.manageContracts.list(id);
  }

  /** POST /api/enterprises/:id/contracts - Crea un contrato con archivos. */
  @Post(':id/contracts')
  @UseInterceptors(FilesInterceptor('files'))
  async createContract(
    @Param('id') id: string,
    @Body() body: CreateContractDto,
    @UploadedFiles() files: ArchivoSubido[] | undefined,
  ) {
    return this.manageContracts.create(id, body.name, files ?? []);
  }

  /** PATCH /api/enterprises/:id/contracts/:contractId - Edita nombre y/o agrega archivos. */
  @Patch(':id/contracts/:contractId')
  @UseInterceptors(FilesInterceptor('files'))
  async updateContract(
    @Param('contractId') contractId: string,
    @Body() body: UpdateContractDto,
    @UploadedFiles() files: ArchivoSubido[] | undefined,
  ) {
    return this.manageContracts.update(contractId, body.name, files ?? []);
  }

  /** DELETE /api/enterprises/:id/contracts/:contractId - Elimina un contrato. */
  @Delete(':id/contracts/:contractId')
  async deleteContract(@Param('contractId') contractId: string) {
    await this.manageContracts.remove(contractId);
    return { success: true } as const;
  }

  /** DELETE /api/enterprises/:id/contracts/:contractId/files/:fileId - Elimina un archivo del contrato. */
  @Delete(':id/contracts/:contractId/files/:fileId')
  async deleteContractFile(
    @Param('contractId') contractId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.manageContracts.removeFile(contractId, fileId);
    return { success: true } as const;
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

  /** POST /api/enterprises/:id/transactions - Registra un movimiento. */
  @Post(':id/transactions')
  async createTransaction(
    @Param('id') id: string,
    @Body() body: CreateTransactionDto,
  ) {
    return this.createTransactionUseCase.execute(id, body);
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

  /**
   * GET /api/enterprises/contracts/file/:taxId/:fileName - Sirve un archivo de contrato.
   */
  @Get('contracts/file/:taxId/:fileName')
  async getContractFile(
    @Param('taxId') taxId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const doc = await this.documentStorage.getDocument(taxId, fileName, 'contracts');
    if (!doc) {
      throw new NotFoundException('Archivo de contrato no encontrado.');
    }

    res.type(doc.mimeType);
    res.send(doc.buffer);
  }
}
