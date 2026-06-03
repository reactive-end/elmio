import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { ENTERPRISE_REPOSITORY_PORT, type EnterpriseRepositoryPort } from '../domain/ports/enterprise-repository.port'
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service'
import { normalizePhoneToR4 } from '@/shared/utils/phone'
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

    if (request.status !== 'approved' && request.status !== 'company_approved') {
      throw new BadRequestException('La solicitud debe estar aprobada (por la empresa o finanzas) para desembolsar.')
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

    // Obtener tasa de cambio BCV. Primero busca en la BD local,
    // y si no hay dato reciente consulta directamente el endpoint de R4.
    let exchangeRate: number

    const dbRate = await this.paymentProcessorService.getLastExchangeRate()
    if (dbRate && dbRate.bolivaresPerUsd) {
      exchangeRate = Number(dbRate.bolivaresPerUsd)
    } else {
      const today = new Date().toISOString().split('T')[0]

      const rateResponse = await this.paymentProcessorService.getExchangeRate({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        date: today,
        currency: 'USD',
      })

      if (!rateResponse || !rateResponse.exchangeRate) {
        throw new BadRequestException(
          'No se pudo obtener la tasa de cambio BCV para calcular el monto en bolivares.',
        )
      }

      exchangeRate = rateResponse.exchangeRate
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
      phoneNumber: normalizePhoneToR4(primaryAccount.phoneNumber),
      nationalId: primaryAccount.documentId,
      concept,
    } as any)

    let definitiveCode = creditResult.code

    // Si R4 responde AC00 (Operacion en Espera de Respuesta del Receptor),
    // hacer polling inmediato para obtener el estado definitivo.
    if (creditResult.code === 'AC00' && creditResult.reference) {
      const MAX_POLL_ATTEMPTS = 3
      const POLL_INTERVAL_MS = 60000

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

        try {
          const statusResult = await this.paymentProcessorService.queryOperationR4({
            companyAccountId: 'GLOBAL_R4_FALLBACK',
            reference: creditResult.reference,
          })

          if (statusResult.code && statusResult.code !== 'AC00') {
            definitiveCode = statusResult.code
            break
          }
        } catch {
          // Si la consulta falla, reintentar en el siguiente ciclo
        }
      }
    }

    const isSuccess = definitiveCode === 'ACCP'

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

    // Actualizar estado de la solicitud solo si el desembolso fue exitoso
    if (isSuccess) {
      request.status = 'disbursed'
      request.updatedAt = new Date().toISOString()
      await this.repository.saveRequest(request)
    }

    return {
      request,
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
