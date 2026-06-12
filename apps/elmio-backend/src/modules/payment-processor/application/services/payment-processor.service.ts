import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { ImmediateCreditRequestDto } from '../../presentation/dtos/banco-r4/immediate-credit.dto';
import { ImmediateDebitRequestDto } from '../../presentation/dtos/banco-r4/immediate-debit.dto';
import { QueryOperationRequestDto } from '../../presentation/dtos/banco-r4/query-operation.dto';
import {
  VueltoRequestDto,
  VueltoResponseDto,
} from '../../presentation/dtos/banco-r4/vuelto.dto';

import type { PaymentProcessorRepositoryPort } from '../../domain/ports/payment-processor-repository.interface';
import {
  GenerateWebPaymentUrlRequest,
  InitiateP2pPaymentRequest,
  InitiateP2pPaymentResponse,
  PAYMENT_PROCESSOR_REPOSITORY,
  VerifyC2pPaymentRequest,
  VerifyC2pPaymentResponse,
} from '../../domain/ports/payment-processor-repository.interface';
import { ConsultSentPaymentsDto } from '../../domain/ports/payment-processor-repository.interface';
import { ValidateReceivedPaymentDto } from '../../domain/ports/payment-processor-repository.interface';
import { MakeMobilePaymentDto } from '../../domain/ports/payment-processor-repository.interface';
import { RequestOtpDto } from '../../domain/ports/payment-processor-repository.interface';
import { ExecuteImmediateDebitDto } from '../../domain/ports/payment-processor-repository.interface';
import { ExecuteImmediateTransferDto } from '../../domain/ports/payment-processor-repository.interface';
import { QueryImmediateTransferDto } from '../../domain/ports/payment-processor-repository.interface';
@Injectable()
export class PaymentProcessorService {
  private readonly logger = new Logger(PaymentProcessorService.name);

  constructor(
    @Inject(PAYMENT_PROCESSOR_REPOSITORY)
    private readonly paymentProcessorRepository: PaymentProcessorRepositoryPort,
  ) {}

  async debit(dto: InitiateDebitDto, ip?: string) {
    const start = Date.now();
    try {
      const result = await this.paymentProcessorRepository.debit(dto, ip);

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      throw error;
    }
  }

  async checkStatus(dto: CheckStatusDto) {
    return this.paymentProcessorRepository.checkStatus(dto);
  }

  async sendMobilePayment(dto: SendMobilePaymentDto, user: LegacyTokenPayload) {
    return this.paymentProcessorRepository.sendMobilePayment(dto, user);
  }

  async processCustomerMobilePayment(dto: CustomerMobilePaymentDto) {
    return this.paymentProcessorRepository.processCustomerMobilePayment(dto);
  }

  async getMobilePaymentHistory(dto: ConsultMobilePaymentDto) {
    return this.paymentProcessorRepository.getMobilePaymentHistory(dto);
  }

  async initiateTransfer(dto: InitiateTransferDto, user: LegacyTokenPayload) {
    return this.paymentProcessorRepository.initiateTransfer(dto, user);
  }

  async initiateCustomerTransfer(
    dto: CustomerTransferDto,
    user: LegacyTokenPayload,
  ) {
    return this.paymentProcessorRepository.initiateCustomerTransfer(dto, user);
  }

  async consultTransferStatus(dto: ConsultTransferStatusDto) {
    return this.paymentProcessorRepository.consultTransferStatus(dto);
  }

  async requestToken(dto: RequestDebitTokenDto, ip?: string) {
    return this.paymentProcessorRepository.requestToken(dto, ip);
  }

  async initiateDirectDebit(dto: InitiateDirectDebitDto) {
    return this.paymentProcessorRepository.initiateDirectDebit(dto);
  }

  async checkSettlement(dto: CheckSettlementDto) {
    return this.paymentProcessorRepository.checkSettlement(dto);
  }

  async processWebhook(provider: string, payload: Record<string, unknown>) {
    return this.paymentProcessorRepository.processWebhook(provider, payload);
  }

  async generateWebPaymentUrl(
    provider: string,
    dto: GenerateWebPaymentUrlRequest,
  ) {
    return this.paymentProcessorRepository.generateWebPaymentUrl(provider, dto);
  }

  async processP2pPayment(
    request: InitiateP2pPaymentRequest,
  ): Promise<InitiateP2pPaymentResponse> {
    return this.paymentProcessorRepository.processP2pPayment(request);
  }

  async verifyC2pPayment(
    request: VerifyC2pPaymentRequest,
  ): Promise<VerifyC2pPaymentResponse> {
    return this.paymentProcessorRepository.verifyC2pPayment(request);
  }

  async getLastExchangeRate(companyAccountId?: string) {
    return this.paymentProcessorRepository.getLastExchangeRate(
      companyAccountId,
    );
  }

  async getExchangeRate(dto: GetExchangeRateDto) {
    return this.paymentProcessorRepository.getExchangeRate(dto);
  }

  async generateOTP(dto: GenerateOtpDto) {
    return this.paymentProcessorRepository.generateOTP(dto);
  }

  async consultMobilePaymentR4(dto: ConsultMobilePaymentR4Dto) {
    return this.paymentProcessorRepository.consultMobilePaymentR4(dto);
  }

  async processMobilePaymentNotificationR4(
    dto: MobilePaymentNotificationR4Dto,
  ) {
    return this.paymentProcessorRepository.processMobilePaymentNotificationR4(
      dto,
    );
  }

  async processAccountDirectDebitR4(dto: AccountDirectDebitDto) {
    return this.paymentProcessorRepository.processAccountDirectDebitR4(dto);
  }

  async processPhoneDirectDebitR4(dto: PhoneDirectDebitDto) {
    return this.paymentProcessorRepository.processPhoneDirectDebitR4(dto);
  }

  async processImmediateCreditR4(dto: ImmediateCreditRequestDto) {
    this.logger.log('[Service] processImmediateCreditR4 - incoming request');
    this.logger.debug(`[Service] DTO: ${JSON.stringify(dto)}`);

    const result =
      await this.paymentProcessorRepository.processImmediateCreditR4(dto);

    this.logger.debug(
      `[Service] processImmediateCreditR4 - repository response: ${JSON.stringify(
        result,
      )}`,
    );

    return result;
  }

  async processImmediateDebitR4(dto: ImmediateDebitRequestDto) {
    this.logger.log('[Service] processImmediateDebitR4 - incoming request');
    this.logger.debug(`[Service] DTO: ${JSON.stringify(dto)}`);

    const result =
      await this.paymentProcessorRepository.processImmediateDebitR4(dto);

    this.logger.debug(
      `[Service] processImmediateDebitR4 - repository response: ${JSON.stringify(
        result,
      )}`,
    );

    return result;
  }

  async queryOperationR4(dto: QueryOperationRequestDto) {
    this.logger.log('[Service] queryOperationR4 - incoming request');
    this.logger.debug(`[Service] DTO: ${JSON.stringify(dto)}`);

    const result = await this.paymentProcessorRepository.queryOperationR4(dto);

    this.logger.debug(
      `[Service] queryOperationR4 - repository response: ${JSON.stringify(
        result,
      )}`,
    );

    return result;
  }

  async processVueltoR4(dto: VueltoRequestDto): Promise<VueltoResponseDto> {
    this.logger.log('[Service] processVueltoR4 - incoming request');
    this.logger.debug(`[Service] DTO: ${JSON.stringify(dto)}`);

    const result = await this.paymentProcessorRepository.processVueltoR4(dto);

    this.logger.debug(
      `[Service] processVueltoR4 - repository response: ${JSON.stringify(
        result,
      )}`,
    );

    return result;
  }

  async consultSentPayments(dto: ConsultSentPaymentsDto) {
    return this.paymentProcessorRepository.consultSentPayments(dto);
  }

  async validateReceivedPayment(dto: ValidateReceivedPaymentDto) {
    return this.paymentProcessorRepository.validateReceivedPayment(dto);
  }

  async makeMobilePayment(dto: MakeMobilePaymentDto) {
    return this.paymentProcessorRepository.makeMobilePayment(dto);
  }

  async requestOtp(dto: RequestOtpDto) {
    return this.paymentProcessorRepository.requestOtp(dto);
  }

  async executeImmediateDebit(dto: ExecuteImmediateDebitDto) {
    return this.paymentProcessorRepository.executeImmediateDebit(dto);
  }

  async executeImmediateTransfer(dto: ExecuteImmediateTransferDto) {
    return this.paymentProcessorRepository.executeImmediateTransfer(dto);
  }

  async queryImmediateTransfer(dto: QueryImmediateTransferDto) {
    return this.paymentProcessorRepository.queryImmediateTransfer(dto);
  }
}
