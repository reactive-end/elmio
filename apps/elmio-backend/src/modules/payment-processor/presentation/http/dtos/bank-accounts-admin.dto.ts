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


