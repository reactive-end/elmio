import { IsNotEmpty, IsString, Length } from 'class-validator'

export class GenerateOtpDto {
  @IsString()
  @IsNotEmpty()
  companyAccountId: string

  @IsString()
  @Length(4, 4) // validar longitud exacta
  @IsNotEmpty()
  bankCode: string

  @IsString()
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  phoneNumber: string

  @IsString()
  @IsNotEmpty()
  nationalId: string
}
