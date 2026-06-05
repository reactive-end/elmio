// @ts-nocheck
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { firstValueFrom, lastValueFrom } from 'rxjs'
import * as crypto from 'node:crypto'
import * as https from 'node:https'
import { Buffer } from 'node:buffer'
import { sign, decode } from 'jsonwebtoken'
import type { LegacyTokenPayload } from '../../domain/ports/payment-processor-repository.interface'

import { Payment } from './entities/payment.entity'
import { BankAccount } from './entities/bank-account.entity'
import { Currency } from './entities/currency.entity'
import { ApiKey } from './entities/api-key.entity'
import { ExchangeRate } from './entities/exchange-rate.entity'
import { ApiKeyCipher } from './api-key-cipher.util'

import { InitiateDebitDto } from '../../presentation/dtos/banco-plaza/initiate-debit.dto'
import { CheckStatusDto } from '../../presentation/dtos/banco-plaza/check-status.dto'
import { SendMobilePaymentDto } from '../../presentation/dtos/banco-plaza/send-mobile-payment.dto'
import { CustomerMobilePaymentDto } from '../../presentation/dtos/banco-plaza/customer-mobile-payment.dto'
import { ConsultMobilePaymentDto } from '../../presentation/dtos/banco-plaza/consult-mobile-payment.dto'
import { InitiateTransferDto } from '../../presentation/dtos/banco-plaza/initiate-transfer.dto'
import { CustomerTransferDto } from '../../presentation/dtos/banco-plaza/customer-transfer.dto'
import { ConsultTransferStatusDto } from '../../presentation/dtos/banco-plaza/consult-transfer-status.dto'
import { RequestDebitTokenDto } from '../../presentation/dtos/banco-plaza/request-debit-token.dto'
import { InitiateDirectDebitDto } from '../../presentation/dtos/banco-plaza/initiate-direct-debit.dto'
import { CheckSettlementDto } from '../../presentation/dtos/banco-plaza/check-settlement.dto'

import { GetExchangeRateDto } from '../../presentation/dtos/banco-r4/get-r4-exchange-rate.dto'
import { ConsultMobilePaymentR4Dto } from '../../presentation/dtos/banco-r4/consult-mobile-payment.dto'
import { MobilePaymentNotificationR4Dto } from '../../presentation/dtos/banco-r4/mobile-payment-notification.dto'
import { AccountDirectDebitDto } from '../../presentation/dtos/banco-r4/account-direct-debit.dto'
import { PhoneDirectDebitDto } from '../../presentation/dtos/banco-r4/phone-direct-debit.dto'
import { GenerateOtpDto } from '../../presentation/dtos/banco-r4/generate-otp.dto'
import {
  ImmediateCreditRequestDto,
  ImmediateCreditResponseDto,
} from '../../presentation/dtos/banco-r4/immediate-credit.dto'
import { ImmediateDebitRequestDto } from '../../presentation/dtos/banco-r4/immediate-debit.dto'
import {
  QueryOperationRequestDto,
  QueryOperationResponseDto,
} from '../../presentation/dtos/banco-r4/query-operation.dto'
import { VueltoRequestDto, VueltoResponseDto } from '../../presentation/dtos/banco-r4/vuelto.dto'

import {
  GenerateWebPaymentUrlRequest,
  InitiateP2pPaymentRequest,
  PaymentProcessorRepositoryPort,
  QueryOperationGatewayRequest,
  QueryOperationGatewayResponse,
  VerifyC2pPaymentRequest,
} from '../../domain/ports/payment-processor-repository.interface'
import { ConsultSentPaymentsDto } from '../../domain/ports/payment-processor-repository.interface'
import { ValidateReceivedPaymentDto } from '../../domain/ports/payment-processor-repository.interface'
import { MakeMobilePaymentDto } from '../../domain/ports/payment-processor-repository.interface'
import { RequestOtpDto } from '../../domain/ports/payment-processor-repository.interface'
import { ExecuteImmediateDebitDto } from '../../domain/ports/payment-processor-repository.interface'
import { ExecuteImmediateTransferDto } from '../../domain/ports/payment-processor-repository.interface'
import { QueryImmediateTransferDto } from '../../domain/ports/payment-processor-repository.interface'

const BANK_CODES_REJECTED = new Set(['AM04', 'MD15'])

type PlazaContext = {
  companyAccountId: string
  account: BankAccount
  documentId: string
  accountNumber: string
  apiKey: string
  apiSecret: string
  vesCurrency: Currency
}

type R4Context = {
  companyAccountId: string
  account?: BankAccount
  commerceKey: string
  secretKey: string
}

type MercantilContext = {
  companyAccountId: string
  account: BankAccount
  masterKey: string
  secretKey: string
  clientId: string
  merchantId: string
  merchantMobile: string
}

type ExteriorContext = {
  companyAccountId: string
  account: BankAccount
  apiKey: string
  clientSecret: string
  masterKey: string
  clientId: string
}

@Injectable()
export class PaymentProcessorRepository implements PaymentProcessorRepositoryPort {
  private readonly logger = new Logger(PaymentProcessorRepository.name)
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {
    this.BASE_URL = this.configService.get<string>('R4_API_URL') || ''
  }

  private normalizeCedula(id?: string): string | undefined {
    if (!id) return id
    // remove whitespace
    const s = String(id).replace(/\s+/g, '')
    // If starts with non-digit prefix (e.g., 'V' or 'E'), separate
    const m = s.match(/^(\D+)(\d+)$/)
    if (m) {
      const prefix = m[1]
      const digits = m[2]
      // bank expects prefix + 11 digits = 12 chars total
      const padded = digits.padStart(11, '0')
      return `${prefix}${padded}`
    }
    // If only digits, pad to 12
    if (/^\d+$/.test(s)) {
      return s.padStart(12, '0')
    }
    return s
  }

  async debit(dto: InitiateDebitDto, ip?: string) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    const bankResponse = await this.plazaInitiateDebit({
      ...dto,
      provider: 'banco_plaza',
      companyAccountId: context.companyAccountId,
      ipAddress: this.normalizeIp(ip),
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
      gatewayCompanyAccount: context.accountNumber,
      gatewayCurrencyId: context.vesCurrency.id,
    })

    try {
      const payment = new Payment()
      this.setExternalDocumentAsSource(payment, dto.payerId)

      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId = bankResponse.reference || `DEBIT-${Date.now()}`
      payment.internalSourceAccount = null
      payment.internalDestinationAccount = context.account
      payment.externalSourceBankCode = dto.payerBankCode
      payment.externalSourceAccount = dto.payerAccount || null
      payment.externalSourcePhone = dto.payerPhone || null
      payment.externalDestBankCode = null
      payment.externalDestAccount = null
      payment.externalDestPhone = null
      payment.externalDestDocType = null
      payment.externalDestDoc = null
      payment.payerUserId = null
      payment.payerName = dto.payerName
      payment.enterpriseId = null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 4
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = context.vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'No se pudo persistir el debito de Banco Plaza',
        error as Error,
      )
      return {
        ...bankResponse,
        warning:
          'Operacion bancaria exitosa, pero no se pudo registrar localmente.',
      }
    }
  }

  async checkStatus(dto: CheckStatusDto) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    return this.plazaCheckTransactionStatus({
      endToEndId: dto.endToEndId,
      amount: dto.amount,
      reference: dto.reference || '',
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
      gatewayCompanyAccount: context.accountNumber,
    })
  }

  async sendMobilePayment(dto: SendMobilePaymentDto, user: LegacyTokenPayload) {
    const context = await this.getPlazaContext(dto.companyAccountId)
    const sourcePhone = (context.account.phoneNumber || '').trim()

    if (!sourcePhone) {
      throw new InternalServerErrorException(
        'La cuenta origen no tiene datos completos para operar con Banco Plaza.',
      )
    }

    const bankResponse = await this.plazaSendMobilePayment({
      destinationBankCode: dto.destinationBankCode,
      destinationId: dto.destinationId,
      destinationPhone: dto.destinationPhone,
      sourcePhone,
      amount: dto.amount,
      concept: dto.concept,
      ip: dto.userIp || '127.0.0.1',
      latitude: dto.latitude || '0.00',
      longitude: dto.longitude || '0.00',
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
    })

    try {
      const payment = new Payment()
      this.setExternalDocumentAsDestination(payment, dto.destinationId)

      payment.externalDestPhone = dto.destinationPhone
      payment.externalDestBankCode = dto.destinationBankCode
      payment.externalSourcePhone = sourcePhone
      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId = bankResponse.reference || `TEMP-${Date.now()}`
      payment.internalSourceAccount = context.account
      payment.internalDestinationAccount = null
      payment.externalSourceBankCode = null
      payment.externalSourceAccount = null
      payment.externalSourceDocType = null
      payment.externalSourceDoc = null
      payment.externalDestAccount = null
      payment.payerUserId = user.sub
      payment.payerName = null
      payment.enterpriseId = user.sub ?? null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 5
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = context.vesCurrency

      const saved = await this.paymentRepository.save(payment)

      return {
        success: true,
        reference: bankResponse.reference,
        message: bankResponse.message,
        internalId: saved.id,
        rawResponse: bankResponse.rawResponse,
      }
    } catch (error) {
      this.logger.error(
        'Pago movil Plaza exitoso pero no se pudo persistir',
        error as Error,
      )
      return {
        success: true,
        reference: bankResponse.reference,
        message: 'Pago bancario exitoso, error en registro local.',
        internalId: null,
        warning: true,
        rawResponse: bankResponse.rawResponse,
      }
    }
  }

  async processCustomerMobilePayment(dto: CustomerMobilePaymentDto) {
    const bankResponse = await this.plazaSendCustomerMobilePayment({
      payerId: dto.payerId,
      payerPhone: dto.payerPhone,
      amount: dto.amount,
      concept: dto.concept,
      ip: dto.userIp || '127.0.0.1',
      latitude: dto.latitude || '0.00',
      longitude: dto.longitude || '0.00',
    })

    try {
      const vesCurrency = await this.requireVesCurrency()
      const payment = new Payment()

      this.setExternalDocumentAsSource(payment, dto.payerId)
      payment.externalSourcePhone = dto.payerPhone || null

      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId = bankResponse.reference || `CUST-P2P-${Date.now()}`
      payment.internalSourceAccount = null
      payment.internalDestinationAccount = this.buildInternalAccountStub(
        process.env.PAYMENTS_INTERNAL_DEST_ACCOUNT_ID,
      )

      payment.externalSourceBankCode = null
      payment.externalSourceAccount = null
      payment.externalDestBankCode = null
      payment.externalDestAccount = null
      payment.externalDestPhone = null
      payment.externalDestDocType = null
      payment.externalDestDoc = null

      payment.payerUserId = null
      payment.payerName = null
      payment.enterpriseId = null

      payment.paymentStatusId = 1
      payment.paymentMethodId = 5
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'Pago movil cliente Plaza exitoso pero no se pudo persistir',
        error as Error,
      )
      return {
        ...bankResponse,
        warning: true,
      }
    }
  }

  async getMobilePaymentHistory(dto: ConsultMobilePaymentDto) {
    const context = await this.getPlazaContext(dto.companyAccountId)
    const filters: Record<string, unknown> = {}

    if (dto.date) {
      filters.dateStart = dto.date
      filters.dateEnd = dto.date
    }

    if (dto.reference) {
      filters.reference = dto.reference
    }

    return this.plazaGetMobilePaymentHistory({
      payerId: dto.payerId,
      filters,
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
    })
  }

  async initiateTransfer(dto: InitiateTransferDto, user: LegacyTokenPayload) {
    const context = await this.getPlazaContext(dto.companyAccountId, true)
    const companyName = (context.account.businessName || '').trim()
    const companyBankCode = context.account.bank?.bankCode

    if (!companyName || !companyBankCode) {
      throw new InternalServerErrorException(
        'La cuenta origen no tiene datos completos para operar con Banco Plaza.',
      )
    }

    const bankResponse = await this.plazaInitiateTransfer({
      beneficiaryName: dto.beneficiaryName,
      beneficiaryId: dto.beneficiaryId,
      beneficiaryBankCode: dto.beneficiaryBankCode,
      amount: dto.amount,
      concept: dto.concept,
      ip: dto.userIp || '127.0.0.1',
      beneficiaryAccount: dto.beneficiaryAccount,
      beneficiaryPhone: dto.beneficiaryPhone,
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
      gatewayCompanyAccount: context.accountNumber,
      gatewayCompanyName: companyName,
      gatewayCompanyBankCode: companyBankCode,
      gatewayCurrencyCode: context.vesCurrency.code,
    })

    try {
      const payment = new Payment()
      this.setExternalDocumentAsDestination(payment, dto.beneficiaryId)

      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId = bankResponse.reference || `TRF-${Date.now()}`
      payment.internalSourceAccount = context.account
      payment.internalDestinationAccount = null
      payment.externalSourceBankCode = null
      payment.externalSourceAccount = null
      payment.externalSourcePhone = null
      payment.externalSourceDocType = null
      payment.externalSourceDoc = null
      payment.externalDestBankCode = dto.beneficiaryBankCode
      payment.externalDestAccount = dto.beneficiaryAccount || null
      payment.externalDestPhone = dto.beneficiaryPhone || null
      payment.payerUserId = user.sub
      payment.payerName = null
      payment.enterpriseId = user.sub ?? null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 6
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = context.vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'Transferencia Plaza exitosa pero no se pudo persistir',
        error as Error,
      )
      return {
        ...bankResponse,
        warning:
          'Transferencia realizada en banco, pero no se pudo registrar en base de datos local.',
      }
    }
  }

  async initiateCustomerTransfer(
    dto: CustomerTransferDto,
    user: LegacyTokenPayload,
  ) {
    const vesCurrency = await this.requireVesCurrency()

    const bankResponse = await this.plazaInitiateCustomerTransfer({
      payerName: dto.payerName,
      payerId: dto.payerId,
      payerAccount: dto.payerAccount,
      amount: dto.amount,
      concept: dto.concept,
      ip: dto.userIp || '127.0.0.1',
      gatewayCurrencyId: vesCurrency.id,
    })

    try {
      const payment = new Payment()
      this.setExternalDocumentAsSource(payment, dto.payerId)

      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId = bankResponse.reference || `CUST-TRF-${Date.now()}`
      payment.internalSourceAccount = null
      payment.internalDestinationAccount = this.buildInternalAccountStub(
        process.env.PAYMENTS_INTERNAL_DEST_ACCOUNT_ID,
      )
      payment.externalSourceBankCode = dto.payerAccount
        ? dto.payerAccount.substring(0, 4)
        : null
      payment.externalSourceAccount = dto.payerAccount || null
      payment.externalSourcePhone = null
      payment.externalDestBankCode = null
      payment.externalDestAccount = null
      payment.externalDestPhone = null
      payment.externalDestDocType = null
      payment.externalDestDoc = null
      payment.payerUserId = user.sub
      payment.payerName = dto.payerName
      payment.enterpriseId = user.sub ?? null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 6
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'Customer transfer Plaza exitosa pero no se pudo persistir',
        error as Error,
      )
      return {
        ...bankResponse,
        warning:
          'Operacion bancaria exitosa, pero no se pudo registrar localmente.',
      }
    }
  }

  async consultTransferStatus(dto: ConsultTransferStatusDto) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    return this.plazaConsultTransferStatus({
      originatorId: context.documentId,
      account: context.accountNumber || dto.account,
      reference: dto.reference,
      amount: dto.amount,
      date: dto.date,
      channel: dto.channel || '23',
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
    })
  }

  async requestToken(dto: RequestDebitTokenDto, ip?: string) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    return this.plazaRequestDebitToken({
      ...dto,
      companyAccountId: context.companyAccountId,
      ipAddress: this.normalizeIp(ip),
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyAccount: context.accountNumber,
      gatewayCompanyId: context.documentId,
      gatewayCurrencyId: context.vesCurrency.id,
    })
  }

  async initiateDirectDebit(dto: InitiateDirectDebitDto) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    const payerDocument = (dto.payerDocument || dto.payerId || '').trim()
    if (!payerDocument) {
      throw new InternalServerErrorException(
        'Debe indicar payerDocument o payerId para continuar.',
      )
    }

    const bankResponse = await this.plazaInitiateDirectDebit({
      amount: dto.amount,
      concept: dto.concept,
      payerBankCode: dto.payerBankCode,
      payerAccount: dto.payerAccount,
      payerDocument,
      payerName: dto.payerName,
      contratoId: dto.contratoId,
      fechaContrato: dto.fechaContrato,
      userIp: dto.userIp || '127.0.0.1',
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
      gatewayCompanyAccount: context.accountNumber,
      gatewayCurrencyCode: context.vesCurrency.code,
    })

    try {
      const payment = new Payment()
      this.setExternalDocumentAsSource(payment, payerDocument)

      payment.amountBs = dto.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference || null
      payment.billingId =
        bankResponse.rawResponse?.body?.transaccionId ||
        bankResponse.reference ||
        `DOM-${Date.now()}`

      payment.internalSourceAccount = null
      payment.internalDestinationAccount = context.account
      payment.externalSourceBankCode = dto.payerBankCode
      payment.externalSourceAccount = dto.payerAccount
      payment.externalSourcePhone = null
      payment.externalDestBankCode = null
      payment.externalDestAccount = null
      payment.externalDestPhone = null
      payment.externalDestDocType = null
      payment.externalDestDoc = null
      payment.payerUserId = null
      payment.payerName = dto.payerName
      payment.enterpriseId = null
      payment.paymentStatusId = 2
      payment.paymentMethodId = 4
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = context.vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'Domiciliacion Plaza exitosa pero no se pudo persistir',
        error as Error,
      )
      return {
        ...bankResponse,
        warning:
          'Operacion bancaria exitosa, pero no se pudo registrar localmente.',
      }
    }
  }

  async checkSettlement(dto: CheckSettlementDto) {
    const context = await this.getPlazaContext(dto.companyAccountId)

    const payment = await this.paymentRepository.findOne({
      where: { reference: dto.reference },
      relations: ['internalDestinationAccount'],
      order: { createdAt: 'DESC' },
    })

    if (!payment) {
      throw new NotFoundException(
        'No se encontro un pago asociado a la referencia indicada.',
      )
    }

    if (
      payment.internalDestinationAccount?.id &&
      payment.internalDestinationAccount.id !== context.companyAccountId
    ) {
      throw new NotFoundException(
        'La referencia no pertenece a la cuenta destino indicada.',
      )
    }

    if (!payment.billingId) {
      throw new InternalServerErrorException(
        'El pago no tiene billingId para consultar liquidacion en Banco Plaza.',
      )
    }

    const settlementResponse = await this.plazaCheckSettlement({
      reference: dto.reference,
      transactionId: payment.billingId,
      gatewayApiKey: context.apiKey,
      gatewayApiSecret: context.apiSecret,
      gatewayCompanyId: context.documentId,
      gatewayCompanyAccount: context.accountNumber,
      userIp: '127.0.0.1',
    })

    if (settlementResponse.status === '0000') {
      payment.paymentStatusId = 1
    } else if (BANK_CODES_REJECTED.has(settlementResponse.status)) {
      payment.paymentStatusId = 3
    }

    await this.paymentRepository.save(payment)

    return {
      reference: dto.reference,
      paymentStatusId: payment.paymentStatusId,
      isApproved: settlementResponse.status === '0000',
      bankStatus: settlementResponse.status,
      message: settlementResponse.message,
      rawResponse: settlementResponse.rawResponse,
    }
  }

  async processWebhook(provider: string, payload: Record<string, unknown>) {
    if ((provider || '').toLowerCase() !== 'banco_mercantil') {
      throw new BadRequestException(
        `Proveedor no soportado para webhook: ${provider}`,
      )
    }

    const mercantilContext = await this.getMercantilContext(undefined, true)

    const bankResponse = await this.mercantilProcessWebhookNotificationDebit(
      {
        provider,
        payload,
      },
      mercantilContext.masterKey,
    )

    try {
      const decryptedData = bankResponse.decryptedData
      if (!decryptedData) {
        return bankResponse
      }

      const webhookData = decryptedData?.webhookNotificationIn ?? decryptedData

      const getFirst = (keys: string[]) => {
        for (const key of keys) {
          const value = webhookData?.[key]
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
          ) {
            return value
          }
        }
        return undefined
      }

      const amountRaw = getFirst([
        'monto',
        'amount',
        'montoTransaccion',
        'montoOperacion',
      ])
      const amount = Number(amountRaw ?? 0)
      if (!amount || Number.isNaN(amount)) {
        return bankResponse
      }

      const vesCurrency = await this.requireVesCurrency()
      const payment = new Payment()

      const payerIdRaw = String(
        getFirst([
          'cedulaOrdenante',
          'cedulaPagador',
          'payerId',
          'identificacionPagador',
        ]) ?? '',
      ).trim()
      this.setExternalDocumentAsSource(payment, payerIdRaw)

      payment.externalSourcePhone =
        String(
          getFirst(['telefonoOrdenante', 'telefonoPagador', 'payerPhone']) ??
            '',
        ) || null
      payment.externalSourceBankCode =
        String(
          getFirst([
            'bancoOrdenante',
            'codigoBancoOrdenante',
            'payerBankCode',
          ]) ?? '',
        ) || null
      payment.externalSourceAccount =
        String(getFirst(['cuentaOrdenante', 'payerAccount']) ?? '') || null

      const destIdRaw = String(
        getFirst([
          'cedulaBeneficiario',
          'identificacionBeneficiario',
          'beneficiaryId',
        ]) ?? '',
      ).trim()
      this.setExternalDocumentAsDestination(payment, destIdRaw)

      payment.externalDestPhone =
        String(getFirst(['telefonoBeneficiario', 'beneficiaryPhone']) ?? '') ||
        null
      payment.externalDestBankCode =
        String(
          getFirst(['bancoBeneficiario', 'codigoBancoBeneficiario']) ?? '',
        ) || null
      payment.externalDestAccount =
        String(getFirst(['cuentaBeneficiario', 'beneficiaryAccount']) ?? '') ||
        null

      const reference =
        String(
          getFirst([
            'referenciaBancoOrdenante',
            'referenciaBanco',
            'reference',
            'referencia',
          ]) ?? '',
        ) || null

      payment.amountBs = amount
      payment.amountUsd = 0
      payment.reference = reference
      payment.billingId = reference || `MERCANTIL-DEBIT-${Date.now()}`
      payment.internalSourceAccount = null
      payment.internalDestinationAccount = this.buildInternalAccountStub(
        process.env.PAYMENTS_INTERNAL_DEST_ACCOUNT_ID,
      )
      payment.payerUserId = null
      payment.payerName =
        String(getFirst(['nombrePagador', 'payerName']) ?? '') || null
      payment.enterpriseId = null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 4
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = vesCurrency

      await this.paymentRepository.save(payment)
      return bankResponse
    } catch (error) {
      this.logger.error(
        'Webhook Mercantil procesado pero no se pudo persistir',
        error as Error,
      )
      return bankResponse
    }
  }

  async generateWebPaymentUrl(
    provider: string,
    dto: GenerateWebPaymentUrlRequest,
  ) {
    if ((provider || '').toLowerCase() !== 'banco_mercantil') {
      throw new BadRequestException(
        `Proveedor no soportado para web payment: ${provider}`,
      )
    }

    return this.mercantilGenerateWebPaymentUrl(dto)
  }

  async processP2pPayment(request: InitiateP2pPaymentRequest) {
    const context = await this.getMercantilContext(request.companyAccountId)
    const bankResponse = await this.mercantilProcessP2pPayment(request, context)

    try {
      const vesCurrency = await this.requireVesCurrency()
      const payment = new Payment()

      this.setExternalDocumentAsDestination(payment, request.payerId)

      payment.externalDestPhone = request.payerPhone || null
      payment.externalDestBankCode = request.payerBankCode || null
      payment.externalSourcePhone = context.merchantMobile || null
      payment.amountBs = request.amount
      payment.amountUsd = 0
      payment.reference = bankResponse.reference
      payment.billingId =
        bankResponse.reference || `MERCANTIL-P2P-${Date.now()}`
      payment.internalSourceAccount = this.buildInternalAccountStub(
        process.env.PAYMENTS_INTERNAL_SOURCE_ACCOUNT_ID,
      )
      payment.internalDestinationAccount = null
      payment.externalSourceBankCode = null
      payment.externalSourceAccount = null
      payment.externalSourceDocType = null
      payment.externalSourceDoc = null
      payment.externalDestAccount = null
      payment.payerUserId = null
      payment.payerName = null
      payment.enterpriseId = null
      payment.paymentStatusId = 1
      payment.paymentMethodId = 5
      payment.paymentTypeId = 3
      payment.paymentDate = new Date()
      payment.currency = vesCurrency

      const saved = await this.paymentRepository.save(payment)
      return { ...bankResponse, internalId: saved.id }
    } catch (error) {
      this.logger.error(
        'P2P Mercantil exitoso pero no se pudo persistir',
        error as Error,
      )
      return {
        ...bankResponse,
        message:
          bankResponse.message ||
          'Pago bancario exitoso, error en registro local.',
        warning: true,
      }
    }
  }

  async verifyC2pPayment(request: VerifyC2pPaymentRequest) {
    const context = await this.getMercantilContext(request.companyAccountId)
    return this.mercantilVerifyC2pPayment(request, context)
  }

  async getLastExchangeRate(companyAccountId?: string) {
    await this.getR4Context(companyAccountId, true)

    return this.exchangeRateRepository.findOne({
      where: {},
      relations: { currency: true },
      order: {
        effectiveDate: 'DESC',
        createdAt: 'DESC',
      },
    })
  }

  async getExchangeRate(dto: GetExchangeRateDto) {
    return this.r4GetExchangeRate({
      companyAccountId: dto.companyAccountId,
      currency: dto.currency,
      date: dto.date,
    })
  }

  async generateOTP(dto: GenerateOtpDto) {
    return this.r4GenerateOTP({
      companyAccountId: dto.companyAccountId,
      bankCode: dto.bankCode,
      amount: dto.amount,
      phoneNumber: dto.phoneNumber,
      nationalId: dto.nationalId,
    })
  }

  async consultMobilePaymentR4(dto: ConsultMobilePaymentR4Dto) {
    try {
      await this.getR4Context(undefined, true)
      return await this.r4ConsultMobilePayment(dto)
    } catch (error) {
      this.logger.error('Error en consulta R4', error as Error)
      return { status: false }
    }
  }

  async processMobilePaymentNotificationR4(
    dto: MobilePaymentNotificationR4Dto,
  ) {
    try {
      const r4Context = await this.getR4Context(undefined, true)
      const validation = await this.r4ProcessMobilePaymentNotification(dto)
      if (!validation || !validation.abono) {
        return { abono: false }
      }

      const vesCurrency = await this.requireVesCurrency()

      if (dto.Referencia) {
        const existing = await this.paymentRepository.findOne({
          where: { reference: dto.Referencia },
        })

        if (existing) {
          return { abono: true }
        }
      }

      const payment = new Payment()
      payment.amountBs = Number(dto.Monto)
      payment.amountUsd = 0
      payment.reference = dto.Referencia || null
      payment.billingId = dto.Referencia || `R4-${Date.now()}`
      payment.paymentDate = new Date(dto.FechaHora)

      payment.internalSourceAccount = null
      payment.externalSourceBankCode = dto.BancoEmisor || null
      payment.externalSourceAccount = null
      payment.externalSourcePhone = dto.TelefonoEmisor || null
      payment.externalSourceDocType = null
      payment.externalSourceDoc = null

      payment.internalDestinationAccount = r4Context.account
      payment.externalDestBankCode = null
      payment.externalDestAccount = null
      payment.externalDestPhone = dto.TelefonoComercio || null
      payment.externalDestDocType = null
      payment.externalDestDoc = dto.IdComercio || null

      payment.payerUserId = null
      payment.payerName = null
      payment.enterpriseId = dto.IdComercio || null

      payment.paymentStatusId = 1
      payment.paymentMethodId = 5
      payment.paymentTypeId = 3
      payment.currency = vesCurrency

      await this.paymentRepository.save(payment)
      return { abono: true }
    } catch (error) {
      this.logger.error('Error procesando notificacion R4', error as Error)
      return { abono: false }
    }
  }

  async processAccountDirectDebitR4(dto: AccountDirectDebitDto) {
    return this.r4ProcessAccountDirectDebit(dto)
  }

  async processPhoneDirectDebitR4(dto: PhoneDirectDebitDto) {
    return this.r4ProcessPhoneDirectDebit(dto)
  }

  async processImmediateCreditR4(dto: ImmediateCreditRequestDto) {
    return this.r4ProcessImmediateCredit(dto)
  }

  async processImmediateDebitR4(dto: ImmediateDebitRequestDto) {
    return this.r4ProcessImmediateDebit(dto)
  }

  async queryOperationR4(
    dto: QueryOperationRequestDto,
  ): Promise<QueryOperationResponseDto> {
    const context = await this.getR4Context(dto.companyAccountId)

    const payment = await this.paymentRepository.findOne({
      where: { reference: dto.reference },
      relations: ['internalDestinationAccount'],
      order: { createdAt: 'DESC' },
    })

    if (!payment) {
      throw new NotFoundException(
        'No se encontro una transaccion asociada a la referencia indicada.',
      )
    }

    if (
      payment.internalDestinationAccount?.id &&
      payment.internalDestinationAccount.id !== context.companyAccountId
    ) {
      throw new NotFoundException(
        'La referencia no pertenece a la cuenta indicada.',
      )
    }

    const bankOperationId = String(payment.billingId || '').trim()

    if (!bankOperationId) {
      throw new BadRequestException(
        'La referencia no tiene un Id de operación bancario para consultar.',
      )
    }

    const bankResponse = await this.r4ConsultOperations({
      id: bankOperationId,
      commerceKey: context.commerceKey,
    })

    if (bankResponse.code === 'ACCP') {
      payment.paymentStatusId = 1
    } else if (bankResponse.code === 'AC00') {
      payment.paymentStatusId = 2
    } else if (bankResponse.code) {
      payment.paymentStatusId = 3
    }

    await this.paymentRepository.save(payment)

    return {
      code: bankResponse.code,
      reference: dto.reference,
      success: bankResponse.success,
      rawResponse: bankResponse.rawResponse,
    }
  }

  async processVueltoR4(dto: VueltoRequestDto): Promise<VueltoResponseDto> {
    return this.r4ProcessVuelto(dto)
  }

  async consultSentPayments(dto: ConsultSentPaymentsDto) {
    return this.exteriorConsultSentPayments({
      companyAccountId: dto.companyAccountId,
      clientId: dto.clientId,
      channelId: dto.channelId,
      date: dto.date,
      receiverPhone: dto.receiverPhone,
      startPosition: dto.startPosition,
    })
  }

  async validateReceivedPayment(dto: ValidateReceivedPaymentDto) {
    return this.exteriorValidateReceivedPayment({
      companyAccountId: dto.companyAccountId,
      clientId: dto.clientId,
      channelId: dto.channelId,
      date: dto.date,
      senderPhone: dto.senderPhone,
    })
  }

  async makeMobilePayment(dto: MakeMobilePaymentDto) {
    return this.exteriorMakeMobilePayment({
      companyAccountId: dto.companyAccountId,
      ip: dto.ip ?? '127.0.0.1',
      idCliente: dto.idCliente,
      idCanal: dto.idCanal,
      idOperacion: dto.idOperacion,
      fechaOperacion: dto.fechaOperacion,
      codigoBanco: dto.codigoBanco,
      nombreBanco: dto.nombreBanco,
      concepto: dto.concepto,
      telefonoEmisor: dto.telefonoEmisor,
      cuentaEmisor: dto.cuentaEmisor,
      idBeneficiario: dto.idBeneficiario,
      telefonoBeneficiario: dto.telefonoBeneficiario,
      moneda: dto.moneda,
      monto: dto.monto,
      envioEmailEmisor: dto.envioEmailEmisor,
      envioEmailBeneficiario: dto.envioEmailBeneficiario,
    })
  }

  async requestOtp(dto: RequestOtpDto) {
    return this.exteriorRequestOtp({
      companyAccountId: dto.companyAccountId,
      datosPeticion: {
        ...dto.datosPeticion,
        ip: dto.datosPeticion.ip ?? '127.0.0.1',
      },
    })
  }

  async executeImmediateDebit(dto: ExecuteImmediateDebitDto) {
    const debitInstrument = dto.debtorPhone ?? dto.debtorAccount

    if (!debitInstrument) {
      throw new BadRequestException(
        'Debe enviar debtorPhone o debtorAccount para ejecutar el debito inmediato',
      )
    }

    return this.exteriorExecuteImmediateDebit({
      companyAccountId: dto.companyAccountId,
      datosPeticion: {
        canal: dto.channel,
        canalCore: dto.channelCore,
        idUsuario: dto.userId,
        ip: dto.ip ?? '127.0.0.1',
        idSesion: dto.sessionId,
        idCliente: dto.creditorId,
        encabezado: {
          nombreAcreedor: dto.creditorName,
        },
        datos: [
          {
            bancoDebito: dto.debtorBankCode,
            bancoCredito: dto.creditorBankCode,
            datosOperacion: {
              instrumentoLocal: '050',
              idOperacion: dto.operationId,
              concepto: dto.concept,
            },
            monto: {
              montoOperacion: dto.amount,
              moneda: dto.currency,
            },
            cuentaDebito: {
              tipoInstrumento: dto.debtorInstrumentType,
              instrumento: debitInstrument,
            },
            deudor: {
              nombreEsquema: dto.debtorIdScheme,
              idCliente: dto.debtorId,
            },
            acreedor: {
              nombreEsquema: dto.creditorIdScheme,
              idCliente: dto.creditorId,
            },
            cuentaCredito: {
              tipoInstrumento: dto.creditorInstrumentType,
              instrumento: dto.creditorAccount,
            },
            autenticacion: {
              clavePago: dto.otpCode,
            },
          },
        ],
      },
    })
  }

  async executeImmediateTransfer(dto: ExecuteImmediateTransferDto) {
    if (!dto.receiverAccount && !dto.receiverPhone) {
      throw new BadRequestException(
        'Debe enviar receiverAccount o receiverPhone para completar la transferencia',
      )
    }

    return this.exteriorExecuteImmediateTransfer({
      companyAccountId: dto.companyAccountId,
      datosPeticion: {
        idCliente: dto.idClient,
        idSesion: dto.sessionId,
        idCanal: dto.channelId,
        idUsuario: dto.userId,
        idTerminal: dto.terminalId,
        idConsumidor: dto.consumerId,
      },
      transferenciaInmediata: {
        ctaPagadora: dto.payerAccount,
        ctaReceptora: dto.receiverAccount,
        codigobancoReceptor: dto.receiverBankCode,
        telefonoReceptor: dto.receiverPhone,
        idReceptor: dto.receiverId,
        monto: dto.amount,
        moneda: 'VES',
        nombreBeneficiario: dto.beneficiaryName,
        concepto: dto.concept,
      },
    })
  }

  async queryImmediateTransfer(dto: QueryImmediateTransferDto) {
    const hasAnyFilter = Boolean(
      dto.reference || dto.transactionDate || dto.account || dto.transactionId,
    )

    if (!hasAnyFilter) {
      throw new BadRequestException(
        'Debe enviar al menos un filtro: reference, transactionDate, account o transactionId',
      )
    }

    return this.exteriorQueryImmediateTransfer({
      companyAccountId: dto.companyAccountId,
      datosPeticion: {
        idCliente: dto.idClient,
        idSesion: dto.sessionId,
      },
      filtrosConsulta: {
        referencia: dto.reference,
        fecha: dto.transactionDate,
        cuenta: dto.account,
        idTransaccion: dto.transactionId,
      },
    })
  }

  // BEGIN: Provider Logic In Repository

  async plazaRequestDebitToken(
    data: RequestDebitTokenRequest,
  ): Promise<DebitTokenResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret
      const companyAccount = data.gatewayCompanyAccount
      const currencyId = data.gatewayCurrencyId

      if (!baseUrl || !apiKey || !apiSecret || !companyAccount || !currencyId) {
        throw new InternalServerErrorException(
          'Configuración incompleta Banco Plaza',
        )
      }

      const endpointPath = '/v1/cce/debinm/tokenDI'
      const fullUrl = `${baseUrl}${endpointPath}`

      // 1. Lógica de Selección (Cuenta vs Teléfono)
      let cuentaPagador = ''
      let telefonoPagador = ''

      if (data.validationType === 'C') {
        cuentaPagador = data.payerAccount || ''
        telefonoPagador = '' // Vacío explícito
      } else {
        cuentaPagador = '' // Vacío explícito
        telefonoPagador = data.payerPhone || ''
      }

      // 2. Construcción del Payload
      const payload = {
        moneda: 'VES',
        canal: process.env.PLAZA_CANAL || '23',
        Tvalidacion_p: data.validationType,
        identificacion_p: this.normalizeCedula(data.payerId),
        cuenta_cobrador: companyAccount,
        cuenta_pagador: cuentaPagador,
        telefono_pagador: telefonoPagador,
        cod_banco_p: data.payerBankCode,
        monto: Number(data.amount),
        direccion_ip: data.ipAddress || '127.0.0.1',
      }

      // 3. Serialización y Forzado de Decimales
      let payloadString = JSON.stringify(payload)

      // Convertimos {"monto":10} en {"monto":10.00} para la firma
      payloadString = payloadString.replace(
        /"monto":(\d+(\.\d*)?)/,
        (match, number) => {
          const val = Number.parseFloat(number)
          return `"monto":${val.toFixed(2)}`
        },
      )

      this.logger.debug(`Solicitando Token DI: ${payloadString}`)

      // 4. Firma (Path + Nonce + Body)
      const nonce = Date.now().toString()
      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      // 5. Preparar headers y loguearlos
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Api-key': apiKey,
        Nonce: nonce,
        'Api-signature': signature,
        // Header opcional recomendado por doc
        ipCliente: data.ipAddress || '127.0.0.1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0)',
      }

      this.logger.debug(`Request headers: ${JSON.stringify(requestHeaders)}`)

      // 6. Petición POST
      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: requestHeaders,
        }),
      )

      // 6. Leer Respuesta de los HEADERS (Body suele venir vacío)
      const bankHeaders = response.headers
      const codigoRespuesta =
        bankHeaders['codigorespuesta'] || bankHeaders['codigoRespuesta']
      const descripcionCliente =
        bankHeaders['descripcioncliente'] || bankHeaders['descripcionCliente']

      this.logger.debug(`Bank response headers: ${JSON.stringify(bankHeaders)}`)

      if (codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: descripcionCliente || 'Error solicitando token',
            bankCode: codigoRespuesta || '9999',
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      return {
        success: true,
        message: descripcionCliente || 'Token enviado exitosamente',
        bankCode: codigoRespuesta,
        rawResponse: { headers: bankHeaders },
      }
    } catch (error) {
      if (error.response) {
        const h = error.response.headers || {}
        const code = h['codigorespuesta'] || h['codigoRespuesta'] || '9999'
        const msg =
          h['descripcioncliente'] ||
          h['descripcionCliente'] ||
          'Error del banco'

        // Log completo para depuración
        this.logger.error(`Error Token ${error.response.status}: ${msg}`)
        this.logger.error(`Bank error headers: ${JSON.stringify(h)}`)
        this.logger.error(
          `Bank error body: ${JSON.stringify(error.response.data)}`,
        )

        throw new HttpException(
          {
            message: msg,
            bankCode: code,
            statusCode: error.response.status,
          },
          error.response.status,
        )
      }
      throw new InternalServerErrorException('Error interno solicitando token')
    }
  }

  async plazaInitiateDebit(
    data: InitiatePaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret
      const companyId = data.gatewayCompanyId
      const companyAccount = data.gatewayCompanyAccount
      const currencyId = data.gatewayCurrencyId

      if (
        !baseUrl ||
        !apiKey ||
        !apiSecret ||
        !companyId ||
        !companyAccount ||
        !currencyId
      ) {
        throw new InternalServerErrorException(
          'Configuración incompleta de pasarela de pago',
        )
      }

      // 1. LÓGICA DE ENDPOINT: El recurso base es /v1/cce/debinm/cobroDI
      // Según docs, se suele concatenar el ID del cliente o el de la empresa al final
      const baseEndpoint = '/v1/cce/debinm/cobroDI'
      const identifier =
        data.isCustomerInitiated && data.payerId ? data.payerId : companyId
      const endpointPath = `${baseEndpoint}`
      const fullUrl = `${baseUrl}${endpointPath}/${identifier}`

      // 2. CONSTRUCCIÓN DINÁMICA DEL PAYLOAD
      const tValidacion = data.validationType || (data.payerAccount ? 'C' : 'T')

      const payload = {
        moneda: 'VES',
        canal: '23',
        Tvalidacion_p: tValidacion,
        identificacion_p: this.normalizeCedula(data.payerId),
        identificacion_b: companyId,
        cuenta_cobrador: companyAccount,
        cuenta_pagador: tValidacion === 'C' ? data.payerAccount || '' : '',
        telefono_pagador: tValidacion === 'T' ? data.payerPhone || '' : '',
        cod_banco_p: data.payerBankCode,
        nombre_p: data.payerName,
        monto: Number(data.amount),
        concepto: data.concept || 'Debito inmediato',
        Token_p: data.token || '',
        direccion_ip: data.ipAddress || '127.0.0.1',
        referencia_c: '',
      }

      // 3. SERIALIZACIÓN Y FIRMA
      let payloadString = JSON.stringify(payload)
      payloadString = payloadString.replace(
        /"monto":(\d+(\.\d*)?)/,
        (match, number) => {
          const val = Number.parseFloat(number)
          return `"monto":${val.toFixed(2)}`
        },
      )

      const nonce = Date.now().toString()
      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      // 4. PETICIÓN HTTP
      const requestHeaders: Record<string, any> = {
        'Content-Type': 'application/json',
        'Api-key': apiKey,
        Nonce: nonce,
        // don't log signature value
        'Api-signature': '***',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0)',
      }

      const reqStart = Date.now()
      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0)',
          },
        }),
      )

      const reqDuration = Date.now() - reqStart

      // 5. MANEJO DE RESPUESTA DESDE HEADERS
      const bankHeaders = response.headers
      const bankBody = response.data

      const codigoRespuesta =
        bankHeaders['codigorespuesta'] || bankHeaders['codigoRespuesta']
      const descripcionCliente =
        bankHeaders['descripcioncliente'] || bankHeaders['descripcionCliente']

      if (codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: descripcionCliente || 'Operación rechazada por el banco',
            bankCode: codigoRespuesta,
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      return {
        success: true,
        reference: bankBody.referencia_c,
        externalId: bankBody.endtoend,
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en comunicación con el banco',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno en el procesador de pagos',
      )
    }
  }

  async plazaInitiateDirectDebit(
    data: DirectDebitRequest,
  ): Promise<DirectDebitResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret
      const companyId = data.gatewayCompanyId
      const companyAccount = data.gatewayCompanyAccount

      if (!baseUrl || !apiKey || !apiSecret || !companyId || !companyAccount) {
        throw new InternalServerErrorException(
          'Configuracion incompleta de Banco Plaza para cobro por domiciliacion',
        )
      }

      // Correccion: Separamos la ruta base para la firma, del URL completo para la peticion
      const endpointPath = '/v1/cce/dom/cobroDI'
      const fullUrl = `${baseUrl}${endpointPath}/${companyId}`

      // Limpiar concepto: Sin acentos y máximo 60 caracteres como indica la doc
      const cleanConcept = data.concept
        ? data.concept
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 60)
        : 'Cobro Domiciliacion'

      // Estos campos ya vienen del front a traves del flujo DTO -> use-case.
      const contratoId = data.contratoId
      const fechaContrato = data.fechaContrato

      // Payload estricto según la v3.0.0
      const payload = {
        moneda: 'VES',
        canal: process.env.PLAZA_CANAL || '23',
        Id: companyId,
        cuenta_cobrador: companyAccount,
        contrato: contratoId,
        fecha_contrato: fechaContrato,
        identificacion_d: data.payerDocument,
        cuenta_deudor: data.payerAccount,
        nombre_d: data.payerName,
        monto: Number(data.amount),
        concepto: cleanConcept,
        direccion_ip: this.formatIp(data.userIp || '127.0.0.1'),
      }

      let payloadString = JSON.stringify(payload)
      payloadString = payloadString.replace(
        /"monto":(\d+(\.\d*)?)/,
        (_, number) => {
          const val = Number.parseFloat(number)
          return `"monto":${val.toFixed(2)}`
        },
      )

      const nonce = Date.now().toString()
      // Ahora dataToSign usara '/v1/cce/dom/cobroDI' sin el ID al final, coincidiendo con el API Gateway del banco
      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0)',
            Accept: '*/*',
          },
          timeout: 45000,
        }),
      )

      const bankBody = response.data
      const bankHeaders = response.headers

      const bankCode =
        bankHeaders['codigorespuesta'] ||
        bankHeaders['codigoRespuesta'] ||
        bankBody?.codigoRespuesta ||
        '9999'

      const bankMessage =
        bankHeaders['descripcioncliente'] ||
        bankHeaders['descripcionCliente'] ||
        bankBody?.descripcionCliente ||
        bankBody?.descripcionSistema ||
        'Sin descripcion'

      if (bankCode !== '0000') {
        throw new HttpException(
          {
            message: bankMessage,
            bankCode,
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      const reference =
        bankBody?.referencia ||
        bankBody?.referencia_c ||
        bankBody?.numeroReferencia ||
        bankHeaders['referencia'] ||
        bankHeaders['numeroreferencia'] ||
        ''

      return {
        success: true,
        reference,
        bankCode,
        message: bankMessage,
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      if (error.response) {
        const bankData = error.response.data
        const bankHeaders = error.response.headers || {}
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.debug(`Error response body: ${JSON.stringify(bankData)}`)
        this.logger.debug(
          `Error response headers: ${JSON.stringify(bankHeaders)}`,
        )

        throw new HttpException(
          {
            message:
              bankHeaders['descripcioncliente'] ||
              bankHeaders['descripcionCliente'] ||
              bankData?.descripcionCliente ||
              bankData?.descripcionSistema ||
              'Error en cobro por domiciliacion',
            bankCode:
              bankHeaders['codigorespuesta'] ||
              bankHeaders['codigoRespuesta'] ||
              bankData?.codigoRespuesta ||
              '9999',
            statusCode: status,
          },
          status,
        )
      }

      this.logger.error(
        `Error inesperado en cobro por domiciliacion: ${error.message}`,
      )
      throw new InternalServerErrorException(
        'Error interno iniciando cobro por domiciliacion',
      )
    }
  }

  async plazaCheckSettlement(
    data: CheckSettlementRequest,
  ): Promise<SettlementStatusResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret
      const companyId = data.gatewayCompanyId
      const companyAccount = data.gatewayCompanyAccount

      if (!baseUrl || !apiKey || !apiSecret || !companyId || !companyAccount) {
        throw new InternalServerErrorException(
          'Configuracion incompleta para consulta de liquidacion',
        )
      }

      const endpointPath = '/v1/cce/dom/consultaLiq'
      const fullUrl = `${baseUrl}${endpointPath}/${companyId}`

      // Payload exigido por la documentación v3.0.0 (Pág 12-13)
      const payload = {
        transaccionId: data.transactionId || data.reference,
        canal: process.env.PLAZA_CANAL || '23',
        Id: companyId,
        cuenta_cobrador: companyAccount,
        direccion_ip: this.formatIp(data.userIp || '127.0.0.1'),
      }

      const payloadString = JSON.stringify(payload)
      const nonce = Date.now().toString()

      // Firma estricta: ruta base + nonce + body
      const dataToSign = endpointPath + nonce + payloadString

      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      const agent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
      })

      // Petición POST
      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
            Accept:
              'application/json, text/html, application/xhtml+xml, application/xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0)',
          },
          httpsAgent: agent,
          timeout: 45000,
        }),
      )

      const bankBody = response.data || {}
      const bankHeaders = response.headers || {}

      const status =
        bankBody?.codigoRespuesta ||
        bankHeaders['codigorespuesta'] ||
        bankHeaders['codigoRespuesta'] ||
        '9999'

      const message =
        bankBody?.descripcionCliente ||
        bankBody?.descripcionSistema ||
        bankHeaders['descripcioncliente'] ||
        bankHeaders['descripcionCliente'] ||
        'Procesado'

      return {
        // En consulta de liquidación, '0000' indica procesada con éxito.
        isApproved: status === '0000',
        status,
        message,
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      this.logger.error(`--- ERROR BANCO PLAZA (CONSULTA LIQ) ---`)

      // Nuevo bloque para registrar la peticion cruda que envio Axios
      if (error.config) {
        this.logger.error(
          `[AXIOS REQUEST] Metodo: ${error.config.method?.toUpperCase()}`,
        )
        this.logger.error(`[AXIOS REQUEST] URL: ${error.config.url}`)
        this.logger.error(
          `[AXIOS REQUEST] Headers: ${JSON.stringify(error.config.headers, null, 2)}`,
        )
        this.logger.error(`[AXIOS REQUEST] Data: ${error.config.data}`)
      }

      const bankData = error.response?.data
      const bankHeaders = error.response?.headers || {}
      const statusCode = error.response?.status || 500

      this.logger.error(`Status HTTP: ${statusCode}`)
      this.logger.error(
        `Headers recibidos: ${JSON.stringify(bankHeaders, null, 2)}`,
      )
      this.logger.error(`Body recibido: ${JSON.stringify(bankData)}`)
      this.logger.error(`------------------------------------------`)

      throw new HttpException(
        {
          message:
            bankHeaders['descripcioncliente'] ||
            bankHeaders['descripcionCliente'] ||
            bankData?.descripcionCliente ||
            'Error en consulta',
          bankCode:
            bankHeaders['codigorespuesta'] ||
            bankHeaders['codigoRespuesta'] ||
            bankData?.codigoRespuesta ||
            '9999',
          statusCode,
        },
        statusCode,
      )
    }
  }

  async plazaCheckTransactionStatus(
    data: CheckTransactionRequest,
  ): Promise<TransactionStatusResponse> {
    try {
      // --- PASO 0: Extracción y Validación de Configuración ---
      const baseUrl = process.env.PLAZA_API_URL
      const companyId = data.gatewayCompanyId
      const companyAccount = data.gatewayCompanyAccount
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret

      if (!baseUrl || !companyId || !companyAccount || !apiKey || !apiSecret) {
        throw new InternalServerErrorException(
          'Configuración incompleta de Banco Plaza para consultas',
        )
      }

      // 1. Construir el Path Base
      const endpointPath = `/v1/cce/debinm/consultarDI`

      // 2. Construir los Query Params
      const queryParams = new URLSearchParams({
        cuenta_cobrador: companyAccount,
        endtoend: data.endToEndId,
        referencia_c: data.reference || '',
        monto: data.amount.toFixed(2),
        canal: process.env.PLAZA_CANAL || '23',
      })

      const fullUrl = `${baseUrl}${endpointPath}/${companyId}?${queryParams.toString()}`

      // 3. FIRMA DIGITAL
      const nonce = Date.now().toString()
      const payloadString = ''

      const dataToSign = endpointPath + nonce + payloadString

      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      // 4. Petición POST
      const response = await lastValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            'api-key': apiKey,
            nonce,
            'api-signature': signature,
          },
        }),
      )

      const bankData = response.data
      this.logger.log(`Respuesta Consulta: ${JSON.stringify(bankData)}`)

      // 5. Interpretación
      const isApproved = bankData.codigoRespuesta === '0000'

      return {
        isApproved,
        status: bankData.codigoRespuesta,
        message:
          bankData.descripcionCliente ||
          bankData.descripcionSistema ||
          'Sin descripción',
        rawResponse: bankData,
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaSendMobilePayment(
    data: MobilePaymentRequest,
  ): Promise<MobilePaymentResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret
      const companyId = data.gatewayCompanyId

      if (!baseUrl || !apiKey || !apiSecret || !companyId) {
        throw new InternalServerErrorException(
          'Configuración incompleta de Banco Plaza (P2P)',
        )
      }

      const endpointPath = '/v1/pagos/p2p'
      const fullUrl = `${baseUrl}${endpointPath}/${companyId}`

      const payload = {
        banco: data.destinationBankCode,
        idBeneficiario: data.destinationId,
        telefono: data.destinationPhone,
        telefonoAfiliado: data.sourcePhone,
        monto: data.amount,
        motivo: data.concept,
        canal: process.env.PLAZA_CANAL,
        tipoCuenta: 'E',
      }

      const payloadString = JSON.stringify(payload)
      const nonce = Date.now().toString()

      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      this.logger.log(
        `Enviando Pago Móvil a ${data.destinationBankCode}-${data.destinationPhone}`,
      )

      // 5. Envío de Petición
      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
            ipCliente: data.ip || '127.0.0.1',
            Longitud: data.longitude || '0.00',
            Latitud: data.latitude || '0.00',
            Precision: '13',
          },
        }),
      )

      // 6. Extracción de Datos
      const bankBody = response.data
      const bankHeaders = response.headers

      this.logger.debug(`Body Respuesta: ${JSON.stringify(bankBody)}`)
      this.logger.debug(`Headers Respuesta: ${JSON.stringify(bankHeaders)}`)

      const codigoRespuesta =
        bankHeaders['codigorespuesta'] || bankHeaders['codigoRespuesta']
      const descripcionCliente =
        bankHeaders['descripcioncliente'] || bankHeaders['descripcionCliente']

      // 7. Validación
      if (codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: descripcionCliente || 'Pago Móvil rechazado',
            bankCode: codigoRespuesta || '9999',
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      return {
        success: true,
        reference: bankBody.numeroReferencia || bankHeaders['numeroreferencia'],
        message: descripcionCliente || 'Transacción Exitosa',
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaSendCustomerMobilePayment(
    data: CustomerPaymentRequest,
  ): Promise<MobilePaymentResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const context = await this.getPlazaContext(data.companyAccountId, true)
      const apiKey = context.apiKey
      const apiSecret = context.apiSecret

      const companyId = context.documentId
      const companyPhone = String(context.account.phoneNumber || '').trim()
      const companyBankCode = context.account.bank?.bankCode?.trim()

      if (!baseUrl || !apiKey || !apiSecret || !companyId || !companyPhone) {
        throw new InternalServerErrorException(
          'Configuración incompleta de Banco Plaza (Cobro P2P)',
        )
      }

      const endpointPath = `/v1/pagos/p2p/${data.payerId}`
      const fullUrl = `${baseUrl}${endpointPath}`

      const payload = {
        banco: companyBankCode,
        idBeneficiario: companyId,
        telefono: companyPhone,
        telefonoafiliado: data.payerPhone,
        monto: data.amount,
        motivo: data.concept,
        canal: process.env.PLAZA_CANAL,
        tipoCuenta: 'E',
      }

      const payloadString = JSON.stringify(payload)
      const nonce = Date.now().toString()

      this.logger.debug(`Payload P2P Cobro: ${payloadString}`)
      this.logger.debug(`URL: ${fullUrl}`)

      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      this.logger.log(`Cliente ${data.payerId} enviando pago a Empresa...`)

      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
            ipCliente: data.ip,
            Longitud: data.longitude,
            Latitud: data.latitude,
            Precision: '13',
          },
        }),
      )

      const bankData = response.data

      if (bankData.codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: bankData.descripcionCliente || 'Pago rechazado',
            bankCode: bankData.codigoRespuesta,
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      return {
        success: true,
        reference: bankData.numeroReferencia,
        message: bankData.descripcionCliente,
        rawResponse: bankData,
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaGetMobilePaymentHistory(
    data: ConsultMobilePaymentRequest,
  ): Promise<MobilePaymentHistoryResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret

      if (!baseUrl || !apiKey || !apiSecret) {
        throw new InternalServerErrorException(
          'Configuración incompleta de Banco Plaza',
        )
      }

      const signingPath = 'v1/pagos/p2p'

      const requestPath = `/${signingPath}/${data.payerId}`

      const queryParams = new URLSearchParams()

      if (data.filters) {
        if (data.filters.dateStart)
          queryParams.append('fi', data.filters.dateStart)
        if (data.filters.dateEnd) queryParams.append('ff', data.filters.dateEnd)
        if (data.filters.phone) queryParams.append('tlfa', data.filters.phone)
        const accValue =
          data.filters.action !== undefined
            ? data.filters.action.toString()
            : '2'
        queryParams.append('acc', accValue)
      } else {
        // Si no hay filtros, por defecto pedimos todas las transacciones
        queryParams.append('acc', '2')
      }

      // Canal siempre fijo o por env
      queryParams.append('canal', process.env.PLAZA_CANAL || '23')

      const queryString = queryParams.toString()
      const fullUrl = queryString
        ? `${baseUrl}${requestPath}?${queryString}`
        : `${baseUrl}${requestPath}`

      const nonce = Date.now().toString()
      const payloadString = ''
      const dataToSign = `/${signingPath}${nonce}${payloadString}`

      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      this.logger.debug(`Firmando: ${dataToSign}`)
      this.logger.debug(`Signature: ${signature}`)

      // 5. Petición HTTP GET (HEADERS LIMPIOS)
      const response = await lastValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
          },
        }),
      )

      const bankData = response.data

      const historyItems: MobilePaymentHistoryItem[] = (
        bankData.pagos || []
      ).map((p) => ({
        action: p.accion,
        bankCode: p.banco,
        clientPhone: p.telefonoCliente,
        affiliatePhone: p.telefonoAfiliado,
        amount: Number(p.monto),
        date: p.fecha,
        time: p.hora,
        reference: p.referencia,
        concept: p.motivo,
      }))

      return {
        count: bankData.cantidadPagos || 0,
        payments: historyItems,
        rawResponse: bankData,
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaInitiateTransfer(
    data: TransferRequest,
  ): Promise<TransferResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret

      const companyId = data.gatewayCompanyId
      const companyAccount = data.gatewayCompanyAccount
      const companyName = data.gatewayCompanyName
      const companyBankCode = data.gatewayCompanyBankCode
      const currencyCode = data.gatewayCurrencyCode

      if (
        !baseUrl ||
        !apiKey ||
        !apiSecret ||
        !companyId ||
        !companyAccount ||
        !companyName ||
        !companyBankCode ||
        !currencyCode
      ) {
        throw new InternalServerErrorException(
          'Configuración incompleta de Banco Plaza (Transferencias)',
        )
      }

      const endpointPath = '/v1/cce/pagoO'
      const fullUrl = `${baseUrl}${endpointPath}/${companyId}`

      const isPhoneTransfer = !!data.beneficiaryPhone
      const instrumentType = isPhoneTransfer ? 'T' : 'C'

      const payload = {
        moneda: currencyCode,
        canal: '23',
        tipo_cce: 'E',
        tipo_proposito: '220',
        tipo_instrumento_b: instrumentType,

        identificacion_o: companyId,
        cuenta_origen: companyAccount,
        cod_banco_d: companyBankCode,
        nombre_d: companyName,

        identificacion_b: data.beneficiaryId,
        cod_banco_a: data.beneficiaryBankCode,
        nombre_a: data.beneficiaryName,

        cuenta_destino: isPhoneTransfer ? '' : data.beneficiaryAccount,
        telefono: isPhoneTransfer ? data.beneficiaryPhone : '',
        correo: '',

        monto: Number(data.amount.toFixed(2)),
        concepto: data.concept,
        direccion_ip: this.formatIp(data.ip),
      }

      const payloadString = JSON.stringify(payload)
      const nonce = Date.now().toString()

      this.logger.debug(
        `Iniciando Transferencia a ${data.beneficiaryName}: ${payloadString}`,
      )

      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      // 1. Hacemos la petición y capturamos el objeto response
      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
          },
        }),
      )

      // 2. Separamos Body y Headers
      const bankBody = response.data
      const bankHeaders = response.headers

      // 3. Extraemos el código de respuesta de los HEADERS
      const codigoRespuesta =
        bankHeaders['codigorespuesta'] || bankHeaders['codigoRespuesta']
      const descripcionCliente =
        bankHeaders['descripcioncliente'] || bankHeaders['descripcionCliente']

      // 4. Validamos
      if (codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: descripcionCliente || 'Transferencia rechazada',
            bankCode: codigoRespuesta || '9999', // Si es undefined, ponemos 9999
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      // 5. Retornamos Éxito
      // La referencia suele venir en el Body, pero a veces también en Headers
      const reference =
        bankBody.referencia ||
        bankBody.numeroReferencia ||
        bankBody.referencia_c ||
        bankHeaders['numeroreferencia'] ||
        'PENDIENTE'

      return {
        success: true,
        reference: reference,
        message: descripcionCliente || 'Transacción Exitosa',
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaInitiateCustomerTransfer(
    data: CustomerTransferRequest,
  ): Promise<TransferResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const context = await this.getPlazaContext(data.companyAccountId, true)
      const apiKey = context.apiKey
      const apiSecret = context.apiSecret
      const currencyId = data.gatewayCurrencyId

      const companyId = context.documentId
      const companyAccount = context.accountNumber
      const companyName = String(context.account.businessName || '').trim()
      const companyBankCode = context.account.bank?.bankCode?.trim()

      if (
        !baseUrl ||
        !apiKey ||
        !apiSecret ||
        !companyId ||
        !companyAccount ||
        !companyName ||
        !companyBankCode ||
        !currencyId
      ) {
        throw new InternalServerErrorException(
          'Configuración incompleta para recibir transferencias',
        )
      }

      const endpointPath = `/v1/cce/pagoO`
      const fullUrl = `${baseUrl}${endpointPath}/${data.payerId.trim()}`

      const payload = {
        moneda: currencyId,
        canal: process.env.PLAZA_CANAL || '23',
        tipo_cce: 'E',
        tipo_proposito: '220',
        tipo_instrumento_b: 'C',

        identificacion_o: data.payerId.trim(),
        cuenta_origen: data.payerAccount.trim(),
        cod_banco_d: companyBankCode,
        nombre_d: data.payerName.toUpperCase().trim(),

        identificacion_b: companyId.trim(),
        cod_banco_a: companyBankCode,
        nombre_a: companyName.toUpperCase().trim(),
        cuenta_destino: companyAccount.trim(),

        telefono: '',
        correo: '',

        monto: Number(data.amount.toFixed(2)),
        concepto: data.concept.toUpperCase().trim(),
        direccion_ip: this.formatIp(data.ip),
        referencia: Date.now().toString().slice(-8),
      }

      const payloadString = JSON.stringify(payload)
      const nonce = Date.now().toString()

      this.logger.debug(
        `Iniciando Cobro a Cliente ${data.payerName}: ${payloadString}`,
      )

      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      const response = await lastValueFrom(
        this.httpService.post(fullUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
          },
        }),
      )

      const bankBody = response.data
      const bankHeaders = response.headers

      const codigoRespuesta =
        bankHeaders['codigorespuesta'] || bankHeaders['codigoRespuesta']
      const descripcionCliente =
        bankHeaders['descripcioncliente'] || bankHeaders['descripcionCliente']

      if (codigoRespuesta !== '0000') {
        throw new HttpException(
          {
            message: descripcionCliente || 'Cobro rechazado',
            bankCode: codigoRespuesta || '9999',
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      return {
        success: true,
        reference:
          bankBody.numeroReferencia ||
          bankBody.referencia ||
          payload.referencia,
        message: descripcionCliente || 'Cobro Exitoso',
        rawResponse: { body: bankBody, headers: bankHeaders },
      }
    } catch (error) {
      if (error.response?.data) {
        const bankData = error.response.data
        const status = error.response.status || HttpStatus.BAD_REQUEST

        this.logger.error(
          `Respuesta bruta del banco (Consulta): ${JSON.stringify(bankData)}`,
        )

        if (typeof bankData === 'string') {
          throw new HttpException(
            {
              message: bankData,
              bankCode: '9999',
              statusCode: status,
            },
            status,
          )
        }

        throw new HttpException(
          {
            message:
              bankData.descripcionCliente ||
              bankData.descripcionSistema ||
              'Error en consulta',
            bankCode: bankData.codigoRespuesta || '9999',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error inesperado en consulta: ${error.message}`)
      throw new InternalServerErrorException(
        'Error interno consultando transacción',
      )
    }
  }

  async plazaConsultTransferStatus(
    data: ConsultTransferStatusRequest,
  ): Promise<TransactionTransferStatusResponse> {
    try {
      const baseUrl = process.env.PLAZA_API_URL
      const apiKey = data.gatewayApiKey
      const apiSecret = data.gatewayApiSecret

      if (!baseUrl || !apiKey || !apiSecret) {
        throw new InternalServerErrorException(
          'Configuración incompleta Banco Plaza',
        )
      }

      const originatorIdClean = data.originatorId.replace(/^0+/, '')
      const endpointPath = `/v1/cce/consultaLiq`

      const queryParams = new URLSearchParams()

      if (data.account) queryParams.append('cuenta', data.account)
      if (data.reference) queryParams.append('referencia', data.reference)

      if (data.amount !== undefined && data.amount !== null) {
        queryParams.append('monto', data.amount.toFixed(2))
      }

      if (data.date) queryParams.append('fecha', data.date)

      queryParams.append('canal', data.channel || '23')

      const queryString = queryParams.toString()

      const fullUrl = queryString
        ? `${baseUrl}${endpointPath}/${originatorIdClean}?${queryString}`
        : `${baseUrl}${endpointPath}/${originatorIdClean}`

      const nonce = Date.now().toString()
      const payloadString = ''
      const dataToSign = endpointPath + nonce + payloadString
      const signature = this.generateHmacSha384(apiSecret, dataToSign)

      this.logger.debug(`Consultando Liquidación: ${fullUrl}`)

      const response = await lastValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Api-key': apiKey,
            Nonce: nonce,
            'Api-signature': signature,
          },
        }),
      )

      const bankData = response.data

      const isSuccess = bankData.codigoRespuesta === '0000'

      return {
        isSuccess: isSuccess,
        message: bankData.descripcionCliente || bankData.descripcionSistema,
        bankCode: bankData.codigoRespuesta,
        rawResponse: bankData,
      }
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `Error Consulta Liq ${error.response.status}: ${JSON.stringify(error.response.data)}`,
        )

        if (error.response.status === 404) {
          return {
            isSuccess: false,
            message:
              'La transacción no fue encontrada (No liquidada o Rechazada)',
            bankCode: '404',
            rawResponse: error.response.data,
          }
        }
      }

      throw new InternalServerErrorException(
        'Error consultando estado de liquidación',
      )
    }
  }

  private generateHmacSha384(secret: string, data: string): string {
    const hmac = crypto.createHmac('sha384', secret)
    hmac.update(data)
    return hmac.digest('hex')
  }

  private readonly formatIp = (ip: string): string => {
    if (ip === '::1' || ip.includes('127.0.0.1')) return '127.0.0.1'
    return ip.replace(/^.*:/, '')
  }

  private readonly defaultMercantilGuid = 'ad2a1719-f8af-10d1-60e7-d4e5d5b93464'

  async mercantilProcessWebhookNotificationDebit(
    data: WebhookNotificationDebitRequest,
    masterKey: string,
  ): Promise<WebhookNotificationDebitResponse> {
    this.logger.log('Webhook Mercantil recibido')
    this.logger.debug(
      `1. Payload completo recibido en el metodo: ${JSON.stringify(data, null, 2)}`,
    )

    try {
      this.logger.debug(
        `2. Inspeccionando data.payload: ${JSON.stringify(data?.payload, null, 2)}`,
      )

      // Correccion: Extraemos directamente de data.data según el JSON que envia el banco
      const encryptedData = data?.payload?.data || data?.payload?.['data']

      this.logger.debug(
        `3. Texto extraido para descifrar: ${encryptedData ? encryptedData.substring(0, 20) + '...' : 'UNDEFINED'}`,
      )

      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new InternalServerErrorException(
          `Payload inválido. Tipo recibido: ${typeof encryptedData}`,
        )
      }

      const normalizedCipherText = encryptedData.trim().replace(/[\r\n]/g, '')
      this.logger.debug('4. Texto normalizado listo para descifrar')

      const decryptedString = this.decryptWebhookData(
        normalizedCipherText,
        masterKey,
      )
      this.logger.debug(
        `5. Texto descifrado exitosamente (antes de JSON.parse): ${decryptedString}`,
      )

      const jsonData = JSON.parse(decryptedString)

      this.logger.log('Descifrado de webhook exitoso')
      this.logger.debug(
        `6. JSON procesado final: ${JSON.stringify(jsonData, null, 2)}`,
      )

      const responseBody = this.buildMercantilWebhookAck(
        this.extractMercantilInfoMsg(jsonData),
      )

      return {
        statusCode: 200,
        responseBody,
        decryptedData: jsonData,
      }
    } catch (error: any) {
      // Capturamos el stack trace completo para ver la linea exacta que lanza la excepcion
      this.logger.error(
        `Error al descifrar webhook: ${error?.message || error}`,
      )
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`)
      }

      // Se responde 200 para evitar reintentos excesivos por parte del banco.
      return {
        statusCode: 200,
        responseBody: this.buildMercantilWebhookAck(),
      }
    }
  }

  private extractMercantilInfoMsg(jsonData: any) {
    const infoMsg =
      jsonData?.infoMsg || jsonData?.webhookNotificationIn?.infoMsg || {}

    return {
      guId:
        infoMsg?.guId ||
        jsonData?.webhookNotificationIn?.guId ||
        this.defaultMercantilGuid,
      channel: infoMsg?.channel || '0006',
      subchannel: infoMsg?.subchannel || '07',
      applId: infoMsg?.applId || 'OLB',
      personId: infoMsg?.personId || 'V11312786@J306993762',
      userId: infoMsg?.userId || '',
      token: infoMsg?.token || '',
      action: infoMsg?.action || '',
    }
  }

  private buildMercantilWebhookAck(infoMsgInput?: {
    guId: string
    channel: string
    subchannel: string
    applId: string
    personId: string
    userId: string
    token: string
    action: string
  }) {
    const infoMsg = infoMsgInput || {
      guId: this.defaultMercantilGuid,
      channel: '0006',
      subchannel: '07',
      applId: 'OLB',
      personId: 'V11312786@J306993762',
      userId: '',
      token: '',
      action: '',
    }

    return {
      infoMsg: {
        guId: infoMsg.guId,
        channel: infoMsg.channel,
        subchannel: infoMsg.subchannel,
        applId: infoMsg.applId,
        personId: infoMsg.personId,
        userId: infoMsg.userId,
        token: infoMsg.token,
        action: infoMsg.action,
      },
      code: 0,
      codigo: '0000',
      mensajeCliente: 'Notificacion recibida con éxito!',
      mensajeSistema: 'Notificacion recibida con éxito!!',
      idRegistro: '00000',
    }
  }

  private decryptWebhookData(cipherText: string, masterKey: string): string {
    const hashString = crypto
      .createHash('sha256')
      .update(masterKey, 'utf8')
      .digest('hex')
    const firstHalf = hashString.substring(0, 32)
    const keyBuffer = Buffer.from(firstHalf, 'hex')

    // 2. Usamos Buffer.alloc(0) que es el equivalente exacto a Crypto.randomBytes(0) del banco
    const iv = Buffer.alloc(0)

    const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, iv)
    decipher.setAutoPadding(true)

    let decryptedText = decipher.update(cipherText, 'base64', 'utf8')
    decryptedText += decipher.final('utf8')

    return decryptedText
  }

  private getMercantilAes128Key(masterKey: string): Buffer {
    const hash = crypto.createHash('sha256').update(masterKey, 'utf8').digest()
    return hash.subarray(0, 16)
  }

  async mercantilGenerateWebPaymentUrl(
    request: GenerateWebPaymentUrlRequest,
  ): Promise<GenerateWebPaymentUrlResponse> {
    const context = await this.getMercantilContext(request.companyAccountId)
    this.logger.debug('Contexto Mercantil obtenido:', context)
    const merchantId = context.merchantId
    const integratorId = process.env.MERCANTIL_INTEGRATOR_ID
    const baseUrl = process.env.MERCANTIL_WEB_PAYMENT_BASE_URL

    // Decide si usar la URL predefinida en .env en vez de generar una dinámica
    const useEnvFlagRaw = String(
      process.env.MERCANTIL_USE_ENV_PAYMENT_URL || '',
    )
    const useEnvFlag =
      useEnvFlagRaw.toLowerCase() === 'true' ||
      useEnvFlagRaw === '1' ||
      useEnvFlagRaw.toLowerCase() === 'yes'
    const envPaymentUrl = process.env.MERCANTIL_PAYMENT_URL

    if (useEnvFlag) {
      if (!envPaymentUrl) {
        this.logger.warn(
          'MERCANTIL_USE_ENV_PAYMENT_URL está activado pero MERCANTIL_PAYMENT_URL no está definida; se generará la URL dinámicamente',
        )
      } else {
        return { paymentUrl: envPaymentUrl }
      }
    }

    if (!merchantId || !baseUrl) {
      throw new InternalServerErrorException(
        'Faltan credenciales de Mercantil en el .env',
      )
    }

    // Calculamos las fechas en formato YYYY-MM-DD
    const today = new Date()
    const creationDate = today.toISOString().split('T')[0]

    // Fecha de cancelación (ej: vencimiento en 3 días)
    const cancelDateObj = new Date(today)
    cancelDateObj.setDate(today.getDate() + 3)
    const cancelledDate = cancelDateObj.toISOString().split('T')[0]
    const formattedAmount = request.amount.toFixed(2)
    const invoiceSequence = Date.now().toString().slice(-8).padStart(8, '0')

    // Payload EXACTO como exige la documentación del PDF
    const transactionPayload = {
      // Aseguramos que amount se envíe como string (requisito del banco)
      amount: String(formattedAmount),
      customerName: request.payerName,
      returnUrl: process.env.MERCANTIL_OK_URL,
      merchantId: merchantId,
      trxType: 'compra',
      currency: 'ves',
      paymentConcepts: ['b2b', 'c2p', 'tdd'], // Arreglo obligatorio
      invoiceNumber: {
        number: `ORD-${invoiceSequence}`,
        invoiceCreationDate: creationDate,
        invoiceCancelledDate: cancelledDate,
      },
    }

    this.logger.debug(
      `Generando URL Mercantil para factura: ${transactionPayload.invoiceNumber.number}`,
    )
    this.logger.debug(
      `Payload enviado a Mercantil: ${JSON.stringify(transactionPayload)}`,
    )

    const encryptedData = this.encryptWebTransactionData(
      transactionPayload,
      context.masterKey,
    )
    const paymentUrl = `${baseUrl}?merchantid=${merchantId}&integratorid=${integratorId}&transactiondata=${encodeURIComponent(encryptedData)}`

    return { paymentUrl }
  }

  private encryptWebTransactionData(payload: any, masterKey: string): string {
    const key16 = this.getMercantilAes128Key(masterKey)

    // 3. Cifrar el JSON
    const cipher = crypto.createCipheriv('aes-128-ecb', key16, null)
    cipher.setAutoPadding(true)

    const jsonString = JSON.stringify(payload)
    let encrypted = cipher.update(jsonString, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    return encrypted
  }

  private encryptField(text: string, masterKey: string): string {
    const key16 = this.getMercantilAes128Key(masterKey)

    const cipher = crypto.createCipheriv('aes-128-ecb', key16, null)
    cipher.setAutoPadding(true)

    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    return encrypted
  }

  async mercantilProcessP2pPayment(
    request: InitiateP2pPaymentRequest,
    context: MercantilContext,
  ): Promise<InitiateP2pPaymentResponse> {
    const merchantId = context.merchantId
    const integratorId = process.env.MERCANTIL_INTEGRATOR_ID || '1'
    const terminalId = process.env.MERCANTIL_TERMINAL_ID || '1'
    const clientId = context.clientId
    const merchantMobile = context.merchantMobile
    const paymentUrl = process.env.MERCANTIL_C2P_PAYMENT_URL + '/payment/c2p'

    const encryptedPayerId = this.encryptField(
      request.payerId,
      context.masterKey,
    )
    const encryptedPayerPhone = this.encryptField(
      request.payerPhone,
      context.masterKey,
    )
    const encryptedMerchantPhone = this.encryptField(
      merchantMobile,
      context.masterKey,
    )

    if (!paymentUrl) {
      throw new InternalServerErrorException(
        'MERCANTIL_C2P_PAYMENT_URL no definida',
      )
    }

    const payload = {
      merchant_identify: {
        integratorId: Number(integratorId),
        merchantId: Number(merchantId),
        terminalId: terminalId,
      },
      client_identify: { ipaddress: request.ipAddress },
      transaction_c2p: {
        trx_type: 'vuelto',
        payment_method: 'p2p',
        destination_id: encryptedPayerId,
        invoice_number: `INV-${Date.now()}`,
        currency: 'VES',
        amount: Number(request.amount.toFixed(2)),
        destination_bank_id: Number(request.payerBankCode),
        destination_mobile_number: encryptedPayerPhone,
        origin_mobile_number: encryptedMerchantPhone,
      },
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(paymentUrl, payload, {
          headers: {
            'X-IBM-Client-Id': clientId,
            'Content-Type': 'application/json',
          },
        }),
      )

      const responseData = response.data

      return {
        success: true,
        reference:
          responseData.transaction_c2p?.payment_reference || 'Ref_No_Provista',
        message: 'Pago móvil procesado exitosamente',
        rawResponse: responseData,
      }
    } catch (error: any) {
      const errorDetail = error.response?.data || error.message
      throw new InternalServerErrorException(
        `Fallo en P2P Mercantil: ${JSON.stringify(errorDetail)}`,
      )
    }
  }

  async mercantilVerifyC2pPayment(
    request: VerifyC2pPaymentRequest,
    context: MercantilContext,
  ): Promise<VerifyC2pPaymentResponse> {
    const searchUrl =
      process.env.MERCANTIL_SEARCH_URL ||
      'https://apimbu.mercantilbanco.com/mercantil-banco/cert/v1/mobile-payment/search'
    const clientId = context.clientId
    const merchantMobile = context.merchantMobile

    const integratorId = process.env.MERCANTIL_INTEGRATOR_ID || '1'
    const merchantId = context.merchantId
    const terminalId = process.env.MERCANTIL_TERMINAL_ID || '1'

    const trxDate = request.trxDate || new Date().toISOString().slice(0, 10)

    const encryptedMerchantMobile = this.encryptField(
      merchantMobile,
      context.masterKey,
    )
    const encryptedPayerPhone = this.encryptField(
      request.payerPhone,
      context.masterKey,
    )

    const payload = {
      merchant_identify: {
        integratorId,
        merchantId,
        terminalId,
      },
      client_identify: {
        ipaddress: request.ipAddress,
      },
      search_by: {
        amount: Number(request.amount.toFixed(2)),
        currency: 'ves',
        origin_mobile_number: encryptedMerchantMobile,
        destination_mobile_number: encryptedPayerPhone,
        payment_reference: request.paymentReference,
        trx_date: trxDate,
      },
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(searchUrl, payload, {
          headers: {
            'X-IBM-Client-Id': clientId,
            'Content-Type': 'application/json',
          },
        }),
      )

      const bankData = response.data
      const status =
        bankData?.search_result?.status ||
        bankData?.status ||
        bankData?.codigoRespuesta ||
        bankData?.responseCode ||
        'unknown'

      return {
        success: true,
        status: String(status),
        rawResponse: bankData,
      }
    } catch (error: any) {
      const errorDetail = error?.response?.data || error?.message
      throw new InternalServerErrorException(
        `Fallo en verificación C2P Mercantil: ${JSON.stringify(errorDetail)}`,
      )
    }
  }

  private readonly BASE_URL: string

  private generateHash(
    date: string,
    currency: string,
    commerceKey: string,
  ): string {
    const mensaje = date + currency
    return crypto
      .createHmac('sha256', commerceKey)
      .update(mensaje)
      .digest('hex')
  }

  private generateOTPHash(
    bankAccountId: string,
    amount: number,
    phoneNumber: string,
    nationalId: string,
    commerceKey: string,
  ): string {
    const safeBankId = String(bankAccountId || '')
    const safeAmount = amount ? amount.toFixed(2) : '0.00'
    const safePhone = String(phoneNumber || '')
    const safeId = String(nationalId || '')

    // 2. Concatenamos explícitamente (puedes usar template strings para mayor claridad)
    const mensaje = `${safeBankId}${safeAmount}${safePhone}${safeId}`

    this.logger.debug(`Mensaje a cifrar: "${mensaje}"`)
    return crypto
      .createHmac('sha256', commerceKey)
      .update(mensaje)
      .digest('hex')
  }

  private generateDirectDebitHash(value: string, commerceKey: string): string {
    return crypto.createHmac('sha256', commerceKey).update(value).digest('hex')
  }

  private generateImmediateDebitHash(
    bankCode: string,
    nationalId: string,
    phoneNumber: string,
    amount: string,
    otp: string,
    secretKey: string,
  ): string {
    const raw = `${bankCode}${nationalId}${phoneNumber}${amount}${otp}`

    return crypto.createHmac('sha256', secretKey).update(raw).digest('hex')
  }

  private generateImmediateCreditHash(
    bankCode: string,
    nationalId: string,
    phoneNumber: string,
    amount: string,
    commerceKey: string,
  ): string {
    const raw = `${bankCode}${nationalId}${phoneNumber}${amount}`

    return crypto.createHmac('sha256', commerceKey).update(raw).digest('hex')
  }

  private mapDirectDebitError(error: any, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      throw error
    }

    const status = error?.response?.status
    const bankMessage =
      error?.response?.data?.mensaje ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      fallbackMessage

    if (status && status >= 400 && status < 500) {
      throw new BadRequestException(bankMessage)
    }

    throw new InternalServerErrorException(bankMessage)
  }

  async r4GetExchangeRate(
    data: ExchangeRateRequest,
  ): Promise<ExchangeRateResponse> {
    try {
      const context = await this.getR4Context(data.companyAccountId, true)
      const URL_BCV = this.BASE_URL ? `${this.BASE_URL}/MBbcv` : ''

      if (!context.commerceKey || !URL_BCV) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const hash = this.generateHash(
        data.date,
        data.currency,
        context.commerceKey,
      )

      const payload = {
        Moneda: data.currency,
        Fechavalor: data.date,
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: hash,
          Commerce: context.commerceKey,
        },
      }

      const response = await firstValueFrom(
        this.httpService.post(URL_BCV, payload, config),
      )

      const bankData = response.data

      const tipocambio =
        bankData?.tipocambio ??
        bankData?.exchangeRate ??
        bankData?.data?.tipocambio ??
        bankData?.data?.exchangeRate
      const parsed =
        tipocambio !== undefined && tipocambio !== null
          ? Number(tipocambio)
          : NaN

      if (isNaN(parsed)) {
        this.logger.error(
          'Respuesta inválida de R4: tipocambio no encontrada o no es numérica',
        )
        throw new InternalServerErrorException(
          'Respuesta inválida de R4: tipocambio no encontrada',
        )
      }

      return {
        success: true,
        exchangeRate: parsed,
      }
    } catch (error) {
      const err = error
      this.logger.error(`Error consultando tasa de R4: ${err.message}`)

      if (err.response?.data) {
        const bankData = err.response.data
        const status = err.response.status || HttpStatus.BAD_REQUEST

        throw new HttpException(
          {
            message:
              bankData.message ||
              bankData.error ||
              'Error consultando tasa de cambio',
            statusCode: status,
          },
          status,
        )
      }

      if (error instanceof HttpException) {
        throw error
      }

      throw new InternalServerErrorException(
        'Error interno consultando tasa de cambio',
      )
    }
  }

  async r4GenerateOTP(data: GenerateOtpRequest): Promise<GenerateOtpResponse> {
    /**
     * Genera un OTP contra la API de Banco R4.
     * - Valida configuración necesaria (commerce_key, BASE_URL).
     * - Construye el payload y firma HMAC requerido por la API.
     * - Realiza la petición HTTP y normaliza la respuesta.
     * @param {GenerateOtpRequest} data Datos requeridos: bankCode, amount, phoneNumber, nationalId.
     * @returns {Promise<GenerateOtpResponse>} Objeto con `code`, `success` y `message`.
     * @throws {BadRequestException|InternalServerErrorException} Errores apropiados según la respuesta del banco o la configuración.
     */
    try {
      const context = await this.getR4Context(data.companyAccountId)

      if (!context.commerceKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }
      const endpoint = `${this.BASE_URL}/GenerarOtp`

      const hash = this.generateOTPHash(
        data.bankCode,
        data.amount,
        data.phoneNumber,
        data.nationalId,
        context.commerceKey,
      )

      const payload = {
        Banco: data.bankCode,
        Monto: data.amount.toFixed(2),
        Telefono: data.phoneNumber,
        Cedula: data.nationalId,
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: hash,
          Commerce: context.commerceKey,
        },
      }

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, config),
      )

      const bankData = response.data

      // Registrar la respuesta completa del banco para auditoria y depuracion
      this.logger.log(
        `Respuesta exitosa R4 Generar OTP: ${JSON.stringify(bankData)}`,
      )

      // Mapear dinamicamente usando los datos reales devueltos por el banco
      return {
        code: String(bankData?.code || '202'),
        success: bankData?.success === true || bankData?.code === '202',
        message: bankData?.message || 'OTP generado exitosamente',
      }
    } catch (error) {
      const err = error

      // Capturar la estructura completa del error devuelto por la API del banco
      const bankErrorData = err.response?.data

      this.logger.error(
        `Error generando OTP en R4. Status HTTP: ${err.response?.status}. Payload del banco: ${JSON.stringify(bankErrorData || err.message)}`,
      )

      // Buscar el mensaje de error en los campos mas comunes
      const errorMessage =
        bankErrorData?.message ||
        bankErrorData?.error ||
        bankErrorData?.descripcion ||
        'Error al procesar OTP con el banco'

      throw new BadRequestException(errorMessage)
    }
  }

  async r4ProcessAccountDirectDebit(
    dto: AccountDirectDebitDto,
  ): Promise<AccountDirectDebitResponseDto> {
    try {
      const context = await this.getR4Context(dto.companyAccountId)

      if (!context.commerceKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const endpoint = `${this.BASE_URL}/TransferenciaOnline/DomiciliacionCNTA`
      const authorization = this.generateDirectDebitHash(
        dto.accountNumber,
        context.commerceKey,
      )

      const payload = {
        docId: dto.documentId,
        nombre: dto.fullName,
        cuenta: dto.accountNumber,
        monto: dto.amount,
        concepto: dto.concept,
      }

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: context.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      if (response.status !== HttpStatus.OK && response.status !== HttpStatus.ACCEPTED) {
        throw new InternalServerErrorException(
          'Respuesta HTTP inválida de Banco R4',
        )
      }

      const code = String(response.data?.codigo ?? '')
      const message = response.data?.mensaje || 'Respuesta inválida de Banco R4'

      if (code !== '202') {
        throw new BadRequestException(message)
      }

      return {
        code,
        message,
        uuid: response.data?.uuid || '',
        rawResponse: response.data,
      }
    } catch (error) {
      this.logger.error(
        `Error en domiciliación por cuenta R4: ${error instanceof Error ? error.message : String(error)}`,
      )
      this.mapDirectDebitError(
        error,
        'Error procesando domiciliación por cuenta en Banco R4',
      )
    }
  }

  async r4ProcessPhoneDirectDebit(
    dto: PhoneDirectDebitDto,
  ): Promise<PhoneDirectDebitResponseDto> {
    try {
      const context = await this.getR4Context(dto.companyAccountId)

      if (!context.commerceKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const endpoint = `${this.BASE_URL}/TransferenciaOnline/DomiciliacionCELE`
      const authorization = this.generateDirectDebitHash(
        dto.phoneNumber,
        context.commerceKey,
      )

      const payload = {
        docId: dto.documentId,
        telefono: dto.phoneNumber,
        nombre: dto.fullName,
        banco: dto.bankCode,
        monto: dto.amount,
        concepto: dto.concept,
      }

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: context.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      if (response.status !== HttpStatus.OK && response.status !== HttpStatus.ACCEPTED) {
        throw new InternalServerErrorException(
          'Respuesta HTTP inválida de Banco R4',
        )
      }

      const code = String(response.data?.codigo ?? '')
      const message = response.data?.mensaje || 'Respuesta inválida de Banco R4'

      if (code !== '202') {
        throw new BadRequestException(message)
      }

      return {
        code,
        message,
        uuid: response.data?.uuid || '',
        rawResponse: response.data,
      }
    } catch (error) {
      this.logger.error(
        `Error en domiciliación por teléfono R4: ${error instanceof Error ? error.message : String(error)}`,
      )
      this.mapDirectDebitError(
        error,
        'Error procesando domiciliación por teléfono en Banco R4',
      )
    }
  }

  async r4ProcessImmediateDebit(
    dto: ImmediateDebitRequestDto,
  ): Promise<ImmediateDebitResponseDto> {
    try {
      const context = await this.getR4Context(dto.companyAccountId)

      if (!context.commerceKey || !context.secretKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const endpoint = `${this.BASE_URL}/DebitoInmediato`
      const amountValue = Number(dto.amount)

      if (Number.isNaN(amountValue) || amountValue <= 0) {
        throw new BadRequestException('Monto invalido para Debito Inmediato')
      }

      // Se reutiliza el mismo monto formateado para hash y payload.
      const formattedAmount = amountValue.toFixed(2)

      // ✅ NORMALIZACIÓN CORRECTA (Conserva letras y números, fuerza mayúscula)
      const normalizedNationalId = String(dto.nationalId || '')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()

      const normalizedPhone = String(dto.phoneNumber || '')
        .trim()
        .replace(/\D/g, '')

      if (!normalizedNationalId) {
        this.logger.warn(
          '[R4][DebitoInmediato] Cedula vacía después de normalizar',
        )
      }

      if (!normalizedPhone) {
        this.logger.warn(
          '[R4][DebitoInmediato] Telefono vacío después de normalizar',
        )
      }

      if (dto.otp && String(dto.otp).length !== 6) {
        this.logger.warn(
          `[R4][DebitoInmediato] OTP length unexpected: ${String(dto.otp).length}`,
        )
      }

      // Calculamos dos variantes de firma para compatibilidad con el gateway:
      // 1) Firma histórica usada por Debito Inmediato (secretKey)
      const authorizationSecret = this.generateImmediateDebitHash(
        dto.bankCode,
        normalizedNationalId,
        normalizedPhone,
        formattedAmount,
        String(dto.otp || ''),
        context.secretKey,
      )

      // 2) Firma construida con la misma lógica que Generar OTP (commerceKey)
      //    Esto es: HMAC_SHA256(concatenacion bankId + amount + phone + id, commerceKey)
      // La documentación exige estrictamente este orden: Banco + Cedula + Telefono + Monto + OTP
      const stringToSign = `${dto.bankCode}${normalizedNationalId}${normalizedPhone}${formattedAmount}${dto.otp}`

      this.logger.debug(
        `[R4][DebitoInmediato] String a cifrar: ${stringToSign}`,
      )

      // Generamos el hash con la llave secreta
      const authorization = crypto
        .createHmac('sha256', context.commerceKey)
        .update(stringToSign)
        .digest('hex')

      // (Opcional) Si prefieres usar tu método abstracto, asegúrate de que internamente haga exactamente lo de arriba:
      // const authorization = this.generateImmediateDebitHash(...)
      const payload = {
        Banco: dto.bankCode,
        Monto: formattedAmount,
        Telefono: normalizedPhone,
        Cedula: normalizedNationalId,
        Nombre: dto.fullName,
        OTP: dto.otp,
        Concepto: dto.concept,
      }

      this.logger.debug(`[R4][DebitoInmediato] Endpoint: ${endpoint}`)
      this.logger.debug(
        `[R4][DebitoInmediato] Request payload: ${JSON.stringify(payload)}`,
      )
      this.logger.debug(
        `[R4][DebitoInmediato] Request headers: ${JSON.stringify({
          Commerce: context.commerceKey,
          Authorization: authorization,
        })}`,
      )

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: context.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      this.logger.debug(
        `[R4][DebitoInmediato] HTTP status: ${response.status} - Response body: ${JSON.stringify(
          response.data,
        )}`,
      )

      if (response.status !== HttpStatus.OK && response.status !== HttpStatus.ACCEPTED) {
        throw new InternalServerErrorException(
          'Respuesta HTTP invalida de Banco R4',
        )
      }

      const code = String(response.data?.code ?? '')
      const message =
        response.data?.message ||
        response.data?.mensaje ||
        'Respuesta invalida de Banco R4'

      // Caso: operacion aceptada y completada
      if (code === 'ACCP') {
        return {
          code,
          message,
          reference: String(response.data?.reference ?? ''),
          id: String(response.data?.id ?? ''),
          rawResponse: response.data,
        }
      }

      // Caso: operación en espera (AC00) — persistir pago pendiente y generar referencia propia
      if (code === 'AC00') {
        try {
          const vesCurrency = await this.requireVesCurrency()

          const payment = new Payment()

          // Guardamos datos del ordenante
          this.setExternalDocumentAsSource(payment, normalizedNationalId)

          payment.externalSourcePhone = normalizedPhone || null
          payment.externalSourceBankCode = dto.bankCode || null
          payment.externalSourceAccount = null

          // Generamos referencia propia para exponer al usuario
          const generatedRef = `${Date.now().toString().slice(-8)}`

          payment.amountBs = amountValue
          payment.amountUsd = 0
          payment.reference = generatedRef
          payment.billingId = String(response.data?.id ?? generatedRef)
          payment.internalSourceAccount = null
          payment.internalDestinationAccount = context.account
          payment.externalDestBankCode = null
          payment.externalDestAccount = null
          payment.externalDestPhone = null
          payment.externalDestDocType = null
          payment.externalDestDoc = null
          payment.payerUserId = null
          payment.payerName = dto.fullName || null
          payment.enterpriseId = null
          payment.paymentStatusId = 2 // pendiente
          payment.paymentMethodId = 4
          payment.paymentTypeId = 3
          payment.paymentDate = new Date()
          payment.currency = vesCurrency

          const saved = await this.paymentRepository.save(payment)

          this.logger.log(
            `[R4][DebitoInmediato] Pago pendiente registrado internamente (id=${saved.id}, reference=${generatedRef})`,
          )

          return {
            code,
            message,
            reference: generatedRef,
            id: String(response.data?.id ?? ''),
            rawResponse: response.data,
          }
        } catch (persistError) {
          this.logger.error(
            'Error al persistir pago pendiente R4',
            persistError as Error,
          )
          // Si falla persistencia, aún devolvemos la info del banco para diagnóstico
          return {
            code,
            message,
            reference: String(response.data?.reference ?? ''),
            id: String(response.data?.id ?? ''),
            rawResponse: response.data,
          }
        }
      }

      // Otros códigos -> error
      throw new BadRequestException(message)
    } catch (error) {
      this.logger.error(
        `Error en Debito Inmediato R4: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )

      if (error.config) {
        try {
          this.logger.error(
            `[AXIOS REQUEST] Metodo: ${error.config.method?.toUpperCase()}`,
          )
          this.logger.error(`[AXIOS REQUEST] URL: ${error.config.url}`)
          this.logger.error(
            `[AXIOS REQUEST] Headers: ${JSON.stringify(
              error.config.headers,
              null,
              2,
            )}`,
          )
          this.logger.error(
            `[AXIOS REQUEST] Data: ${JSON.stringify(error.config.data)}`,
          )
        } catch (e) {
          this.logger.error('Error al loggear la request Axios', e as Error)
        }
      }

      if (error.response) {
        const resp = error.response
        this.logger.error(`Status HTTP: ${resp.status}`)
        this.logger.error(`Headers recibidos: ${JSON.stringify(resp.headers)}`)
        this.logger.error(`Body recibido: ${JSON.stringify(resp.data)}`)
      }

      this.mapDirectDebitError(
        error,
        'Error procesando Debito Inmediato en Banco R4',
      )
    }
  }

  /**
   * Procesa una solicitud de Vuelto en Banco R4.
   * Obtiene la referencia y estado de la transacción de vuelto en la red interbancaria.
   *
   * @see https://r4conecta.mibanco.com.ve/MBvuelto
   */
  async r4ProcessVuelto(dto: VueltoRequestDto): Promise<VueltoResponseDto> {
    try {
      const context = await this.getR4Context(dto.companyAccountId)

      if (!context.commerceKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const endpoint = `${this.BASE_URL}/MBvuelto`

      // Normalizar datos
      const normalizedPhone = String(dto.TelefonoDestino || '')
        .trim()
        .replace(/\D/g, '')
      const normalizedCedula = String(dto.Cedula || '')
        .trim()
        .toUpperCase()
      const normalizedBanco = String(dto.Banco || '')
        .trim()
      const normalizedMonto = String(dto.Monto || '').trim()
      const normalizedIp = dto.Ip?.trim() || '0.0.0.0'

      // Generar hash HMAC-SHA256 de "TelefonoDestino + Monto + Banco + Cedula"
      const stringToSign = `${normalizedPhone}${normalizedMonto}${normalizedBanco}${normalizedCedula}`
      const authorization = crypto
        .createHmac('sha256', context.commerceKey)
        .update(stringToSign)
        .digest('hex')

      const payload: Record<string, string> = {
        TelefonoDestino: normalizedPhone,
        Cedula: normalizedCedula,
        Banco: normalizedBanco,
        Monto: normalizedMonto,
      }

      // Agregar campos opcionales solo si están presentes
      if (dto.Concepto) {
        payload.Concepto = String(dto.Concepto).substring(0, 30)
      }
      if (dto.Ip) {
        payload.Ip = normalizedIp
      }

      this.logger.debug(`[R4][Vuelto] Endpoint: ${endpoint}`)
      this.logger.debug(
        `[R4][Vuelto] Request payload: ${JSON.stringify(payload)}`,
      )
      this.logger.debug(
        `[R4][Vuelto] Request headers: ${JSON.stringify({
          Commerce: context.commerceKey,
          Authorization: authorization,
        })}`,
      )

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: context.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      this.logger.debug(
        `[R4][Vuelto] HTTP status: ${response.status} - Response body: ${JSON.stringify(
          response.data,
        )}`,
      )

      if (response.status !== HttpStatus.OK && response.status !== HttpStatus.ACCEPTED) {
        throw new InternalServerErrorException(
          'Respuesta HTTP inválida de Banco R4',
        )
      }

      const code = String(response.data?.code ?? '')
      const message =
        response.data?.message ||
        response.data?.mensaje ||
        'Respuesta inválida de Banco R4'

      // Transacción exitosa (código "00")
      if (code === '00') {
        return {
          code,
          message,
          reference: String(response.data?.reference ?? ''),
          rawResponse: response.data,
        }
      }

      // Códigos de error conocidos - devolver como respuesta exitosa pero con código de error
      // Estos no lanzan excepción, se devuelven para que el cliente maneje la lógica
      const knownErrorCodes = ['08', '14', '51', '55', '56', '80']
      if (knownErrorCodes.includes(code)) {
        this.logger.warn(
          `[R4][Vuelto] Código de respuesta conocido: ${code} - ${message}`,
        )
        return {
          code,
          message,
          reference: undefined,
          rawResponse: response.data,
        }
      }

      // Código desconocido -> error
      throw new BadRequestException(message)
    } catch (error) {
      this.logger.error(
        `Error en Vuelto R4: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )

      if (error.config) {
        try {
          this.logger.error(
            `[AXIOS REQUEST] Método: ${error.config.method?.toUpperCase()}`,
          )
          this.logger.error(`[AXIOS REQUEST] URL: ${error.config.url}`)
          this.logger.error(
            `[AXIOS REQUEST] Headers: ${JSON.stringify(error.config.headers)}`,
          )
          this.logger.error(
            `[AXIOS REQUEST] Data: ${JSON.stringify(error.config.data)}`,
          )
        } catch (e) {
          this.logger.error('Error al loggear la request Axios', e as Error)
        }
      }

      if (error.response) {
        const resp = error.response
        this.logger.error(`Status HTTP: ${resp.status}`)
        this.logger.error(`Body recibido: ${JSON.stringify(resp.data)}`)
      }

      // Re-lanzar excepciones de NestJS tal cual
      if (error instanceof HttpException) {
        throw error
      }

      throw new InternalServerErrorException(
        `Error procesando Vuelto en Banco R4: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  async r4ProcessImmediateCredit(
    dto: ImmediateCreditRequestDto,
  ): Promise<ImmediateCreditResponseDto> {
    try {
      const context = await this.getR4Context(dto.companyAccountId)

      if (!context.commerceKey || !this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      const endpoint = `${this.BASE_URL}/CreditoInmediato`
      const amountValue = Number(dto.amount)

      if (Number.isNaN(amountValue) || amountValue <= 0) {
        throw new BadRequestException('Monto invalido para Credito Inmediato')
      }

      const formattedAmount = amountValue.toFixed(2)
      const normalizedNationalId = String(dto.nationalId || '')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
      const normalizedPhone = String(dto.phoneNumber || '')
        .trim()
        .replace(/\D/g, '')

      const authorization = this.generateImmediateCreditHash(
        dto.bankCode,
        normalizedNationalId,
        normalizedPhone,
        formattedAmount,
        context.commerceKey,
      )

      const payload = {
        Banco: dto.bankCode,
        Cedula: normalizedNationalId,
        Telefono: normalizedPhone,
        Monto: formattedAmount,
        Concepto: dto.concept,
      }

      this.logger.debug(`[R4][CreditoInmediato] Endpoint: ${endpoint}`)
      this.logger.debug(
        `[R4][CreditoInmediato] Request payload: ${JSON.stringify(payload)}`,
      )
      this.logger.debug(
        `[R4][CreditoInmediato] Request headers: ${JSON.stringify({
          Commerce: context.commerceKey,
          Authorization: authorization,
        })}`,
      )

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: context.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      this.logger.debug(
        `[R4][CreditoInmediato] HTTP status: ${response.status} - Response body: ${JSON.stringify(
          response.data,
        )}`,
      )

      if (response.status !== HttpStatus.OK && response.status !== HttpStatus.ACCEPTED) {
        throw new InternalServerErrorException(
          'Respuesta HTTP invalida de Banco R4',
        )
      }

      const code = String(response.data?.code ?? '')
      const message =
        response.data?.message ||
        response.data?.mensaje ||
        'Respuesta invalida de Banco R4'

      const bankReference = String(response.data?.reference || (response.data?.id ?? ''))
      const bankOperationId = String(response.data?.id ?? '')

      // Persistir Payment para trazabilidad
      try {
        const vesCurrency = await this.requireVesCurrency()

        const payment = new Payment()

        // Datos del beneficiario (destino externo)
        payment.externalDestBankCode = dto.bankCode || null
        payment.externalDestAccount = null
        payment.externalDestPhone = normalizedPhone || null
        payment.externalDestDocType = normalizedNationalId.match(/^[A-Z]/)
          ? normalizedNationalId[0]
          : null
        payment.externalDestDoc = normalizedNationalId.replace(/^[A-Z]/, '') || null

        // Origen interno (cuenta R4 del comercio)
        payment.internalSourceAccount = context.account ?? null
        payment.externalSourceBankCode = null
        payment.externalSourceAccount = null
        payment.externalSourcePhone = null
        payment.externalSourceDocType = null
        payment.externalSourceDoc = null

        payment.amountBs = amountValue
        payment.amountUsd = 0
        payment.reference = bankReference || null
        payment.billingId = bankOperationId || `${Date.now().toString().slice(-8)}`
        payment.internalDestinationAccount = null
        payment.payerUserId = null
        payment.payerName = dto.concept || null
        payment.enterpriseId = null
        payment.paymentStatusId = code === 'ACCP' ? 1 : 2
        payment.paymentMethodId = 5
        payment.paymentTypeId = 3
        payment.paymentDate = new Date()
        payment.currency = vesCurrency

        const saved = await this.paymentRepository.save(payment)

        this.logger.log(
          `[R4][CreditoInmediato] Pago registrado internamente (id=${saved.id}, reference=${bankReference})`,
        )

        return {
          code,
          message,
          reference: bankReference,
          id: bankOperationId,
          internalPaymentId: saved.id,
          rawResponse: response.data,
        }
      } catch (persistError) {
        this.logger.error(
          'Error al persistir pago de Credito Inmediato R4',
          persistError as Error,
        )
        return {
          code,
          message,
          reference: bankReference,
          id: bankOperationId,
          rawResponse: response.data,
        }
      }
    } catch (error) {
      this.logger.error(
        `Error en Credito Inmediato R4: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )

      this.mapDirectDebitError(
        error,
        'Error procesando Credito Inmediato en Banco R4',
      )
    }
  }

  /**
   * Consulta en R4 el estado de una operación usando su UUID bancario.
   * La autenticación exige HMAC-SHA256 del Id con la llave Commerce.
   */
  async r4ConsultOperations(
    data: QueryOperationGatewayRequest,
  ): Promise<QueryOperationGatewayResponse> {
    try {
      if (!this.BASE_URL) {
        throw new InternalServerErrorException(
          'Configuración incompleta de banco R4',
        )
      }

      if (!data.id?.trim()) {
        throw new BadRequestException('Id de operación bancario inválido')
      }

      const endpoint = `${this.BASE_URL}/ConsultarOperaciones`
      const payload = {
        Id: data.id.trim(),
      }

      const authorization = crypto
        .createHmac('sha256', data.commerceKey)
        .update(payload.Id)
        .digest('hex')

      this.logger.debug(`[R4][ConsultarOperaciones] Endpoint: ${endpoint}`)
      this.logger.debug(
        `[R4][ConsultarOperaciones] Request payload: ${JSON.stringify(payload)}`,
      )
      this.logger.debug(
        `[R4][ConsultarOperaciones] Request headers: ${JSON.stringify({
          Commerce: data.commerceKey,
          Authorization: authorization,
        })}`,
      )

      const response = await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
            Commerce: data.commerceKey,
            Authorization: authorization,
          },
        }),
      )

      this.logger.debug(
        `[R4][ConsultarOperaciones] HTTP status: ${response.status} - Response body: ${JSON.stringify(
          response.data,
        )}`,
      )

      const bankData = response.data || {}
      const code = String(bankData.code ?? '')
      const success = bankData.success === true

      return {
        code,
        reference: String(bankData.reference ?? ''),
        success,
        rawResponse: bankData,
      }
    } catch (error) {
      const errorPayload = error?.response?.data || error?.message || error

      this.logger.error(
        `[R4][ConsultarOperaciones] Error payload: ${JSON.stringify(errorPayload)}`,
      )

      if (error instanceof HttpException) {
        throw error
      }

      const bankMessage =
        error?.response?.data?.message ||
        error?.response?.data?.mensaje ||
        'Error consultando operación en Banco R4'

      throw new BadRequestException(bankMessage)
    }
  }

  async r4ConsultMobilePayment(
    dto: ConsultMobilePaymentR4Dto,
  ): Promise<ConsultMobilePaymentR4ResponseDto> {
    this.logger.debug(
      '[R4consulta][Gateway] Paso A: iniciando validaciones de negocio',
    )
    this.logger.debug(
      `[R4consulta][Gateway] Request recibido: ${JSON.stringify(dto)}`,
    )

    const isClientIdValid = /^\d{8,20}$/.test(
      String(dto.IdCliente || '').trim(),
    )
    const isMerchantPhoneValid = /^\d{11}$/.test(
      String(dto.TelefonoComercio || '').trim(),
    )

    if (!isClientIdValid) {
      this.logger.debug(
        '[R4consulta][Gateway] Cliente inválido: IdCliente no cumple formato esperado',
      )
      const response = { status: false }
      this.logger.debug(
        `[R4consulta][Gateway] Response: ${JSON.stringify(response)}`,
      )
      return response
    }

    if (!isMerchantPhoneValid) {
      this.logger.debug(
        '[R4consulta][Gateway] Teléfono de comercio inválido: TelefonoComercio no cumple 11 dígitos',
      )
      const response = { status: false }
      this.logger.debug(
        `[R4consulta][Gateway] Response: ${JSON.stringify(response)}`,
      )
      return response
    }

    if (
      dto.Monto !== undefined &&
      dto.Monto !== null &&
      String(dto.Monto).trim() !== ''
    ) {
      const amount = Number(dto.Monto)
      if (Number.isNaN(amount) || amount <= 0) {
        this.logger.debug(
          `[R4consulta][Gateway] Monto inválido recibido: ${dto.Monto}`,
        )
        const response = { status: false }
        this.logger.debug(
          `[R4consulta][Gateway] Response: ${JSON.stringify(response)}`,
        )
        return response
      }
    }

    this.logger.debug(
      '[R4consulta][Gateway] Paso B: validaciones completadas, pago aceptado',
    )
    const response = { status: true }
    this.logger.debug(
      `[R4consulta][Gateway] Response: ${JSON.stringify(response)}`,
    )
    return response
  }

  async r4ProcessMobilePaymentNotification(
    dto: MobilePaymentNotificationR4Dto,
  ): Promise<MobilePaymentNotificationR4ResponseDto> {
    this.logger.debug(
      '[R4notifica][Gateway] Paso A: iniciando procesamiento de notificación',
    )
    this.logger.debug(
      `[R4notifica][Gateway] Request recibido: ${JSON.stringify(dto)}`,
    )
    // Gateway only validates and normalizes data; persistence belongs to the use-case.
    try {
      // Basic validations
      if (!dto || !dto.Monto || !dto.FechaHora) {
        this.logger.debug(
          '[R4notifica][Gateway] Datos obligatorios faltantes (Monto o FechaHora)',
        )
        return { abono: false }
      }

      // Validate monto
      const amount = Number(dto.Monto)
      if (Number.isNaN(amount) || amount <= 0) {
        this.logger.debug(
          `[R4notifica][Gateway] Monto inválido recibido: ${dto.Monto}`,
        )
        return { abono: false }
      }

      // Validate fecha
      const date = new Date(dto.FechaHora)
      if (isNaN(date.getTime())) {
        this.logger.debug(
          `[R4notifica][Gateway] FechaHora inválida recibida: ${dto.FechaHora}`,
        )
        return { abono: false }
      }

      // All good — let the use-case persist
      this.logger.debug(
        '[R4notifica][Gateway] Validaciones completadas, remitiendo a use-case para persistencia',
      )
      return { abono: true }
    } catch (error) {
      this.logger.error(
        `[R4notifica][Gateway] Error procesando notificación: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      return { abono: false }
    }
  }

  async exteriorConsultSentPayments(
    data: ConsultSentPaymentsRequest,
  ): Promise<BancoExteriorApiResponse> {
    this.logger.debug(
      `[BancoExterior] exteriorConsultSentPayments - incoming request: ${JSON.stringify(
        {
          companyAccountId: data.companyAccountId,
          clientId: data.clientId,
          channelId: data.channelId,
          date: data.date,
          receiverPhone: data.receiverPhone,
          startPosition: data.startPosition,
        },
      )}`,
    )

    const context = await this.getExteriorContext(data.companyAccountId)

    // Corrección del Path: La versión va antes del recurso según la documentación
    const endpointPath = '/v1/consultas-pagos-enviados'

    const payload = {
      idCliente: context.clientId,
      idCanal: data.channelId,
      fecha: data.date, // El banco exige formato estricto DD/MM/AAAA
      telefonoReceptor: data.receiverPhone, // El banco exige formato 58XXXXXXXXXX
      posicionInicial: data.startPosition ?? 0, // Integer obligatorio, valor por defecto 0
    }

    this.logger.debug(
      `[BancoExterior] exteriorConsultSentPayments - sending to bank: endpoint=${endpointPath} payload=${JSON.stringify(
        payload,
      )}`,
    )

    return this.executeRequest(
      endpointPath,
      payload,
      'Consultas de Pagos Enviados',
      context,
    )
  }

  async exteriorValidateReceivedPayment(
    data: ValidateReceivedPaymentRequest,
  ): Promise<BancoExteriorApiResponse> {
    this.logger.debug(
      `[BancoExterior] exteriorValidateReceivedPayment - incoming request: ${JSON.stringify(
        {
          companyAccountId: data.companyAccountId,
          clientId: data.clientId,
          channelId: data.channelId,
          date: data.date,
          senderPhone: data.senderPhone,
        },
      )}`,
    )

    const context = await this.getExteriorContext(data.companyAccountId)

    // Corrección del Path: La versión 'v2' va antes del recurso según la documentación
    // Path documentado: /api/[env]/v2/validar-pago-recibido
    const endpointPath = '/v2/validar-pago-recibido'

    const payload = {
      id_cliente: context.clientId,
      id_canal: data.channelId,
      fecha: data.date, // El banco exige formato estricto DD/MM/AAAA
      telefono_emisor: data.senderPhone, // El banco exige formato 58XXXXXXXXXX
    }

    this.logger.debug(
      `[BancoExterior] exteriorValidateReceivedPayment - sending to bank: endpoint=${endpointPath} payload=${JSON.stringify(
        payload,
      )}`,
    )

    return this.executeRequest(
      endpointPath,
      payload,
      'Validar Pago Recibido',
      context,
    )
  }

  async exteriorRequestMakeMobilePaymentOAuthToken(
    context: ExteriorContext,
  ): Promise<string> {
    const oauthUrl = `${this.getBancoExteriorBaseUrl()}/v2/realizar-pago-movil/oauth2/token`

    const authJwt = this.buildBancoExteriorJwt(context)

    const requestPayload = {
      grant_type: 'client_credentials',
      client_id: context.clientId,
      client_secret: context.clientSecret,
    }

    this.logger.debug(
      `Solicitando token OAuth2 para Pago Móvil ${JSON.stringify(requestPayload)}`,
    )

    const requestHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authJwt}`,
      'X-API-Key': context.apiKey,
      api_key: context.apiKey,
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(oauthUrl, requestPayload, {
          headers: requestHeaders,
        }),
      )

      this.logger.debug(
        `Respuesta OAuth2 para Pago Móvil: ${JSON.stringify(response.data)}`,
      )

      const oauthToken = response?.data?.access_token ?? response?.data?.token
      if (!oauthToken) {
        throw new InternalServerErrorException(
          'Respuesta OAuth2 inválida: no se recibió access_token',
        )
      }

      return oauthToken
    } catch (error) {
      const bankResponse = error?.response?.data ?? null
      this.logger.error(
        `Error obteniendo OAuth2 Realizar Pago Móvil: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )
      throw error
    }
  }

  async exteriorMakeMobilePayment(
    data: MakeMobilePaymentRequest,
  ): Promise<BancoExteriorApiResponse> {
    const context = await this.getExteriorContext(data.companyAccountId)
    const authJwt = this.buildBancoExteriorJwt(context)
    const oauthToken =
      await this.exteriorRequestMakeMobilePaymentOAuthToken(context)
    const endpointUrl = `${this.getBancoExteriorBaseUrl()}/v2/realizar-pago-movil`

    this.logger.log(
      `[BancoExterior] makeMobilePayment start - idOperacion=${data.idOperacion} idCliente=${data.idCliente}`,
    )

    const datosAutorizados = this.buildAuthorizationJwt({
      telefonoEmisor: data.telefonoEmisor,
      cuentaEmisor: data.cuentaEmisor,
      idBeneficiario: data.idBeneficiario,
      telefonoBeneficiario: data.telefonoBeneficiario,
      moneda: data.moneda,
      monto: data.monto,
    })

    // Mostrar JWT firmado y su contenido decodificado (útil para soporte)
    try {
      this.logger.debug(
        `[BancoExterior] datosAutorizados (JWT): ${datosAutorizados}`,
      )
      const decoded = decode(datosAutorizados, { complete: true })
      this.logger.debug(
        `[BancoExterior] datosAutorizados decoded: ${JSON.stringify(decoded)}`,
      )
    } catch (err) {
      this.logger.error(
        '[BancoExterior] Error decodificando datosAutorizados JWT: ' +
          String(err),
      )
    }

    const payload = {
      ip: data.ip,
      idCliente: context.clientId,
      idCanal: data.idCanal,
      idOperacion: data.idOperacion,
      fechaOperacion: data.fechaOperacion,
      codigoBanco: data.codigoBanco,
      nombreBanco: data.nombreBanco,
      concepto: data.concepto,
      datosAutorizados,
      envioEmailEmisor: data.envioEmailEmisor,
      envioEmailBeneficiario: data.envioEmailBeneficiario,
    }

    // Preparar headers por separado para poder loguearlos (con máscara en valores sensibles)
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authJwt}`,
      'X-Authorization-OAuth2': oauthToken,
      'X-API-Key': context.apiKey,
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs de verificación
    this.logger.debug(`[BancoExterior] Endpoint URL: ${endpointUrl}`)
    this.logger.debug(
      `[BancoExterior] Request headers (masked): ${JSON.stringify({
        'Content-Type': headers['Content-Type'],
        Authorization: mask(headers.Authorization),
        'X-Authorization-OAuth2': mask(headers['X-Authorization-OAuth2']),
        'X-API-Key': mask(headers['X-API-Key']),
      })}`,
    )
    this.logger.debug(
      '[BancoExterior] Request payload (datosAutorizados included): ' +
        JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(endpointUrl, payload, { headers }),
      )

      this.logger.debug(
        '[BancoExterior] Response data: ' + JSON.stringify(response?.data),
      )

      return {
        success: true,
        message: 'Realizar Pago Móvil procesada exitosamente',
        data: response.data,
        rawResponse: response.data,
      }
    } catch (error) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en Realizar Pago Móvil: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      // Logear lo que se intentó enviar para facilitar debugging
      this.logger.debug(
        '[BancoExterior] Failed request payload: ' + JSON.stringify(payload),
      )
      this.logger.debug(
        '[BancoExterior] Failed request headers (masked): ' +
          JSON.stringify({
            Authorization: mask(headers.Authorization),
            'X-Authorization-OAuth2': mask(headers['X-Authorization-OAuth2']),
            'X-API-Key': mask(headers['X-API-Key']),
          }),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ??
            'Fallo la integración de Realizar Pago Móvil',
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  async exteriorRequestOtp(
    data: RequestOtpRequest,
  ): Promise<BancoExteriorApiResponse> {
    const context = await this.getExteriorContext(data.companyAccountId)
    const baseUrl = this.getBancoExteriorBaseUrl()

    // El doc tiene un error tipográfico con "//V2", usamos el estándar "/v2"
    const endpointPath = '/v2/otp/claves-pagos/creaciones'
    const url = `${baseUrl}${endpointPath}`

    const authJwt = this.buildBancoExteriorJwt(context)

    // Armado EXPLÍCITO y ESTRICTO del Payload según la documentación (pág. 16-18)
    const payload = {
      datosPeticion: {
        canal: data.datosPeticion.canal, // ej. "01"
        canalCore: data.datosPeticion.canalCore, // ej. "15" para Débito Inmediato
        idUsuario: data.datosPeticion.idUsuario,
        idTerminal: data.datosPeticion.idTerminal,
        IdConsumidor: data.datosPeticion.idConsumidor, // Ojo: La doc exige 'I' mayúscula aquí
        ip: data.datosPeticion.ip,
        codUsuario: data.datosPeticion.codUsuario,
        idSesion: data.datosPeticion.idSesion, // Obligatorio: YYYYMMddHHmmss (14 caracteres)
        idCliente: context.clientId, // Forzado desde las credenciales del contexto

        encabezado: {
          List: {
            bancoDebito: data.datosPeticion.encabezado.List.bancoDebito,
            bancoCredito: data.datosPeticion.encabezado.List.bancoCredito,
          },
        },

        datosOperacion: {
          instrumentoLocal: data.datosPeticion.datosOperacion.instrumentoLocal, // ej. "050"
          monto: {
            // Forzamos que sea un número flotante de 2 decimales para el BigDecimal
            montoOperacion: Number(
              data.datosPeticion.datosOperacion.monto.montoOperacion.toFixed(2),
            ),
            moneda: data.datosPeticion.datosOperacion.monto.moneda || 'VES',
          },
          cuentaDebito: {
            tipoInstrumento:
              data.datosPeticion.datosOperacion.cuentaDebito.tipoInstrumento, // CELE, CNTA, ALIS
            instrumento:
              data.datosPeticion.datosOperacion.cuentaDebito.instrumento,
          },
          deudor: {
            nombreEsquema:
              data.datosPeticion.datosOperacion.deudor.nombreEsquema, // SCID, SRIF, SPAS
            idCliente: data.datosPeticion.datosOperacion.deudor.idCliente,
          },
          acreedor: {
            nombreEsquema:
              data.datosPeticion.datosOperacion.acreedor.nombreEsquema, // SCID, SRIF, SPAS
            idCliente: data.datosPeticion.datosOperacion.acreedor.idCliente,
          },
          cuentaCredito: {
            tipoInstrumento:
              data.datosPeticion.datosOperacion.cuentaCredito.tipoInstrumento, // CELE, CNTA, ALIS
            instrumento:
              data.datosPeticion.datosOperacion.cuentaCredito.instrumento,
          },
        },
      },
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authJwt}`,
      'X-API-Key': context.apiKey,
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs estructurados para facilitar debug en caso de rechazo del payload
    this.logger.debug(`[BancoExterior] Solicitud OTP - URL: ${url}`)
    this.logger.debug(
      `[BancoExterior] Solicitud OTP - Headers (masked): ${JSON.stringify({
        'Content-Type': headers['Content-Type'],
        Authorization: mask(headers.Authorization),
        'X-API-Key': mask(headers['X-API-Key']),
      })}`,
    )
    this.logger.debug(
      '[BancoExterior] Solicitud OTP - Payload Final: ' +
        JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, { headers }),
      )

      const bankResponse = response?.data ?? {}
      this.logger.debug(
        '[BancoExterior] Solicitud OTP - Response: ' +
          JSON.stringify(bankResponse),
      )

      // Mapeo específico que habías definido
      const mappedData = {
        ...bankResponse,
        resultado: {
          codigo: String(bankResponse?.resultado?.codigo ?? ''),
          descripcion: String(bankResponse?.resultado?.descripcion ?? ''),
        },
      }

      return {
        success: true,
        message: 'Solicitud OTP procesada exitosamente',
        data: mappedData,
        rawResponse: bankResponse,
      }
    } catch (error: any) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en Solicitud OTP: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      this.logger.debug(
        '[BancoExterior] Failed Solicitud OTP payload: ' +
          JSON.stringify(payload),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ?? 'Fallo la integración de Solicitud OTP',
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  async exteriorRequestImmediateDebitOAuthToken(
    context: ExteriorContext,
  ): Promise<string> {
    const baseUrl = this.getBancoExteriorBaseUrl()
    // Corrección del Path según documentación
    const oauthUrl = `${baseUrl}/v1/debitoInmediato/enviar/oauth2/token`

    // Generamos el JWT, ¡faltaba enviarlo en los headers de esta petición!
    const authJwt = this.buildBancoExteriorJwt(context)

    const requestPayload = {
      grant_type: 'client_credentials',
      client_id: context.clientId,
      client_secret: context.clientSecret,
    }

    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json', // Añadido por buena práctica
      Authorization: `Bearer ${authJwt}`, // CRÍTICO: Faltaba en tu código original
      'X-API-Key': context.apiKey,
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(oauthUrl, requestPayload, {
          headers: requestHeaders,
        }),
      )

      const oauthToken = response?.data?.access_token ?? response?.data?.token
      if (!oauthToken) {
        throw new InternalServerErrorException(
          'Respuesta OAuth2 inválida: no se recibió access_token',
        )
      }

      return oauthToken
    } catch (error: any) {
      const bankResponse = error?.response?.data ?? null
      this.logger.error(
        `Error obteniendo OAuth2 para Débito Inmediato: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )
      throw error
    }
  }

  async exteriorExecuteImmediateDebit(
    data: ExecuteImmediateDebitRequest, // Asegúrate de que este DTO contenga las propiedades que mapeamos abajo
  ): Promise<BancoExteriorApiResponse> {
    const context = await this.getExteriorContext(data.companyAccountId)
    const authJwt = this.buildBancoExteriorJwt(context)
    const oauthToken =
      await this.exteriorRequestImmediateDebitOAuthToken(context)

    // Corrección del Path según documentación
    const endpointPath = '/v1/debitoInmediato/enviar'
    const endpointUrl = `${this.getBancoExteriorBaseUrl()}${endpointPath}`

    // Armado EXPLÍCITO y ESTRICTO del Payload
    const payload = {
      datosPeticion: {
        idCliente: context.clientId, // Forzado desde el contexto de credenciales
        idSesion: data.datosPeticion.idSesion,
        idCanal: Number(data.datosPeticion.idCanal), // La doc dice Integer
        idUsuario: data.datosPeticion.idUsuario,
        idTerminal: data.datosPeticion.idTerminal
          ? Number(data.datosPeticion.idTerminal)
          : undefined, // La doc dice Integer
        ipCliente: data.datosPeticion.ipCliente,
        idConsumidor: data.datosPeticion.idConsumidor,
        ipConsumidor: data.datosPeticion.ipConsumidor,
      },
      debitoInmediato: {
        cobrador: {
          nombre: data.debitoInmediato.cobrador.nombre,
          cuenta: data.debitoInmediato.cobrador.cuenta, // 20 dígitos
          telefono: data.debitoInmediato.cobrador.telefono, // 11 dígitos, ej. 04141234567
        },
        pagador: {
          pagadorId: data.debitoInmediato.pagador.pagadorId, // ej. V10000000
          nombre: data.debitoInmediato.pagador.nombre,
          cuenta: data.debitoInmediato.pagador.cuenta,
          telefono: data.debitoInmediato.pagador.telefono,
          bancoCodigo: data.debitoInmediato.pagador.bancoCodigo, // 4 dígitos
          otp: data.debitoInmediato.pagador.otp, // Clave OTP generada previamente (8 dígitos)
        },
        monto: Number(data.debitoInmediato.monto.toFixed(2)), // Double forzado
        concepto: data.debitoInmediato.concepto,
        notificar: Boolean(data.debitoInmediato.notificar), // Boolean
        subproducto: data.debitoInmediato.subproducto || '002', // Por defecto 002 (Clave de Pago)
      },
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authJwt}`,
      'X-Authorization-OAuth2': oauthToken,
      'X-API-Key': context.apiKey,
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs estructurados
    this.logger.debug(
      `[BancoExterior] Cobro Débito Inmediato - URL: ${endpointUrl}`,
    )
    this.logger.debug(
      `[BancoExterior] Cobro Débito Inmediato - Headers (masked): ${JSON.stringify(
        {
          'Content-Type': headers['Content-Type'],
          Authorization: mask(headers.Authorization),
          'X-Authorization-OAuth2': mask(headers['X-Authorization-OAuth2']),
          'X-API-Key': mask(headers['X-API-Key']),
        },
      )}`,
    )
    this.logger.debug(
      `[BancoExterior] Cobro Débito Inmediato - Payload: ` +
        JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(endpointUrl, payload, { headers }),
      )

      this.logger.debug(
        `[BancoExterior] Cobro Débito Inmediato - Response: ` +
          JSON.stringify(response?.data),
      )

      return {
        success: true,
        message: 'Cobro por Débito Inmediato procesado exitosamente',
        data: response.data,
        rawResponse: response.data,
      }
    } catch (error: any) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en Cobro Débito Inmediato: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      this.logger.debug(
        `[BancoExterior] Failed Cobro Débito Inmediato payload: ` +
          JSON.stringify(payload),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ??
            'Fallo la integración de Cobro por Débito Inmediato',
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  async exteriorRequestImmediateTransferOAuthToken(
    context: ExteriorContext,
  ): Promise<string> {
    const baseUrl = this.getBancoExteriorBaseUrl()
    // Corrección de Path: Se incluye la versión /v1 exigida por la documentación
    const oauthUrl = `${baseUrl}/v1/transferenciasInmediatas/enviar/oauth2/token`

    // CRÍTICO: Generamos el JWT, faltaba en la petición original
    const authJwt = this.buildBancoExteriorJwt(context)

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          oauthUrl,
          {
            grant_type: 'client_credentials',
            client_id: context.clientId,
            client_secret: context.clientSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${authJwt}`, // Añadido el JWT requerido
              'X-API-Key': context.apiKey,
            },
          },
        ),
      )

      const oauthToken = response?.data?.access_token ?? response?.data?.token
      if (!oauthToken) {
        throw new InternalServerErrorException(
          'Respuesta OAuth2 inválida: no se recibió access_token',
        )
      }

      return oauthToken
    } catch (error: any) {
      const bankResponse = error?.response?.data ?? null
      this.logger.error(
        `Error obteniendo OAuth2 para Transferencias Inmediatas: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )
      throw error
    }
  }

  async exteriorExecuteImmediateTransfer(
    data: ExecuteImmediateTransferRequest,
  ): Promise<BancoExteriorApiResponse> {
    const context = await this.getExteriorContext(data.companyAccountId)
    const authJwt = this.buildBancoExteriorJwt(context)
    const oauthToken =
      await this.exteriorRequestImmediateTransferOAuthToken(context)

    // Corrección de Path: Se incluye la versión /v1
    const endpointPath = '/v1/transferenciasInmediatas/enviar'
    const endpointUrl = `${this.getBancoExteriorBaseUrl()}${endpointPath}`

    // Armado EXPLÍCITO del Payload para garantizar los tipos y nombres de variables exactos
    const payload = {
      datosPeticion: {
        idCliente: context.clientId, // Forzado por seguridad desde credenciales
        idSesion: data.datosPeticion.idSesion, // aaaaMMddhhmmSSss (16 caracteres)
        idCanal: Number(data.datosPeticion.idCanal), // Integer obligatorio (1 o 2)
        idUsuario: data.datosPeticion.idUsuario,
        idTerminal: data.datosPeticion.idTerminal, // String(20) según doc
        IdConsumidor: data.datosPeticion.idConsumidor, // Atención a la 'I' mayúscula
      },
      transferenciaInmediata: {
        ctaPagadora: context.account?.accountNumber || data.transferenciaInmediata.ctaPagadora,
        ctaReceptora: data.transferenciaInmediata.ctaReceptora,
        codigobancoReceptor: data.transferenciaInmediata.codigobancoReceptor, // Atención a la 'b' minúscula
        telefonoReceptor: data.transferenciaInmediata.telefonoReceptor, // String(11) ej. 04146949977
        idReceptor: data.transferenciaInmediata.idReceptor, // Formato V000000000
        monto: Number(data.transferenciaInmediata.monto.toFixed(2)), // Double forzado
        moneda: data.transferenciaInmediata.moneda || 'VES',
        nombreBeneficiario: data.transferenciaInmediata.nombreBeneficiario,
        concepto: data.transferenciaInmediata.concepto,
      },
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authJwt}`,
      'X-Authorization-OAuth2': oauthToken, // Corregido: Faltaba el guion en tu código
      'X-API-Key': context.apiKey,
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs estructurados
    this.logger.debug(
      `[BancoExterior] Transferencia Inmediata - URL: ${endpointUrl}`,
    )
    this.logger.debug(
      `[BancoExterior] Transferencia Inmediata - Headers (masked): ${JSON.stringify(
        {
          'Content-Type': headers['Content-Type'],
          Authorization: mask(headers.Authorization),
          'X-Authorization-OAuth2': mask(headers['X-Authorization-OAuth2']),
          'X-API-Key': mask(headers['X-API-Key']),
        },
      )}`,
    )
    this.logger.debug(
      `[BancoExterior] Transferencia Inmediata - Payload: ` +
        JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(endpointUrl, payload, { headers }),
      )

      const bankResponse = response?.data ?? {}

      this.logger.debug(
        `[BancoExterior] Transferencia Inmediata - Response: ` +
          JSON.stringify(bankResponse),
      )

      // Mapeo solicitado
      const mappedData = {
        resultado: {
          codigo: String(bankResponse?.resultado?.codigo ?? ''),
          descripcion: String(bankResponse?.resultado?.descripcion ?? ''),
        },
        datosTransferenciainmediata: {
          referencia:
            bankResponse?.datosTransferenciainmediata?.referencia ?? null,
          fecha: bankResponse?.datosTransferenciainmediata?.fecha ?? null,
          estatus: bankResponse?.datosTransferenciainmediata?.estatus ?? null,
        },
      }

      return {
        success: true,
        message: 'Transferencia inmediata procesada exitosamente',
        data: mappedData,
        rawResponse: bankResponse,
      }
    } catch (error: any) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en Transferencias Inmediatas: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      this.logger.debug(
        `[BancoExterior] Failed Transferencias Inmediatas payload: ` +
          JSON.stringify(payload),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ??
            'Fallo la integración de Transferencias Inmediatas',
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  async exteriorQueryImmediateTransfer(
    data: QueryImmediateTransferRequest,
  ): Promise<BancoExteriorApiResponse> {
    const context = await this.getExteriorContext(data.companyAccountId)
    const authJwt = this.buildBancoExteriorJwt(context)

    // Corrección del Path: Se usa la v4 según documentación
    const endpointPath = '/v4/transaccionesInmediatas/consultas'
    const endpointUrl = `${this.getBancoExteriorBaseUrl()}${endpointPath}`

    // Extraemos los filtros (asumiendo que vienen en data.filtrosConsulta o directamente en data)
    const filtros = data.filtrosConsulta || (data as any)

    // Armado EXPLÍCITO del Payload
    // Los campos de filtrado van en la raíz, NO dentro de un objeto "filtrosConsulta"
    const payload = {
      datosPeticion: {
        idCliente: context.clientId,
        idSesion: data.datosPeticion.idSesion,
        idCanal: Number(data.datosPeticion.idCanal), // Integer
        idUsuario: data.datosPeticion.idUsuario,
        idTerminal: data.datosPeticion.idTerminal
          ? Number(data.datosPeticion.idTerminal)
          : undefined, // Integer
        ip: data.datosPeticion.ip,
        idConsumidor: data.datosPeticion.idConsumidor,
      },
      // Campos raíz obligatorios
      fecha: filtros.fecha, // Formato exigido: AAAA-MM-DD
      documentoContraparte: filtros.documentoContraparte,

      // Campos raíz opcionales
      referencia: filtros.referencia,
      cuenta: filtros.cuenta,
      telefonoContraparte: filtros.telefonoContraparte,
      tipoConsulta: filtros.tipoConsulta || 'C', // 'C' = Crédito, 'D' = Débito
      otroBanco:
        filtros.otroBanco !== undefined ? Boolean(filtros.otroBanco) : true,
      bancoContraparte: filtros.bancoContraparte,
      monto: filtros.monto
        ? Number(Number(filtros.monto).toFixed(2))
        : undefined, // Double
      posicionInicial:
        filtros.posicionInicial !== undefined
          ? Number(filtros.posicionInicial)
          : undefined, // Integer
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json', // Requerido por la doc
      Authorization: `Bearer ${authJwt}`,
      'X-API-Key': context.apiKey,
      // Nota: Este endpoint de consulta no requiere OAuth2
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs estructurados
    this.logger.debug(
      `[BancoExterior] Consulta Transacciones Inmediatas - URL: ${endpointUrl}`,
    )
    this.logger.debug(
      `[BancoExterior] Consulta Transacciones Inmediatas - Headers (masked): ${JSON.stringify(
        {
          'Content-Type': headers['Content-Type'],
          Authorization: mask(headers.Authorization),
          'X-API-Key': mask(headers['X-API-Key']),
        },
      )}`,
    )
    this.logger.debug(
      `[BancoExterior] Consulta Transacciones Inmediatas - Payload: ` +
        JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(endpointUrl, payload, { headers }),
      )

      const bankResponse = response?.data ?? {}
      this.logger.debug(
        `[BancoExterior] Consulta Transacciones Inmediatas - Response: ` +
          JSON.stringify(bankResponse),
      )

      // Corrección del mapeo de respuesta según documentación (bankResponse.datos.operaciones)
      const rawTransactions = bankResponse?.datos?.operaciones ?? []
      const transactionList = Array.isArray(rawTransactions)
        ? rawTransactions
        : [rawTransactions]

      const mappedData = {
        resultado: {
          codigo: String(
            bankResponse?.resultado?.codigo ?? response?.status ?? '',
          ),
          descripcion: String(
            bankResponse?.resultado?.descripcion ??
              'Consulta procesada exitosamente',
          ),
        },
        transacciones: transactionList.map((item: any) => ({
          referencia: item?.referencia ?? null,
          fecha: item?.fechaOperacion ?? item?.fechaContable ?? null,
          estatus: item?.status ?? null,
          monto: item?.monto ?? null,
          cuenta: item?.cuenta ?? item?.cuentaContraparte ?? null,
          signoOpr: item?.signoOpr ?? null,
          bancoContraparte: item?.bancoContraparte ?? null,
          concepto: item?.concepto ?? null,
          motivoRechazo: item?.motivoRechazo ?? null,
        })),
        cantidadRegistros:
          bankResponse?.datos?.cantidadRegistros ?? transactionList.length,
      }

      return {
        success: true,
        message: 'Consulta de transacciones inmediatas procesada exitosamente',
        data: mappedData,
        rawResponse: bankResponse,
      }
    } catch (error: any) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en Consulta de Transferencias Inmediatas: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      this.logger.debug(
        `[BancoExterior] Failed Consulta Transacciones Inmediatas payload: ` +
          JSON.stringify(payload),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ??
            'Fallo la integración de Consulta de Transferencias Inmediatas',
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  private buildBancoExteriorJwt(context: ExteriorContext): string {
    const issuer = process.env.BANCO_EXTERIOR_ISS
    const secretKey = context.masterKey

    if (!issuer || !secretKey) {
      throw new InternalServerErrorException(
        'No se pudieron resolver issuer/master key para Banco Exterior (issuer desde .env y master key desde credenciales activas).',
      )
    }

    // Expiración en 24 horas (como exige el manual)
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24

    const payload = {
      iss: issuer,
      exp: expiration,
    }

    // Convertimos la llave secreta desde Base64 (Comprobado matemáticamente)
    const secretBuffer = Buffer.from(secretKey, 'base64')

    // Firmamos usando HS256 y bloqueamos la inyección del timestamp (iat)
    return sign(payload, secretBuffer, {
      algorithm: 'HS256',
      noTimestamp: true,
    })
  }

  private getBancoExteriorBaseConfig() {
    const baseUrl = process.env.BANCO_EXTERIOR_API_URL

    if (!baseUrl) {
      throw new InternalServerErrorException(
        'Falta BANCO_EXTERIOR_API_URL para operar con Banco Exterior.',
      )
    }

    return { baseUrl }
  }

  private getBancoExteriorBaseUrl(): string {
    const { baseUrl } = this.getBancoExteriorBaseConfig()
    return baseUrl.replace(/\/v\d+\/?$/, '').replace(/\/$/, '')
  }

  private buildAuthorizationJwt(payload: {
    telefonoEmisor: string
    cuentaEmisor: string
    idBeneficiario: string
    telefonoBeneficiario: string
    moneda: string
    monto: number
  }): string {
    try {
      const privateKeyRaw = process.env.BANCO_EXTERIOR_PRIVATE_KEY
      if (!privateKeyRaw) {
        throw new InternalServerErrorException(
          'Falta BANCO_EXTERIOR_PRIVATE_KEY en entorno',
        )
      }
      const privateKey = privateKeyRaw.replaceAll(String.raw`\n`, '\n')

      // 1. Calculamos exp (máximo 3 minutos según manual)
      const expiration = Math.floor(Date.now() / 1000) + 3 * 60

      // 2. Construimos el payload EXACTO al manual
      const finalPayload = {
        telefonoEmisor: payload.telefonoEmisor,
        cuentaEmisor: payload.cuentaEmisor,
        idBeneficiario: payload.idBeneficiario,
        telefonoBeneficiario: payload.telefonoBeneficiario,
        moneda: payload.moneda,
        monto: Number(payload.monto.toFixed(2)), // Forzamos a que sea numérico con 2 decimales
        exp: expiration,
      }

      this.logger.debug(
        '[BancoExterior] Payload Final RS512: ' + JSON.stringify(finalPayload),
      )

      return sign(finalPayload, privateKey, {
        algorithm: 'RS512',
        noTimestamp: true, // Usamos nuestro propio 'exp' definido arriba
      })
    } catch (error: any) {
      this.logger.error(
        'Error firmando datosAutorizados:',
        error?.message || String(error),
      )
      throw new InternalServerErrorException('Error al generar la firma RSA')
    }
  }

  private async executeRequest(
    endpointPath: string,
    payload: Record<string, any>,
    operation: string,
    context: ExteriorContext,
  ): Promise<BancoExteriorApiResponse> {
    // Usamos getBancoExteriorBaseUrl() para evitar barras duplicadas
    const baseUrl = this.getBancoExteriorBaseUrl()
    const jwt = this.buildBancoExteriorJwt(context)
    const url = `${baseUrl}${endpointPath}`

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${jwt}`,
      'X-API-Key': context.apiKey,
    }

    const mask = (v?: string) => {
      if (!v) return ''
      if (v.length <= 8) return '********'
      return `${v.slice(0, 4)}...${v.slice(-4)}`
    }

    // Logs de verificación estandarizados
    this.logger.debug(`[BancoExterior] ${operation} - URL: ${url}`)
    this.logger.debug(
      `[BancoExterior] ${operation} - Headers (masked): ${JSON.stringify({
        'Content-Type': headers['Content-Type'],
        Authorization: mask(headers.Authorization),
        'X-API-Key': mask(headers['X-API-Key']),
      })}`,
    )
    this.logger.debug(
      `[BancoExterior] ${operation} - Payload: ` + JSON.stringify(payload),
    )

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, { headers }),
      )

      this.logger.debug(
        `[BancoExterior] ${operation} - Response: ` +
          JSON.stringify(response?.data),
      )

      return {
        success: true,
        message: `${operation} procesada exitosamente`,
        data: response.data,
        rawResponse: response.data,
      }
    } catch (error: any) {
      const statusCode = error?.response?.status ?? HttpStatus.BAD_GATEWAY
      const bankResponse = error?.response?.data ?? null

      this.logger.error(
        `Error Banco Exterior en ${operation}: ${JSON.stringify(bankResponse) || error.message}`,
        error?.stack,
      )

      this.logger.debug(
        `[BancoExterior] Failed ${operation} request payload: ` +
          JSON.stringify(payload),
      )

      throw new HttpException(
        {
          success: false,
          message:
            bankResponse?.message ?? `Fallo la integración de ${operation}`,
          data: bankResponse,
          rawResponse: bankResponse,
        },
        statusCode,
      )
    }
  }

  // END: Provider Logic In Repository

  private normalizeIp(ip?: string): string {
    if (!ip || ip === '::1') {
      return '127.0.0.1'
    }

    return ip
  }

  private resolveCompanyAccountId(companyAccountId?: string): string {
    const resolved =
      companyAccountId?.trim() ||
      process.env.PLAZA_DEFAULT_COMPANY_ACCOUNT_ID?.trim()

    if (!resolved) {
      throw new InternalServerErrorException(
        'Falta configurar PLAZA_DEFAULT_COMPANY_ACCOUNT_ID para operar con Banco Plaza.',
      )
    }

    return resolved
  }

  private resolveR4CompanyAccountId(
    companyAccountId?: string,
    useDefault = false,
  ): string {
    const resolved = companyAccountId?.trim()

    if (resolved) {
      return resolved
    }

    if (!useDefault) {
      throw new BadRequestException(
        'El campo companyAccountId es obligatorio para operar con Banco R4.',
      )
    }

    const defaultCompanyAccountId =
      process.env.R4_DEFAULT_COMPANY_ACCOUNT_ID?.trim()

    if (!defaultCompanyAccountId) {
      throw new InternalServerErrorException(
        'Falta configurar R4_DEFAULT_COMPANY_ACCOUNT_ID para endpoints publicos de Banco R4.',
      )
    }

    return defaultCompanyAccountId
  }

  private resolveMercantilCompanyAccountId(
    companyAccountId?: string,
    useDefault = false,
  ): string {
    const resolved = companyAccountId?.trim()

    if (resolved) {
      return resolved
    }

    if (!useDefault) {
      throw new BadRequestException(
        'El campo companyAccountId es obligatorio para operar con Banco Mercantil.',
      )
    }

    const defaultCompanyAccountId =
      process.env.MERCANTIL_DEFAULT_COMPANY_ACCOUNT_ID?.trim()

    if (!defaultCompanyAccountId) {
      throw new InternalServerErrorException(
        'Falta configurar MERCANTIL_DEFAULT_COMPANY_ACCOUNT_ID para endpoints publicos de Banco Mercantil.',
      )
    }

    return defaultCompanyAccountId
  }

  private resolveExteriorCompanyAccountId(companyAccountId?: string): string {
    const resolved = companyAccountId?.trim()

    if (!resolved) {
      throw new BadRequestException(
        'El campo companyAccountId es obligatorio para operar con Banco Exterior.',
      )
    }

    return resolved
  }

  private buildExteriorClientId(account: BankAccount): string {
    const documentType = (account.documentType || '').trim().toUpperCase()
    const documentNumber = (account.documentNumber || '')
      .replaceAll(/\s+/g, '')
      .replaceAll('-', '')

    if (!documentType || !documentNumber) {
      throw new InternalServerErrorException(
        'La cuenta no tiene datos de documento completos para operar con Banco Exterior.',
      )
    }

    return `${documentType}${documentNumber}`
  }

  private async getExteriorContext(
    companyAccountId?: string,
  ): Promise<ExteriorContext> {
    let resolvedCompanyAccountId = companyAccountId?.trim()
    let account: BankAccount | null = null
    let activeKey: ApiKey | null = null

    if (resolvedCompanyAccountId && resolvedCompanyAccountId !== 'GLOBAL_R4_FALLBACK') {
      try {
        account = await this.bankAccountRepository.findOne({
          where: { id: resolvedCompanyAccountId },
        })
        if (account) {
          activeKey = await this.apiKeyRepository.findOne({
            where: {
              bankAccount: { id: resolvedCompanyAccountId },
              isActive: true,
            },
            order: { createdAt: 'DESC' },
            relations: ['bankAccount'],
          })
        }
      } catch (e) {
        // Ignorar error al buscar cuenta específica para intentar con el fallback general
      }
    }

    // Si no se encontró la cuenta o no tiene credenciales activas, buscar CUALQUIER cuenta con credenciales activas para Banco Exterior
    if (!account || !activeKey) {
      const activeKeys = await this.apiKeyRepository.find({
        where: { isActive: true },
        relations: ['bankAccount', 'bankAccount.bank'],
        order: { createdAt: 'DESC' },
      })

      for (const key of activeKeys) {
        const bankAcc = key.bankAccount
        if (bankAcc && key.commerceKey && key.secretKey && key.extraKey) {
          const isExterior =
            (bankAcc.bank?.code === '0115') ||
            (bankAcc.accountNumber && bankAcc.accountNumber.startsWith('0115'))
          
          if (isExterior) {
            account = bankAcc
            activeKey = key
            resolvedCompanyAccountId = bankAcc.id
            break
          }
        }
      }

      // Si no hay ninguna con código/número Exterior pero hay alguna con 3 keys (común en Exterior), usarla
      if (!account || !activeKey) {
        for (const key of activeKeys) {
          const bankAcc = key.bankAccount
          if (bankAcc && key.commerceKey && key.secretKey && key.extraKey) {
            account = bankAcc
            activeKey = key
            resolvedCompanyAccountId = bankAcc.id
            break
          }
        }
      }
    }

    let decryptedApiKey: string | null = null
    let decryptedClientSecret: string | null = null
    let decryptedMasterKey: string | null = null

    if (account && activeKey?.commerceKey && activeKey?.secretKey && activeKey?.extraKey) {
      decryptedApiKey = ApiKeyCipher.decryptIfEncrypted(activeKey.commerceKey)
      decryptedClientSecret = ApiKeyCipher.decryptIfEncrypted(activeKey.secretKey)
      decryptedMasterKey = ApiKeyCipher.decryptIfEncrypted(activeKey.extraKey)
    }

    // Fallback a variables de entorno si no hay credenciales en BD
    if (!decryptedApiKey || !decryptedClientSecret || !decryptedMasterKey) {
      const envApiKey = process.env.EXTERIOR_API_KEY?.trim()
      const envClientSecret = process.env.EXTERIOR_CLIENT_SECRET?.trim()
      const envMasterKey = process.env.EXTERIOR_MASTER_KEY?.trim()

      if (!envApiKey || !envClientSecret || !envMasterKey) {
        throw new InternalServerErrorException(
          'No hay credenciales activas completas para Banco Exterior ni variables de entorno EXTERIOR_API_KEY / EXTERIOR_CLIENT_SECRET / EXTERIOR_MASTER_KEY configuradas.',
        )
      }

      decryptedApiKey = envApiKey
      decryptedClientSecret = envClientSecret
      decryptedMasterKey = envMasterKey
    }

    return {
      companyAccountId: resolvedCompanyAccountId!,
      account,
      apiKey: decryptedApiKey,
      clientSecret: decryptedClientSecret,
      masterKey: decryptedMasterKey,
      clientId: account ? this.buildExteriorClientId(account) : '',
    }
  }

  private async getR4Context(
    companyAccountId?: string,
    useDefault = false,
  ): Promise<R4Context> {
    let resolvedCompanyAccountId = 'GLOBAL_R4_FALLBACK'
    let account: BankAccount | undefined = undefined
    let decryptedCommerceKey: string | null = null
    let decryptedSecretKey: string | null = null

    try {
      resolvedCompanyAccountId = this.resolveR4CompanyAccountId(
        companyAccountId,
        useDefault,
      )

      const foundAccount = await this.bankAccountRepository.findOne({
        where: { id: resolvedCompanyAccountId },
      })

      if (foundAccount) {
        account = foundAccount
        const activeKey = await this.apiKeyRepository.findOne({
          where: {
            bankAccount: { id: resolvedCompanyAccountId },
            isActive: true,
          },
          order: { createdAt: 'DESC' },
          relations: ['bankAccount'],
        })

        if (activeKey?.commerceKey && activeKey?.secretKey) {
          decryptedCommerceKey = ApiKeyCipher.decryptIfEncrypted(
            activeKey.commerceKey,
          )
          decryptedSecretKey = ApiKeyCipher.decryptIfEncrypted(
            activeKey.secretKey,
          )
        }
      }
    } catch {
      // Ignorar errores de resolución o de búsqueda para caer en el fallback
    }

    // Fallback: Si no se consiguieron en la DB, usar las variables de entorno globales
    if (!decryptedCommerceKey || !decryptedSecretKey) {
      const envCommerceKey = process.env.R4_COMMERCE_KEY || process.env.R4_COMMERCE_KEY_QA
      const envSecretKey = process.env.R4_SECRET_KEY || process.env.R4_SECRET_KEY_QA

      if (!envCommerceKey || !envSecretKey) {
        throw new InternalServerErrorException(
          'Configuración incompleta: No se encontró la cuenta de Banco R4 en la DB ni las credenciales R4_COMMERCE_KEY / R4_SECRET_KEY en las variables de entorno globales.',
        )
      }

      decryptedCommerceKey = envCommerceKey
      decryptedSecretKey = envSecretKey
    }

    return {
      companyAccountId: resolvedCompanyAccountId,
      account,
      commerceKey: decryptedCommerceKey,
      secretKey: decryptedSecretKey,
    }
  }

  private buildMercantilMerchantId(account: BankAccount): string {
    const documentType = (account.documentType || '').trim().toUpperCase()
    const documentNumber = (account.documentNumber || '').replace(/\s+/g, '')

    const merchantId = `${documentType}${documentNumber}`

    if (
      !documentType ||
      !documentNumber ||
      !/^([VEJPG])-?\d+$/i.test(merchantId)
    ) {
      throw new InternalServerErrorException(
        'La cuenta no tiene un documento valido para operar con Banco Mercantil.',
      )
    }

    return merchantId.replace(/-/g, '')
  }

  private buildMercantilMerchantMobile(account: BankAccount): string {
    const digits = String(account.phoneNumber || '').replace(/\D/g, '')

    if (!digits) {
      throw new InternalServerErrorException(
        'La cuenta no tiene telefono para operar con Banco Mercantil.',
      )
    }

    if (/^58\d{10}$/.test(digits)) {
      return digits
    }

    if (/^0\d{10}$/.test(digits)) {
      return `58${digits.slice(1)}`
    }

    if (/^\d{10}$/.test(digits)) {
      return `58${digits}`
    }

    throw new InternalServerErrorException(
      'El telefono de la cuenta no cumple el formato requerido por Banco Mercantil.',
    )
  }

  private async getMercantilContext(
    companyAccountId?: string,
    useDefault = false,
  ): Promise<MercantilContext> {
    const resolvedCompanyAccountId = this.resolveMercantilCompanyAccountId(
      companyAccountId,
      useDefault,
    )

    const account = await this.bankAccountRepository.findOne({
      where: { id: resolvedCompanyAccountId },
    })

    if (!account) {
      throw new NotFoundException(
        'No se encontro la cuenta indicada para Banco Mercantil.',
      )
    }

    const activeKey = await this.apiKeyRepository.findOne({
      where: {
        bankAccount: { id: resolvedCompanyAccountId },
        isActive: true,
      },
      order: { createdAt: 'DESC' },
      relations: ['bankAccount'],
    })

    let decryptedMasterKey: string | null = null
    let decryptedSecretKey: string | null = null
    let decryptedClientId: string | null = null

    if (activeKey?.commerceKey && activeKey?.secretKey && activeKey?.extraKey) {
      decryptedMasterKey = ApiKeyCipher.decryptIfEncrypted(activeKey.commerceKey)
      decryptedSecretKey = ApiKeyCipher.decryptIfEncrypted(activeKey.secretKey)
      decryptedClientId = ApiKeyCipher.decryptIfEncrypted(activeKey.extraKey)
    }

    // Fallback a variables de entorno si no hay credenciales en BD
    if (!decryptedMasterKey || !decryptedSecretKey || !decryptedClientId) {
      const envMasterKey = process.env.MERCANTIL_MASTER_KEY?.trim()
      const envSecretKey = process.env.MERCANTIL_SECRET_KEY?.trim()
      const envClientId = process.env.MERCANTIL_CLIENT_ID?.trim()

      if (!envMasterKey || !envSecretKey || !envClientId) {
        throw new InternalServerErrorException(
          'No hay credenciales activas completas para la cuenta indicada de Banco Mercantil ni variables de entorno MERCANTIL_MASTER_KEY / MERCANTIL_SECRET_KEY / MERCANTIL_CLIENT_ID configuradas.',
        )
      }

      decryptedMasterKey = envMasterKey
      decryptedSecretKey = envSecretKey
      decryptedClientId = envClientId
    }

    return {
      companyAccountId: resolvedCompanyAccountId,
      account,
      masterKey: decryptedMasterKey,
      secretKey: decryptedSecretKey,
      clientId: decryptedClientId,
      merchantId: this.buildMercantilMerchantId(account),
      merchantMobile: this.buildMercantilMerchantMobile(account),
    }
  }

  private async requireVesCurrency(): Promise<Currency> {
    const vesCurrency = await this.currencyRepository.findOne({
      where: { code: 'VES' },
    })
    if (!vesCurrency) {
      throw new InternalServerErrorException(
        'No se encontro la moneda VES en la base de datos.',
      )
    }

    return vesCurrency
  }

  private async getPlazaContext(
    companyAccountId?: string,
    withBank = false,
  ): Promise<PlazaContext> {
    let resolvedCompanyAccountId = 'PLAZA_ENV_FALLBACK';
    try {
      resolvedCompanyAccountId = this.resolveCompanyAccountId(companyAccountId);
      if (resolvedCompanyAccountId === 'GLOBAL_R4_FALLBACK') {
        resolvedCompanyAccountId = process.env.PLAZA_DEFAULT_COMPANY_ACCOUNT_ID?.trim() || 'PLAZA_ENV_FALLBACK';
      }
    } catch (e) {
      resolvedCompanyAccountId = process.env.PLAZA_DEFAULT_COMPANY_ACCOUNT_ID?.trim() || 'PLAZA_ENV_FALLBACK';
    }

    let account = await this.bankAccountRepository.findOne({
      where: { id: resolvedCompanyAccountId },
      relations: withBank ? ['bank'] : [],
    }).catch(() => null);

    // Fallback: Si no existe la cuenta en BD, crear un stub usando variables de entorno
    if (!account) {
      const envAccountNum = process.env.PLAZA_COMPANY_ACCOUNT_NUMBER;
      const envDocType = process.env.PLAZA_COMPANY_DOCUMENT_TYPE;
      const envDocNum = process.env.PLAZA_COMPANY_DOCUMENT_NUMBER;
      const envName = process.env.PLAZA_COMPANY_BUSINESS_NAME || 'Comercio Plaza';

      if (envAccountNum && envDocType && envDocNum) {
        account = {
          id: resolvedCompanyAccountId,
          accountNumber: envAccountNum,
          documentType: envDocType,
          documentNumber: envDocNum,
          businessName: envName,
          bank: {
            bankCode: envAccountNum.slice(0, 4),
            code: envAccountNum.slice(0, 4),
          } as any,
        } as BankAccount;
      }
    }

    if (!account) {
      throw new NotFoundException(
        'No se encontro la cuenta de Banco Plaza en Base de Datos ni en Variables de Entorno.',
      );
    }

    // Buscar API Key en BD
    const activeKey = await this.apiKeyRepository.findOne({
      where: {
        bankAccount: { id: resolvedCompanyAccountId },
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    }).catch(() => null);

    let decryptedCommerceKey: string | null = null;
    let decryptedSecretKey: string | null = null;

    if (activeKey?.commerceKey) {
      try {
        decryptedCommerceKey = ApiKeyCipher.decryptIfEncrypted(activeKey.commerceKey);
      } catch (e) {
        // Ignorar fallo de descifrado
      }
    }
    if (activeKey?.secretKey) {
      try {
        decryptedSecretKey = ApiKeyCipher.decryptIfEncrypted(activeKey.secretKey);
      } catch (e) {
        // Ignorar fallo de descifrado
      }
    }

    // Fallback: Si no hay credenciales en BD, usar variables de entorno de QA
    if (!decryptedCommerceKey || !decryptedSecretKey) {
      decryptedCommerceKey = process.env.PLAZA_API_KEY || process.env.PLAZA_COMMERCE_KEY || null;
      decryptedSecretKey = process.env.PLAZA_API_SECRET || process.env.PLAZA_SECRET_KEY || null;
    }

    if (!decryptedCommerceKey || !decryptedSecretKey) {
      throw new InternalServerErrorException(
        'No se encontraron credenciales de Banco Plaza (ni en Base de Datos ni en Variables de Entorno).',
      );
    }

    const documentType = (account.documentType || '').trim().toUpperCase();
    const documentNumber = (account.documentNumber || '').trim();
    const accountNumber = (account.accountNumber || '').trim();

    const vesCurrency = await this.requireVesCurrency();

    return {
      companyAccountId: resolvedCompanyAccountId,
      account,
      documentId: `${documentType}${documentNumber}`,
      accountNumber,
      apiKey: decryptedCommerceKey,
      apiSecret: decryptedSecretKey,
      vesCurrency,
    };
  }

  private buildInternalAccountStub(accountId?: string): BankAccount | null {
    if (!accountId) {
      return null
    }

    return { id: accountId } as BankAccount
  }

  private setExternalDocumentAsSource(
    payment: Payment,
    raw: string | null | undefined,
  ) {
    const cleaned = (raw || '').trim()

    if (cleaned.length > 1) {
      payment.externalSourceDocType = cleaned.charAt(0).toUpperCase()
      payment.externalSourceDoc = cleaned.slice(1)
      return
    }

    payment.externalSourceDocType = null
    payment.externalSourceDoc = null
  }

  private setExternalDocumentAsDestination(
    payment: Payment,
    raw: string | null | undefined,
  ) {
    const cleaned = (raw || '').trim()

    if (cleaned.length > 1) {
      payment.externalDestDocType = cleaned.charAt(0).toUpperCase()
      payment.externalDestDoc = cleaned.slice(1)
      return
    }

    payment.externalDestDocType = null
    payment.externalDestDoc = null
  }
}
