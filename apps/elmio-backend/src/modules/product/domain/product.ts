/**
 * Tipo de producto en el catalogo.
 */
export type ProductType = 'PRODUCT' | 'SERVICE' | 'KIT' | 'LOAN';

/**
 * Tipo de pago aceptado.
 */
export type PaymentMode = 'cash' | 'quota' | 'mixed';

/**
 * Esquema de financiamiento del producto.
 */
export interface FinancingScheme {
  id: string;
  name: string;
  paymentMode: PaymentMode;
  paymentPeriod: string;
  maxQuotas: number;
  initialPayment: number;
}

/**
 * Origen de la lista de precios.
 */
export type PriceSource = 'manual' | 'third-party';

/**
 * Lista de precios de un producto.
 * Puede ser manual o provenir de un tercero.
 */
export interface PriceList {
  id: string;
  currency: string;
  amount: number;
  source: PriceSource;
  thirdPartyProvider: string | null;
  thirdPartyRef: string | null;
  lastSyncAt: string | null;
}

/**
 * Periodo de descuento aplicable al producto.
 */
export interface DiscountPeriod {
  id: string;
  startDate: string;
  endDate: string;
  percentage: number;
  description: string;
}

/**
 * Atributo dinamico del producto (ej: color, talla).
 */
export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
}

/**
 * Tipo de ventana/accion invocable por un producto.
 */
export type WindowActionType =
  | 'payment-form'
  | 'custom-form'
  | 'external-redirect'
  | 'document-upload'
  | 'confirmation-dialog';

/**
 * Ventana/accion hardcoded que un producto puede invocar.
 * Permite ejecutar procesos como pagos, formularios personalizados, etc.
 */
export interface ProductWindow {
  id: string;
  type: WindowActionType;
  label: string;
  description: string;
  /** Configuracion especifica por tipo de ventana */
  config: WindowConfig;
  order: number;
  required: boolean;
}

/**
 * Configuracion especifica de la ventana segun su tipo.
 */
export interface WindowConfig {
  /** URL para external-redirect */
  redirectUrl?: string;
  /** Campos para custom-form */
  fields?: FormField[];
  /** Metodos de pago para payment-form */
  paymentMethods?: string[];
  /** Tipos de documento aceptados para document-upload */
  acceptedFileTypes?: string[];
  /** Mensaje para confirmation-dialog */
  confirmationMessage?: string;
}

/**
 * Campo de formulario personalizado.
 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'date'
    | 'select'
    | 'textarea'
    | 'file'
    | 'checkbox';
  required: boolean;
  placeholder: string;
  options: string[];
}

/**
 * Accion de post-compra del producto (ej: desembolso de fondos, webhook, email).
 */
export interface ProductAction {
  id: string;
  type: 'manual_disburse' | 'disburse_funds' | 'send_email_voucher' | 'custom_webhook' | 'r4_vuelto';
  name: string;
  active: boolean;
  config: Record<string, any>;
}

/**
 * Entidad principal de producto del catalogo.
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  category: string;
  tags: string[];
  images: string[];
  active: boolean;

  /** Inventario */
  hasStock: boolean;
  currentStock: number;
  minimumStock: number;
  hasValidity: boolean;
  validFrom: string | null;
  validTo: string | null;

  /** Atributos dinamicos */
  attributes: ProductAttribute[];

  /** Precios (pueden venir de terceros) */
  priceLists: PriceList[];
  discounts: DiscountPeriod[];

  /** Configuracion de pago */
  financingSchemes: FinancingScheme[];
  interestType: 'none' | 'percentage' | 'fixed';
  interestRate: number;
  usesThirdPartyPricing: boolean;
  globalThirdPartyProvider: string | null;

  /** Ventanas/acciones que el producto invoca */
  windows: ProductWindow[];

  /** Acciones ejecutadas al finalizar la compra */
  actions?: ProductAction[];

  /** Marketplace al que pertenece (opcional) */
  marketplaceId: string | null;

  /** Cuenta bancaria alternativa para traspaso de fondos (opcional) */
  alternativeBankAccountId?: string | null;

  createdAt: string;
  updatedAt: string;
}
