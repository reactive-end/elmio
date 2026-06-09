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
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/guards/roles.decorator';
import { MercantilStorageService } from '../../../mercantil/application/services/mercantil-storage.service';
import { UserRole } from '../../../auth/domain/user';
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
import { ExecuteBillingCutoffUseCase, type BillingCutoffResult } from '../../application/execute-billing-cutoff.use-case';
import { ManageDisburseUseCase } from '../../application/manage-disburse.use-case';
import { ManageVueltoUseCase } from '../../application/manage-vuelto.use-case';
import { ManagePurchasesUseCase } from '../../application/manage-purchases.use-case';
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
  CreatePurchaseDto,
} from './dto/enterprise.dto';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../../domain/ports/enterprise-repository.port';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
} from '../../../product/domain/ports/product-repository.port';
import type { Product } from '../../../product/domain/product';
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
    private readonly executeBillingCutoff: ExecuteBillingCutoffUseCase,
    private readonly manageDisburse: ManageDisburseUseCase,
    private readonly manageVuelto: ManageVueltoUseCase,
    private readonly managePurchases: ManagePurchasesUseCase,
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly enterpriseRepository: EnterpriseRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    private readonly documentStorage: DocumentStorageService,
    private readonly mercantilStorageService: MercantilStorageService,
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

  /** GET /api/enterprises/requests/finance-pending - Lista de solicitudes pendientes para Finanzas. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE)
  @Get('requests/finance-pending')
  async listFinancePendingRequests() {
    const requests = await this.enterpriseRepository.findAllRequests('company_approved');

    // Resolver si cada solicitud requiere desembolso manual (manual_disburse)
    // segun la configuracion del producto asociado.
    const productIds = [...new Set(requests.map((r: LoanRequest) => r.productId).filter(Boolean) as string[])];
    const products = await Promise.all(
      productIds.map((id: string) => this.productRepository.findById(id)),
    );
    const productMap = new Map<string, Product>(
      products.filter((p): p is Product => p !== null).map((p) => [p.id, p]),
    );

    // Buscar si hay desembolsos asociados
    const disbursements = await Promise.all(
      requests.map((r: LoanRequest) => this.enterpriseRepository.findDisbursementByLoanRequestId(r.id))
    );
    const disbursementMap = new Map<string, any>(
      disbursements.filter((d): d is any => d !== null).map((d) => [d.loanRequestId, d])
    );

    return requests.map((req: LoanRequest) => {
      const product = req.productId ? productMap.get(req.productId) : undefined;
      const requiresManualDisburse =
        product?.actions?.some((a: { type: string; active: boolean }) => a.type === 'manual_disburse' && a.active) ?? false;
      const requiresR4Vuelto =
        product?.actions?.some((a: { type: string; active: boolean }) => a.type === 'r4_vuelto' && a.active) ?? false;

      const disbursement = disbursementMap.get(req.id);
      const hasPendingDisbursement = disbursement?.status === 'pending';

      return { ...req, requiresManualDisburse, requiresR4Vuelto, hasPendingDisbursement };
    });
  }

  /** PATCH /api/enterprises/requests/:reqId/finance-resolve - Finanzas aprueba/deniega. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE)
  @Patch('requests/:reqId/finance-resolve')
  async resolveFinanceRequest(
    @Param('reqId') reqId: string,
    @Body() body: ResolveLoanRequestDto,
  ) {
    return this.manageRequests.resolveByFinance(reqId, body.status, body.denialReason);
  }

  /** POST /api/enterprises/requests/:reqId/disburse - Finanzas desembolsa via Credito Inmediato R4. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Post('requests/:reqId/disburse')
  async disburseRequest(
    @Req() req: Request,
    @Param('reqId') reqId: string,
    @Body('force') force?: boolean,
  ) {
    const session = req.session!
    return this.manageDisburse.execute(reqId, {
      financeUserId: session.userId,
      financeUserName: session.email || 'Usuario Finanzas',
    }, force);
  }

  /** POST /api/enterprises/requests/:reqId/disburse/verify - Verifica el resultado de un desembolso pendiente (R4 AC00). */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Post('requests/:reqId/disburse/verify')
  async verifyDisburseRequest(
    @Param('reqId') reqId: string,
  ) {
    return this.manageDisburse.verifyDisburse(reqId);
  }

  /** POST /api/enterprises/requests/:reqId/disburse/complete-manual - Finanzas concilia y completa el desembolso manualmente. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Post('requests/:reqId/disburse/complete-manual')
  async completeManualDisburseRequest(
    @Param('reqId') reqId: string,
  ) {
    return this.manageDisburse.completeManual(reqId);
  }

  /** POST /api/enterprises/requests/:reqId/vuelto - Finanzas desembolsa via Vuelto R4 (respuesta inmediata). */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Post('requests/:reqId/vuelto')
  async processVueltoRequest(
    @Req() req: Request,
    @Param('reqId') reqId: string,
  ) {
    const session = req.session!
    return this.manageVuelto.execute(reqId, {
      financeUserId: session.userId,
      financeUserName: session.email || 'Usuario Finanzas',
    });
  }

  // --- Purchases ---

  /** POST /api/enterprises/purchases - Crea una compra/orden desde el checkout del marketplace. */
  @Post('purchases')
  async createPurchase(@Body() body: CreatePurchaseDto) {
    return this.managePurchases.execute({
      purchaserType: body.purchaserType,
      purchaserId: body.purchaserId,
      purchaserName: body.purchaserName,
      purchaserEmail: body.purchaserEmail,
      purchaserDocument: body.purchaserDocument,
      productId: body.productId,
      productName: body.productName,
      productSku: body.productSku,
      marketplaceId: body.marketplaceId,
      amountUsd: body.amountUsd,
      isFinanced: body.isFinanced,
      installments: body.installments,
      interestRate: body.interestRate,
      channel: body.channel,
      transactionId: body.transactionId,
      status: body.status,
    });
  }

  /** GET /api/enterprises/purchases - Lista todas las compras del sistema (solo finanzas). */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Get('purchases')
  async listAllPurchases() {
    return this.enterpriseRepository.findAllPurchases();
  }

  /** GET /api/enterprises/finance/purchases - Obtiene todas las compras y cuotas pendientes del sistema. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Get('finance/purchases')
  async listAllFinancePurchases() {
    const transactions = await this.enterpriseRepository.findAllTransactions();
    
    // 1. Filtrar las transacciones de tipo 'charge' que comiencen con 'Compra marketplace:'
    const chargeTxs = transactions.filter(
      (t) => t.kind === 'charge' && t.concept.startsWith('Compra marketplace:'),
    );

    const results = [];

    for (const tx of chargeTxs) {
      // 2. Buscar el colaborador
      let collaboratorName = 'Colaborador del Sistema';
      let documentId = '—';
      let email = '—';

      if (tx.collaboratorId) {
        const collab = await this.enterpriseRepository.findCollaboratorById(tx.collaboratorId);
        if (collab) {
          collaboratorName = `${collab.name} ${collab.lastName}`.trim();
          documentId = collab.documentId || '—';
          email = collab.email || '—';
        }
      }

      // 3. Buscar la empresa
      let enterpriseName = 'Consumidor Directo / Sistema';
      if (tx.enterpriseId) {
        const enterprise = await this.enterpriseRepository.findEnterpriseById(tx.enterpriseId);
        if (enterprise) {
          enterpriseName = enterprise.companyName;
        }
      }

      // 4. Determinar si es un Seguro Mercantil
      const conceptLower = tx.concept.toLowerCase();
      const isInsurance =
        conceptLower.includes('seguro') ||
        conceptLower.includes('póliza') ||
        conceptLower.includes('poliza');

      let totalQuotes = 6;
      let paidQuotes = 0;
      let pendingQuotes = 6;
      let pendingAmount = tx.amount;

      if (isInsurance) {
        const isRCV = conceptLower.includes('rcv');
        if (isRCV) {
          // Seguros RCV (La Mundial o Mercantil RCV): Pago anual único (1 cuota)
          totalQuotes = 1;
          if (tx.status === 'paid') {
            paidQuotes = 1;
            pendingQuotes = 0;
            pendingAmount = 0;
          } else {
            paidQuotes = 0;
            pendingQuotes = 1;
            pendingAmount = tx.amount;
          }
        } else {
          // Seguros de mercantil (Salud, Vida, etc.): Consultar las cuotas reales por su shopcartId
          try {
            if (email !== '—') {
              const clientSearchResult = await this.mercantilStorageService.searchClients({ email });
              const userOrders = clientSearchResult?.items || [];
              if (userOrders.length > 0) {
                const shopcartId = userOrders[0].shopcartId;
                const quotes = await this.mercantilStorageService.getQuotesByShopcart(shopcartId);
                if (quotes && quotes.length > 0) {
                  totalQuotes = quotes.length;
                  const paidList = quotes.filter(
                    (cuota) =>
                      cuota.isPaid ||
                      cuota.receiptStatus?.toLowerCase() === 'paid' ||
                      cuota.quoteStatus?.toLowerCase() === 'paid',
                  );
                  paidQuotes = paidList.length;
                  pendingQuotes = Math.max(0, totalQuotes - paidQuotes);
                  
                  // Calcular el monto pendiente acumulando el total de las cuotas no pagadas
                  const unpaidList = quotes.filter(
                    (cuota) =>
                      !(
                        cuota.isPaid ||
                        cuota.receiptStatus?.toLowerCase() === 'paid' ||
                        cuota.quoteStatus?.toLowerCase() === 'paid'
                      ),
                  );
                  pendingAmount = unpaidList.reduce((sum, q) => sum + (q.amount ?? 0), 0);
                }
              }
            }
          } catch (err) {
            console.error('Error calculando cuotas de seguro mercantil en backend:', err);
          }
        }
      } else {
        // Producto estándar / Préstamos
        // Para productos estándar/préstamos simulamos cuotas (por defecto 6 cuotas)
        totalQuotes = 6;
        if (tx.status === 'paid') {
          paidQuotes = 6;
          pendingQuotes = 0;
          pendingAmount = 0;
        } else if (tx.status === 'failed') {
          paidQuotes = 0;
          pendingQuotes = 6;
          pendingAmount = 0;
        } else {
          // Si está pendiente, las cuotas cuya fecha ya pasó se consideran pagadas
          const baseDate = new Date(tx.date);
          const now = new Date();
          let unpaidCount = 0;
          let unpaidSum = 0;
          const cuotaAmount = Math.round((tx.amount / 6) * 100) / 100;

          for (let i = 1; i <= 6; i++) {
            const dueDate = new Date(baseDate);
            dueDate.setMonth(baseDate.getMonth() + i);

            if (dueDate < now) {
              paidQuotes++;
            } else {
              unpaidCount++;
              unpaidSum += i === 6 ? tx.amount - cuotaAmount * 5 : cuotaAmount;
            }
          }
          pendingQuotes = unpaidCount;
          pendingAmount = Math.max(0, Math.round(unpaidSum * 100) / 100);
        }
      }

      results.push({
        transactionId: tx.id,
        collaborator: {
          name: collaboratorName,
          documentId,
          email,
        },
        enterprise: {
          name: enterpriseName,
        },
        concept: tx.concept,
        amount: tx.amount,
        date: tx.date,
        type: isInsurance ? 'insurance' : 'product',
        totalQuotes,
        paidQuotes,
        pendingQuotes,
        pendingAmount,
      });
    }

    return results;
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

  /** POST /api/enterprises/billing/execute-cutoff - Ejecuta el cobro y facturación consolidada a empresas y personas naturales para una fecha de corte específica. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @Post('billing/execute-cutoff')
  async executeCutoff(@Body('date') date?: string): Promise<BillingCutoffResult> {
    return this.executeBillingCutoff.execute(date);
  }
}
