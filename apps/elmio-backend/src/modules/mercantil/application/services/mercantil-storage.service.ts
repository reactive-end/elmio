import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { InsuranceOrderEntity } from '../../infrastructure/persistence/entities/insurance-order.entity';
import { InsurancePaymentTraceEntity } from '../../infrastructure/persistence/entities/insurance-payment-trace.entity';
import {
  MercantilPaymentFrequency,
  MercantilPolicyStatus,
  MercantilTraceStage,
  MercantilTraceStatus,
} from '../types/mercantil-persistence.types';

export interface SaveClientDto {
  shopcartId: string;
  clientId?: string;
  firstName: string;
  lastName: string;
  email: string;
  dniType: string;
  dniNumber: string;
  dniVenNationality?: string;
  birthDate: string;
  genderId: string;
  countryOfBirthId?: string;
  civilStateId?: string;
  phone?: {
    countryId?: string;
    areaCode?: string;
    number?: string;
  };
  address?: {
    countryId?: string;
    administrativeAreaId?: string;
    subadministrativeAreaId?: string;
    localityId?: string;
    zoneId?: string;
    postalCode?: string;
    address1?: string;
  };
  rawData?: Record<string, unknown>;
}

export interface ResolveClientDto {
  clientId?: string;
  dniType?: string;
  dniNumber?: string;
}

export interface SavePaymentQuotesDto {
  shopcartId: string;
  policyId: string;
  policyNumber?: string;
  quotes: Array<{
    quote: string;
    agreement?: number;
    receipt?: number;
    receiptStatus?: string;
    quoteStatus?: string;
    isNextDuePayment?: boolean;
    isPaid?: boolean;
    amount?: number;
    expirationDate?: string;
    rawData?: Record<string, unknown>;
  }>;
}

export interface SavePaymentDto {
  shopcartId: string;
  clientId?: string;
  paymentMethod:
    | 'debito'
    | 'domiciliacion_tarjeta'
    | 'domiciliacion_cuenta'
    | 'none';
  payerDocType?: string;
  payerDocNumber?: string;
  payerFirstName?: string;
  payerLastName?: string;
  debitBankCode?: string;
  debitValidationType?: string;
  debitPayerIdentifier?: string;
  debitToken?: string;
  cardNumber?: string;
  cardExpiryDate?: string;
  cardBankCode?: string;
  cardType?: string;
  accountPhone?: string;
  selectedBanks?: string[];
  amount?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  concept?: string;
  provider?: string;
  rawData?: Record<string, unknown>;
}

export interface SavePolicyDto {
  shopcartId: string;
  clientId?: string;
  dniType?: string;
  dniNumber?: string;
  policyId: string;
  policyNumber?: string;
  number?: string;
  entity?: string;
  area?: string;
  certificateNumber?: string;
  title?: string;
  status?: MercantilPolicyStatus;
  paymentFrequency?: MercantilPaymentFrequency;
  assuredSum?: number;
  quotedAmount?: number;
  annualPremium?: number;
  startDate?: string;
  endDate?: string;
  rawData?: Record<string, unknown>;
}

export interface SaveTraceDto {
  shopcartId: string;
  stage: MercantilTraceStage;
  status: MercantilTraceStatus;
  message: string;
  clientId?: string;
  dniType?: string;
  dniNumber?: string;
  errorCode?: string;
  errorStack?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
}

export interface SaveVehicleDto {
  shopcartId: string;
  clientId?: string;
  policyId?: string;
  vehicleTypeId?: string;
  year: string;
  brandCode: string;
  brandName?: string;
  modelCode: string;
  modelName?: string;
  versionCode: string;
  versionName?: string;
  commonLocationId?: string;
  commonLocationName?: string;
  isArmored?: boolean;
  plate?: string;
  colorId?: string;
  colorName?: string;
  chassisSerial?: string;
  engineSerial?: string;
  rawData?: Record<string, unknown>;
}

export interface SearchMercantilClientsDto {
  clientId?: string;
  dniType?: string;
  dniNumber?: string;
  name?: string;
  lastName?: string;
  email?: string;
  page?: number;
  perPage?: number;
}

export interface MercantilClientListItemDto {
  shopcartId: string;
  clientId: string | null;
  dniType: string;
  dniNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  policiesCount: number;
  quotesCount: number;
  paidQuotes: number;
  pendingQuotes: number;
  profileKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MercantilClientProfileDto {
  client: {
    shopcartId: string;
    clientId: string | null;
    dniType: string;
    dniNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    genderId: string;
    phone: {
      countryId: string | null;
      areaCode: string | null;
      number: string | null;
    };
  };
  summary: {
    policiesCount: number;
    quotesCount: number;
    paidQuotes: number;
    pendingQuotes: number;
  };
  policies: Array<{
    id: string;
    policyId: string;
    policyNumber: string | null;
    number: string | null;
    entity: string | null;
    area: string | null;
    title: string | null;
    status: string | null;
    paymentFrequency: string | null;
    assuredSum: number | null;
    quotedAmount: number | null;
    annualPremium: number | null;
    startDate: string | null;
    endDate: string | null;
    quotes: Array<{
      id: string;
      quote: string;
      agreement: number | null;
      receipt: number | null;
      receiptStatus: string | null;
      quoteStatus: string | null;
      isPaid: boolean;
      isNextDuePayment: boolean;
      amount: number | null;
      expirationDate: string | null;
    }>;
  }>;
  vehicle?: {
    id: string;
    shopcartId: string;
    year: string | null;
    brandCode: string | null;
    brandName: string | null;
    modelCode: string | null;
    modelName: string | null;
    versionCode: string | null;
    versionName: string | null;
    vehicleTypeId: string | null;
    commonLocationId: string | null;
    commonLocationName: string | null;
    isArmored: boolean | null;
    plate: string | null;
    colorId: string | null;
    colorName: string | null;
    chassisSerial: string | null;
    engineSerial: string | null;
  } | null;
}

export interface ClientSnapshot extends Record<string, unknown> {
  clientId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  dniType?: string;
  dniNumber?: string;
  dniVenNationality?: string | null;
  birthDate?: string;
  genderId?: string;
  countryOfBirthId?: string | null;
  civilStateId?: string | null;
  phoneCountryId?: string | null;
  phoneAreaCode?: string | null;
  phoneNumber?: string | null;
  addressCountryId?: string | null;
  addressAdministrativeAreaId?: string | null;
  addressSubadministrativeAreaId?: string | null;
  addressLocalityId?: string | null;
  addressZoneId?: string | null;
  addressPostalCode?: string | null;
  addressLine?: string | null;
  rawData?: Record<string, unknown> | null;
}

export interface VehicleSnapshot extends Record<string, unknown> {
  policyId?: string | null;
  vehicleTypeId?: string | null;
  year?: string;
  brandCode?: string;
  brandName?: string | null;
  modelCode?: string;
  modelName?: string | null;
  versionCode?: string;
  versionName?: string | null;
  commonLocationId?: string | null;
  commonLocationName?: string | null;
  isArmored?: boolean | null;
  plate?: string | null;
  colorId?: string | null;
  colorName?: string | null;
  chassisSerial?: string | null;
  engineSerial?: string | null;
  rawData?: Record<string, unknown> | null;
}

export interface PaymentSnapshot extends Record<string, unknown> {
  paymentMethod?:
    | 'debito'
    | 'domiciliacion_tarjeta'
    | 'domiciliacion_cuenta'
    | 'none';
  payerDocType?: string | null;
  payerDocNumber?: string | null;
  payerFirstName?: string | null;
  payerLastName?: string | null;
  debitBankCode?: string | null;
  debitValidationType?: string | null;
  debitPayerIdentifier?: string | null;
  debitToken?: string | null;
  cardNumber?: string | null;
  cardExpiryDate?: string | null;
  cardBankCode?: string | null;
  cardType?: string | null;
  accountPhone?: string | null;
  selectedBanks?: string[] | null;
  amount?: number | null;
  concept?: string | null;
  provider?: string | null;
  rawData?: Record<string, unknown> | null;
}

export interface PaymentQuoteSnapshot {
  id: string;
  shopcartId: string;
  policyId: string;
  policyNumber: string | null;
  quote: string;
  agreement: number | null;
  receipt: number | null;
  receiptStatus: string | null;
  quoteStatus: string | null;
  isNextDuePayment: boolean;
  isPaid: boolean;
  amount: number | null;
  expirationDate: string | null;
  rawData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicySnapshot {
  id: string;
  shopcartId: string;
  clientId: string | null;
  dniType: string | null;
  dniNumber: string | null;
  policyId: string;
  policyNumber: string | null;
  number: string | null;
  entity: string | null;
  area: string | null;
  certificateNumber: string | null;
  title: string | null;
  status: string | null;
  paymentFrequency: string | null;
  assuredSum: number | null;
  quotedAmount: number | null;
  annualPremium: number | null;
  startDate: string | null;
  endDate: string | null;
  rawData: Record<string, unknown> | null;
  paymentQuotes: PaymentQuoteSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PoliciesSnapshot extends Record<string, unknown> {
  policies: PolicySnapshot[];
}

export interface EmulatedClient {
  id: string;
  shopcartId: string;
  clientId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  dniType: string;
  dniNumber: string;
  dniVenNationality: string | null;
  birthDate: string;
  genderId: string;
  countryOfBirthId: string | null;
  civilStateId: string | null;
  phoneCountryId: string | null;
  phoneAreaCode: string | null;
  phoneNumber: string | null;
  addressCountryId: string | null;
  addressAdministrativeAreaId: string | null;
  addressSubadministrativeAreaId: string | null;
  addressLocalityId: string | null;
  addressZoneId: string | null;
  addressPostalCode: string | null;
  addressLine: string | null;
  rawData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmulatedVehicle {
  id: string;
  shopcartId: string;
  clientId: string | null;
  policyId: string | null;
  vehicleTypeId: string | null;
  year: string;
  brandCode: string;
  brandName: string | null;
  modelCode: string;
  modelName: string | null;
  versionCode: string;
  versionName: string | null;
  commonLocationId: string | null;
  commonLocationName: string | null;
  isArmored: boolean;
  plate: string | null;
  colorId: string | null;
  colorName: string | null;
  chassisSerial: string | null;
  engineSerial: string | null;
  rawData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmulatedPayment {
  id: string;
  shopcartId: string;
  clientId: string | null;
  paymentMethod:
    | 'debito'
    | 'domiciliacion_tarjeta'
    | 'domiciliacion_cuenta'
    | 'none';
  payerDocType: string | null;
  payerDocNumber: string | null;
  payerFirstName: string | null;
  payerLastName: string | null;
  debitBankCode: string | null;
  debitValidationType: string | null;
  debitPayerIdentifier: string | null;
  debitToken: string | null;
  cardNumber: string | null;
  cardExpiryDate: string | null;
  cardBankCode: string | null;
  cardType: string | null;
  accountPhone: string | null;
  selectedBanks: string[] | null;
  amount: number | null;
  status: string;
  concept: string | null;
  provider: string | null;
  rawData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MercantilStorageService {
  constructor(
    @InjectRepository(InsuranceOrderEntity)
    private readonly orderRepo: Repository<InsuranceOrderEntity>,
    @InjectRepository(InsurancePaymentTraceEntity)
    private readonly traceRepo: Repository<InsurancePaymentTraceEntity>,
  ) {}

  /**
   * Mapea un registro InsuranceOrder al formato de cliente emulado compatible.
   */
  private mapToEmulatedClient(
    order: InsuranceOrderEntity | null,
  ): EmulatedClient | null {
    if (!order || !order.clientSnapshot) return null;
    const client = order.clientSnapshot as ClientSnapshot;
    return {
      id: order.id,
      shopcartId: order.shopcartId,
      clientId: client.clientId ?? null,
      firstName: client.firstName ?? '',
      lastName: client.lastName ?? '',
      email: client.email ?? '',
      dniType: client.dniType ?? '',
      dniNumber: client.dniNumber ?? '',
      dniVenNationality: client.dniVenNationality ?? null,
      birthDate: client.birthDate ?? '',
      genderId: client.genderId ?? '',
      countryOfBirthId: client.countryOfBirthId ?? null,
      civilStateId: client.civilStateId ?? null,
      phoneCountryId: client.phoneCountryId ?? null,
      phoneAreaCode: client.phoneAreaCode ?? null,
      phoneNumber: client.phoneNumber ?? null,
      addressCountryId: client.addressCountryId ?? null,
      addressAdministrativeAreaId: client.addressAdministrativeAreaId ?? null,
      addressSubadministrativeAreaId:
        client.addressSubadministrativeAreaId ?? null,
      addressLocalityId: client.addressLocalityId ?? null,
      addressZoneId: client.addressZoneId ?? null,
      addressPostalCode: client.addressPostalCode ?? null,
      addressLine: client.addressLine ?? null,
      rawData: client.rawData ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Mapea el snapshot de vehículo al formato emulado.
   */
  private mapToEmulatedVehicle(
    order: InsuranceOrderEntity | null,
  ): EmulatedVehicle | null {
    if (!order || !order.vehicleSnapshot) return null;
    const vehicle = order.vehicleSnapshot as VehicleSnapshot;
    const client = order.clientSnapshot as ClientSnapshot | null;
    return {
      id: order.id,
      shopcartId: order.shopcartId,
      clientId: client?.clientId ?? null,
      policyId: vehicle.policyId ?? null,
      vehicleTypeId: vehicle.vehicleTypeId ?? null,
      year: vehicle.year ?? '',
      brandCode: vehicle.brandCode ?? '',
      brandName: vehicle.brandName ?? null,
      modelCode: vehicle.modelCode ?? '',
      modelName: vehicle.modelName ?? null,
      versionCode: vehicle.versionCode ?? '',
      versionName: vehicle.versionName ?? null,
      commonLocationId: vehicle.commonLocationId ?? null,
      commonLocationName: vehicle.commonLocationName ?? null,
      isArmored: vehicle.isArmored ?? false,
      plate: vehicle.plate ?? null,
      colorId: vehicle.colorId ?? null,
      colorName: vehicle.colorName ?? null,
      chassisSerial: vehicle.chassisSerial ?? null,
      engineSerial: vehicle.engineSerial ?? null,
      rawData: vehicle.rawData ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Mapea el snapshot de pago al formato emulado.
   */
  private mapToEmulatedPayment(
    order: InsuranceOrderEntity | null,
  ): EmulatedPayment | null {
    if (!order || !order.paymentSnapshot) return null;
    const payment = order.paymentSnapshot as PaymentSnapshot;
    const client = order.clientSnapshot as ClientSnapshot | null;
    return {
      id: order.id,
      shopcartId: order.shopcartId,
      clientId: client?.clientId ?? null,
      paymentMethod: payment.paymentMethod ?? 'none',
      payerDocType: payment.payerDocType ?? null,
      payerDocNumber: payment.payerDocNumber ?? null,
      payerFirstName: payment.payerFirstName ?? null,
      payerLastName: payment.payerLastName ?? null,
      debitBankCode: payment.debitBankCode ?? null,
      debitValidationType: payment.debitValidationType ?? null,
      debitPayerIdentifier: payment.debitPayerIdentifier ?? null,
      debitToken: payment.debitToken ?? null,
      cardNumber: payment.cardNumber ?? null,
      cardExpiryDate: payment.cardExpiryDate ?? null,
      cardBankCode: payment.cardBankCode ?? null,
      cardType: payment.cardType ?? null,
      accountPhone: payment.accountPhone ?? null,
      selectedBanks: payment.selectedBanks ?? null,
      amount: payment.amount ?? null,
      status: order.status ?? 'pending',
      concept: payment.concept ?? null,
      provider: payment.provider ?? null,
      rawData: payment.rawData ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async saveClient(dto: SaveClientDto): Promise<EmulatedClient> {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mercantil';
      order.status = 'draft';
    }

    order.clientSnapshot = {
      clientId: dto.clientId ?? null,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      dniType: dto.dniType,
      dniNumber: dto.dniNumber,
      dniVenNationality: dto.dniVenNationality ?? null,
      birthDate: dto.birthDate,
      genderId: dto.genderId,
      countryOfBirthId: dto.countryOfBirthId ?? null,
      civilStateId: dto.civilStateId ?? null,
      phoneCountryId: dto.phone?.countryId ?? null,
      phoneAreaCode: dto.phone?.areaCode ?? null,
      phoneNumber: dto.phone?.number ?? null,
      addressCountryId: dto.address?.countryId ?? null,
      addressAdministrativeAreaId: dto.address?.administrativeAreaId ?? null,
      addressSubadministrativeAreaId:
        dto.address?.subadministrativeAreaId ?? null,
      addressLocalityId: dto.address?.localityId ?? null,
      addressZoneId: dto.address?.zoneId ?? null,
      addressPostalCode: dto.address?.postalCode ?? null,
      addressLine: dto.address?.address1 ?? null,
      rawData: dto.rawData ?? null,
    };

    const saved = await this.orderRepo.save(order);
    const mapped = this.mapToEmulatedClient(saved);
    if (!mapped) {
      throw new Error('Error al mapear la información del cliente guardado.');
    }
    return mapped;
  }

  async savePaymentQuotes(
    dto: SavePaymentQuotesDto,
  ): Promise<PaymentQuoteSnapshot[]> {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mercantil';
      order.status = 'draft';
    }

    const currentPoliciesSnapshot = (order.policiesSnapshot as
      | PoliciesSnapshot
      | undefined
      | null) ?? { policies: [] };
    const policiesList = Array.isArray(currentPoliciesSnapshot.policies)
      ? currentPoliciesSnapshot.policies
      : [];

    // Generar las nuevas cuotas emuladas
    const emulatedQuotes = dto.quotes.map((q) => {
      return {
        id: randomUUID(),
        shopcartId: dto.shopcartId,
        policyId: dto.policyId,
        policyNumber: dto.policyNumber ?? null,
        quote: q.quote,
        agreement: q.agreement ?? null,
        receipt: q.receipt ?? null,
        receiptStatus: q.receiptStatus ?? null,
        quoteStatus: q.quoteStatus ?? null,
        isNextDuePayment: q.isNextDuePayment ?? false,
        isPaid: q.isPaid ?? false,
        amount: q.amount ?? null,
        expirationDate: q.expirationDate ?? null,
        rawData: q.rawData ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Buscar o actualizar la póliza dentro del JSONB
    let policyEntry = policiesList.find((p) => p.policyId === dto.policyId);
    if (!policyEntry) {
      policyEntry = {
        id: randomUUID(),
        shopcartId: dto.shopcartId,
        clientId: null,
        dniType: null,
        dniNumber: null,
        policyId: dto.policyId,
        policyNumber: dto.policyNumber ?? null,
        number: null,
        entity: null,
        area: null,
        certificateNumber: null,
        title: null,
        status: null,
        paymentFrequency: null,
        assuredSum: null,
        quotedAmount: null,
        annualPremium: null,
        startDate: null,
        endDate: null,
        rawData: null,
        paymentQuotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      policiesList.push(policyEntry);
    }

    policyEntry.paymentQuotes = emulatedQuotes;
    order.policiesSnapshot = { policies: policiesList };

    await this.orderRepo.save(order);
    return emulatedQuotes;
  }

  async getClientByShopcart(
    shopcartId: string,
  ): Promise<EmulatedClient | null> {
    const order = await this.orderRepo.findOne({ where: { shopcartId } });
    return this.mapToEmulatedClient(order);
  }

  async resolveExistingClient(
    dto: ResolveClientDto,
  ): Promise<EmulatedClient | null> {
    if (dto.clientId?.trim()) {
      const order = await this.orderRepo
        .createQueryBuilder('o')
        .where('o."clientSnapshot"->>\'clientId\' = :clientId', {
          clientId: dto.clientId.trim(),
        })
        .orderBy('o.updatedAt', 'DESC')
        .getOne();
      if (order) return this.mapToEmulatedClient(order);
    }

    if (dto.dniType?.trim() && dto.dniNumber?.trim()) {
      const order = await this.orderRepo
        .createQueryBuilder('o')
        .where('o."clientSnapshot"->>\'dniType\' = :dniType', {
          dniType: dto.dniType.trim(),
        })
        .andWhere('o."clientSnapshot"->>\'dniNumber\' = :dniNumber', {
          dniNumber: dto.dniNumber.trim(),
        })
        .orderBy('o.updatedAt', 'DESC')
        .getOne();
      if (order) return this.mapToEmulatedClient(order);
    }

    return null;
  }

  async getQuotesByShopcart(
    shopcartId: string,
  ): Promise<PaymentQuoteSnapshot[]> {
    const order = await this.orderRepo.findOne({ where: { shopcartId } });
    if (!order || !order.policiesSnapshot) return [];

    const policiesList =
      (order.policiesSnapshot as PoliciesSnapshot).policies ?? [];
    const allQuotes: PaymentQuoteSnapshot[] = [];
    for (const p of policiesList) {
      if (Array.isArray(p.paymentQuotes)) {
        allQuotes.push(...p.paymentQuotes);
      }
    }
    return allQuotes;
  }

  async getQuotesByPolicy(policyId: string): Promise<PaymentQuoteSnapshot[]> {
    const order = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.policiesSnapshot::text LIKE :policyId', {
        policyId: `%${policyId}%`,
      })
      .getOne();

    if (!order || !order.policiesSnapshot) return [];
    const policiesList =
      (order.policiesSnapshot as PoliciesSnapshot).policies ?? [];
    const policy = policiesList.find((p) => p.policyId === policyId);
    return Array.isArray(policy?.paymentQuotes) ? policy.paymentQuotes : [];
  }

  async savePayment(dto: SavePaymentDto): Promise<EmulatedPayment> {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mercantil';
    }

    order.status = dto.status === 'completed' ? 'paid' : dto.status;
    order.paymentSnapshot = {
      paymentMethod: dto.paymentMethod,
      payerDocType: dto.payerDocType ?? null,
      payerDocNumber: dto.payerDocNumber ?? null,
      payerFirstName: dto.payerFirstName ?? null,
      payerLastName: dto.payerLastName ?? null,
      debitBankCode: dto.debitBankCode ?? null,
      debitValidationType: dto.debitValidationType ?? null,
      debitPayerIdentifier: dto.debitPayerIdentifier ?? null,
      debitToken: dto.debitToken ?? null,
      cardNumber: dto.cardNumber ?? null,
      cardExpiryDate: dto.cardExpiryDate ?? null,
      cardBankCode: dto.cardBankCode ?? null,
      cardType: dto.cardType ?? null,
      accountPhone: dto.accountPhone ?? null,
      selectedBanks: dto.selectedBanks ?? null,
      amount: dto.amount ?? null,
      concept: dto.concept ?? null,
      provider: dto.provider ?? null,
      rawData: dto.rawData ?? null,
    };

    const saved = await this.orderRepo.save(order);
    const mapped = this.mapToEmulatedPayment(saved);
    if (!mapped) {
      throw new Error('Error al mapear la información del pago guardado.');
    }
    return mapped;
  }

  async getPaymentByShopcart(
    shopcartId: string,
  ): Promise<EmulatedPayment | null> {
    const order = await this.orderRepo.findOne({ where: { shopcartId } });
    return this.mapToEmulatedPayment(order);
  }

  async savePolicies(dto: {
    shopcartId: string;
    clientId?: string;
    dniType?: string;
    dniNumber?: string;
    paymentFrequency?: MercantilPaymentFrequency;
    policies: SavePolicyDto[];
  }): Promise<PolicySnapshot[]> {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mercantil';
    }

    order.status = 'emitted';

    const currentPoliciesSnapshot = (order.policiesSnapshot as
      | PoliciesSnapshot
      | undefined
      | null) ?? { policies: [] };
    const existingList = Array.isArray(currentPoliciesSnapshot.policies)
      ? currentPoliciesSnapshot.policies
      : [];

    const emulatedPolicies = dto.policies.map((p) => {
      const existingPolicy = existingList.find(
        (ex) => ex.policyId === p.policyId,
      );
      return {
        id: randomUUID(),
        shopcartId: dto.shopcartId,
        clientId: p.clientId ?? dto.clientId ?? null,
        dniType: p.dniType ?? dto.dniType ?? null,
        dniNumber: p.dniNumber ?? dto.dniNumber ?? null,
        policyId: p.policyId,
        policyNumber: p.policyNumber ?? null,
        number: p.number ?? null,
        entity: p.entity ?? null,
        area: p.area ?? null,
        certificateNumber: p.certificateNumber ?? null,
        title: p.title ?? null,
        status: p.status ?? null,
        paymentFrequency: p.paymentFrequency ?? dto.paymentFrequency ?? null,
        assuredSum: p.assuredSum ?? null,
        quotedAmount: p.quotedAmount ?? null,
        annualPremium: p.annualPremium ?? null,
        startDate: p.startDate ?? null,
        endDate: p.endDate ?? null,
        rawData: p.rawData ?? null,
        paymentQuotes: existingPolicy?.paymentQuotes ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    order.policiesSnapshot = { policies: emulatedPolicies };
    await this.orderRepo.save(order);
    return emulatedPolicies;
  }

  async getPoliciesByShopcart(shopcartId: string): Promise<PolicySnapshot[]> {
    const order = await this.orderRepo.findOne({ where: { shopcartId } });
    if (!order || !order.policiesSnapshot) return [];
    return (order.policiesSnapshot as PoliciesSnapshot).policies ?? [];
  }

  async saveTrace(dto: SaveTraceDto): Promise<InsurancePaymentTraceEntity> {
    const entity = new InsurancePaymentTraceEntity();
    entity.id = randomUUID();
    entity.shopcartId = dto.shopcartId;
    entity.provider = 'mercantil';
    entity.stage = dto.stage;
    entity.status = dto.status;
    entity.message = dto.message;
    entity.errorCode = dto.errorCode ?? null;
    entity.errorStack = dto.errorStack ?? null;
    entity.payload = dto.payload ?? null;
    entity.response = dto.response ?? null;
    return this.traceRepo.save(entity);
  }

  async getTracesByShopcart(
    shopcartId: string,
  ): Promise<InsurancePaymentTraceEntity[]> {
    return this.traceRepo.find({
      where: { shopcartId },
      order: { createdAt: 'DESC' },
    });
  }

  async searchClients(dto: SearchMercantilClientsDto): Promise<{
    items: MercantilClientListItemDto[];
    count: number;
    page: number;
    perPage: number;
  }> {
    const page = Math.max(1, dto.page ?? 1);
    const perPage = Math.min(100, Math.max(1, dto.perPage ?? 20));

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o."clientSnapshot" IS NOT NULL');

    if (dto.clientId?.trim()) {
      qb.andWhere('o."clientSnapshot"->>\'clientId\' = :clientId', {
        clientId: dto.clientId.trim(),
      });
    }
    if (dto.dniType?.trim()) {
      qb.andWhere('o."clientSnapshot"->>\'dniType\' = :dniType', {
        dniType: dto.dniType.trim(),
      });
    }
    if (dto.dniNumber?.trim()) {
      qb.andWhere('o."clientSnapshot"->>\'dniNumber\' LIKE :dniNumber', {
        dniNumber: `%${dto.dniNumber.trim()}%`,
      });
    }
    if (dto.name?.trim()) {
      qb.andWhere('LOWER(o."clientSnapshot"->>\'firstName\') LIKE :name', {
        name: `%${dto.name.trim().toLowerCase()}%`,
      });
    }
    if (dto.lastName?.trim()) {
      qb.andWhere('LOWER(o."clientSnapshot"->>\'lastName\') LIKE :lastName', {
        lastName: `%${dto.lastName.trim().toLowerCase()}%`,
      });
    }
    if (dto.email?.trim()) {
      qb.andWhere('LOWER(o."clientSnapshot"->>\'email\') LIKE :email', {
        email: `%${dto.email.trim().toLowerCase()}%`,
      });
    }

    qb.orderBy('o.updatedAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [orders, count] = await qb.getManyAndCount();

    const items: MercantilClientListItemDto[] = [];
    for (const order of orders) {
      const client = order.clientSnapshot as ClientSnapshot;
      const policies =
        (order.policiesSnapshot as PoliciesSnapshot | undefined | null)
          ?.policies ?? [];

      const allQuotes: PaymentQuoteSnapshot[] = [];
      for (const p of policies) {
        if (Array.isArray(p.paymentQuotes)) {
          allQuotes.push(...p.paymentQuotes);
        }
      }

      const paidQuotes = allQuotes.filter((quote) => {
        if (quote.isPaid) return true;
        if (!quote.receiptStatus) return false;
        return quote.receiptStatus.toLowerCase() === 'paid';
      }).length;

      const profileKey = client.clientId
        ? `client-${client.clientId}`
        : `dni-${client.dniType}-${client.dniNumber}`;

      items.push({
        shopcartId: order.shopcartId,
        clientId: client.clientId ?? null,
        dniType: client.dniType ?? '',
        dniNumber: client.dniNumber ?? '',
        firstName: client.firstName ?? '',
        lastName: client.lastName ?? '',
        email: client.email ?? '',
        policiesCount: policies.length,
        quotesCount: allQuotes.length,
        paidQuotes,
        pendingQuotes: Math.max(0, allQuotes.length - paidQuotes),
        profileKey,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    return { items, count, page, perPage };
  }

  async saveVehicle(dto: SaveVehicleDto): Promise<EmulatedVehicle> {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mercantil';
      order.status = 'draft';
    }

    order.vehicleSnapshot = {
      policyId: dto.policyId ?? null,
      vehicleTypeId: dto.vehicleTypeId ?? null,
      year: dto.year,
      brandCode: dto.brandCode,
      brandName: dto.brandName ?? null,
      modelCode: dto.modelCode,
      modelName: dto.modelName ?? null,
      versionCode: dto.versionCode,
      versionName: dto.versionName ?? null,
      commonLocationId: dto.commonLocationId ?? null,
      commonLocationName: dto.commonLocationName ?? null,
      isArmored: dto.isArmored ?? null,
      plate: dto.plate ?? null,
      colorId: dto.colorId ?? null,
      colorName: dto.colorName ?? null,
      chassisSerial: dto.chassisSerial ?? null,
      engineSerial: dto.engineSerial ?? null,
      rawData: dto.rawData ?? null,
    };

    const saved = await this.orderRepo.save(order);
    const mapped = this.mapToEmulatedVehicle(saved);
    if (!mapped) {
      throw new Error('Error al mapear la información del vehículo guardado.');
    }
    return mapped;
  }

  async getVehicleByShopcart(
    shopcartId: string,
  ): Promise<EmulatedVehicle | null> {
    const order = await this.orderRepo.findOne({ where: { shopcartId } });
    return this.mapToEmulatedVehicle(order);
  }

  async markQuoteAsPaid(id: string): Promise<void> {
    const order = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.policiesSnapshot::text LIKE :id', { id: `%${id}%` })
      .getOne();

    if (!order || !order.policiesSnapshot) {
      throw new NotFoundException('Cuota no encontrada');
    }

    const policiesList =
      (order.policiesSnapshot as PoliciesSnapshot).policies ?? [];
    let found = false;
    for (const p of policiesList) {
      if (Array.isArray(p.paymentQuotes)) {
        const quote = p.paymentQuotes.find((q) => q.id === id);
        if (quote) {
          quote.isPaid = true;
          quote.receiptStatus = 'paid';
          found = true;
          break;
        }
      }
    }

    if (!found) {
      throw new NotFoundException('Cuota no encontrada');
    }

    order.policiesSnapshot = { policies: policiesList };
    await this.orderRepo.save(order);
  }

  async getClientProfile(filters: {
    clientId?: string;
    dniType?: string;
    dniNumber?: string;
  }): Promise<MercantilClientProfileDto | null> {
    const hasClientId = Boolean(filters.clientId?.trim());
    const hasDni = Boolean(
      filters.dniType?.trim() && filters.dniNumber?.trim(),
    );

    if (!hasClientId && !hasDni) {
      return null;
    }

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o."clientSnapshot" IS NOT NULL');

    if (hasClientId) {
      qb.andWhere('o."clientSnapshot"->>\'clientId\' = :clientId', {
        clientId: filters.clientId!.trim(),
      });
    } else {
      qb.andWhere('o."clientSnapshot"->>\'dniType\' = :dniType', {
        dniType: filters.dniType!.trim(),
      }).andWhere('o."clientSnapshot"->>\'dniNumber\' = :dniNumber', {
        dniNumber: filters.dniNumber!.trim(),
      });
    }

    const order = await qb.orderBy('o.updatedAt', 'DESC').getOne();
    if (!order) {
      return null;
    }

    const client = order.clientSnapshot as ClientSnapshot;
    const policies =
      (order.policiesSnapshot as PoliciesSnapshot | undefined | null)
        ?.policies ?? [];

    const allQuotes: PaymentQuoteSnapshot[] = [];
    for (const p of policies) {
      if (Array.isArray(p.paymentQuotes)) {
        allQuotes.push(...p.paymentQuotes);
      }
    }

    const paidQuotes = allQuotes.filter((quote) => {
      if (quote.isPaid) return true;
      if (!quote.receiptStatus) return false;
      return quote.receiptStatus.toLowerCase() === 'paid';
    }).length;

    const formattedPolicies = policies.map((policy) => {
      return {
        id: policy.id,
        policyId: policy.policyId,
        policyNumber: policy.policyNumber,
        number: policy.number,
        entity: policy.entity,
        area: policy.area,
        title: policy.title,
        status: policy.status,
        paymentFrequency: policy.paymentFrequency,
        assuredSum: policy.assuredSum,
        quotedAmount: policy.quotedAmount,
        annualPremium: policy.annualPremium,
        startDate: policy.startDate,
        endDate: policy.endDate,
        quotes: Array.isArray(policy.paymentQuotes)
          ? policy.paymentQuotes.map((quote) => ({
              id: quote.id,
              quote: quote.quote,
              agreement: quote.agreement,
              receipt: quote.receipt,
              receiptStatus: quote.receiptStatus,
              quoteStatus: quote.quoteStatus,
              isPaid: quote.isPaid,
              isNextDuePayment: quote.isNextDuePayment,
              amount: quote.amount,
              expirationDate: quote.expirationDate,
            }))
          : [],
      };
    });

    const emulatedVehicle = this.mapToEmulatedVehicle(order);

    return {
      client: {
        shopcartId: order.shopcartId,
        clientId: client.clientId ?? null,
        dniType: client.dniType ?? '',
        dniNumber: client.dniNumber ?? '',
        firstName: client.firstName ?? '',
        lastName: client.lastName ?? '',
        email: client.email ?? '',
        birthDate: client.birthDate ?? '',
        genderId: client.genderId ?? '',
        phone: {
          countryId: client.phoneCountryId ?? null,
          areaCode: client.phoneAreaCode ?? null,
          number: client.phoneNumber ?? null,
        },
      },
      summary: {
        policiesCount: policies.length,
        quotesCount: allQuotes.length,
        paidQuotes,
        pendingQuotes: Math.max(0, allQuotes.length - paidQuotes),
      },
      policies: formattedPolicies,
      vehicle: emulatedVehicle
        ? {
            id: emulatedVehicle.id,
            shopcartId: emulatedVehicle.shopcartId,
            year: emulatedVehicle.year,
            brandCode: emulatedVehicle.brandCode,
            brandName: emulatedVehicle.brandName,
            modelCode: emulatedVehicle.modelCode,
            modelName: emulatedVehicle.modelName,
            versionCode: emulatedVehicle.versionCode,
            versionName: emulatedVehicle.versionName,
            vehicleTypeId: emulatedVehicle.vehicleTypeId,
            commonLocationId: emulatedVehicle.commonLocationId,
            commonLocationName: emulatedVehicle.commonLocationName,
            isArmored: emulatedVehicle.isArmored,
            plate: emulatedVehicle.plate,
            colorId: emulatedVehicle.colorId,
            colorName: emulatedVehicle.colorName,
            chassisSerial: emulatedVehicle.chassisSerial,
            engineSerial: emulatedVehicle.engineSerial,
          }
        : null,
    };
  }
}
