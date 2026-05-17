import type {
  Enterprise,
  Collaborator,
  LoanRequest,
  Transaction,
  PlatformConfig,
} from '../enterprise';

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
  findCollaboratorsByEnterprise(enterpriseId: string): Promise<Collaborator[]>;

  /**
   * Busca un colaborador por su ID.
   * @param id ID del colaborador.
   * @returns Colaborador o null.
   */
  findCollaboratorById(id: string): Promise<Collaborator | null>;

  /**
   * Crea o actualiza un colaborador.
   * @param collaborator Datos del colaborador.
   * @returns Colaborador guardado.
   */
  saveCollaborator(collaborator: Collaborator): Promise<Collaborator>;

  /**
   * Crea multiples colaboradores a la vez.
   * @param collaborators Lista de colaboradores.
   * @returns Colaboradores creados.
   */
  saveCollaborators(collaborators: Collaborator[]): Promise<Collaborator[]>;

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
   * Busca una solicitud por su ID.
   * @param id ID de la solicitud.
   * @returns Solicitud o null.
   */
  findRequestById(id: string): Promise<LoanRequest | null>;

  /**
   * Crea o actualiza una solicitud.
   * @param request Datos de la solicitud.
   * @returns Solicitud guardada.
   */
  saveRequest(request: LoanRequest): Promise<LoanRequest>;

  // --- Transactions ---

  /**
   * Lista las transacciones de una empresa.
   * @param enterpriseId ID de la empresa.
   * @returns Lista de transacciones.
   */
  findTransactionsByEnterprise(enterpriseId: string): Promise<Transaction[]>;

  /**
   * Crea o actualiza una transaccion.
   * @param transaction Datos de la transaccion.
   * @returns Transaccion guardada.
   */
  saveTransaction(transaction: Transaction): Promise<Transaction>;

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
