import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsString,
} from 'class-validator'

/**
 * DTO para solicitar la tasa de cambio del BCV desde Banco R4.
 */
const currencies = ['USD', 'EUR', 'CNY', 'TRY', 'RUB'] as const

export class GetExchangeRateDto {
  @IsOptional()
  @IsString()
  companyAccountId?: string

  /**
   * Fecha para consultar la tasa en formato YYYY-MM-DD.
   * @example '2026-02-19'
   */
  @IsDateString()
  @IsNotEmpty()
  date: string

  /**
   * Código de la moneda a consultar.
   * @example 'USD'
   */
  @IsString()
  @IsNotEmpty()
  @IsEnum(currencies, {
    message: `La moneda solicitada debe ser entre ${currencies.join(', ')}`,
  })
  currency: string
}
