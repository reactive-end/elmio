import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { MercantilClientEntity } from '../../infrastructure/persistence/entities/mercantil-client.entity';
import { MercantilPaymentQuoteEntity } from '../../infrastructure/persistence/entities/mercantil-payment-quote.entity';
import { MercantilPaymentEntity } from '../../infrastructure/persistence/entities/mercantil-payment.entity';
import { MercantilPolicyEntity } from '../../infrastructure/persistence/entities/mercantil-policy.entity';
import { MercantilPaymentTraceEntity } from '../../infrastructure/persistence/entities/mercantil-payment-trace.entity';
import { MercantilVehicleEntity } from '../../infrastructure/persistence/entities/mercantil-vehicle.entity';
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
  paymentMethod: 'debito' | 'domiciliacion_tarjeta' | 'domiciliacion_cuenta' | 'none';
  payerDocType?: string;
  payerDocNumber?: string;
  payerFirstName?: string;
  payerLastName?: string;
  // Débito
  debitBankCode?: string;
  debitValidationType?: string;
  debitPayerIdentifier?: string;
  debitToken?: string;
  // Tarjeta
  cardNumber?: string;
  cardExpiryDate?: string;
  cardBankCode?: string;
  cardType?: string;
  // Cuenta
  accountPhone?: string;
  selectedBanks?: string[];
  // General
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

@Injectable()
export class MercantilStorageService {
  constructor(
    @InjectRepository(MercantilClientEntity)
    private readonly clientRepo: Repository<MercantilClientEntity>,
    @InjectRepository(MercantilPaymentQuoteEntity)
    private readonly quoteRepo: Repository<MercantilPaymentQuoteEntity>,
    @InjectRepository(MercantilPaymentEntity)
    private readonly paymentRepo: Repository<MercantilPaymentEntity>,
    @InjectRepository(MercantilPolicyEntity)
    private readonly policyRepo: Repository<MercantilPolicyEntity>,
    @InjectRepository(MercantilPaymentTraceEntity)
    private readonly traceRepo: Repository<MercantilPaymentTraceEntity>,
    @InjectRepository(MercantilVehicleEntity)
    private readonly vehicleRepo: Repository<MercantilVehicleEntity>,
  ) {}

  async saveClient(dto: SaveClientDto): Promise<MercantilClientEntity> {
    // Si ya existe para este shopcart, actualizar
    const existing = await this.clientRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    const entity = existing ?? new MercantilClientEntity();
    if (!existing) {
      entity.id = randomUUID();
    }

    entity.shopcartId = dto.shopcartId;
    entity.clientId = dto.clientId ?? null;
    entity.firstName = dto.firstName;
    entity.lastName = dto.lastName;
    entity.email = dto.email;
    entity.dniType = dto.dniType;
    entity.dniNumber = dto.dniNumber;
    entity.dniVenNationality = dto.dniVenNationality ?? null;
    entity.birthDate = dto.birthDate;
    entity.genderId = dto.genderId;
    entity.countryOfBirthId = dto.countryOfBirthId ?? null;
    entity.civilStateId = dto.civilStateId ?? null;
    entity.phoneCountryId = dto.phone?.countryId ?? null;
    entity.phoneAreaCode = dto.phone?.areaCode ?? null;
    entity.phoneNumber = dto.phone?.number ?? null;
    entity.addressCountryId = dto.address?.countryId ?? null;
    entity.addressAdministrativeAreaId = dto.address?.administrativeAreaId ?? null;
    entity.addressSubadministrativeAreaId = dto.address?.subadministrativeAreaId ?? null;
    entity.addressLocalityId = dto.address?.localityId ?? null;
    entity.addressZoneId = dto.address?.zoneId ?? null;
    entity.addressPostalCode = dto.address?.postalCode ?? null;
    entity.addressLine = dto.address?.address1 ?? null;
    entity.rawData = dto.rawData ?? null;

    return this.clientRepo.save(entity);
  }

  async savePaymentQuotes(dto: SavePaymentQuotesDto): Promise<MercantilPaymentQuoteEntity[]> {
    // Eliminar quotes anteriores para esta póliza
    await this.quoteRepo.delete({
      shopcartId: dto.shopcartId,
      policyId: dto.policyId,
    });

    const entities = dto.quotes.map((q) => {
      const entity = new MercantilPaymentQuoteEntity();
      entity.id = randomUUID();
      entity.shopcartId = dto.shopcartId;
      entity.policyId = dto.policyId;
      entity.policyNumber = dto.policyNumber ?? null;
      entity.quote = q.quote;
      entity.agreement = q.agreement ?? null;
      entity.receipt = q.receipt ?? null;
      entity.receiptStatus = q.receiptStatus ?? null;
      entity.quoteStatus = q.quoteStatus ?? null;
      entity.isNextDuePayment = q.isNextDuePayment ?? false;
      entity.isPaid = q.isPaid ?? false;
      entity.amount = q.amount ?? null;
      entity.expirationDate = q.expirationDate ?? null;
      entity.rawData = q.rawData ?? null;
      return entity;
    });

    return this.quoteRepo.save(entities);
  }

  async getClientByShopcart(shopcartId: string): Promise<MercantilClientEntity | null> {
    return this.clientRepo.findOne({ where: { shopcartId } });
  }

  async resolveExistingClient(dto: ResolveClientDto): Promise<MercantilClientEntity | null> {
    if (dto.clientId?.trim()) {
      const byClientId = await this.clientRepo.findOne({
        where: { clientId: dto.clientId.trim() },
        order: { updatedAt: 'DESC' },
      });

      if (byClientId) {
        return byClientId;
      }
    }

    if (dto.dniType?.trim() && dto.dniNumber?.trim()) {
      return this.clientRepo.findOne({
        where: {
          dniType: dto.dniType.trim(),
          dniNumber: dto.dniNumber.trim(),
        },
        order: { updatedAt: 'DESC' },
      });
    }

    return null;
  }

  async getQuotesByShopcart(shopcartId: string): Promise<MercantilPaymentQuoteEntity[]> {
    return this.quoteRepo.find({ where: { shopcartId } });
  }

  async getQuotesByPolicy(policyId: string): Promise<MercantilPaymentQuoteEntity[]> {
    return this.quoteRepo.find({ where: { policyId } });
  }

  async savePayment(dto: SavePaymentDto): Promise<MercantilPaymentEntity> {
    const existing = await this.paymentRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    const entity = existing ?? new MercantilPaymentEntity();
    if (!existing) {
      entity.id = randomUUID();
    }

    entity.shopcartId = dto.shopcartId;
    entity.clientId = dto.clientId ?? null;
    entity.paymentMethod = dto.paymentMethod;
    entity.payerDocType = dto.payerDocType ?? null;
    entity.payerDocNumber = dto.payerDocNumber ?? null;
    entity.payerFirstName = dto.payerFirstName ?? null;
    entity.payerLastName = dto.payerLastName ?? null;
    entity.debitBankCode = dto.debitBankCode ?? null;
    entity.debitValidationType = dto.debitValidationType ?? null;
    entity.debitPayerIdentifier = dto.debitPayerIdentifier ?? null;
    entity.debitToken = dto.debitToken ?? null;
    entity.cardNumber = dto.cardNumber ?? null;
    entity.cardExpiryDate = dto.cardExpiryDate ?? null;
    entity.cardBankCode = dto.cardBankCode ?? null;
    entity.cardType = dto.cardType ?? null;
    entity.accountPhone = dto.accountPhone ?? null;
    entity.selectedBanks = dto.selectedBanks ?? null;
    entity.amount = dto.amount ?? null;
    entity.status = dto.status;
    entity.concept = dto.concept ?? null;
    entity.provider = dto.provider ?? null;
    entity.rawData = dto.rawData ?? null;

    return this.paymentRepo.save(entity);
  }

  async getPaymentByShopcart(shopcartId: string): Promise<MercantilPaymentEntity | null> {
    return this.paymentRepo.findOne({ where: { shopcartId } });
  }

  async savePolicies(dto: {
    shopcartId: string;
    clientId?: string;
    dniType?: string;
    dniNumber?: string;
    paymentFrequency?: MercantilPaymentFrequency;
    policies: SavePolicyDto[];
  }): Promise<MercantilPolicyEntity[]> {
    await this.policyRepo.delete({ shopcartId: dto.shopcartId });

    const entities = dto.policies.map((p) => {
      const entity = new MercantilPolicyEntity();
      entity.id = randomUUID();
      entity.shopcartId = dto.shopcartId;
      entity.clientId = p.clientId ?? dto.clientId ?? null;
      entity.dniType = p.dniType ?? dto.dniType ?? null;
      entity.dniNumber = p.dniNumber ?? dto.dniNumber ?? null;
      entity.policyId = p.policyId;
      entity.policyNumber = p.policyNumber ?? null;
      entity.number = p.number ?? null;
      entity.entity = p.entity ?? null;
      entity.area = p.area ?? null;
      entity.certificateNumber = p.certificateNumber ?? null;
      entity.title = p.title ?? null;
      entity.status = p.status ?? null;
      entity.paymentFrequency = p.paymentFrequency ?? dto.paymentFrequency ?? null;
      entity.assuredSum = p.assuredSum ?? null;
      entity.quotedAmount = p.quotedAmount ?? null;
      entity.annualPremium = p.annualPremium ?? null;
      entity.startDate = p.startDate ?? null;
      entity.endDate = p.endDate ?? null;
      entity.rawData = p.rawData ?? null;
      return entity;
    });

    return this.policyRepo.save(entities);
  }

  async getPoliciesByShopcart(shopcartId: string): Promise<MercantilPolicyEntity[]> {
    return this.policyRepo.find({ where: { shopcartId } });
  }

  async saveTrace(dto: SaveTraceDto): Promise<MercantilPaymentTraceEntity> {
    const entity = new MercantilPaymentTraceEntity();
    entity.id = randomUUID();
    entity.shopcartId = dto.shopcartId;
    entity.clientId = dto.clientId ?? null;
    entity.dniType = dto.dniType ?? null;
    entity.dniNumber = dto.dniNumber ?? null;
    entity.stage = dto.stage;
    entity.status = dto.status;
    entity.message = dto.message;
    entity.errorCode = dto.errorCode ?? null;
    entity.errorStack = dto.errorStack ?? null;
    entity.payload = dto.payload ?? null;
    entity.response = dto.response ?? null;
    return this.traceRepo.save(entity);
  }

  async getTracesByShopcart(shopcartId: string): Promise<MercantilPaymentTraceEntity[]> {
    return this.traceRepo.find({ where: { shopcartId } });
  }

  async searchClients(dto: SearchMercantilClientsDto): Promise<{
    items: MercantilClientListItemDto[];
    count: number;
    page: number;
    perPage: number;
  }> {
    const page = Math.max(1, dto.page ?? 1);
    const perPage = Math.min(100, Math.max(1, dto.perPage ?? 20));

    const qb = this.clientRepo.createQueryBuilder('c');

    if (dto.clientId?.trim()) qb.andWhere('c.clientId = :clientId', { clientId: dto.clientId.trim() });
    if (dto.dniType?.trim()) qb.andWhere('c.dniType = :dniType', { dniType: dto.dniType.trim() });
    if (dto.dniNumber?.trim()) qb.andWhere('c.dniNumber LIKE :dniNumber', { dniNumber: `%${dto.dniNumber.trim()}%` });
    if (dto.name?.trim()) qb.andWhere('LOWER(c.firstName) LIKE :name', { name: `%${dto.name.trim().toLowerCase()}%` });
    if (dto.lastName?.trim()) qb.andWhere('LOWER(c.lastName) LIKE :lastName', { lastName: `%${dto.lastName.trim().toLowerCase()}%` });
    if (dto.email?.trim()) qb.andWhere('LOWER(c.email) LIKE :email', { email: `%${dto.email.trim().toLowerCase()}%` });

    qb.orderBy('c.updatedAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [clients, count] = await qb.getManyAndCount();

    const items: MercantilClientListItemDto[] = [];
    for (const client of clients) {
      const [policies, quotes] = await Promise.all([
        this.policyRepo.find({ where: { shopcartId: client.shopcartId } }),
        this.quoteRepo.find({ where: { shopcartId: client.shopcartId } }),
      ]);

      const paidQuotes = quotes.filter((quote) => {
        if (quote.isPaid) return true;
        if (!quote.receiptStatus) return false;
        return quote.receiptStatus.toLowerCase() === 'paid';
      }).length;

      const profileKey = client.clientId
        ? `client-${client.clientId}`
        : `dni-${client.dniType}-${client.dniNumber}`;

      items.push({
        shopcartId: client.shopcartId,
        clientId: client.clientId,
        dniType: client.dniType,
        dniNumber: client.dniNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        policiesCount: policies.length,
        quotesCount: quotes.length,
        paidQuotes,
        pendingQuotes: Math.max(0, quotes.length - paidQuotes),
        profileKey,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      });
    }

    return { items, count, page, perPage };
  }

  async saveVehicle(dto: SaveVehicleDto): Promise<MercantilVehicleEntity> {
    const existing = await this.vehicleRepo.findOne({
      where: { shopcartId: dto.shopcartId },
    });

    const entity = existing ?? new MercantilVehicleEntity();
    if (!existing) {
      entity.id = randomUUID();
    }

    entity.shopcartId = dto.shopcartId;
    entity.clientId = dto.clientId ?? null;
    entity.policyId = dto.policyId ?? null;
    entity.vehicleTypeId = dto.vehicleTypeId ?? null;
    entity.year = dto.year;
    entity.brandCode = dto.brandCode;
    entity.brandName = dto.brandName ?? null;
    entity.modelCode = dto.modelCode;
    entity.modelName = dto.modelName ?? null;
    entity.versionCode = dto.versionCode;
    entity.versionName = dto.versionName ?? null;
    entity.commonLocationId = dto.commonLocationId ?? null;
    entity.commonLocationName = dto.commonLocationName ?? null;
    entity.isArmored = dto.isArmored ?? null;
    entity.plate = dto.plate ?? null;
    entity.colorId = dto.colorId ?? null;
    entity.colorName = dto.colorName ?? null;
    entity.chassisSerial = dto.chassisSerial ?? null;
    entity.engineSerial = dto.engineSerial ?? null;
    entity.rawData = dto.rawData ?? null;

    return this.vehicleRepo.save(entity);
  }

  async getVehicleByShopcart(shopcartId: string): Promise<MercantilVehicleEntity | null> {
    return this.vehicleRepo.findOne({ where: { shopcartId } });
  }

  async markQuoteAsPaid(id: string): Promise<void> {
    const quote = await this.quoteRepo.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Cuota no encontrada');
    }
    quote.isPaid = true;
    quote.receiptStatus = 'paid';
    await this.quoteRepo.save(quote);
  }

  async getClientProfile(filters: {
    clientId?: string;
    dniType?: string;
    dniNumber?: string;
  }): Promise<MercantilClientProfileDto | null> {
    const hasClientId = Boolean(filters.clientId?.trim());
    const hasDni = Boolean(filters.dniType?.trim() && filters.dniNumber?.trim());

    if (!hasClientId && !hasDni) {
      return null;
    }

    const where = hasClientId
      ? { clientId: filters.clientId!.trim() }
      : {
          dniType: filters.dniType!.trim(),
          dniNumber: filters.dniNumber!.trim(),
        };

    const client = await this.clientRepo.findOne({
      where,
      order: { updatedAt: 'DESC' },
    });

    if (!client) {
      return null;
    }

    const [policies, quotes] = await Promise.all([
      this.policyRepo.find({
        where: { shopcartId: client.shopcartId },
        order: { createdAt: 'DESC' },
      }),
      this.quoteRepo.find({
        where: { shopcartId: client.shopcartId },
        order: { createdAt: 'ASC' },
      }),
    ]);

    // Vehicle query is optional — table may not exist in all environments yet
    let vehicle: MercantilVehicleEntity | null = null;
    try {
      vehicle = await this.vehicleRepo.findOne({
        where: { shopcartId: client.shopcartId },
      });
    } catch {
      // Table likely doesn't exist — ignore
    }

    const quotesByPolicyId = new Map<string, MercantilPaymentQuoteEntity[]>();
    for (const quote of quotes) {
      const key = quote.policyId;
      const current = quotesByPolicyId.get(key) ?? [];
      current.push(quote);
      quotesByPolicyId.set(key, current);
    }

    const paidQuotes = quotes.filter((quote) => {
      if (quote.isPaid) return true;
      if (!quote.receiptStatus) return false;
      return quote.receiptStatus.toLowerCase() === 'paid';
    }).length;

    return {
      client: {
        shopcartId: client.shopcartId,
        clientId: client.clientId,
        dniType: client.dniType,
        dniNumber: client.dniNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        birthDate: client.birthDate,
        genderId: client.genderId,
        phone: {
          countryId: client.phoneCountryId,
          areaCode: client.phoneAreaCode,
          number: client.phoneNumber,
        },
      },
      summary: {
        policiesCount: policies.length,
        quotesCount: quotes.length,
        paidQuotes,
        pendingQuotes: Math.max(0, quotes.length - paidQuotes),
      },
      policies: policies.map((policy) => ({
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
        quotes: (quotesByPolicyId.get(policy.policyId) ?? []).map((quote) => ({
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
        })),
      })),
      vehicle: vehicle ? {
        id: vehicle.id,
        shopcartId: vehicle.shopcartId,
        year: vehicle.year,
        brandCode: vehicle.brandCode,
        brandName: vehicle.brandName,
        modelCode: vehicle.modelCode,
        modelName: vehicle.modelName,
        versionCode: vehicle.versionCode,
        versionName: vehicle.versionName,
        vehicleTypeId: vehicle.vehicleTypeId,
        commonLocationId: vehicle.commonLocationId,
        commonLocationName: vehicle.commonLocationName,
        isArmored: vehicle.isArmored,
        plate: vehicle.plate,
        colorId: vehicle.colorId,
        colorName: vehicle.colorName,
        chassisSerial: vehicle.chassisSerial,
        engineSerial: vehicle.engineSerial,
      } : null,
    };
  }
}
