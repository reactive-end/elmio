import type {
  Enterprise,
  LoanRequest,
  Transaction,
  PlatformConfig,
  Contract,
  ContractFile,
} from '../enterprise';
import type { PersonProfile } from '../person-profile';
import type { PersonBankAccount } from '../person-bank-account';
import type { Disbursement } from '../disbursement';

export const ENTERPRISE_REPOSITORY_PORT = Symbol('ENTERPRISE_REPOSITORY_PORT');

/**
 * Puerto del dominio para persistir datos empresariales.
 */
export interface EnterpriseRepositoryPort {
  // --- Enterprise ---

  /**
   * Obtiene una empresa por su ID.
   * @param id ID de la empresa.
   * @returns Empresa o null.
   */
  findEnterpriseById(id: string): Promise<Enterprise | null>;

  /**
   * Obtiene una empresa por el ID de su usuario propietario.
   * @param userId ID del usuario propietario.
   * @returns Empresa o null.
   */
  findEnterpriseByUserId(userId: string): Promise<Enterprise | null>;

  /**
   * Crea o actualiza una empresa.
   * @param enterprise Datos de la empresa.
   * @returns Empresa guardada.
   */
  saveEnterprise(enterprise: Enterprise): Promise<Enterprise>;

  // --- Collaborators ---

  /**
   * Lista los colaboradores de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de colaboradores.
   */
  findCollaboratorsByEnterprise(enterpriseId: string): Promise<PersonProfile[]>;

  /**
   * Busca un colaborador por su ID.
   * @param id ID del colaborador.
   * @returns Colaborador o null.
   */
  findCollaboratorById(id: string): Promise<PersonProfile | null>;

  /**
   * Busca un perfil de persona por su ID de usuario.
   * @param userId ID del usuario.
   * @returns Perfil o null.
   */
  findProfileByUserId(userId: string): Promise<PersonProfile | null>;

  /**
   * Crea o actualiza un colaborador.
   * @param collaborator Datos del colaborador.
   * @returns Colaborador guardado.
   */
  saveCollaborator(collaborator: PersonProfile): Promise<PersonProfile>;

  /**
   * Crea multiples colaboradores a la vez.
   * @param collaborators Lista de colaboradores.
   * @returns Colaboradores creados.
   */
  saveCollaborators(collaborators: PersonProfile[]): Promise<PersonProfile[]>;

  // --- Person Bank Accounts ---

  /**
   * Lista las cuentas bancarias de un perfil de persona.
   * @param personProfileId ID del perfil.
   * @returns Lista de cuentas bancarias.
   */
  findBankAccountsByPersonProfileId(personProfileId: string): Promise<PersonBankAccount[]>;

  /**
   * Busca una cuenta bancaria por su ID.
   * @param id ID de la cuenta.
   * @returns Cuenta bancaria o null.
   */
  findBankAccountById(id: string): Promise<PersonBankAccount | null>;

  /**
   * Guarda una cuenta bancaria de persona.
   * @param account Datos de la cuenta.
   * @returns Cuenta guardada.
   */
  saveBankAccount(account: PersonBankAccount): Promise<PersonBankAccount>;

  /**
   * Elimina una cuenta bancaria por ID.
   * @param id ID de la cuenta.
   */
  deleteBankAccount(id: string): Promise<void>;

  // --- Disbursements ---

  /**
   * Guarda un registro de desembolso.
   * @param disbursement Datos del desembolso.
   * @returns Desembolso guardado.
   */
  saveDisbursement(disbursement: Disbursement): Promise<Disbursement>;

  /**
   * Busca un desembolso por ID de solicitud.
   * @param loanRequestId ID de la solicitud.
   * @returns Desembolso o null.
   */
  findDisbursementByLoanRequestId(loanRequestId: string): Promise<Disbursement | null>;

  // --- Loan Requests ---

  /**
   * Lista las solicitudes de una empresa.
   * @param enterpriseId ID de la empresa.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes.
   */
  findRequestsByEnterprise(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]>;

  /**
   * Lista las solicitudes de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes del colaborador.
   */
  findRequestsByCollaborator(
    collaboratorId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]>;

  /**
   * Busca una solicitud por su ID.
   * @param id ID de la solicitud.
   * @returns Solicitud o null.
   */
  findRequestById(id: string): Promise<LoanRequest | null>;

  /**
   * Lista todas las solicitudes de la plataforma por estado (sin filtrar por empresa).
   * @param status Filtro de estado.
   * @returns Lista global de solicitudes.
   */
  findAllRequests(status?: LoanRequest['status']): Promise<LoanRequest[]>;

  /**
   * Crea o actualiza una solicitud.
   * @param request Datos de la solicitud.
   * @returns Solicitud guardada.
   */
  saveRequest(request: LoanRequest): Promise<LoanRequest>;

  // --- Contracts ---

  /**
   * Lista los contratos de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de contratos.
   */
  findContractsByEnterprise(enterpriseId: string): Promise<Contract[]>;

  /**
   * Busca un contrato por su ID.
   * @param id ID del contrato.
   * @returns Contrato o null.
   */
  findContractById(id: string): Promise<Contract | null>;

  /**
   * Guarda un contrato.
   * @param contract Datos del contrato.
   * @returns Contrato persistido.
   */
  saveContract(contract: Contract): Promise<Contract>;

  /**
   * Elimina un contrato por ID.
   * @param id ID del contrato.
   */
  deleteContract(id: string): Promise<void>;

  /**
   * Lista los archivos de un contrato.
   * @param contractId ID del contrato.
   * @returns Lista de archivos.
   */
  findContractFilesByContract(contractId: string): Promise<ContractFile[]>;

  /**
   * Busca un archivo de contrato por su ID.
   * @param id ID del archivo.
   * @returns Archivo o null.
   */
  findContractFileById(id: string): Promise<ContractFile | null>;

  /**
   * Guarda varios archivos de contrato.
   * @param files Archivos a guardar.
   * @returns Archivos persistidos.
   */
  saveContractFiles(files: ContractFile[]): Promise<ContractFile[]>;

  /**
   * Elimina un archivo de contrato por ID.
   * @param id ID del archivo.
   */
  deleteContractFile(id: string): Promise<void>;

  // --- Transactions ---

  /**
   * Lista las transacciones de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de transacciones.
   */
  findTransactionsByEnterprise(enterpriseId: string): Promise<Transaction[]>;

  /**
   * Lista las transacciones de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @returns Lista de transacciones del colaborador.
   */
  findTransactionsByCollaborator(
    collaboratorId: string,
  ): Promise<Transaction[]>;

  /**
   * Busca una transaccion por su ID.
   * @param id ID de la transaccion.
   * @returns Transaccion o null.
   */
  findTransactionById(id: string): Promise<Transaction | null>;

  /**
   * Crea o actualiza una transaccion.
   * @param transaction Datos de la transaccion.
   * @returns Transaccion guardada.
   */
  saveTransaction(transaction: Transaction): Promise<Transaction>;
  
  /**
   * Recupera todas las transacciones del sistema.
   * @returns Lista de todas las transacciones.
   */
  findAllTransactions(): Promise<Transaction[]>;


  // --- Platform Config ---

  /**
   * Obtiene la configuracion global de la plataforma.
   * @returns Configuracion o defaults.
   */
  getPlatformConfig(): Promise<PlatformConfig>;

  /**
   * Guarda la configuracion global de la plataforma.
   * @param config Configuracion a guardar.
   * @returns Configuracion guardada.
   */
  savePlatformConfig(config: PlatformConfig): Promise<PlatformConfig>;
}
