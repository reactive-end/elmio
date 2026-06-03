export interface LegacyTokenPayload {
  sub: string
  phone?: string
  role?: string
  iat?: number
  exp?: number
}

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
import { ImmediateCreditRequestDto } from '../../presentation/dtos/banco-r4/immediate-credit.dto'
import { ImmediateDebitRequestDto } from '../../presentation/dtos/banco-r4/immediate-debit.dto'
import { QueryOperationRequestDto } from '../../presentation/dtos/banco-r4/query-operation.dto'

// Las importaciones de banco-exterior se dejan como DTOs vacíos locales si no se migran
export interface ConsultSentPaymentsDto {}
export interface ValidateReceivedPaymentDto {}
export interface MakeMobilePaymentDto {}
export interface RequestOtpDto {}
export interface ExecuteImmediateDebitDto {}
export interface ExecuteImmediateTransferDto {}
export interface QueryImmediateTransferDto {}

export const PAYMENT_PROCESSOR_REPOSITORY = 'PAYMENT_PROCESSOR_REPOSITORY'

export interface PaymentProcessorRepositoryPort {
  debit(dto: InitiateDebitDto, ip?: string): Promise<any>
  checkStatus(dto: CheckStatusDto): Promise<any>
  sendMobilePayment(
    dto: SendMobilePaymentDto,
    user: LegacyTokenPayload,
  ): Promise<any>
  processCustomerMobilePayment(dto: CustomerMobilePaymentDto): Promise<any>
  getMobilePaymentHistory(dto: ConsultMobilePaymentDto): Promise<any>
  initiateTransfer(
    dto: InitiateTransferDto,
    user: LegacyTokenPayload,
  ): Promise<any>
  initiateCustomerTransfer(
    dto: CustomerTransferDto,
    user: LegacyTokenPayload,
  ): Promise<any>
  consultTransferStatus(dto: ConsultTransferStatusDto): Promise<any>
  requestToken(dto: RequestDebitTokenDto, ip?: string): Promise<any>
  initiateDirectDebit(dto: InitiateDirectDebitDto): Promise<any>
  checkSettlement(dto: CheckSettlementDto): Promise<any>

  processWebhook(provider: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>
  generateWebPaymentUrl(
    provider: string,
    dto: GenerateWebPaymentUrlRequest,
  ): Promise<any>
  processP2pPayment(request: InitiateP2pPaymentRequest): Promise<any>
  verifyC2pPayment(request: VerifyC2pPaymentRequest): Promise<any>

  getLastExchangeRate(companyAccountId?: string): Promise<any>
  getExchangeRate(dto: GetExchangeRateDto): Promise<any>
  generateOTP(dto: GenerateOtpDto): Promise<any>
  consultMobilePaymentR4(dto: ConsultMobilePaymentR4Dto): Promise<any>
  processMobilePaymentNotificationR4(
    dto: MobilePaymentNotificationR4Dto,
  ): Promise<any>
  processAccountDirectDebitR4(dto: AccountDirectDebitDto): Promise<any>
  processPhoneDirectDebitR4(dto: PhoneDirectDebitDto): Promise<any>
  processImmediateCreditR4(dto: ImmediateCreditRequestDto): Promise<any>
  processImmediateDebitR4(dto: ImmediateDebitRequestDto): Promise<any>
  queryOperationR4(dto: QueryOperationRequestDto): Promise<any>

  consultSentPayments(dto: ConsultSentPaymentsDto): Promise<any>
  validateReceivedPayment(dto: ValidateReceivedPaymentDto): Promise<any>
  makeMobilePayment(dto: MakeMobilePaymentDto): Promise<any>
  requestOtp(dto: RequestOtpDto): Promise<any>
  executeImmediateDebit(dto: ExecuteImmediateDebitDto): Promise<any>
  executeImmediateTransfer(dto: ExecuteImmediateTransferDto): Promise<any>
  queryImmediateTransfer(dto: QueryImmediateTransferDto): Promise<any>
}

/**
 * Datos necesarios para iniciar un pago.
 */
export interface InitiatePaymentRequest {
  /** Id interno de la cuenta de empresa (destino en débito/token; origen en otros flujos). */
  companyAccountId?: string
  amount: number
  concept: string
  /** Identificación del pagador (p. ej. cédula o RUC). */
  payerId: string
  /** Nombre completo del pagador (se enviará al banco). */
  payerName: string
  /** Teléfono del pagador (opcional, para pagos móviles). */
  payerPhone?: string
  /** Cuenta del pagador (opcional, para débito a cuenta). */
  payerAccount?: string
  /** Código del banco del pagador (ej. "0134"). */
  payerBankCode: string
  ipAddress: string
  /** Identificador del proveedor/pasarela a usar (ej. 'banco_plaza'). */
  provider: string
  /** Indica si el pago fue iniciado por el cliente (true) o es un débito automático (false). */
  isCustomerInitiated?: boolean

  token?: string // El Token_p de 8 dígitos
  validationType?: 'C' | 'T' // C: Cuenta, T: Teléfono

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
  gatewayCurrencyId?: string
}

/**
 * Resumen de la respuesta devuelta por una estrategia de pago.
 */
export interface PaymentResponse {
  success: boolean
  reference: string
  /** Identificador externo proporcionado por el banco (endtoend). */
  externalId: string
  rawResponse: any
}

/**
 * Datos normalizados para iniciar un cobro por domiciliacion (Debito Inmediato CCE).
 */
export interface DirectDebitRequest {
  /** Monto a cobrar en VES. */
  amount: number
  /** Concepto de la operacion. */
  concept: string
  /** Codigo bancario del pagador (ej. 0105). */
  payerBankCode: string
  /** Cuenta del pagador (20 digitos). */
  payerAccount: string
  /** Documento del pagador (ej. V12345678). */
  payerDocument: string
  /** Nombre del pagador. */
  payerName: string
  /** Identificador del contrato de domiciliacion (max 15 chars). */
  contratoId: string
  /** Fecha del contrato en formato YYYY-MM-DD. */
  fechaContrato: string
  /** IP del cliente para auditoria. */
  userIp: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
  gatewayCurrencyCode?: string
}

/**
 * Resultado normalizado al iniciar una domiciliacion.
 */
export interface DirectDebitResponse {
  success: boolean
  /** Referencia principal devuelta por el banco para rastreo. */
  reference: string
  /** Codigo de estado de negocio reportado por el banco. */
  bankCode: string
  /** Mensaje legible de la pasarela. */
  message: string
  rawResponse: any
}

/**
 * Solicitud normalizada para consultar liquidacion de domiciliacion.
 */
export interface CheckSettlementRequest {
  /** Referencia de la domiciliacion a consultar. */
  reference: string
  /** Id de transaccion del banco (persistido en billingId). */
  transactionId?: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
  userIp?: string
}

/**
 * Resultado normalizado de la consulta de liquidacion.
 */
export interface SettlementStatusResponse {
  /** Verdadero cuando la liquidacion fue aprobada (0000). */
  isApproved: boolean
  /** Codigo devuelto por la pasarela/banco. */
  status: string
  /** Mensaje legible para el cliente/sistema. */
  message: string
  rawResponse: any
}

/**
 * DTO de entrada para consultas de estado de transacción.
 */
export interface CheckTransactionRequest {
  /** Identificador que devuelve el banco cuando se inició el pago. */
  endToEndId: string
  /** Referencia del pago, si está disponible. */
  reference: string
  /** Monto exacto de la operación. */
  amount: number

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
}

/**
 * Respuesta de estado de transacción devuelta por las estrategias.
 */
export interface TransactionStatusResponse {
  /** Verdadero cuando la transacción fue aprobada/cobrada exitosamente. */
  isApproved: boolean
  /** Código de estado crudo del banco (p. ej. '0000'). */
  status: string
  /** Mensaje legible proporcionado por el banco. */
  message: string
  rawResponse: any
}

// Datos normalizados para el uso interno (pago móvil)
/**
 * Datos normalizados para iniciar un pago móvil.
 *
 * Estos campos ya están adaptados a un formato común que usan las
 * estrategias de pago para realizar la operación.
 */
export interface MobilePaymentRequest {
  /** Código del banco destino (ej. '0102'). */
  destinationBankCode: string
  /** Identificación del beneficiario (Cédula/RIF). */
  destinationId: string
  /** Teléfono del beneficiario (ej. '4141234567'). */
  destinationPhone: string
  /** Teléfono desde el que se origina el pago. */
  sourcePhone: string
  /** Monto a transferir. */
  amount: number
  /** Concepto o descripción del pago. */
  concept: string
  /** IP usada para auditoría. */
  ip: string
  /** Latitud para auditoría/geo (opcional si no aplica). */
  latitude: string
  /** Longitud para auditoría/geo (opcional si no aplica). */
  longitude: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
}

/**
 * Resultado normalizado devuelto por la estrategia tras intentar
 * enviar un pago móvil.
 */
export interface MobilePaymentResponse {
  /** Verdadero si la operación fue exitosa. */
  success: boolean
  /** Referencia interna o de negocio asociada al pago. */
  reference: string
  /** Mensaje legible con estado o descripción adicional. */
  message: string
  /** Respuesta cruda original proporcionada por la pasarela/banco. */
  rawResponse: any
}

/**
 * Datos normalizados para pago movil iniciados por el cliente.
 *
 * Se usan cuando la operación la inicia el cliente (Customer -> Merchant)
 * y la estrategia necesita campos mínimos para procesar el pago.
 */
export interface CustomerPaymentRequest {
  /** Identificador del cliente (Cédula/RIF). */
  payerId: string
  /** Teléfono del cliente (se usará como afiliado/remitente). */
  payerPhone: string
  /** Monto a transferir. */
  amount: number
  /** Concepto o descripción del pago. */
  concept: string
  /** IP para auditoría. */
  ip: string
  /** Latitud para auditoría/geo. */
  latitude: string
  /** Longitud para auditoría/geo. */
  longitude: string
}

/**
 * Filtros opcionales para consultar pagos móviles.
 *
 * - `dateStart`: Fecha inicial (campo 'fi').
 * - `dateEnd`: Fecha final (campo 'ff').
 * - `phone`: Teléfono (campo 'tlfa').
 * - `action`: Tipo de acción (campo 'acc'). Valores: 0=Entrante, 1=Saliente, 2=All.
 * - `reference`: Referencia opcional.
 */
export interface ConsultMobilePaymentFilters {
  /** Fecha inicial (campo 'fi'). */
  dateStart?: string
  /** Fecha final (campo 'ff'). */
  dateEnd?: string
  /** Teléfono (campo 'tlfa'). */
  phone?: string
  /** Tipo de acción: 0=Entrante, 1=Saliente, 2=All (campo 'acc'). */
  action?: number
  /** Referencia opcional. */
  reference?: string
}

/**
 * Datos de entrada para consultar el historial de pagos móviles de un cliente.
 */
export interface ConsultMobilePaymentRequest {
  /** RIF o cédula del cliente cuyo historial se consulta. */
  payerId: string
  /** Filtros opcionales aplicables a la consulta. */
  filters?: ConsultMobilePaymentFilters

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
}

/**
 * Representa un pago individual dentro del historial devuelto por la pasarela.
 */
export interface MobilePaymentHistoryItem {
  /** Tipo de acción (ej. 'R' para recibido/realizado). */
  action: string
  /** Código del banco asociado al pago (ej. '0102'). */
  bankCode: string
  /** Teléfono del cliente asociado al pago. */
  clientPhone: string
  /** Teléfono afiliado/remitente del pago. */
  affiliatePhone: string
  /** Monto de la operación. */
  amount: number
  /** Fecha de la operación (formato dependiente de la pasarela). */
  date: string
  /** Hora de la operación. */
  time: string
  /** Referencia asociada al pago. */
  reference: string
  /** Concepto o descripción del pago. */
  concept: string
}

/**
 * Respuesta completa devuelta al consultar el historial de pagos móviles.
 */
export interface MobilePaymentHistoryResponse {
  /** Número total de registros devueltos. */
  count: number
  /** Lista de pagos normalizados. */
  payments: MobilePaymentHistoryItem[]
  /** Respuesta cruda original proporcionada por la pasarela/banco. */
  rawResponse: any
}

/**
 * Datos normalizados para iniciar una transferencia.
 *
 * Estos campos representan la forma común que usan las estrategias
 * para enviar una transferencia a un proveedor/banco.
 */
export interface TransferRequest {
  /** Nombre del beneficiario */
  beneficiaryName: string
  /** Identificación del beneficiario (Cédula/RIF) */
  beneficiaryId: string
  /** Código del banco beneficiario (ej. '0102') */
  beneficiaryBankCode: string
  /** Monto a transferir */
  amount: number
  /** Concepto o descripción de la transferencia */
  concept: string
  /** IP usada para auditoría */
  ip: string
  /** Número de cuenta del beneficiario (opcional) */
  beneficiaryAccount?: string
  /** Teléfono del beneficiario (opcional) */
  beneficiaryPhone?: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
  gatewayCompanyName?: string
  gatewayCompanyBankCode?: string
  gatewayCurrencyId?: string
  gatewayCurrencyCode?: string
}

/**
 * Resultado normalizado devuelto por la estrategia tras intentar
 * procesar una transferencia.
 */
export interface TransferResponse {
  /** Indica si la operación fue exitosa */
  success: boolean
  /** Referencia interna o de negocio asociada a la transferencia */
  reference: string
  /** Mensaje legible con estado o descripción adicional */
  message: string
  /** Respuesta cruda original proporcionada por la pasarela/banco */
  rawResponse: any
}

/**
 * Datos normalizados para una transferencia iniciada por un cliente.
 *
 * Se utiliza cuando el cliente paga desde su propia cuenta hacia la
 * empresa. Estos campos representan la forma común esperada por las
 * estrategias de pago.
 */
export interface CustomerTransferRequest {
  /** Nombre completo del pagador (cliente) */
  payerName: string
  /** Identificación del pagador (Cédula/RIF) */
  payerId: string
  /** Cuenta bancaria del pagador (formato según pasarela, ej. 20 dígitos) */
  payerAccount: string
  /** Monto a transferir */
  amount: number
  /** Concepto o descripción de la transferencia */
  concept: string
  /** IP usada para auditoría */
  ip: string

  /** Moneda resuelta desde BD (id de `currency` con code VES). */
  gatewayCurrencyId?: string
}

/**
 * Parámetros necesarios para consultar el estado de una transferencia.
 * Se usan para localizar la operación en la pasarela.
 */
export interface ConsultTransferStatusRequest {
  /** Identificador del originador usado en la URL (quien envió el dinero) */
  originatorId: string
  /** Cuenta de origen (normalmente 20 dígitos) */
  account: string
  /** Referencia proporcionada por el banco al realizar el pago */
  reference: string
  /** Monto exacto de la operación */
  amount: number
  /** Fecha de la operación en formato YYMMDD */
  date: string
  /** Canal o subcanal a usar en la consulta (ej. '23') */
  channel: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
}

/**
 * Resultado devuelto por una estrategia al consultar el estado
 * de una transferencia específica.
 */
export interface TransactionTransferStatusResponse {
  /** Verdadero si la transacción fue localizada y está en estado exitoso */
  isSuccess: boolean
  /** Mensaje legible con información sobre el estado */
  message: string
  /** Código de estado/cruce devuelto por el banco */
  bankCode: string
  /** Respuesta cruda original de la pasarela/banco */
  rawResponse: any
}

export enum DebitValidationType {
  CUENTA = 'C',
  TELEFONO = 'T',
}

export class RequestDebitTokenRequest {
  /** Id interno de la cuenta de empresa (destino en débito/token; origen en otros flujos). */
  companyAccountId: string
  /** Tipo de validación (`C` = cuenta, `T` = teléfono). */
  validationType: DebitValidationType
  /** Identificación del pagador (Cédula/RIF). */
  payerId: string
  /** Código del banco del pagador (ej. '0134'). */
  payerBankCode: string
  /** Monto solicitado para el token. */
  amount: number
  /** IP de origen para auditoría. */
  ipAddress?: string
  /** Cuenta del pagador (cuando aplica). */
  payerAccount?: string
  /** Teléfono del pagador (cuando aplica). */
  payerPhone?: string

  /** Credenciales/campos operativos resueltos desde BD para Banco Plaza. */
  gatewayApiKey?: string
  gatewayApiSecret?: string
  gatewayCompanyId?: string
  gatewayCompanyAccount?: string
  gatewayCurrencyId?: string
}

export interface DebitTokenResponse {
  /** Indica si la solicitud fue exitosa. */
  success: boolean
  /** Mensaje legible del banco o sistema. */
  message: string
  /** Código de estado devuelto por la pasarela/banco. */
  bankCode: string
  /** Respuesta cruda original del proveedor. */
  rawResponse: any
}

// BANCO MERCANTIL
/**
 * Interfaz para la solicitud entrante del webhook
 */
export interface WebhookNotificationDebitRequest {
  provider: string // ej: 'banco_mercantil'
  payload: {
    data: string // Aquí es donde viene el Base64 del banco
  } // El body crudo del request
}

/**
 * Respuesta que la estrategia devuelve para que el controlador la mande al banco
 */
export interface WebhookNotificationDebitResponse {
  statusCode: number
  responseBody: any
  decryptedData?: any
}

/**
 * Datos necesarios para generar la URL del botón de pagos web.
 */
export interface GenerateWebPaymentUrlRequest {
  companyAccountId: string
  amount: number
  concept: string
  payerId: string
  payerName: string
  provider: string // ej: 'banco_mercantil'
}

/**
 * Respuesta que devuelve la URL lista para redireccionar.
 */
export interface GenerateWebPaymentUrlResponse {
  paymentUrl: string
}

// BANCO  R4

export interface ExchangeRateRequest {
  companyAccountId: string
  date: string
  currency: string
}

export interface ExchangeRateResponse {
  success: boolean
  exchangeRate: number
}

export interface GenerateOtpRequest {
  companyAccountId: string
  bankCode: string
  amount: number
  phoneNumber: string
  nationalId: string
}

export interface GenerateOtpResponse {
  code: string
  message: string
  success: boolean
}

export interface QueryOperationRequest {
  companyAccountId: string
  reference: string
}

export interface QueryOperationGatewayRequest {
  id: string
  commerceKey: string
}

export interface QueryOperationGatewayResponse {
  code: string
  reference: string
  success: boolean
  rawResponse: any
}

export interface InitiateP2pPaymentRequest {
  companyAccountId: string
  provider: string
  amount: number
  payerId: string
  payerPhone: string
  payerBankCode: string
  ipAddress: string
}

export interface InitiateP2pPaymentResponse {
  success: boolean
  reference: string
  message: string
  rawResponse?: any // Opcional, por si quieres guardar el JSON exacto del banco en logs
  internalId?: string
  warning?: boolean
}

export interface VerifyC2pPaymentRequest {
  companyAccountId: string
  provider: string
  amount: number
  payerPhone: string
  paymentReference: string
  trxDate?: string
  ipAddress: string
}

export interface VerifyC2pPaymentResponse {
  success: boolean
  status: string
  rawResponse: any
}

// BANCO EXTERIOR
// BANCO EXTERIOR

export interface ConsultSentPaymentsRequest {
  companyAccountId: string
  clientId: string
  channelId: string
  date: string
  receiverPhone: string
  startPosition: number
}

export interface ValidateReceivedPaymentRequest {
  companyAccountId: string
  clientId: string
  channelId: string
  date: string
  senderPhone: string
}

export interface MakeMobilePaymentRequest {
  companyAccountId: string
  ip: string
  idCliente: string
  idCanal: string
  idOperacion: string
  fechaOperacion: string
  codigoBanco: string
  nombreBanco: string
  concepto: string
  telefonoEmisor: string
  cuentaEmisor: string
  idBeneficiario: string
  telefonoBeneficiario: string
  moneda: string
  monto: number
  envioEmailEmisor: boolean
  envioEmailBeneficiario: boolean
}

export interface RequestOtpRequest {
  companyAccountId: string
  datosPeticion: {
    canal: string
    canalCore: string
    idUsuario: string
    ip: string
    idSesion: string
    idCliente: string
    encabezado?: Record<string, any>
    datos: Array<{
      bancoDebito: string
      bancoCredito: string
      datosOperacion: {
        instrumentoLocal: string
      }
      monto: {
        montoOperacion: number
        moneda: string
      }
      cuentaDebito: {
        tipoInstrumento: string
        instrumento: string
      }
      deudor: {
        nombreEsquema: string
        idCliente: string
      }
      acreedor: {
        nombreEsquema: string
        idCliente: string
      }
      cuentaCredito: {
        tipoInstrumento: string
        instrumento: string
      }
    }>
  }
}

export interface ExecuteImmediateDebitRequest {
  companyAccountId: string
  datosPeticion: {
    canal: string
    canalCore: string
    idUsuario: string
    ip: string
    idSesion: string
    idCliente: string
    encabezado?: Record<string, any>
    datos: Array<{
      bancoDebito: string
      bancoCredito: string
      datosOperacion: {
        instrumentoLocal: string
        idOperacion: string
        concepto: string
      }
      monto: {
        montoOperacion: number
        moneda: string
      }
      cuentaDebito: {
        tipoInstrumento: string
        instrumento: string
      }
      deudor: {
        nombreEsquema: string
        idCliente: string
      }
      acreedor: {
        nombreEsquema: string
        idCliente: string
      }
      cuentaCredito: {
        tipoInstrumento: string
        instrumento: string
      }
      autenticacion: {
        clavePago: string
      }
    }>
  }
}

export interface RequestImmediateTransferOAuthTokenRequest {
  grant_type: 'client_credentials'
  client_id: string
  client_secret: string
}

export interface ExecuteImmediateTransferRequest {
  companyAccountId: string
  datosPeticion: {
    idCliente: string
    idSesion: string
    idCanal: number
    idUsuario?: string
    idTerminal?: string
    idConsumidor?: string
  }
  transferenciaInmediata: {
    ctaPagadora: string
    ctaReceptora?: string
    codigobancoReceptor: string
    telefonoReceptor?: string
    idReceptor: string
    monto: number
    moneda: 'VES'
    nombreBeneficiario: string
    concepto: string
  }
}

export interface QueryImmediateTransferRequest {
  companyAccountId: string
  datosPeticion: {
    idCliente: string
    idSesion?: string
  }
  filtrosConsulta: {
    referencia?: string
    fecha?: string
    cuenta?: string
    idTransaccion?: string
  }
}

export interface BancoExteriorApiResponse {
  success: boolean
  message: string
  data: any
  rawResponse: any
}

/**
 * Interfaz base (puerto) que deben implementar las estrategias de pago.
 * Permite que el sistema seleccione y ejecute diferentes adaptadores
 * sin acoplar la lógica de negocio a detalles de implementación.
 */
export abstract class PaymentGatewayPort {
  /**
   * Indica si la estrategia puede manejar el proveedor dado.
   * @param provider - Nombre del proveedor a evaluar
   */
  abstract canHandle(provider: string): boolean

  /**
   * Ejecuta la operación de débito en la pasarela correspondiente.
   * @param data - Payload con la información del pago
   */
  abstract initiateDebit(data: InitiatePaymentRequest): Promise<PaymentResponse>

  /**
   * Consulta el estado de una transacción previamente iniciada.
   * @param data - Payload para la búsqueda de la transacción
   */
  abstract checkTransactionStatus(
    data: CheckTransactionRequest,
  ): Promise<TransactionStatusResponse>

  /**
   * Envía un pago móvil usando la estrategia correspondiente.
   *
   * @param data - Datos normalizados del pago móvil.
   * @returns Resultado normalizado de la operación.
   */
  abstract sendMobilePayment(
    data: MobilePaymentRequest,
  ): Promise<MobilePaymentResponse>

  /**
   * Envía un pago móvil iniciado por un cliente.
   *
   * @param data - Datos del pago proporcionados por el cliente.
   * @returns Resultado normalizado de la operación.
   */
  abstract sendCustomerMobilePayment(
    data: CustomerPaymentRequest,
  ): Promise<MobilePaymentResponse>

  /**
   * Recupera el historial de pagos móviles para un cliente.
   *
   * @param data - Parámetros de consulta (payerId y filtros opcionales).
   * @returns Respuesta normalizada con la lista de pagos y la respuesta cruda.
   */
  abstract getMobilePaymentHistory(
    data: ConsultMobilePaymentRequest,
  ): Promise<MobilePaymentHistoryResponse>

  /**
   * Inicia una transferencia usando la estrategia correspondiente.
   * @param data - Datos normalizados de la transferencia
   * @returns Resultado normalizado con el estado de la operación
   */
  abstract initiateTransfer(data: TransferRequest): Promise<TransferResponse>

  /**
   * Inicia una transferencia originada por un cliente hacia la empresa.
   *
   * @param data - Datos normalizados de la transferencia iniciada por el cliente
   * @returns Resultado normalizado con el estado de la operación
   */
  abstract initiateCustomerTransfer(
    data: CustomerTransferRequest,
  ): Promise<TransferResponse>

  /**
   * Consulta el estado de una transferencia en la pasarela.
   * @param data - Parámetros normalizados para localizar la transferencia
   * @returns Estado normalizado de la transacción y la respuesta cruda
   */
  abstract consultTransferStatus(
    data: ConsultTransferStatusRequest,
  ): Promise<TransactionTransferStatusResponse>

  /**
   * Solicita el Token OTP para débito inmediato.
   */
  abstract requestDebitToken(
    data: RequestDebitTokenRequest,
  ): Promise<DebitTokenResponse>

  /**
   * Inicia un cobro por domiciliacion (Debito Inmediato CCE).
   */
  abstract initiateDirectDebit(
    data: DirectDebitRequest,
  ): Promise<DirectDebitResponse>

  /**
   * Consulta la liquidacion de una domiciliacion.
   */
  abstract checkSettlement(
    data: CheckSettlementRequest,
  ): Promise<SettlementStatusResponse>

  // BANCO MERCANTIL
  /**
   * Procesa notificaciones asíncronas (webhooks) enviadas por el banco.
   * @param data - Payload crudo recibido en el endpoint
   */
  abstract processWebhookNotificationDebit(
    data: WebhookNotificationDebitRequest,
  ): Promise<WebhookNotificationDebitResponse>

  /**
   * Genera la URL de redirección para pasarelas de pago web (Ej: Botón Mercantil)
   * @param data - Datos de la solicitud de pago
   */
  abstract generateWebPaymentUrl(
    data: GenerateWebPaymentUrlRequest,
  ): Promise<GenerateWebPaymentUrlResponse>

  // BANCO R4 (Opcional - solo para estrategias que soporten consulta de tasas)
  getExchangeRate?(data: ExchangeRateRequest): Promise<ExchangeRateResponse>
  consultOperations?(
    data: QueryOperationGatewayRequest,
  ): Promise<QueryOperationGatewayResponse>

  abstract processP2pPayment(
    data: InitiateP2pPaymentRequest,
  ): Promise<InitiateP2pPaymentResponse>

  abstract verifyC2pPayment(
    data: VerifyC2pPaymentRequest,
  ): Promise<VerifyC2pPaymentResponse>

  // BANCO EXTERIOR
  consultSentPayments?(
    data: ConsultSentPaymentsRequest,
  ): Promise<BancoExteriorApiResponse>

  validateReceivedPayment?(
    data: ValidateReceivedPaymentRequest,
  ): Promise<BancoExteriorApiResponse>

  requestMakeMobilePaymentOAuthToken?(): Promise<string>

  makeMobilePayment?(
    data: MakeMobilePaymentRequest,
  ): Promise<BancoExteriorApiResponse>

  requestOtp?(data: RequestOtpRequest): Promise<BancoExteriorApiResponse>

  requestImmediateDebitOAuthToken?(): Promise<string>

  executeImmediateDebit?(
    data: ExecuteImmediateDebitRequest,
  ): Promise<BancoExteriorApiResponse>

  requestImmediateTransferOAuthToken?(): Promise<string>

  executeImmediateTransfer?(
    data: ExecuteImmediateTransferRequest,
  ): Promise<BancoExteriorApiResponse>

  queryImmediateTransfer?(
    data: QueryImmediateTransferRequest,
  ): Promise<BancoExteriorApiResponse>
}
