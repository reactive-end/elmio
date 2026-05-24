/**
 * @fileoverview Servicio de API para procesar transacciones bancarias e interactuar con la pasarela de pagos.
 * @description Provee funciones para Débito Inmediato, Solicitud de Token OTP y Domiciliaciones de cuenta.
 * @module services/payments
 */

const PAYMENTS_BASE_URL = process.env.NEXT_PUBLIC_PAYMENTS_API_URL ?? 'http://localhost:3500';
const DONE_API_KEY = process.env.NEXT_PUBLIC_PAYMENTS_API_TOKEN ?? '';

interface RequestTokenPayload {
  companyAccountId?: string | null;
  validationType: 'C' | 'T';
  payerId: string;
  payerBankCode: string;
  amount: number;
  payerAccount?: string;
  payerPhone?: string;
}

interface RequestTokenResult {
  success?: boolean;
  message?: string;
}

interface DebitPayload {
  companyAccountId?: string | null;
  amount: number;
  concept: string;
  payerId: string;
  payerName: string;
  payerBankCode: string;
  payerPhone?: string;
  payerAccount?: string;
  validationType: 'C' | 'T';
  token: string;
  provider: 'banco_plaza';
  isCustomerInitiated: boolean;
}

interface DebitResult {
  success?: boolean;
  reference?: string;
  message?: string;
}

interface DirectDebitPayload {
  provider: 'banco_plaza';
  amount: number;
  concept: string;
  payerBankCode: string;
  payerAccount: string;
  payerDocument: string;
  contratoId: string;
  fechaContrato: string;
  payerName: string;
}

interface DirectDebitResult {
  success?: boolean;
  reference?: string;
  message?: string;
}

/**
 * Realiza solicitudes de red a la pasarela de pagos.
 * @async
 * @template T
 * @param {string} path - Ruta relativa del endpoint de pago.
 * @param {RequestInit} [init] - Configuración de la petición HTTP.
 * @returns {Promise<T>} Objeto de respuesta JSON.
 */
async function paymentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  if (DONE_API_KEY) {
    headers.set('apikey', DONE_API_KEY);
  } else {
    // Si no está el token configurado, colocamos una advertencia pero permitimos fetch local
    console.warn('Falta NEXT_PUBLIC_PAYMENTS_API_TOKEN para cabecera apikey.');
  }

  const response = await fetch(`${PAYMENTS_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const responseJson = await response
    .json()
    .catch(() => ({ message: 'No se pudo procesar la respuesta del servidor de pagos' }));

  if (!response.ok) {
    throw new Error(responseJson?.message || 'Error al conectar con la pasarela de pagos');
  }

  return responseJson as T;
}

export const paymentsService = {
  /**
   * Solicita un token/OTP bancario para autorizar un Débito Inmediato.
   * @async
   * @param {RequestTokenPayload} payload - Datos de la cuenta/teléfono pagador.
   * @returns {Promise<RequestTokenResult>} Resultado de envío de SMS/OTP.
   */
  async requestDebitToken(payload: RequestTokenPayload): Promise<RequestTokenResult> {
    return paymentFetch<RequestTokenResult>('/banco-plaza/debit/token/apikey', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Confirma y procesa el cobro por Débito Inmediato ingresando el token OTP.
   * @async
   * @param {DebitPayload} payload - Credenciales del pago y token ingresado.
   * @returns {Promise<DebitResult>} Resultado de la transacción bancaria.
   */
  async debit(payload: DebitPayload): Promise<DebitResult> {
    return paymentFetch<DebitResult>('/banco-plaza/debit/apikey', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Inicia un cobro por Domiciliación Directa de Cuenta bancaria.
   * @async
   * @param {DirectDebitPayload} payload - Datos de domiciliación autorizados.
   * @returns {Promise<DirectDebitResult>} Resultado de la domiciliación directa.
   */
  async initiateDirectDebit(payload: DirectDebitPayload): Promise<DirectDebitResult> {
    return paymentFetch<DirectDebitResult>('/banco-plaza/direct-debit/initiate-dom/apikey', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
