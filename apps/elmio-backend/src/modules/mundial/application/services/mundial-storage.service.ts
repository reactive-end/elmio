import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { InsuranceOrderEntity } from '../../../mercantil/infrastructure/persistence/entities/insurance-order.entity';
import { InsurancePaymentTraceEntity } from '../../../mercantil/infrastructure/persistence/entities/insurance-payment-trace.entity';

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

export interface SaveTraceDto {
  shopcartId: string;
  stage: string;
  status: string;
  message: string;
  clientId?: string;
  dniType?: string;
  dniNumber?: string;
  errorCode?: string;
  errorStack?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
}

@Injectable()
export class MundialStorageService {
  constructor(
    @InjectRepository(InsuranceOrderEntity)
    private readonly orderRepo: Repository<InsuranceOrderEntity>,
    @InjectRepository(InsurancePaymentTraceEntity)
    private readonly traceRepo: Repository<InsurancePaymentTraceEntity>,
  ) {}

  async getClientByShopcart(shopcartId: string) {
    return this.orderRepo.findOne({
      where: { shopcartId, provider: 'mundial' },
    });
  }

  async saveClient(dto: SaveClientDto) {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId, provider: 'mundial' },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mundial';
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

    return this.orderRepo.save(order);
  }

  async saveVehicle(dto: SaveVehicleDto) {
    let order = await this.orderRepo.findOne({
      where: { shopcartId: dto.shopcartId, provider: 'mundial' },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = dto.shopcartId;
      order.provider = 'mundial';
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
      isArmored: dto.isArmored ?? false,
      plate: dto.plate ?? null,
      colorId: dto.colorId ?? null,
      colorName: dto.colorName ?? null,
      chassisSerial: dto.chassisSerial ?? null,
      engineSerial: dto.engineSerial ?? null,
      rawData: dto.rawData ?? null,
    };

    return this.orderRepo.save(order);
  }

  async savePolicies(shopcartId: string, policies: any[]) {
    let order = await this.orderRepo.findOne({
      where: { shopcartId, provider: 'mundial' },
    });

    if (!order) {
      order = new InsuranceOrderEntity();
      order.id = randomUUID();
      order.shopcartId = shopcartId;
      order.provider = 'mundial';
    }

    order.status = 'emitted';
    order.policiesSnapshot = { policies };

    return this.orderRepo.save(order);
  }

  async saveTrace(dto: SaveTraceDto) {
    const trace = new InsurancePaymentTraceEntity();
    trace.id = randomUUID();
    trace.shopcartId = dto.shopcartId;
    trace.provider = 'mundial';
    trace.stage = dto.stage;
    trace.status = dto.status;
    trace.message = dto.message;
    trace.errorCode = dto.errorCode ?? null;
    trace.errorStack = dto.errorStack ?? null;
    trace.payload = dto.payload ?? null;
    trace.response = dto.response ?? null;

    return this.traceRepo.save(trace);
  }
}
