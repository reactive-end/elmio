import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service';

export interface BillingCutoffResult {
  success: boolean;
  message: string;
  processedCompaniesCount: number;
  processedRetailTxsCount: number;
  details: {
    companies: Array<{ id: string; name: string; amount: number; success: boolean; error?: string }>;
    retail: Array<{ transactionId: string; concept: string; amount: number; success: boolean; error?: string }>;
  };
}

/**
 * Procesa el lote de cobros automáticos domiciliados en las fechas fijas (15 y último de mes).
 */
@Injectable()
export class ExecuteBillingCutoffUseCase {
  private readonly logger = new Logger(ExecuteBillingCutoffUseCase.name);

  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  /**
   * Ejecuta el cobro por lotes programado para empresas y cuotas de personas naturales.
   * @param cutoffDateStr Fecha de corte de cobro (YYYY-MM-DD). Si no se proporciona, usa la fecha actual.
   * @returns Resumen detallado de la ejecución de cobro.
   */
  async execute(cutoffDateStr?: string): Promise<BillingCutoffResult> {
    const cutoffDate = cutoffDateStr ? new Date(cutoffDateStr) : new Date();
    if (Number.isNaN(cutoffDate.getTime())) {
      throw new BadRequestException('Formato de fecha de corte inválido (debe ser YYYY-MM-DD).');
    }

    this.logger.log(`Iniciando ejecución de cobros para la fecha de corte: ${cutoffDate.toISOString()}`);

    const transactions = await this.repository.findAllTransactions();
    
    // Filtrar las transacciones pendientes que sean de tipo cobro/cargo y cuya fecha sea igual o anterior a la fecha de corte
    const pendingCharges = transactions.filter((tx) => {
      if (tx.kind !== 'charge' || tx.status !== 'pending') return false;
      const txDate = new Date(tx.date);
      return !Number.isNaN(txDate.getTime()) && txDate <= cutoffDate;
    });

    if (pendingCharges.length === 0) {
      return {
        success: true,
        message: 'No se encontraron cargos de facturación pendientes para procesar en la fecha indicada.',
        processedCompaniesCount: 0,
        processedRetailTxsCount: 0,
        details: { companies: [], retail: [] },
      };
    }

    // Separar cargos de empresas (corporativos) y cargos de personas naturales (individuales)
    const corporateTxs = pendingCharges.filter((tx) => tx.enterpriseId !== null);
    const retailTxs = pendingCharges.filter((tx) => tx.enterpriseId === null);

    const companiesResults: Array<{ id: string; name: string; amount: number; success: boolean; error?: string }> = [];
    const retailResults: Array<{ transactionId: string; concept: string; amount: number; success: boolean; error?: string }> = [];

    // ─────────────────────────────────────────────────────────────────────────
    // 1. COBRO CONSOLIDADO A EMPRESAS (DOMICILIACIÓN CORPORATIVA)
    // ─────────────────────────────────────────────────────────────────────────
    // Agrupar las transacciones corporativas por empresa
    const txsByCompany = new Map<string, typeof corporateTxs>();
    for (const tx of corporateTxs) {
      const enterpriseId = tx.enterpriseId as string;
      const list = txsByCompany.get(enterpriseId) ?? [];
      list.push(tx);
      txsByCompany.set(enterpriseId, list);
    }

    for (const [enterpriseId, txs] of txsByCompany.entries()) {
      const enterprise = await this.repository.findEnterpriseById(enterpriseId);
      const companyName = enterprise?.companyName ?? `Empresa ${enterpriseId}`;
      const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);

      try {
        if (!enterprise) {
          throw new Error('La empresa ya no existe en el sistema.');
        }

        // Buscar cuenta bancaria de cobro (domiciliación) de la empresa
        const billingAccount = enterprise.bankAccounts?.[0];
        if (!billingAccount || !billingAccount.accountNumber || !billingAccount.bank) {
          throw new Error('La empresa no tiene cuentas bancarias de domiciliación registradas.');
        }

        this.logger.log(`Procesando cobro consolidado de ${totalAmount} Bs. para la empresa: ${companyName}`);

        // Ejecutar débito directo CCE (Banco R4 o Plaza) a la cuenta de la organización
        // El R4 fallback o cuenta comercial del procesador se usará en el repositorio de pago
        await this.paymentProcessorService.processAccountDirectDebitR4({
          companyAccountId: 'GLOBAL_R4_FALLBACK',
          documentId: enterprise.taxId,
          fullName: companyName,
          accountNumber: billingAccount.accountNumber,
          amount: totalAmount,
          concept: `Cobro Consolidado ElMio - Corte: ${cutoffDate.toLocaleDateString()}`,
        } as any);

        // Si es exitoso, marcamos todas las transacciones consolidadas de esta empresa como pagadas
        for (const tx of txs) {
          tx.status = 'paid';
          await this.repository.saveTransaction(tx);
        }

        companiesResults.push({
          id: enterpriseId,
          name: companyName,
          amount: totalAmount,
          success: true,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error de comunicación bancaria.';
        this.logger.error(`Fallo en cobro de empresa ${companyName}: ${errMsg}`);
        companiesResults.push({
          id: enterpriseId,
          name: companyName,
          amount: totalAmount,
          success: false,
          error: errMsg,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. COBRO A PERSONAS NATURALES (DOMICILIACIÓN INDIVIDUAL)
    // ─────────────────────────────────────────────────────────────────────────
    for (const tx of retailTxs) {
      try {
        if (!tx.collaboratorId) {
          throw new Error('La transacción de cargo no tiene un colaborador o cliente asociado.');
        }

        const profile = await this.repository.findCollaboratorById(tx.collaboratorId);
        if (!profile) {
          throw new Error('No se encontró el perfil de cliente en el sistema.');
        }

        const bankAccounts = await this.repository.findBankAccountsByPersonProfileId(profile.id);
        const primaryAccount = bankAccounts.find((acc) => acc.isPrimary) || bankAccounts[0];

        if (!primaryAccount) {
          throw new Error('El cliente no tiene datos de cuenta bancaria registrados para la domiciliación.');
        }

        this.logger.log(`Procesando cobro de cuota domiciliada de ${tx.amount} Bs. para cliente: ${profile.name} ${profile.lastName}`);

        // Ejecutar domiciliación electrónica individual en Banco R4
        await this.paymentProcessorService.processAccountDirectDebitR4({
          companyAccountId: 'GLOBAL_R4_FALLBACK',
          documentId: `${profile.documentType || 'V'}${profile.documentId}`,
          fullName: `${profile.name} ${profile.lastName}`,
          accountNumber: primaryAccount.accountNumber,
          amount: tx.amount,
          concept: `ElMio - ${tx.concept}`,
        } as any);

        // Si es exitoso, actualizar la transacción a pagada
        tx.status = 'paid';
        await this.repository.saveTransaction(tx);

        retailResults.push({
          transactionId: tx.id,
          concept: tx.concept,
          amount: tx.amount,
          success: true,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error en cobro domiciliado.';
        this.logger.error(`Fallo en cobro de cuota para transacción ${tx.id}: ${errMsg}`);
        retailResults.push({
          transactionId: tx.id,
          concept: tx.concept,
          amount: tx.amount,
          success: false,
          error: errMsg,
        });
      }
    }

    const success = companiesResults.every((c) => c.success) && retailResults.every((r) => r.success);

    return {
      success,
      message: success
        ? 'Todos los cobros de facturación del periodo han sido procesados y debitados exitosamente.'
        : 'Se completó la ejecución pero fallaron algunos débitos programados. Revisa el listado de detalles.',
      processedCompaniesCount: companiesResults.filter((c) => c.success).length,
      processedRetailTxsCount: retailResults.filter((r) => r.success).length,
      details: {
        companies: companiesResults,
        retail: retailResults,
      },
    };
  }
}
