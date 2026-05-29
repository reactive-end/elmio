/**
 * @fileoverview Servicio de API para interactuar con los endpoints de Seguros Mercantil.
 * @description Provee funciones para validar clientes, cargar DNI, cotizar planes, emitir pólizas y persistir datos.
 * @module services/mercantil
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type MercantilGender = 'M' | 'F';

export interface MercantilRateCoverage {
  name?: string;
}

export interface MercantilRate {
  actuarialAge?: number;
  minAge?: number;
  maxAge?: number;
  assuredSum?: number;
  countryOfResidenceId?: string;
  countryOfPropertyId?: string;
  genderId?: string;
  coverage?: MercantilRateCoverage;
}

export interface MercantilPlan {
  id: string;
  assuredSum?: number;
  totalPrime?: number;
  rates?: MercantilRate[];
}

export interface MercantilProductIcon {
  src?: string;
}

export interface MercantilProduct {
  id: string;
  slug?: string;
  mercantilAreaCode?: string;
  mercantilProductCode?: string;
  title: string;
  category?: string;
  description?: string;
  icon?: MercantilProductIcon;
  plans?: MercantilPlan[];
}

export interface MercantilCategoryResult {
  category: string;
  categoryTitle?: string;
  products: MercantilProduct[];
}

export interface TentativeClientQuery {
  birthDate: string;
  genderId: MercantilGender;
}

export interface ClientExistsQuery {
  birthDate: string;
  dniType: string;
  dniNumber: string;
  dniVenNationality?: string;
}

export interface ClientExistsResult {
  exists: boolean;
  clientId?: string;
  needsCompletion?: boolean;
}

export interface SalesChannel {
  id?: string;
  name?: string;
  code?: string;
}

export interface CreateShopcartResult {
  id?: string;
  shopcartId?: string;
}

export interface BucketUploadResult {
  fileName: string;
  originalName: string;
  path: string;
  size: number;
  contentType: string;
  folder: string;
}

export interface PaymentQuote {
  id?: string;
  quote: string;
  agreement?: number;
  receipt?: number;
  receiptStatus?: string;
  quoteStatus?: string;
  isNextDuePayment?: boolean;
  isPaid?: boolean;
  amount?: number;
  expirationDate?: string;
}

export interface ShopcartPolicy {
  id: string;
  status?: string;
  title?: string;
  certificateNumber?: string;
  number?: string;
  entity?: string;
  area?: string;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  assuredSum?: number;
  quotedAmount?: number;
  annualPremium?: number;
  icon?: { src?: string };
  paymentQuotes?: PaymentQuote[];
}

export interface ShopcartSummary {
  id: string;
  resumeUrl?: string;
  paymentUrl?: string;
  status?: string;
  paymentFrequency?: string;
  quotedAmount?: number;
  policies?: ShopcartPolicy[];
}

export interface PolicyCuota {
  nu_cuota?: number;
  mt_pendiente?: number;
  mt_pendiente_sin_igtf?: number;
  dueDate?: string;
  de_status_cuota?: string;
  fe_vencimiento_cuota?: string;
}

export interface PolicyRecibo {
  cd_recibo?: string;
  fe_desde_recibo?: string;
  nu_convenio_pago?: number;
}

export interface PolicyPaymentData {
  certificateNumber?: number;
  nu_poliza?: number;
  cd_area?: number;
  cd_entidad?: number;
  recibo?: PolicyRecibo;
  cuota?: PolicyCuota;
}

export interface EmissionPolicy {
  id: string;
  isQuoted?: boolean;
  isEmitted?: boolean;
  isPaid?: boolean;
  product?: string;
  category?: string;
  policyPaymentData?: PolicyPaymentData;
}

export interface EmissionStatus {
  id?: string;
  status?: string;
  emissionProgress?: number;
  policies?: EmissionPolicy[];
}

export interface FinalizePersistencePayload {
  client: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  dniDocument?: {
    path: string;
    originalName?: string;
    contentType?: string;
  };
}

export interface PolicyPdfResult {
  pdfName: string;
  pdfBase64: string;
}

export interface ExchangeRate {
  tasa_venta: number;
  tasa_compra: number;
  fe_tasa: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface Locality {
  id: string;
  name: string;
}

export interface SubAdministrativeArea {
  id: string;
  name: string;
  zones?: Zone[];
}

export interface AdministrativeArea {
  id: string;
  name: string;
  subAdministrativeAreas?: SubAdministrativeArea[];
  localities?: Locality[];
}

export interface CountryLocations {
  id: string;
  name: string;
  administrativeAreas?: AdministrativeArea[];
}

/**
 * Realiza una llamada HTTP de tipo GET o POST/PUT con manejo de errores estandarizado.
 * @async
 * @template T
 * @param {string} path - Ruta relativa de la API.
 * @param {RequestInit} [init] - Opciones de inicialización de la solicitud.
 * @returns {Promise<T>} Respuesta parseada en formato JSON.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Error en la comunicación con el servicio de Mercantil';
    try {
      const errBody = await response.json();
      errorMsg = errBody?.message || errBody?.upstream?.title || errorMsg;
    } catch {
      // Ignorar fallo de parseo de error
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const mercantilService = {
  /**
   * Obtiene la lista de planes tentativos basados en fecha de nacimiento y género.
   * @async
   * @param {TentativeClientQuery} query - Datos de nacimiento y género.
   * @returns {Promise<MercantilCategoryResult[]>} Categorías y planes válidos.
   */
  async getTentativeClientPlans(query: TentativeClientQuery): Promise<MercantilCategoryResult[]> {
    const params = new URLSearchParams({
      countryId: '29',
      birthDate: query.birthDate,
      genderId: query.genderId,
    });
    return apiFetch<MercantilCategoryResult[]>(`/mercantil/products/plans/tentative-client?${params.toString()}`);
  },

  /**
   * Revisa si un cliente ya existe registrado en la API de Mercantil.
   * @async
   * @param {ClientExistsQuery} query - Datos de identificación del cliente.
   * @returns {Promise<ClientExistsResult>} Resultado de existencia y completitud.
   */
  async checkClientExists(query: ClientExistsQuery): Promise<ClientExistsResult> {
    const params = new URLSearchParams({
      birthDate: query.birthDate,
      dniType: query.dniType,
      dniNumber: query.dniNumber,
    });
    if (query.dniVenNationality) {
      params.append('dniVenNationality', query.dniVenNationality);
    }
    return apiFetch<ClientExistsResult>(`/mercantil/clients/exists?${params.toString()}`);
  },

  /**
   * Crea un cliente básico en la API de Mercantil.
   * @async
   * @param {Record<string, unknown>} body - Payload del cliente.
   * @returns {Promise<Record<string, unknown>>} Objeto del cliente creado.
   */
  async createClient(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>('/mercantil/clients', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Completa la información avanzada de residencia del cliente.
   * @async
   * @param {string} clientId - ID único del cliente.
   * @param {Record<string, unknown>} body - Datos de dirección y estado civil.
   * @returns {Promise<Record<string, unknown>>} Confirmación del servidor.
   */
  async completeClient(clientId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/clients/${clientId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * Obtiene todos los canales de venta activos para Mercantil.
   * @async
   * @returns {Promise<SalesChannel[]>} Lista de canales de venta.
   */
  async getSalesChannels(): Promise<SalesChannel[]> {
    return apiFetch<SalesChannel[]>('/mercantil/sales-channels');
  },

  /**
   * Crea un nuevo carrito de compras para seguros de Mercantil.
   * @async
   * @param {Record<string, unknown>} body - Datos del cliente y canal de venta.
   * @returns {Promise<CreateShopcartResult>} Objeto con el shopcartId resultante.
   */
  async createShopcart(body: Record<string, unknown>): Promise<CreateShopcartResult> {
    return apiFetch<CreateShopcartResult>('/mercantil/shopcarts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Asocia una lista de productos y planes al carrito en lote.
   * @async
   * @param {string} shopcartId - ID del carrito de compras.
   * @param {unknown} body - Colección de productos, planes y periodos a asociar.
   * @returns {Promise<Record<string, unknown>>} Confirmación de carga exitosa.
   */
  async bulkLoadProducts(shopcartId: string, body: unknown): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/products/load`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Sube el archivo DNI/Cédula asociado al shopcart de Mercantil.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {File} file - Archivo de imagen o PDF de la cédula.
   * @returns {Promise<Record<string, unknown>>} Datos del documento subido.
   */
  async uploadDni(shopcartId: string, file: File): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('dniFile', file);
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/dni`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Sube la cédula de forma genérica al bucket de persistencia digital de ElMio.
   * @async
   * @param {File} file - Archivo digital.
   * @param {string} fileName - Nombre del archivo final en bucket.
   * @returns {Promise<BucketUploadResult>} Detalle del archivo guardado.
   */
  async uploadDniToBucket(file: File, fileName: string): Promise<BucketUploadResult> {
    const formData = new FormData();
    formData.append('dniFile', file);
    formData.append('fileName', fileName);
    return apiFetch<BucketUploadResult>('/mercantil/storage/dni-upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Solicita la emisión de la póliza de Mercantil para el shopcart activo.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {Record<string, unknown>} body - Opciones y declaraciones juradas de salud.
   * @returns {Promise<Record<string, unknown>>} Estado inicial del proceso.
   */
  async emitShopcart(shopcartId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/emit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Consulta el estado de la emisión (polling) de un shopcart.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @returns {Promise<EmissionStatus>} Estado detallado de las pólizas en emisión.
   */
  async getEmissionStatus(shopcartId: string): Promise<EmissionStatus> {
    return apiFetch<EmissionStatus>(`/mercantil/shopcarts/${shopcartId}/emit`);
  },

  /**
   * Realiza el guardado final (mapeo y persistencia local) del cliente y pólizas en ElMio.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {FinalizePersistencePayload} body - Datos completos a persistir.
   * @returns {Promise<Record<string, unknown>>} Resultado de inserciones en BD.
   */
  async finalizePersistence(shopcartId: string, body: FinalizePersistencePayload): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/finalize-persistence`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Descarga el archivo PDF digital de una póliza emitida.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {string} policyId - ID de la póliza emitida.
   * @returns {Promise<PolicyPdfResult>} Archivo PDF codificado en Base64.
   */
  async getPolicyPdf(shopcartId: string, policyId: string): Promise<PolicyPdfResult> {
    return apiFetch<PolicyPdfResult>(`/mercantil/shopcarts/${shopcartId}/policies/${policyId}/pdf`);
  },

  /**
   * Obtiene la tasa de cambio USD a VES oficial vigente.
   * @async
   * @returns {Promise<ExchangeRate[]>} Objeto de tasas de cambio.
   */
  async getExchangeRate(): Promise<ExchangeRate[]> {
    return apiFetch<ExchangeRate[]>('/mercantil/payments/exchange-rate');
  },

  /**
   * Obtiene la lista de todos los países.
   * @async
   * @returns {Promise<Country[]>} Colección de países.
   */
  async getCountries(): Promise<Country[]> {
    return apiFetch<Country[]>('/mercantil/countries');
  },

  /**
   * Obtiene la estructura geográfica detallada de estados y municipios de un país.
   * @async
   * @param {string} countryId - ID único del país.
   * @returns {Promise<CountryLocations>} Estructura de ubicaciones.
   */
  async getCountryLocations(countryId: string): Promise<CountryLocations> {
    return apiFetch<CountryLocations>(`/mercantil/countries/${countryId}/locations`);
  },

  /**
   * Obtiene el resumen del shopcart de compra de pólizas de Mercantil.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @returns {Promise<ShopcartSummary>} Objeto del resumen del carrito.
   */
  async getShopcartSummary(shopcartId: string): Promise<ShopcartSummary> {
    return apiFetch<ShopcartSummary>(`/mercantil/shopcarts/${shopcartId}/summary`);
  },

  /**
   * Consulta la información de vehículos disponibles por año, marca, modelo y versión.
   * @async
   * @param {Record<string, unknown>} params - Parámetros de filtro (year, brand, model, version).
   * @returns {Promise<Record<string, unknown>>} Datos de vehículos del catálogo Mercantil.
   */
  async getVehicleInformation(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    return apiFetch<Record<string, unknown>>(`/mercantil/auto-products/vehicles/vehicle-information?${query.toString()}`);
  },

  /**
   * Obtiene la lista de colores de vehículos disponibles.
   * @async
   * @returns {Promise<Record<string, unknown>[]>} Lista de colores.
   */
  async getVehicleColors(): Promise<Record<string, unknown>[]> {
    return apiFetch<Record<string, unknown>[]>('/mercantil/auto-products/vehicles/colors');
  },

  /**
   * Obtiene la lista de ubicaciones geográficas para vehículos.
   * @async
   * @returns {Promise<Record<string, unknown>[]>} Lista de ubicaciones.
   */
  async getVehicleLocations(): Promise<Record<string, unknown>[]> {
    return apiFetch<Record<string, unknown>[]>('/mercantil/auto-products/vehicles/locations');
  },

  /**
   * Obtiene los planes RCV disponibles para un tipo de vehículo específico.
   * @async
   * @param {string} vehicleTypeId - ID del tipo de vehículo.
   * @returns {Promise<MercantilCategoryResult[]>} Planes de seguro RCV.
   */
  async getAutoPlans(vehicleTypeId: string): Promise<MercantilCategoryResult[]> {
    return apiFetch<MercantilCategoryResult[]>(`/mercantil/auto-products/plans/client?vehicleTypeId=${encodeURIComponent(vehicleTypeId)}`);
  },

  /**
   * Completa la información técnica del vehículo en el shopcart.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {Record<string, unknown>} body - Datos del vehículo.
   * @returns {Promise<Record<string, unknown>>} Confirmación del servidor.
   */
  async completeVehicleInfo(shopcartId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>(`/mercantil/auto-products/vehicles/complete-vehicle-info?shopcartId=${encodeURIComponent(shopcartId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Sube el título de propiedad del vehículo al shopcart.
   * @async
   * @param {string} shopcartId - ID del carrito.
   * @param {File} file - Archivo del título de propiedad.
   * @returns {Promise<Record<string, unknown>>} Confirmación del servidor.
   */
  async uploadVehiclePropertyTitle(shopcartId: string, file: File): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('vehiclePropertyFile', file);
    return apiFetch<Record<string, unknown>>(`/mercantil/shopcarts/${shopcartId}/vehicle-property-title`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Obtiene la lista de cuotas guardadas localmente para un shopcart de Mercantil.
   * @async
   * @param {string} shopcartId - ID del carrito de compras.
   * @returns {Promise<PaymentQuote[]>} Lista de cuotas asociadas.
   */
  async getQuotesByShopcart(shopcartId: string): Promise<PaymentQuote[]> {
    return apiFetch<PaymentQuote[]>(`/mercantil/storage/payment-quotes?shopcartId=${encodeURIComponent(shopcartId)}`);
  },
};
