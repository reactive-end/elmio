import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { MercantilService, MulterFile } from '../../../application/services/mercantil.service';
import { MercantilStorageService } from '../../../application/services/mercantil-storage.service';
import { BucketService } from '../../../../bucket/application/services/bucket.service';
import {
  MercantilPaymentFrequency,
  MercantilPolicyStatus,
  MercantilQuoteStatus,
} from '../../../application/types/mercantil-persistence.types';

type FinalizePersistenceBody = {
  client?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  dniDocument?: Record<string, unknown>;
};

@Controller('api/v1/mercantil')
export class MercantilController {
  private readonly logger = new Logger(MercantilController.name);
  private readonly countryMercantilId: string;

  constructor(
    private readonly mercantilService: MercantilService,
    private readonly mercantilStorageService: MercantilStorageService,
    private readonly bucketService: BucketService,
    private readonly configService: ConfigService,
  ) {
    this.countryMercantilId = this.configService.get<string>('COUNTRY_MERCANTIL_ID') || '29';
  }

  // Información General
  @Get('health')
  getHealth() {
    return this.mercantilService.get('/ally-api/health');
  }

  @Get('countries')
  getCountries() {
    return this.mercantilService.get('/ally-api/countries');
  }

  @Get('countries/:countryId/locations')
  getCountryLocations(@Param('countryId') countryId: string) {
    return this.mercantilService.get(`/ally-api/countries/${countryId}/locations`);
  }

  @Get('sales-channels')
  getSalesChannels() {
    return this.mercantilService.get('/ally-api/sales-channels');
  }

  @Get('shopcarts-by-clients')
  getShopcartsByClients(
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.mercantilService.get('/ally-api/shopcarts-by-clients', {
      clientId,
      page,
      perPage,
    });
  }

  // Información de Clientes
  @Get('clients/exists')
  getClientExists(
    @Query('birthDate') birthDate: string,
    @Query('dniType') dniType: string,
    @Query('dniNumber') dniNumber: string,
    @Query('dniVenNationality') dniVenNationality?: string,
  ) {
    return this.mercantilService.get('/ally-api/clients/exists', {
      birthDate,
      dniType,
      dniNumber,
      dniVenNationality,
    });
  }

  @Post('clients')
  createClient(@Body() body: Record<string, unknown>) {
    return this.mercantilService.post('/ally-api/clients', body);
  }

  @Put('clients/:clientId/complete')
  completeClient(
    @Param('clientId') clientId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.mercantilService.put(`/ally-api/clients/${clientId}/complete`, body);
  }

  // Productos Vitales
  @Get('products')
  getProducts() {
    return this.mercantilService.get('/ally-api/products');
  }

  @Get('products/plans/tentative-client')
  getTentativeClientPlans(
    @Query('genderId') genderId?: string,
    @Query('birthDate') birthDate?: string,
  ) {
    return this.mercantilService.get('/ally-api/products/plans/tentative-client', {
      countryId: this.countryMercantilId,
      genderId,
      birthDate,
    });
  }

  @Get('products/plans/client/:clientId')
  getClientPlans(@Param('clientId') clientId: string) {
    return this.mercantilService.get(`/ally-api/products/plans/client/${clientId}`);
  }

  @Get('products/:productId/rates')
  getProductRates(@Param('productId') productId: string) {
    return this.mercantilService.get(`/ally-api/products/${productId}/rates`);
  }

  // Productos Auto
  @Get('auto-products/vehicles/vehicle-information')
  getVehicleInformation(
    @Query('year') year?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('version') version?: string,
  ) {
    return this.mercantilService.get('/ally-api/auto-products/vehicles/vehicle-information', {
      year,
      brand,
      model,
      version,
    });
  }

  @Get('auto-products/vehicles/colors')
  getVehicleColors() {
    return this.mercantilService.get('/ally-api/auto-products/vehicles/colors');
  }

  @Get('auto-products/vehicles/locations')
  getVehicleLocations() {
    return this.mercantilService.get('/ally-api/auto-products/vehicles/locations');
  }

  @Get('auto-products/plans/client')
  getAutoPlansByClient(@Query('vehicleTypeId') vehicleTypeId: string) {
    return this.mercantilService.get('/ally-api/auto-products/plans/client', {
      vehicleTypeId,
    });
  }

  @Post('auto-products/vehicles/complete-vehicle-info')
  completeVehicleInfo(
    @Query('shopcartId') shopcartId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.mercantilService.post(
      '/ally-api/auto-products/vehicles/complete-vehicle-info',
      body,
      { shopcartId },
    );
  }

  // Carritos de Compra
  @Post('shopcarts')
  createShopcart(@Body() body: Record<string, unknown>) {
    return this.mercantilService.post('/ally-api/shopcarts', body);
  }

  @Post('shopcarts/:shopcartId/products')
  addProductToShopcart(
    @Param('shopcartId') shopcartId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.mercantilService.post(`/ally-api/shopcarts/${shopcartId}/products`, body);
  }

  @Delete('shopcarts/:shopcartId/products/:productId')
  removeProductFromShopcart(
    @Param('shopcartId') shopcartId: string,
    @Param('productId') productId: string,
  ) {
    return this.mercantilService.delete(
      `/ally-api/shopcarts/${shopcartId}/products/${productId}`,
    );
  }

  @Put('shopcarts/:shopcartId/products/:productId')
  updateProductPlan(
    @Param('shopcartId') shopcartId: string,
    @Param('productId') productId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.mercantilService.put(
      `/ally-api/shopcarts/${shopcartId}/products/${productId}`,
      body,
    );
  }

  @Post('shopcarts/:shopcartId/products/load')
  bulkLoadProducts(
    @Param('shopcartId') shopcartId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.mercantilService.post(
      `/ally-api/shopcarts/${shopcartId}/products/load`,
      body,
    );
  }

  @Get('shopcarts/:shopcartId')
  getShopcartById(@Param('shopcartId') shopcartId: string) {
    return this.mercantilService.get(`/ally-api/shopcarts/${shopcartId}`);
  }

  @Get('shopcarts/:shopcartId/summary')
  getShopcartSummary(@Param('shopcartId') shopcartId: string) {
    return this.mercantilService.get(`/ally-api/shopcarts/${shopcartId}/summary`);
  }

  @Post('shopcarts/:shopcartId/dni')
  @UseInterceptors(FileInterceptor('dniFile'))
  uploadDni(
    @Param('shopcartId') shopcartId: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo dniFile es requerido');
    }

    return this.mercantilService.postFile(
      `/ally-api/shopcarts/${shopcartId}/dni`,
      'dniFile',
      file,
    );
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

    const resolvedFileName = fileName?.trim() || `mercantil-dni-${Date.now()}`;

    return this.bucketService.uploadFile(file, resolvedFileName, 'mercantil-dni');
  }

  @Post('shopcarts/:shopcartId/vehicle-property-title')
  @UseInterceptors(FileInterceptor('vehiclePropertyFile'))
  uploadVehiclePropertyTitle(
    @Param('shopcartId') shopcartId: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo vehiclePropertyFile es requerido');
    }

    return this.mercantilService.postFile(
      `/ally-api/shopcarts/${shopcartId}/vehicle-property-title`,
      'vehiclePropertyFile',
      file,
    );
  }

  @Post('shopcarts/:shopcartId/emit')
  emitShopcart(
    @Param('shopcartId') shopcartId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.emitAndPersist(shopcartId, body);
  }

  @Get('shopcarts/:shopcartId/emit')
  getEmissionStatus(@Param('shopcartId') shopcartId: string) {
    return this.mercantilService.get(`/ally-api/shopcarts/${shopcartId}/emit`);
  }

  @Get('shopcarts/:shopcartId/policies/:policyId/pdf')
  getPolicyPdf(
    @Param('shopcartId') shopcartId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.mercantilService.get(
      `/ally-api/shopcarts/${shopcartId}/policies/${policyId}/pdf`,
    );
  }

  
  // Pagos
  @Post('payments/notify-external-payment')
  notifyExternalPayment(
    @Body() body: Record<string, unknown>,
    @Query('shopcartId') shopcartId?: string,
  ) {
    return this.mercantilService.post(
      '/ally-api/payments/notify-external-payment',
      body,
      { shopcartId },
    );
  }

  @Get('payments/exchange-rate')
  getExchangeRate() {
    return this.mercantilService.get('/ally-api/payments/exchange-rate');
  }

  @Get('payments/policy/summary')
  getPolicySummary(
    @Query('entity') entity: string,
    @Query('area') area: string,
    @Query('number') number: string,
    @Query('receipt') receipt?: string,
  ) {
    return this.mercantilService.get('/ally-api/payments/policy/summary', {
      entity,
      area,
      number,
      receipt,
    });
  }

  // ============================================================
  // ALMACENAMIENTO LOCAL - CUOTAS Y CLIENTES
  // ============================================================

  @Post('storage/clients')
  saveClient(@Body() body: Record<string, unknown>) {
    return this.mercantilStorageService.saveClient(body as unknown as Parameters<MercantilStorageService['saveClient']>[0]);
  }

  @Post('storage/payment-quotes')
  savePaymentQuotes(@Body() body: Record<string, unknown>) {
    return this.mercantilStorageService.savePaymentQuotes(body as unknown as Parameters<MercantilStorageService['savePaymentQuotes']>[0]);
  }

  @Get('storage/clients')
  getClientByShopcart(@Query('shopcartId') shopcartId: string) {
    return this.mercantilStorageService.getClientByShopcart(shopcartId);
  }

  @Get('storage/payment-quotes')
  getQuotesByShopcart(@Query('shopcartId') shopcartId: string) {
    return this.mercantilStorageService.getQuotesByShopcart(shopcartId);
  }

  @Post('storage/payments')
  savePayment(@Body() body: Record<string, unknown>) {
    return this.mercantilStorageService.savePayment(body as unknown as Parameters<MercantilStorageService['savePayment']>[0]);
  }

  @Get('storage/payments')
  getPaymentByShopcart(@Query('shopcartId') shopcartId: string) {
    return this.mercantilStorageService.getPaymentByShopcart(shopcartId);
  }

  @Get('storage/clients/search')
  searchStoredClients(
    @Query('clientId') clientId?: string,
    @Query('dniType') dniType?: string,
    @Query('dniNumber') dniNumber?: string,
    @Query('name') name?: string,
    @Query('lastName') lastName?: string,
    @Query('email') email?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.mercantilStorageService.searchClients({
      clientId,
      dniType,
      dniNumber,
      name,
      lastName,
      email,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });
  }

  @Get('storage/clients/profile')
  getStoredClientProfile(
    @Query('clientId') clientId?: string,
    @Query('dniType') dniType?: string,
    @Query('dniNumber') dniNumber?: string,
  ) {
    return this.mercantilStorageService.getClientProfile({
      clientId,
      dniType,
      dniNumber,
    });
  }

  @Post('storage/quotes/:id/mark-paid')
  async markQuoteAsPaid(@Param('id') id: string) {
    await this.mercantilStorageService.markQuoteAsPaid(id);
    return { success: true };
  }

  @Post('shopcarts/:shopcartId/finalize-persistence')
  async finalizePersistence(
    @Param('shopcartId') shopcartId: string,
    @Body() body: FinalizePersistenceBody,
  ) {
    return this.finalizePersistenceForShopcart(shopcartId, body);
  }

  private async emitAndPersist(shopcartId: string, body: Record<string, unknown>): Promise<unknown> {
    const startedAt = Date.now();
    const flowMeta = { shopcartId };

    this.logger.log(`[MERCANTIL EMISSION] emission_start ${JSON.stringify(flowMeta)}`);

    let emitResponse: unknown;
    try {
      emitResponse = await this.mercantilService.post(`/ally-api/shopcarts/${shopcartId}/emit`, body);
      this.logger.log(`[MERCANTIL EMISSION] emission_upstream_ok ${JSON.stringify(flowMeta)}`);
      await this.safeTrace({
        shopcartId,
        stage: 'emit',
        status: 'success',
        message: 'Emision upstream completada',
        payload: this.asRecord(body),
        response: this.asRecord(emitResponse),
      });
    } catch (error) {
      this.logger.error(
        `[MERCANTIL EMISSION] emission_upstream_fail ${JSON.stringify(flowMeta)}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.safeTrace({
        shopcartId,
        stage: 'emit',
        status: 'failed',
        message: 'Fallo al emitir en upstream',
        payload: this.asRecord(body),
        response: this.errorToRecord(error),
        errorCode: 'EMIT_UPSTREAM_FAIL',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    this.logger.log(
      `[MERCANTIL EMISSION] emission_end ${JSON.stringify({
        ...flowMeta,
        durationMs: Date.now() - startedAt,
      })}`,
    );

    return emitResponse;
  }

  private async finalizePersistenceForShopcart(
    shopcartId: string,
    body: FinalizePersistenceBody,
  ): Promise<{ success: true; clientId: string | null; policiesSaved: number; quotesSaved: number }> {
    const clientSnapshot = this.asRecord(body.client);
    const dniDocument = this.asRecord(body.dniDocument);

    await this.safeTrace({
      shopcartId,
      clientId: this.readString(clientSnapshot, 'clientId') ?? undefined,
      dniType: this.readString(clientSnapshot, 'dniType') ?? undefined,
      dniNumber: this.readString(clientSnapshot, 'dniNumber') ?? undefined,
      stage: 'finalize_persistence',
      status: 'success',
      message: 'Inicio de persistencia final',
      payload: {
        hasClient: Boolean(clientSnapshot),
        hasDniDocument: Boolean(dniDocument),
      },
    });

    const emissionStatus = await this.safeGetFromMercantil(
      `/ally-api/shopcarts/${shopcartId}/emit`,
      'emit_status',
      shopcartId,
    );
    const emissionStatusRecord = this.asRecord(emissionStatus);

    if (this.readString(emissionStatusRecord, 'status') !== 'emitted') {
      throw new BadRequestException('La póliza aún no ha sido emitida');
    }

    const summary = await this.safeGetFromMercantil(
      `/ally-api/shopcarts/${shopcartId}/summary`,
      'shopcart_summary',
      shopcartId,
    );

    if (!summary) {
      throw new BadRequestException('No fue posible obtener el resumen del carrito');
    }

    const resolvedClient = await this.resolveAndPersistClient(shopcartId, clientSnapshot, dniDocument);

    const vehicleSnapshot = this.asRecord(body.vehicle);
    if (vehicleSnapshot) {
      try {
        await this.mercantilStorageService.saveVehicle({
          shopcartId,
          clientId: resolvedClient?.clientId ?? undefined,
          year: this.readString(vehicleSnapshot, 'year') ?? '',
          brandCode: this.readString(vehicleSnapshot, 'brandCode') ?? '',
          brandName: this.readString(vehicleSnapshot, 'brandName') ?? undefined,
          modelCode: this.readString(vehicleSnapshot, 'modelCode') ?? '',
          modelName: this.readString(vehicleSnapshot, 'modelName') ?? undefined,
          versionCode: this.readString(vehicleSnapshot, 'versionCode') ?? '',
          versionName: this.readString(vehicleSnapshot, 'versionName') ?? undefined,
          vehicleTypeId: this.readString(vehicleSnapshot, 'vehicleTypeId') ?? undefined,
          commonLocationId: this.readString(vehicleSnapshot, 'commonLocationId') ?? undefined,
          commonLocationName: this.readString(vehicleSnapshot, 'commonLocationName') ?? undefined,
          isArmored: this.readBoolean(vehicleSnapshot, 'isArmored') ?? undefined,
          plate: this.readString(vehicleSnapshot, 'plate') ?? undefined,
          colorId: this.readString(vehicleSnapshot, 'colorId') ?? undefined,
          colorName: this.readString(vehicleSnapshot, 'colorName') ?? undefined,
          chassisSerial: this.readString(vehicleSnapshot, 'chassisSerial') ?? undefined,
          engineSerial: this.readString(vehicleSnapshot, 'engineSerial') ?? undefined,
          rawData: vehicleSnapshot,
        });
      } catch (vehicleError) {
        this.logger.error(`Failed to persist vehicle for shopcart ${shopcartId}`, vehicleError instanceof Error ? vehicleError.stack : undefined);
      }
    }

    const { policiesSaved, quotesSaved } = await this.persistPoliciesAndQuotes(
      shopcartId,
      summary,
      resolvedClient?.clientId ?? null,
      resolvedClient?.dniType ?? null,
      resolvedClient?.dniNumber ?? null,
    );

    await this.safeTrace({
      shopcartId,
      clientId: resolvedClient?.clientId ?? undefined,
      dniType: resolvedClient?.dniType ?? undefined,
      dniNumber: resolvedClient?.dniNumber ?? undefined,
      stage: 'finalize_persistence',
      status: 'success',
      message: 'Persistencia final completada',
      response: {
        policiesSaved,
        quotesSaved,
      },
    });

    return {
      success: true,
      clientId: resolvedClient?.clientId ?? null,
      policiesSaved,
      quotesSaved,
    };
  }

  private async safePersistEmissionData(
    shopcartId: string,
    emitPayload: Record<string, unknown>,
  ): Promise<void> {
    const emissionStatus = await this.safeGetFromMercantil(
      `/ally-api/shopcarts/${shopcartId}/emit`,
      'emit_status',
      shopcartId,
    );
    const summary = await this.safeGetFromMercantil(
      `/ally-api/shopcarts/${shopcartId}/summary`,
      'shopcart_summary',
      shopcartId,
    );

    const localClient = await this.mercantilStorageService.getClientByShopcart(shopcartId);
    const clientId = localClient?.clientId ?? this.extractClientId(summary) ?? this.extractClientId(emissionStatus);
    const dniType = localClient?.dniType ?? this.extractDniType(summary) ?? this.extractDniType(emissionStatus);
    const dniNumber = localClient?.dniNumber ?? this.extractDniNumber(summary) ?? this.extractDniNumber(emissionStatus);

    if (localClient) {
      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_client',
        status: 'success',
        message: 'Cliente local encontrado y reutilizado',
      });
      this.logger.log(
        `[MERCANTIL EMISSION] persist_client_ok ${JSON.stringify({
          shopcartId,
          clientId,
          source: 'mercantil_clients',
        })}`,
      );
    } else {
      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_client',
        status: 'failed',
        message: 'No se encontro cliente local para este shopcartId',
        payload: { shopcartId, hasEmitPayload: Boolean(emitPayload) },
        errorCode: 'CLIENT_NOT_FOUND_IN_LOCAL_STORAGE',
      });
      this.logger.warn(
        `[MERCANTIL EMISSION] persist_client_skipped ${JSON.stringify({
          shopcartId,
          reason: 'client_not_found_in_local_storage',
        })}`,
      );
    }

    const summaryRecord = this.asRecord(summary);
    const summaryPolicies = this.extractPolicies(summaryRecord);
    const paymentFrequency = this.toPaymentFrequency(this.readString(summaryRecord, 'paymentFrequency'));

    if (summaryPolicies.length === 0) {
      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_policies',
        status: 'failed',
        message: 'No se encontraron polizas en el summary para persistir',
        payload: this.asRecord(summary),
        errorCode: 'NO_POLICIES_IN_SUMMARY',
      });
      this.logger.warn(
        `[MERCANTIL EMISSION] persist_policies_skipped ${JSON.stringify({
          shopcartId,
          reason: 'no_policies_in_summary',
        })}`,
      );
      return;
    }

    try {
      const savedPolicies = await this.mercantilStorageService.savePolicies({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        paymentFrequency: paymentFrequency ?? undefined,
        policies: summaryPolicies
          .map((policy) => {
            const policyId = this.readString(policy, 'id');
            if (!policyId) return null;
            return {
              shopcartId,
              clientId: clientId ?? undefined,
              dniType: dniType ?? undefined,
              dniNumber: dniNumber ?? undefined,
              policyId,
              policyNumber: this.readString(policy, 'policyNumber') ?? undefined,
              number: this.readString(policy, 'number') ?? undefined,
              entity: this.readString(policy, 'entity') ?? undefined,
              area: this.readString(policy, 'area') ?? undefined,
              certificateNumber: this.readString(policy, 'certificateNumber') ?? undefined,
              title: this.readString(policy, 'title') ?? undefined,
              status: this.toPolicyStatus(this.readString(policy, 'status')),
              paymentFrequency: paymentFrequency ?? undefined,
              assuredSum: this.readNumber(policy, 'assuredSum') ?? undefined,
              quotedAmount: this.readNumber(policy, 'quotedAmount') ?? undefined,
              annualPremium: this.readNumber(policy, 'annualPremium') ?? undefined,
              startDate: this.readString(policy, 'startDate') ?? undefined,
              endDate: this.readString(policy, 'endDate') ?? undefined,
              rawData: policy,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      });

      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_policies',
        status: 'success',
        message: 'Polizas persistidas exitosamente',
        response: {
          savedPolicies: savedPolicies.length,
        },
      });
      this.logger.log(
        `[MERCANTIL EMISSION] persist_policies_ok ${JSON.stringify({
          shopcartId,
          clientId,
          policies: savedPolicies.length,
        })}`,
      );
    } catch (error) {
      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_policies',
        status: 'failed',
        message: 'Fallo al persistir polizas',
        payload: this.asRecord(summary),
        response: this.errorToRecord(error),
        errorCode: 'PERSIST_POLICIES_FAIL',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      this.logger.error(
        `[MERCANTIL EMISSION] persist_policies_fail ${JSON.stringify({ shopcartId, clientId })}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    let quoteSavedCount = 0;
    for (const policy of summaryPolicies) {
      const policyId = this.readString(policy, 'id');
      if (!policyId) continue;

      const quotes = this.extractQuotes(policy).map((quote) => ({
        quote: this.readString(quote, 'quote') ?? '',
        agreement: this.readInteger(quote, 'agreement') ?? undefined,
        receipt: this.readInteger(quote, 'receipt') ?? undefined,
        receiptStatus: this.toQuoteStatus(this.readString(quote, 'receiptStatus')) ?? undefined,
        quoteStatus: this.toQuoteStatus(this.readString(quote, 'quoteStatus')) ?? undefined,
        isNextDuePayment: this.readBoolean(quote, 'isNextDuePayment') ?? false,
        isPaid: this.readBoolean(quote, 'isPaid') ?? false,
        amount: this.readNumber(quote, 'amount') ?? undefined,
        expirationDate: this.readString(quote, 'expirationDate') ?? undefined,
        rawData: quote,
      })).filter((quote) => quote.quote.length > 0);

      if (quotes.length === 0) continue;

      try {
        const savedQuotes = await this.mercantilStorageService.savePaymentQuotes({
          shopcartId,
          policyId,
          policyNumber: this.readString(policy, 'number')
            ?? this.readString(policy, 'policyNumber')
            ?? undefined,
          quotes,
        });
        quoteSavedCount += savedQuotes.length;
      } catch (error) {
        await this.safeTrace({
          shopcartId,
          clientId: clientId ?? undefined,
          dniType: dniType ?? undefined,
          dniNumber: dniNumber ?? undefined,
          stage: 'persist_quotes',
          status: 'failed',
          message: 'Fallo al persistir cuotas de una poliza',
          payload: { policyId },
          response: this.errorToRecord(error),
          errorCode: 'PERSIST_QUOTES_FAIL',
          errorStack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    await this.safeTrace({
      shopcartId,
      clientId: clientId ?? undefined,
      dniType: dniType ?? undefined,
      dniNumber: dniNumber ?? undefined,
      stage: 'persist_quotes',
      status: 'success',
      message: 'Proceso de persistencia de cuotas completado',
      response: {
        savedQuotes: quoteSavedCount,
      },
    });
    this.logger.log(
      `[MERCANTIL EMISSION] persist_quotes_ok ${JSON.stringify({
        shopcartId,
        clientId,
        savedQuotes: quoteSavedCount,
      })}`,
    );
  }

  private async safeGetFromMercantil(path: string, stage: 'emit_status' | 'shopcart_summary', shopcartId: string): Promise<unknown> {
    try {
      const data = await this.mercantilService.get(path);
      await this.safeTrace({
        shopcartId,
        stage,
        status: 'success',
        message: `Consulta ${stage} completada`,
        response: this.asRecord(data),
      });
      return data;
    } catch (error) {
      await this.safeTrace({
        shopcartId,
        stage,
        status: 'failed',
        message: `Consulta ${stage} fallida`,
        response: this.errorToRecord(error),
        errorCode: stage === 'emit_status' ? 'GET_EMIT_STATUS_FAIL' : 'GET_SHOPCART_SUMMARY_FAIL',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      this.logger.warn(
        `[MERCANTIL EMISSION] ${stage}_fail ${JSON.stringify({ shopcartId })}`,
      );
      return null;
    }
  }

  private async safeTrace(dto: Parameters<MercantilStorageService['saveTrace']>[0]): Promise<void> {
    try {
      await this.mercantilStorageService.saveTrace(dto);
    } catch (traceError) {
      this.logger.error(
        `[MERCANTIL TRACE] trace_save_fail ${JSON.stringify({
          shopcartId: dto.shopcartId,
          stage: dto.stage,
        })}`,
        traceError instanceof Error ? traceError.stack : undefined,
      );
    }
  }

  private extractPolicies(summary: Record<string, unknown> | null | undefined): Record<string, unknown>[] {
    if (!summary) return [];
    const policies = summary.policies;
    if (!Array.isArray(policies)) return [];
    return policies.filter((policy): policy is Record<string, unknown> => this.asRecord(policy) !== null)
      .map((policy) => policy as Record<string, unknown>);
  }

  private extractQuotes(policy: Record<string, unknown>): Record<string, unknown>[] {
    const quotes = policy.paymentQuotes;
    if (!Array.isArray(quotes)) return [];
    return quotes.filter((quote): quote is Record<string, unknown> => this.asRecord(quote) !== null)
      .map((quote) => quote as Record<string, unknown>);
  }

  private extractClientId(payload: unknown): string | null {
    if (!payload) return null;
    const record = this.asRecord(payload);
    if (!record) return null;
    return this.readString(record, 'clientId')
      ?? this.readString(this.asRecord(record.client), 'id')
      ?? this.readString(this.asRecord(record.client), 'clientId');
  }

  private extractDniType(payload: unknown): string | null {
    const record = this.asRecord(payload);
    if (!record) return null;
    return this.readString(record, 'dniType')
      ?? this.readString(this.asRecord(record.client), 'dniType')
      ?? this.readString(this.asRecord(record.client), 'documentType')
      ?? this.readString(this.asRecord(record.client), 'docType');
  }

  private extractDniNumber(payload: unknown): string | null {
    const record = this.asRecord(payload);
    if (!record) return null;
    return this.readString(record, 'dniNumber')
      ?? this.readString(this.asRecord(record.client), 'dniNumber')
      ?? this.readString(this.asRecord(record.client), 'documentNumber')
      ?? this.readString(this.asRecord(record.client), 'docNumber');
  }

  private toPolicyStatus(value: string | null): MercantilPolicyStatus | undefined {
    if (!value) return undefined;
    if (value === 'active' || value === 'upcoming_payment' || value === 'in_debt' || value === 'finished' || value === 'nullified') {
      return value;
    }
    return undefined;
  }

  private toQuoteStatus(value: string | null): MercantilQuoteStatus | undefined {
    if (!value) return undefined;
    if (value === 'paid' || value === 'upcoming_payment' || value === 'coming_soon') {
      return value;
    }
    return undefined;
  }

  private toPaymentFrequency(value: string | null): MercantilPaymentFrequency | undefined {
    if (!value) return undefined;
    if (value === 'monthly' || value === 'quarterly' || value === 'biannual' || value === 'yearly') {
      return value;
    }
    return undefined;
  }

  private readString(obj: Record<string, unknown> | null | undefined, key: string): string | null {
    if (!obj) return null;
    const value = obj[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (typeof value === 'number') return String(value);
    return null;
  }

  private readNumber(obj: Record<string, unknown> | null | undefined, key: string): number | null {
    if (!obj) return null;
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  private readInteger(obj: Record<string, unknown> | null | undefined, key: string): number | null {
    const value = this.readNumber(obj, key);
    if (value === null) return null;
    return Number.isInteger(value) ? value : Math.trunc(value);
  }

  private readBoolean(obj: Record<string, unknown> | null | undefined, key: string): boolean | null {
    if (!obj) return null;
    const value = obj[key];
    if (typeof value === 'boolean') return value;
    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
  }

  private errorToRecord(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }
    const unknownRecord = this.asRecord(error);
    return unknownRecord ?? { message: 'unknown_error' };
  }

  private async resolveAndPersistClient(
    shopcartId: string,
    clientSnapshot: Record<string, unknown> | null | undefined,
    dniDocument: Record<string, unknown> | null | undefined,
  ) {
    const existingClient = await this.mercantilStorageService.resolveExistingClient({
      clientId: this.readString(clientSnapshot, 'clientId') ?? undefined,
      dniType: this.readString(clientSnapshot, 'dniType') ?? undefined,
      dniNumber: this.readString(clientSnapshot, 'dniNumber') ?? undefined,
    });

    const resolvedClientId = existingClient?.clientId
      ?? this.readString(clientSnapshot, 'clientId')
      ?? null;
    const resolvedDniType = existingClient?.dniType
      ?? this.readString(clientSnapshot, 'dniType')
      ?? null;
    const resolvedDniNumber = existingClient?.dniNumber
      ?? this.readString(clientSnapshot, 'dniNumber')
      ?? null;

    if (!clientSnapshot) {
      await this.safeTrace({
        shopcartId,
        clientId: resolvedClientId ?? undefined,
        dniType: resolvedDniType ?? undefined,
        dniNumber: resolvedDniNumber ?? undefined,
        stage: 'persist_client',
        status: 'failed',
        message: 'No se recibio snapshot del cliente para persistir',
        errorCode: 'CLIENT_SNAPSHOT_REQUIRED',
      });
      return existingClient;
    }

    const rawData: Record<string, unknown> = {
      ...(this.asRecord(clientSnapshot.rawData) ?? {}),
    };

    if (dniDocument) {
      rawData.dniDocument = dniDocument;
    }

    const savedClient = await this.mercantilStorageService.saveClient({
      shopcartId,
      clientId: resolvedClientId ?? undefined,
      firstName: this.readString(clientSnapshot, 'firstName') ?? existingClient?.firstName ?? '',
      lastName: this.readString(clientSnapshot, 'lastName') ?? existingClient?.lastName ?? '',
      email: this.readString(clientSnapshot, 'email') ?? existingClient?.email ?? '',
      dniType: resolvedDniType ?? '',
      dniNumber: resolvedDniNumber ?? '',
      dniVenNationality: this.readString(clientSnapshot, 'dniVenNationality') ?? existingClient?.dniVenNationality ?? undefined,
      birthDate: this.readString(clientSnapshot, 'birthDate') ?? existingClient?.birthDate ?? '',
      genderId: this.readString(clientSnapshot, 'genderId') ?? existingClient?.genderId ?? '',
      countryOfBirthId: this.readString(clientSnapshot, 'countryOfBirthId') ?? existingClient?.countryOfBirthId ?? undefined,
      civilStateId: this.readString(clientSnapshot, 'civilStateId') ?? existingClient?.civilStateId ?? undefined,
      phone: {
        countryId: this.readString(this.asRecord(clientSnapshot.phone), 'countryId') ?? existingClient?.phoneCountryId ?? undefined,
        areaCode: this.readString(this.asRecord(clientSnapshot.phone), 'areaCode') ?? existingClient?.phoneAreaCode ?? undefined,
        number: this.readString(this.asRecord(clientSnapshot.phone), 'number') ?? existingClient?.phoneNumber ?? undefined,
      },
      address: {
        countryId: this.readString(this.asRecord(clientSnapshot.address), 'countryId') ?? existingClient?.addressCountryId ?? undefined,
        administrativeAreaId: this.readString(this.asRecord(clientSnapshot.address), 'administrativeAreaId') ?? existingClient?.addressAdministrativeAreaId ?? undefined,
        subadministrativeAreaId: this.readString(this.asRecord(clientSnapshot.address), 'subadministrativeAreaId') ?? existingClient?.addressSubadministrativeAreaId ?? undefined,
        localityId: this.readString(this.asRecord(clientSnapshot.address), 'localityId') ?? existingClient?.addressLocalityId ?? undefined,
        zoneId: this.readString(this.asRecord(clientSnapshot.address), 'zoneId') ?? existingClient?.addressZoneId ?? undefined,
        postalCode: this.readString(this.asRecord(clientSnapshot.address), 'postalCode') ?? existingClient?.addressPostalCode ?? undefined,
        address1: this.readString(this.asRecord(clientSnapshot.address), 'address1') ?? existingClient?.addressLine ?? undefined,
      },
      rawData,
    });

    await this.safeTrace({
      shopcartId,
      clientId: savedClient.clientId ?? undefined,
      dniType: savedClient.dniType,
      dniNumber: savedClient.dniNumber,
      stage: 'persist_client',
      status: 'success',
      message: existingClient ? 'Cliente existente asociado al carrito' : 'Cliente persistido para el carrito',
      response: {
        internalId: savedClient.id,
        clientId: savedClient.clientId,
      },
    });

    return savedClient;
  }

  private async persistPoliciesAndQuotes(
    shopcartId: string,
    summary: unknown,
    clientId: string | null,
    dniType: string | null,
    dniNumber: string | null,
  ): Promise<{ policiesSaved: number; quotesSaved: number }> {
    const summaryRecord = this.asRecord(summary);
    const summaryPolicies = this.extractPolicies(summaryRecord);
    const paymentFrequency = this.toPaymentFrequency(this.readString(summaryRecord, 'paymentFrequency'));

    if (summaryPolicies.length === 0) {
      await this.safeTrace({
        shopcartId,
        clientId: clientId ?? undefined,
        dniType: dniType ?? undefined,
        dniNumber: dniNumber ?? undefined,
        stage: 'persist_policies',
        status: 'failed',
        message: 'No se encontraron polizas en el summary para persistir',
        payload: this.asRecord(summary) ?? undefined,
        errorCode: 'NO_POLICIES_IN_SUMMARY',
      });
      return { policiesSaved: 0, quotesSaved: 0 };
    }

    const savedPolicies = await this.mercantilStorageService.savePolicies({
      shopcartId,
      clientId: clientId ?? undefined,
      dniType: dniType ?? undefined,
      dniNumber: dniNumber ?? undefined,
      paymentFrequency: paymentFrequency ?? undefined,
      policies: summaryPolicies
        .map((policy) => {
          const policyId = this.readString(policy, 'id');
          if (!policyId) return null;
          return {
            shopcartId,
            clientId: clientId ?? undefined,
            dniType: dniType ?? undefined,
            dniNumber: dniNumber ?? undefined,
            policyId,
            policyNumber: this.readString(policy, 'policyNumber') ?? undefined,
            number: this.readString(policy, 'number') ?? undefined,
            entity: this.readString(policy, 'entity') ?? undefined,
            area: this.readString(policy, 'area') ?? undefined,
            certificateNumber: this.readString(policy, 'certificateNumber') ?? undefined,
            title: this.readString(policy, 'title') ?? undefined,
            status: this.toPolicyStatus(this.readString(policy, 'status')),
            paymentFrequency: paymentFrequency ?? undefined,
            assuredSum: this.readNumber(policy, 'assuredSum') ?? undefined,
            quotedAmount: this.readNumber(policy, 'quotedAmount') ?? undefined,
            annualPremium: this.readNumber(policy, 'annualPremium') ?? undefined,
            startDate: this.readString(policy, 'startDate') ?? undefined,
            endDate: this.readString(policy, 'endDate') ?? undefined,
            rawData: policy,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    });

    await this.safeTrace({
      shopcartId,
      clientId: clientId ?? undefined,
      dniType: dniType ?? undefined,
      dniNumber: dniNumber ?? undefined,
      stage: 'persist_policies',
      status: 'success',
      message: 'Polizas persistidas exitosamente',
      response: {
        savedPolicies: savedPolicies.length,
      },
    });

    let quoteSavedCount = 0;
    for (const policy of summaryPolicies) {
      const policyId = this.readString(policy, 'id');
      if (!policyId) continue;

      const quotes = this.extractQuotes(policy).map((quote) => ({
        quote: this.readString(quote, 'quote') ?? '',
        agreement: this.readInteger(quote, 'agreement') ?? undefined,
        receipt: this.readInteger(quote, 'receipt') ?? undefined,
        receiptStatus: this.toQuoteStatus(this.readString(quote, 'receiptStatus')) ?? undefined,
        quoteStatus: this.toQuoteStatus(this.readString(quote, 'quoteStatus')) ?? undefined,
        isNextDuePayment: this.readBoolean(quote, 'isNextDuePayment') ?? false,
        isPaid: this.readBoolean(quote, 'isPaid') ?? false,
        amount: this.readNumber(quote, 'amount') ?? undefined,
        expirationDate: this.readString(quote, 'expirationDate') ?? undefined,
        rawData: quote,
      })).filter((quote) => quote.quote.length > 0);

      if (quotes.length === 0) continue;

      const savedQuotes = await this.mercantilStorageService.savePaymentQuotes({
        shopcartId,
        policyId,
        policyNumber: this.readString(policy, 'number')
          ?? this.readString(policy, 'policyNumber')
          ?? undefined,
        quotes,
      });
      quoteSavedCount += savedQuotes.length;
    }

    await this.safeTrace({
      shopcartId,
      clientId: clientId ?? undefined,
      dniType: dniType ?? undefined,
      dniNumber: dniNumber ?? undefined,
      stage: 'persist_quotes',
      status: 'success',
      message: 'Proceso de persistencia de cuotas completado',
      response: {
        savedQuotes: quoteSavedCount,
      },
    });

    return {
      policiesSaved: savedPolicies.length,
      quotesSaved: quoteSavedCount,
    };
  }
}
