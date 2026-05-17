/**
 * DTO para crear una empresa.
 */
export class CreateEnterpriseDto {
  companyName!: string;
  taxId!: string;
}

/**
 * DTO para guardar datos de domiciliacion bancaria.
 */
export class SaveDomiciliationDto {
  bank!: string;
  accountType!: 'checking' | 'savings';
  accountNumber!: string;
  holderName!: string;
  holderId!: string;
  debitAuthorized!: boolean;
}

/**
 * DTO para crear un colaborador individual.
 */
export class CreateCollaboratorDto {
  name!: string;
  lastName!: string;
  documentId!: string;
  email!: string;
  phone!: string;
  baseSalary!: number;
}

/**
 * DTO para carga masiva de colaboradores.
 */
export class BulkUploadCollaboratorsDto {
  collaborators!: CreateCollaboratorDto[];
}

/**
 * DTO para resolver una solicitud.
 */
export class ResolveLoanRequestDto {
  status!: 'approved' | 'denied';
  denialReason?: string;
}
