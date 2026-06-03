import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { ENTERPRISE_REPOSITORY_PORT, type EnterpriseRepositoryPort } from '../domain/ports/enterprise-repository.port'
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service'
import type { Disbursement } from '../domain/disbursement'

export interface DisburseRequestDto {
  /** ID del usuario de finanzas que ejecuta (viene de la sesion) */
  financeUserId: string
  /** Nombre del usuario de finanzas */
  financeUserName: string
}

/**
 * Orquesta el desembolso manual de una solicitud aprobada via Credito Inmediato R4.
 */
@Injectable()
export class ManageDisburseUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  /**
   * Ejecuta el desembolso de una solicitud de prestamo aprobada.
   * @param requestId ID de la solicitud.
   * @param dto Datos del usuario de finanzas que ejecuta.
   * @returns Resumen del desembolso.
   */
  async execute(requestId: string, dto: DisburseRequestDto) {
    const request = await this.repository.findRequestById(requestId)
    if (!request) throw new NotFoundException('Solicitud no encontrada.')

    if (request.status !== 'approved') {
      throw new BadRequestException('La solicitud debe estar aprobada para desembolsar.')
    }

    // Buscar perfil del colaborador
    const profile = await this.repository.findCollaboratorById(request.collaboratorId)
    if (!profile) {
      throw new BadRequestException('No se encontro el perfil del colaborador.')
    }

    // Buscar cuenta bancaria primaria del colaborador
    const bankAccounts = await this.repository.findBankAccountsByPersonProfileId(profile.id)
    const primaryAccount = bankAccounts.find((acc) => acc.isPrimary) || bankAccounts[0]
    if (!primaryAccount) {
      throw new BadRequestException('El colaborador no tiene cuenta bancaria registrada.')
    }

    // Obtener tasa de cambio BCV de R4
    let exchangeRate = 1
    try {
      const rateObj = await this.paymentProcessorService.getLastExchangeRate()
      if (rateObj && rateObj.bolivaresPerUsd) {
        exchangeRate = Number(rateObj.bolivaresPerUsd)
      }
    } catch {
      // Usar tasa 1 como fallback
    }

    // Calcular monto en Bs
    const amountUsd = Number(request.amount)
    const amountBs = Number((amountUsd * exchangeRate).toFixed(2))

    const concept = `Desembolso prestamo: ${request.description || 'Prestamo'}`
    const fullName = profile.name && profile.lastName
      ? `${profile.name} ${profile.lastName}`
      : (request.collaboratorName || 'Beneficiario')

    // Ejecutar Credito Inmediato en R4
    const creditResult = await this.paymentProcessorService.processImmediateCreditR4({
      companyAccountId: 'GLOBAL_R4_FALLBACK',
      bankCode: primaryAccount.bankCode,
      amount: amountBs,
      phoneNumber: primaryAccount.phoneNumber,
      nationalId: primaryAccount.documentId,
      concept,
    } as any)

    const isSuccess = creditResult.code === 'ACCP'

    // Persistir registro de desembolso
    const disbursement: Disbursement = {
      id: randomUUID(),
      loanRequestId: requestId,
      paymentId: creditResult.internalPaymentId || randomUUID(),
      financeUserId: dto.financeUserId,
      financeUserName: dto.financeUserName,
      amountUsd,
      amountBs,
      exchangeRate,
      bankCode: primaryAccount.bankCode,
      accountNumber: primaryAccount.accountNumber,
      phoneNumber: primaryAccount.phoneNumber,
      documentId: primaryAccount.documentId,
      concept,
      bankReference: creditResult.reference || null,
      bankOperationId: creditResult.id || null,
      status: isSuccess ? 'success' : 'failed',
      createdAt: new Date().toISOString(),
    }

    await this.repository.saveDisbursement(disbursement)

    // Actualizar estado de la solicitud
    request.status = isSuccess ? 'disbursed' : 'approved'
    const savedRequest = await this.repository.saveRequest(request)

    return {
      request: savedRequest,
      disbursement,
      creditResult: {
        code: creditResult.code,
        message: creditResult.message,
        reference: creditResult.reference,
        id: creditResult.id,
      },
    }
  }
}
