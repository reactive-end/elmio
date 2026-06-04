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

export type DisburseExecuteResult =
  | {
      status: 'disbursed'
      request: Awaited<ReturnType<EnterpriseRepositoryPort['findRequestById']>>
      disbursement: Disbursement
    }
  | { status: 'pending'; requestId: string }

export type VerifyDisburseResult =
  | { status: 'disbursed'; reference: string | null }
  | { status: 'pending' }
  | { status: 'failed'; message: string }

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
   * Inicia el desembolso de una solicitud de prestamo aprobada.
   * Llama a Credito Inmediato R4. Si R4 responde ACCP se completa el desembolso
   * en este mismo metodo. Si responde AC00 guarda el desembolso como 'pending'
   * y NO cambia el estado de la solicitud: la verificacion posterior se hace
   * via {@link verifyDisburse} para evitar timeouts de Nginx.
   * Si ya existe un disbursement 'pending' para esta solicitud (reapertura de
   * navegador), retorna 'pending' sin volver a llamar a R4.
   * @param requestId ID de la solicitud.
   * @param dto Datos del usuario de finanzas que ejecuta.
   * @returns Resultado de la fase de inicio.
   */
  async execute(requestId: string, dto: DisburseRequestDto): Promise<DisburseExecuteResult> {
    const request = await this.repository.findRequestById(requestId)
    if (!request) throw new NotFoundException('Solicitud no encontrada.')

    if (request.status !== 'approved' && request.status !== 'company_approved') {
      throw new BadRequestException(
        'La solicitud debe estar aprobada (por la empresa o finanzas) para desembolsar.',
      )
    }

    // Si ya hay un desembolso pendiente para esta solicitud, reanudar sin
    // volver a llamar a R4 (evita credito duplicado si el usuario reabre la UI).
    const existing = await this.repository.findDisbursementByLoanRequestId(requestId)
    if (existing && existing.status === 'pending') {
      return { status: 'pending', requestId }
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

    // Ejecutar Credito Inmediato en R4
    const creditResult = (await this.paymentProcessorService.processImmediateCreditR4({
      companyAccountId: 'GLOBAL_R4_FALLBACK',
      bankCode: primaryAccount.bankCode,
      amount: amountBs,
      phoneNumber: normalizePhoneToR4(primaryAccount.phoneNumber),
      nationalId: primaryAccount.documentId,
      concept,
    } as any)) as {
      code: string
      message?: string
      reference?: string
      id?: string
      internalPaymentId?: string
    }

    // AC00 sin id: no hay forma de consultar despues. Marcamos failed.
    if (creditResult.code === 'AC00' && !creditResult.id) {
      const disbursement = this.buildDisbursement(
        requestId,
        dto,
        amountUsd,
        amountBs,
        exchangeRate,
        primaryAccount,
        concept,
        null,
        null,
        'failed',
        creditResult,
      )
      await this.repository.saveDisbursement(disbursement)
      throw new BadRequestException(
        'R4 respondio AC00 sin ID de operacion. No se puede verificar el resultado del credito.',
      )
    }

    // AC00 con id: desembolso queda en 'pending' y se verifica luego via /disburse/verify.
    if (creditResult.code === 'AC00' && creditResult.id) {
      const disbursement = this.buildDisbursement(
        requestId,
        dto,
        amountUsd,
        amountBs,
        exchangeRate,
        primaryAccount,
        concept,
        creditResult.reference || creditResult.id,
        creditResult.id,
        'pending',
        creditResult,
      )
      await this.repository.saveDisbursement(disbursement)
      return { status: 'pending', requestId }
    }

    // Cualquier otro codigo distinto a ACCP/AC00: desembolso fallido.
    if (creditResult.code !== 'ACCP') {
      const disbursement = this.buildDisbursement(
        requestId,
        dto,
        amountUsd,
        amountBs,
        exchangeRate,
        primaryAccount,
        concept,
        creditResult.reference || null,
        creditResult.id || null,
        'failed',
        creditResult,
      )
      await this.repository.saveDisbursement(disbursement)
      throw new BadRequestException(
        `R4 rechazo la operacion. Codigo: ${creditResult.code || 'N/A'}. ` +
          `Mensaje: ${creditResult.message || ''}`,
      )
    }

    // ACCP: desembolso exitoso, guardar y actualizar solicitud.
    const disbursement = this.buildDisbursement(
      requestId,
      dto,
      amountUsd,
      amountBs,
      exchangeRate,
      primaryAccount,
      concept,
      creditResult.reference || null,
      creditResult.id || null,
      'success',
      creditResult,
    )
    await this.repository.saveDisbursement(disbursement)

    request.status = 'disbursed'
    request.updatedAt = new Date().toISOString()
    await this.repository.saveRequest(request)

    return { status: 'disbursed', request, disbursement }
  }

  /**
   * Verifica el estado de un desembolso que quedo pendiente (R4 respondio AC00).
   * Llama a ConsultarOperaciones en R4. Si la operacion ya esta aceptada
   * (ACCP), actualiza el desembolso a 'success' y la solicitud a 'disbursed'.
   * Si sigue AC00, retorna 'pending' para que el frontend siga esperando.
   * Si fallo, marca el desembolso como 'failed'.
   * @param requestId ID de la solicitud con desembolso pendiente.
   * @returns Estado actual del desembolso.
   */
  async verifyDisburse(requestId: string): Promise<VerifyDisburseResult> {
    const disbursement = await this.repository.findDisbursementByLoanRequestId(requestId)
    if (!disbursement) {
      throw new NotFoundException('No hay un desembolso registrado para esta solicitud.')
    }
    if (disbursement.status === 'success') {
      return { status: 'disbursed', reference: disbursement.bankReference }
    }
    if (disbursement.status === 'failed') {
      return { status: 'failed', message: 'El desembolso ya fue marcado como fallido.' }
    }

    const reference = disbursement.bankReference
    if (!reference) {
      throw new BadRequestException(
        'El desembolso pendiente no tiene referencia bancaria para consultar.',
      )
    }

    let queryResult:
      | { success: boolean; reference?: string; code?: string }
      | undefined
    try {
      queryResult = (await this.paymentProcessorService.queryOperationR4({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        reference,
      } as any)) as { success: boolean; reference?: string; code?: string }
    } catch (err) {
      // Si la consulta falla transitoriamente, lo tratamos como pendiente para
      // que el frontend siga intentando.
      return { status: 'pending' }
    }

    if (queryResult?.success) {
      disbursement.status = 'success'
      if (queryResult.reference) {
        disbursement.bankReference = queryResult.reference
      }
      await this.repository.saveDisbursement(disbursement)

      const request = await this.repository.findRequestById(requestId)
      if (request) {
        request.status = 'disbursed'
        request.updatedAt = new Date().toISOString()
        await this.repository.saveRequest(request)
      }

      return { status: 'disbursed', reference: disbursement.bankReference }
    }

    if (queryResult?.code && queryResult.code !== 'AC00') {
      disbursement.status = 'failed'
      await this.repository.saveDisbursement(disbursement)
      return { status: 'failed', message: `R4 devolvio codigo: ${queryResult.code}` }
    }

    return { status: 'pending' }
  }

  /**
   * Construye un objeto Disbursement con los campos comunes.
   */
  private buildDisbursement(
    requestId: string,
    dto: DisburseRequestDto,
    amountUsd: number,
    amountBs: number,
    exchangeRate: number,
    primaryAccount: { bankCode: string; accountNumber: string; phoneNumber: string; documentId: string },
    concept: string,
    bankReference: string | null,
    bankOperationId: string | null,
    status: 'success' | 'failed' | 'pending',
    creditResult: { internalPaymentId?: string },
  ): Disbursement {
    return {
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
      bankReference,
      bankOperationId,
      status,
      createdAt: new Date().toISOString(),
    }
  }
}
