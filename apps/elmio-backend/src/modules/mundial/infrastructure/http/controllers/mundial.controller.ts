import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MundialService, MulterFile } from '../../../application/services/mundial.service';
import { MundialStorageService } from '../../../application/services/mundial-storage.service';
import { BucketService } from '../../../../bucket/application/services/bucket.service';

type FinalizePersistenceBody = {
  client?: Record<string, any>;
  vehicle?: Record<string, any>;
  dniDocument?: Record<string, any>;
  vehiclePropertyDocument?: Record<string, any>;
};

@Controller('mundial')
export class MundialController {
  private readonly logger = new Logger(MundialController.name);

  constructor(
    private readonly mundialService: MundialService,
    private readonly mundialStorageService: MundialStorageService,
    private readonly bucketService: BucketService,
  ) {}

  @Post('inma/year')
  getYears() {
    return this.mundialService.post('/inma/year', {});
  }

  @Post('inma/marca')
  getBrands(@Body() body: Record<string, any>) {
    return this.mundialService.post('/inma/marca', body);
  }

  @Post('inma/modelo')
  getModels(@Body() body: Record<string, any>) {
    return this.mundialService.post('/inma/modelo', body);
  }

  @Post('inma/version')
  getVersions(@Body() body: Record<string, any>) {
    return this.mundialService.post('/inma/version', body);
  }

  @Get('auto-products/vehicles/colors')
  getVehicleColors() {
    return [];
  }

  @Post('external/getCategoriasUso')
  getCategoriasUso(@Body() body: Record<string, any>) {
    return this.mundialService.post('/external/getCategoriasUso', body);
  }

  @Post('external/getCotizacionAuto')
  getCotizacionAuto(@Body() body: Record<string, any>) {
    return this.mundialService.post('/external/getCotizacionAuto', body);
  }

  @Post('external/validateEmissionAuto')
  validateEmissionAuto(@Body() body: Record<string, any>) {
    return this.mundialService.post('/external/validateEmissionAuto', body);
  }

  @Post('external/createEmissionAuto')
  async createEmissionAuto(
    @Query('shopcartId') shopcartId: string,
    @Body() body: Record<string, any>,
  ) {
    const startedAt = Date.now();
    const flowMeta = { shopcartId };

    this.logger.log(
      `[MUNDIAL EMISSION] emission_start ${JSON.stringify(flowMeta)}`,
    );

    let emitResponse: any;
    try {
      emitResponse = await this.mundialService.post(
        '/external/createEmissionAuto',
        body,
      );

      this.logger.log(
        `[MUNDIAL EMISSION] emission_upstream_ok ${JSON.stringify(flowMeta)}`,
      );

      await this.mundialStorageService.saveTrace({
        shopcartId,
        stage: 'emit',
        status: 'success',
        message: 'Emisión upstream completada',
        payload: body,
        response: emitResponse,
      });

      if (emitResponse?.status && emitResponse?.data?.cpoliza) {
        const policies = [
          {
            id: emitResponse.data.cpoliza,
            policyId: emitResponse.data.cpoliza,
            policyNumber: emitResponse.data.cpoliza,
            number: emitResponse.data.cpoliza,
            entity: 'MUNDIAL',
            title: 'Póliza RCV La Mundial',
            status: emitResponse.data.status || 'emitted',
            rawData: emitResponse.data,
            startDate: body.fdesde,
            endDate: body.fhasta,
          },
        ];
        await this.mundialStorageService.savePolicies(shopcartId, policies);
      }
    } catch (error) {
      this.logger.error(
        `[MUNDIAL EMISSION] emission_upstream_fail ${JSON.stringify(flowMeta)}`,
        error instanceof Error ? error.stack : undefined,
      );

      await this.mundialStorageService.saveTrace({
        shopcartId,
        stage: 'emit',
        status: 'failed',
        message: 'Fallo al emitir en upstream',
        payload: body,
        response: {
          message: error instanceof Error ? error.message : String(error),
        },
        errorCode: 'EMIT_UPSTREAM_FAIL',
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }

    this.logger.log(
      `[MUNDIAL EMISSION] emission_end ${JSON.stringify({
        ...flowMeta,
        durationMs: Date.now() - startedAt,
      })}`,
    );

    return emitResponse;
  }

  @Post('valrep/state')
  getStates() {
    return this.mundialService.post('/valrep/state', {});
  }

  @Post('valrep/city')
  getCities(@Body() body: Record<string, any>) {
    return this.mundialService.post('/valrep/city', body);
  }

  @Get('valrep/list/:type')
  getList(@Param('type') type: string) {
    return this.mundialService.get(`/valrep/list/${type}`);
  }
  @Post('storage/dni-upload')
  @UseInterceptors(FileInterceptor('dniFile'))
  async uploadDniToBucket(
    @UploadedFile() file: MulterFile,
    @Body('fileName') fileName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo dniFile es requerido');
    }

    const resolvedFileName = fileName?.trim() || `mundial-dni-${Date.now()}`;

    return this.bucketService.uploadFile(
      file,
      resolvedFileName,
      'mundial-dni',
    );
  }

  @Post('storage/vehicle-property-upload')
  @UseInterceptors(FileInterceptor('vehiclePropertyFile'))
  async uploadVehiclePropertyToBucket(
    @UploadedFile() file: MulterFile,
    @Body('fileName') fileName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo vehiclePropertyFile es requerido');
    }

    const resolvedFileName = fileName?.trim() || `mundial-vehicle-property-${Date.now()}`;

    return this.bucketService.uploadFile(
      file,
      resolvedFileName,
      'mundial-vehicle-property',
    );
  }

  @Post('storage/finalize-persistence')
  async finalizePersistence(
    @Query('shopcartId') shopcartId: string,
    @Body() body: FinalizePersistenceBody,
  ) {
    if (!shopcartId) {
      throw new BadRequestException('El parámetro shopcartId es requerido');
    }

    await this.mundialStorageService.saveTrace({
      shopcartId,
      stage: 'finalize_persistence',
      status: 'success',
      message: 'Inicio de persistencia final La Mundial',
      payload: {
        hasClient: Boolean(body.client),
        hasVehicle: Boolean(body.vehicle),
        hasDniDocument: Boolean(body.dniDocument),
        hasVehiclePropertyDocument: Boolean(body.vehiclePropertyDocument),
      },
    });

    let savedClient: any = null;
    if (body.client) {
      const clientRawData = {
        ...(body.client.rawData || body.client),
        ...(body.dniDocument ? { dniDocument: body.dniDocument } : {}),
      };

      savedClient = await this.mundialStorageService.saveClient({
        shopcartId,
        firstName: body.client.firstName || '',
        lastName: body.client.lastName || '',
        email: body.client.email || '',
        dniType: body.client.dniType || 'V',
        dniNumber: body.client.dniNumber || '',
        dniVenNationality: body.client.dniVenNationality || body.client.dniType || 'V',
        birthDate: body.client.birthDate || '',
        genderId: body.client.genderId || 'M',
        civilStateId: body.client.civilStateId || 'S',
        phone: body.client.phone,
        address: body.client.address,
        rawData: clientRawData,
      });
    }

    if (body.vehicle) {
      const vehicleRawData = {
        ...(body.vehicle.rawData || body.vehicle),
        ...(body.vehiclePropertyDocument ? { vehiclePropertyDocument: body.vehiclePropertyDocument } : {}),
      };

      await this.mundialStorageService.saveVehicle({
        shopcartId,
        year: body.vehicle.year || '',
        brandCode: body.vehicle.brandCode || '',
        brandName: body.vehicle.brandName || '',
        modelCode: body.vehicle.modelCode || '',
        modelName: body.vehicle.modelName || '',
        versionCode: body.vehicle.versionCode || '',
        versionName: body.vehicle.versionName || '',
        isArmored: body.vehicle.isArmored || false,
        plate: body.vehicle.plate || '',
        colorId: body.vehicle.colorId || '',
        colorName: body.vehicle.colorName || '',
        chassisSerial: body.vehicle.chassisSerial || '',
        engineSerial: body.vehicle.engineSerial || '',
        rawData: vehicleRawData,
      });
    }

    await this.mundialStorageService.saveTrace({
      shopcartId,
      stage: 'finalize_persistence',
      status: 'success',
      message: 'Persistencia final La Mundial completada',
    });

    return {
      success: true,
      shopcartId,
      policiesSaved: 1,
    };
  }

  @Get('storage/payment-quotes')
  getQuotesByShopcart(@Query('shopcartId') shopcartId: string) {
    return [];
  }
}
