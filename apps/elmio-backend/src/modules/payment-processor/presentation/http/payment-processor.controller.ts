import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentProcessorService } from '../../application/services/payment-processor.service';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { DoneApiKeyGuard } from './done-api-key.guard';
import type { UserSession } from '../../../auth/domain/user';
import type { LegacyTokenPayload } from '../../domain/ports/payment-processor-repository.interface';

import { InitiateDebitDto } from '../../presentation/dtos/banco-plaza/initiate-debit.dto';
import { CheckStatusDto } from '../../presentation/dtos/banco-plaza/check-status.dto';
import { SendMobilePaymentDto } from '../../presentation/dtos/banco-plaza/send-mobile-payment.dto';
import { CustomerMobilePaymentDto } from '../../presentation/dtos/banco-plaza/customer-mobile-payment.dto';
import { ConsultMobilePaymentDto } from '../../presentation/dtos/banco-plaza/consult-mobile-payment.dto';
import { InitiateTransferDto } from '../../presentation/dtos/banco-plaza/initiate-transfer.dto';
import { CustomerTransferDto } from '../../presentation/dtos/banco-plaza/customer-transfer.dto';
import { ConsultTransferStatusDto } from '../../presentation/dtos/banco-plaza/consult-transfer-status.dto';
import { RequestDebitTokenDto } from '../../presentation/dtos/banco-plaza/request-debit-token.dto';
import { InitiateDirectDebitDto } from '../../presentation/dtos/banco-plaza/initiate-direct-debit.dto';
import { CheckSettlementDto } from '../../presentation/dtos/banco-plaza/check-settlement.dto';

import { GetExchangeRateDto } from '../../presentation/dtos/banco-r4/get-r4-exchange-rate.dto';
import { ConsultMobilePaymentR4Dto } from '../../presentation/dtos/banco-r4/consult-mobile-payment.dto';
import { MobilePaymentNotificationR4Dto } from '../../presentation/dtos/banco-r4/mobile-payment-notification.dto';
import { AccountDirectDebitDto } from '../../presentation/dtos/banco-r4/account-direct-debit.dto';
import { PhoneDirectDebitDto } from '../../presentation/dtos/banco-r4/phone-direct-debit.dto';
import { GenerateOtpDto } from '../../presentation/dtos/banco-r4/generate-otp.dto';
import { ImmediateDebitRequestDto } from '../../presentation/dtos/banco-r4/immediate-debit.dto';
import { QueryOperationRequestDto } from '../../presentation/dtos/banco-r4/query-operation.dto';

/**
 * Decorador personalizado local para extraer y mapear la sesión actual
 * al formato esperado por el procesador de pagos heredado.
 */
export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LegacyTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.session as UserSession | undefined;
    return {
      sub: session?.userId || 'anonymous',
      role: session?.role,
    };
  },
);

@Controller('')
export class PaymentProcessorController {
  private readonly logger = new Logger(PaymentProcessorController.name);

  constructor(
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  // ==========================================
  // BANCO PLAZA
  // ==========================================

  /**
   * Solicita un token de débito para Banco Plaza.
   *
   * @param dto - Datos de la solicitud de token.
   * @param ip - Dirección IP del solicitante.
   * @returns Resultado de la solicitud del token de débito.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/debit/token')
  async requestDebitToken(@Body() dto: RequestDebitTokenDto, @Ip() ip: string) {
    return this.paymentProcessorService.requestToken(dto, ip);
  }

  /**
   * Inicia una operación de débito directo en Banco Plaza.
   *
   * @param dto - Datos para iniciar la transacción de débito.
   * @param ip - Dirección IP del cliente.
   * @returns Resultado de la operación de débito.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/debit')
  async debit(@Body() dto: InitiateDebitDto, @Ip() ip: string) {
    return this.paymentProcessorService.debit(dto, ip);
  }

  /**
   * Solicita un token de débito para Banco Plaza utilizando autenticación por clave API.
   *
   * @param dto - Datos de la solicitud de token.
   * @param ip - Dirección IP del cliente.
   * @returns Resultado de la solicitud del token de débito.
   */
  @UseGuards(DoneApiKeyGuard)
  @Post('banco-plaza/debit/token/apikey')
  async requestDebitTokenByApiKey(
    @Body() dto: RequestDebitTokenDto,
    @Ip() ip: string,
  ) {
    return this.paymentProcessorService.requestToken(dto, ip);
  }

  /**
   * Inicia una operación de débito en Banco Plaza utilizando autenticación por clave API.
   *
   * @param dto - Datos para iniciar la transacción de débito.
   * @param req - Objeto de solicitud HTTP de Express para extraer la IP cliente de forma segura.
   * @returns Resultado de la operación de débito.
   */
  @UseGuards(DoneApiKeyGuard)
  @Post('banco-plaza/debit/apikey')
  async debitByApiKey(@Body() dto: InitiateDebitDto, @Req() req: Request) {
    let rawIp = (req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1') as string;

    if (rawIp.includes(',')) {
      rawIp = rawIp.split(',')[0].trim();
    }

    let cleanIp = rawIp.replace(/^.*:/, '');
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(cleanIp)) {
      cleanIp = '127.0.0.1';
    }

    return this.paymentProcessorService.debit(dto, cleanIp);
  }

  /**
   * Inicia una domiciliación de cobro en Banco Plaza.
   *
   * @param dto - Datos de la domiciliación.
   * @param ip - Dirección IP del cliente para auditoría.
   * @returns Resultado del inicio de la domiciliación.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/direct-debit/initiate-dom')
  async initiateDirectDebit(
    @Body() dto: InitiateDirectDebitDto,
    @Ip() ip: string,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }
    return await this.paymentProcessorService.initiateDirectDebit(dto);
  }

  /**
   * Inicia una domiciliación de cobro en Banco Plaza utilizando clave API.
   *
   * @param dto - Datos de la domiciliación.
   * @param ip - Dirección IP del cliente para auditoría.
   * @returns Resultado del inicio de la domiciliación.
   */
  @UseGuards(DoneApiKeyGuard)
  @Post('banco-plaza/direct-debit/initiate-dom/apikey')
  async initiateDirectDebitByApiKey(
    @Body() dto: InitiateDirectDebitDto,
    @Ip() ip: string,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }

    const resolvedCompanyAccountId =
      dto.companyAccountId?.trim() ||
      process.env.PLAZA_DEFAULT_COMPANY_ACCOUNT_ID?.trim();

    if (!resolvedCompanyAccountId) {
      throw new HttpException(
        'Falta configurar PLAZA_DEFAULT_COMPANY_ACCOUNT_ID para operar con Banco Plaza.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    dto.companyAccountId = resolvedCompanyAccountId;
    return await this.paymentProcessorService.initiateDirectDebit(dto);
  }

  /**
   * Consulta el estado de liquidación de una domiciliación en Banco Plaza.
   *
   * @param dto - Datos para la consulta de liquidación.
   * @returns Estado actual de liquidación de la domiciliación.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/direct-debit/check-dom')
  async checkDirectDebitSettlement(@Body() dto: CheckSettlementDto) {
    return await this.paymentProcessorService.checkSettlement(dto);
  }

  /**
   * Consulta el estado de una transacción de débito en Banco Plaza.
   *
   * @param dto - Datos de consulta de estado.
   * @returns Estado actual de la transacción.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/check-status')
  async checkStatus(@Body() dto: CheckStatusDto) {
    return await this.paymentProcessorService.checkStatus(dto);
  }

  /**
   * Envía un pago móvil en Banco Plaza.
   *
   * @param dto - Datos del pago móvil a enviar.
   * @param ip - Dirección IP del pagador para auditoría.
   * @param user - Datos de la sesión del usuario.
   * @returns Resultado del envío del pago móvil.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/mobile-payment')
  async sendMobilePayment(
    @Body() dto: SendMobilePaymentDto,
    @Ip() ip: string,
    @User() user: LegacyTokenPayload,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }
    return await this.paymentProcessorService.sendMobilePayment(dto, user);
  }

  /**
   * Procesa el pago móvil recibido de un cliente en Banco Plaza.
   *
   * @param dto - Datos del pago móvil del cliente.
   * @param ip - Dirección IP del pagador para auditoría.
   * @returns Resultado del procesamiento del pago.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/customer-mobile-payment')
  async receiveMobilePayment(
    @Body() dto: CustomerMobilePaymentDto,
    @Ip() ip: string,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }
    return await this.paymentProcessorService.processCustomerMobilePayment(dto);
  }

  /**
   * Obtiene el historial de pagos móviles de un cliente en Banco Plaza.
   *
   * @param payerId - Cédula o RIF del cliente.
   * @param provider - Proveedor del servicio.
   * @param companyAccountId - Cuenta de la empresa.
   * @param date - Fecha de consulta (opcional).
   * @param reference - Referencia a buscar (opcional).
   * @returns Historial de pagos móviles filtrados.
   */
  @UseGuards(AuthGuard)
  @Get('banco-plaza/p2p-history/:payerId')
  async getMobilePaymentHistory(
    @Param('payerId') payerId: string,
    @Query('provider') provider: string,
    @Query('companyAccountId') companyAccountId: string,
    @Query('date') date?: string,
    @Query('reference') reference?: string,
  ) {
    const dto: ConsultMobilePaymentDto = {
      companyAccountId,
      payerId,
      provider: provider,
      date,
      reference,
    };
    return await this.paymentProcessorService.getMobilePaymentHistory(dto);
  }

  /**
   * Inicia una transferencia bancaria en Banco Plaza.
   *
   * @param dto - Datos de la transferencia.
   * @param ip - Dirección IP del remitente para auditoría.
   * @param user - Datos de la sesión del usuario.
   * @returns Resultado del inicio de la transferencia.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/transfer')
  async initiateTransfer(
    @Body() dto: InitiateTransferDto,
    @Ip() ip: string,
    @User() user: LegacyTokenPayload,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }
    return await this.paymentProcessorService.initiateTransfer(dto, user);
  }

  /**
   * Inicia una transferencia bancaria desde el cliente hacia la empresa en Banco Plaza.
   *
   * @param dto - Datos del pago del cliente.
   * @param ip - Dirección IP del cliente para auditoría.
   * @param user - Datos de la sesión del usuario.
   * @returns Resultado del inicio de la transferencia del cliente.
   */
  @UseGuards(AuthGuard)
  @Post('banco-plaza/customer-transfer')
  async initiateCustomerTransfer(
    @Body() dto: CustomerTransferDto,
    @Ip() ip: string,
    @User() user: LegacyTokenPayload,
  ) {
    if (!dto.userIp) {
      dto.userIp = ip || '127.0.0.1';
    }
    return await this.paymentProcessorService.initiateCustomerTransfer(
      dto,
      user,
    );
  }

  /**
   * Consulta el estado de una transferencia en Banco Plaza.
   *
   * @param originatorId - Identificador único de originador (URL).
   * @param provider - Proveedor de pagos.
   * @param companyAccountId - ID de la cuenta comercial.
   * @param account - Cuenta de origen.
   * @param reference - Referencia bancaria.
   * @param amount - Monto exacto.
   * @param date - Fecha de la operación (YYMMDD).
   * @returns Estado actual de la transferencia.
   */
  @UseGuards(AuthGuard)
  @Get('banco-plaza/transfer-status/:id')
  async consultTransferStatus(
    @Param('id') originatorId: string,
    @Query('provider') provider: string,
    @Query('companyAccountId') companyAccountId: string,
    @Query('account') account: string,
    @Query('ref') reference: string,
    @Query('amount') amount: number,
    @Query('date') date: string,
  ) {
    if (!originatorId) {
      throw new HttpException(
        'El ID es obligatorio en la URL',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dto: ConsultTransferStatusDto = {
      companyAccountId,
      provider: provider || 'PLAZA',
      originatorId: originatorId,
      account: account,
      reference: reference,
      amount: Number(amount),
      date: date,
    };
    return await this.paymentProcessorService.consultTransferStatus(dto);
  }

  // ==========================================
  // BANCO R4
  // ==========================================

  /**
   * Consulta la tasa de cambio histórica/específica en Banco R4.
   *
   * @param dto - Parámetros de consulta de tasa (fecha y moneda).
   * @returns Tasa de cambio obtenida.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/consulta/tasa')
  async getExchangeRate(@Body() dto: GetExchangeRateDto) {
    if (!dto.date || !dto.currency) {
      throw new HttpException(
        'Los parámetros fecha y moneda son obligatorios',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.paymentProcessorService.getExchangeRate(dto);
  }

  /**
   * Genera un código OTP de autorización en Banco R4.
   *
   * @param dto - Parámetros para la generación del OTP.
   * @returns Código y estado de la solicitud.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/generate-otp')
  @HttpCode(HttpStatus.OK)
  async generateOTP(@Body() dto: GenerateOtpDto) {
    return await this.paymentProcessorService.generateOTP(dto);
  }

  /**
   * Procesa una solicitud de débito inmediato en Banco R4.
   *
   * @param dto - Parámetros del débito inmediato.
   * @returns Resultado del débito procesado.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/immediate-debit')
  async processImmediateDebitR4(@Body() dto: ImmediateDebitRequestDto) {
    this.logger.debug(
      `[banco-r4/immediate-debit] Request received: ${JSON.stringify(dto)}`,
    );
    const result =
      await this.paymentProcessorService.processImmediateDebitR4(dto);
    this.logger.debug(
      `[banco-r4/immediate-debit] Response returned: ${JSON.stringify(result)}`,
    );
    return result;
  }

  /**
   * Consulta el estado de una operación financiera en Banco R4.
   *
   * @param dto - Identificadores de consulta de operación.
   * @returns Datos y estado de la operación consultada.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/consult-operations')
  @HttpCode(HttpStatus.OK)
  async queryOperationR4(@Body() dto: QueryOperationRequestDto) {
    this.logger.debug(
      `[banco-r4/consult-operations] Request received: ${JSON.stringify(dto)}`,
    );
    const result = await this.paymentProcessorService.queryOperationR4(dto);
    this.logger.debug(
      `[banco-r4/consult-operations] Response returned: ${JSON.stringify(result)}`,
    );
    return result;
  }

  /**
   * Obtiene la última tasa de cambio activa/almacenada para Banco R4.
   *
   * @param companyAccountId - ID de la cuenta de empresa asociada.
   * @returns La última tasa de cambio disponible.
   */
  @UseGuards(AuthGuard)
  @Get('banco-r4/exchange-rate')
  async getLastExchangeRate(
    @Query('companyAccountId') companyAccountId: string,
  ) {
    return await this.paymentProcessorService.getLastExchangeRate(
      companyAccountId,
    );
  }

  /**
   * Procesa una domiciliación de débito directo basada en número de cuenta bancaria en Banco R4.
   *
   * @param dto - Parámetros para la domiciliación.
   * @returns Resultado de la domiciliación procesada.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/direct-debit/account')
  async processAccountDirectDebitR4(@Body() dto: AccountDirectDebitDto) {
    return await this.paymentProcessorService.processAccountDirectDebitR4(dto);
  }

  /**
   * Procesa una domiciliación de débito directo basada en afiliación telefónica en Banco R4.
   *
   * @param dto - Parámetros para la domiciliación.
   * @returns Resultado de la domiciliación procesada.
   */
  @UseGuards(AuthGuard)
  @Post('banco-r4/direct-debit/phone')
  async processPhoneDirectDebitR4(@Body() dto: PhoneDirectDebitDto) {
    return await this.paymentProcessorService.processPhoneDirectDebitR4(dto);
  }

  /**
   * Consulta el estado de una transacción de pago móvil en Banco R4.
   *
   * @param dto - Datos de la consulta de pago móvil.
   * @returns Estado actual del pago móvil.
   */
  @Post('banco-r4/consulta')
  @HttpCode(HttpStatus.OK)
  async consultMobilePaymentR4(@Body() dto: ConsultMobilePaymentR4Dto) {
    return await this.paymentProcessorService.consultMobilePaymentR4(dto);
  }

  /**
   * Procesa una notificación de pago móvil entrante desde Banco R4 (Webhook).
   *
   * @param dto - Datos y metadatos de la notificación de pago móvil recibida.
   * @returns Estado de recepción y aceptación de la notificación.
   */
  @Post('banco-r4/notifica')
  @HttpCode(HttpStatus.OK)
  async processMobilePaymentNotificationR4(
    @Body() dto: MobilePaymentNotificationR4Dto,
  ) {
    this.logger.debug('Notificación R4 recibida:', dto);
    return await this.paymentProcessorService.processMobilePaymentNotificationR4(
      dto,
    );
  }
}
