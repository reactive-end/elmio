/**
 * DTO para actualizar la tasa global de una empresa.
 */
export class UpdateEnterpriseInterestConfigDto {
  interestType!: 'none' | 'percentage' | 'fixed';
  interestRate!: number;
  isActive!: boolean;
}
