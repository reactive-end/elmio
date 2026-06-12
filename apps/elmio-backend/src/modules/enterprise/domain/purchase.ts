/**
 * Compra/orden registrada en el sistema.
 * Se crea una vez por compra real, ya sea pagada de contado (marketplace checkout),
 * desembolsada por finanzas (R4 o Plaza), o por seguros.
 */
export type PurchaserType = 'natural_client' | 'collaborator' | 'enterprise';

export type PurchaseChannel = 'marketplace' | 'loan_request' | 'insurance';

export type PurchaseStatus =
  | 'pending'
  | 'paid'
  | 'financed'
  | 'disbursed'
  | 'cancelled'
  | 'partially_paid';

export interface Purchase {
  id: string;
  /** Tipo de comprador (cliente natural sin empresa, colaborador con empresa, o empresa directa) */
  purchaserType: PurchaserType;
  /** ID del person_profile o enterprise */
  purchaserId: string;
  /** Nombre desnormalizado para queries */
  purchaserName: string;
  purchaserEmail: string | null;
  purchaserDocument: string | null;

  /** Producto comprado */
  productId: string | null;
  productName: string;
  productSku: string | null;
  /** Marketplace de origen (si aplica) */
  marketplaceId: string | null;
  marketplaceName: string | null;

  /** Detalles financieros */
  amountUsd: number;
  /** Monto en bolivares convertido con la tasa de cambio aplicada */
  amountVes: number | null;
  /** Tasa de cambio BCV usada (de R4 o BD local) */
  exchangeRate: number | null;
  /** True si la compra es financiada a cuotas */
  isFinanced: boolean;
  /** Numero de cuotas (proviene del FinancingScheme.maxQuotas) */
  installments: number | null;
  /** Tasa de interes aplicada (proviene del producto) */
  interestRate: number | null;

  /** Canal de la compra */
  channel: PurchaseChannel;
  /** Enlaces a entidades relacionadas */
  transactionId: string | null;
  loanRequestId: string | null;
  disbursementId: string | null;

  status: PurchaseStatus;

  /**
   * Modulo de cobranza (migracion 0011).
   * amountDue espeja amountUsd para purchases historicos; diverge
   * cuando hay abonos parciales. amountPaid es el acumulado.
   * dueDate determina cuando el cargo entra en mora.
   */
  amountDue: number | null;
  amountPaid: number;
  dueDate: string | null;

  /**
   * Bucket de morosidad (migracion 0011) calculado por el job CRON.
   * 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'legal'.
   */
  delinquencyBucket:
    | 'current'
    | 'overdue_30'
    | 'overdue_60'
    | 'overdue_90'
    | 'legal'
    | null;
  /** Fecha desde la cual el cargo esta vencido. ISO 8601 o null. */
  overdueSince: string | null;

  createdAt: string;
  updatedAt: string;
}
