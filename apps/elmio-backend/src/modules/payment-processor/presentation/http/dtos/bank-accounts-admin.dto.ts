/**
 * DTO para registrar una cuenta bancaria.
 */
export class CreateBankAccountDto {
  bankId!: string
  accountNumber!: string
  documentType!: string
  documentNumber!: string
  phoneNumber!: string
  phoneValidationNumber?: string
  businessName?: string
  accountTypeId!: string
  description?: string
  currencyId!: string
  role?: 'EMISOR' | 'RECEPTOR' | 'AMBOS'
}

/**
 * DTO para actualizar una cuenta bancaria.
 */
export class UpdateBankAccountDto {
  bankId?: string
  accountNumber?: string
  documentType?: string
  documentNumber?: string
  phoneNumber?: string
  phoneValidationNumber?: string
  businessName?: string
  accountTypeId?: string
  description?: string
  currencyId?: string
  role?: 'EMISOR' | 'RECEPTOR' | 'AMBOS'
}

/**
 * DTO para crear o actualizar las credenciales API de una cuenta bancaria.
 */
export class UpsertBankAccountApiKeyDto {
  commerceKey!: string
  secretKey?: string
  extraKey?: string
}

/**
 * DTO para registrar una moneda.
 */
export class CreateCurrencyDto {
  code!: string
  name!: string
  symbol!: string
  exchangeRate?: number
}

/**
 * DTO para actualizar una moneda.
 */
export class UpdateCurrencyDto {
  name?: string
  symbol?: string
  exchangeRate?: number
}
