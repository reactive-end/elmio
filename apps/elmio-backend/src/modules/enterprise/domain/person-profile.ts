// ─────────────────────────────────────────────────────────────────────────────
// PersonProfile Domain — Perfil unificado de Persona Natural y Colaborador.
// Segmentado por grupo logico de datos.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sub-entidades embebidas ──────────────────────────────────────────────────

/**
 * Informacion de tarjeta (credito o debito).
 */
export interface CardInfo {
  bank: string;
  cardNumber: string;
  limit: number | null;
}

/**
 * Referencia personal del usuario.
 */
export interface PersonalReference {
  name: string;
  phone: string;
  relationship: string;
}

// ── Entidad principal: PersonProfile ─────────────────────────────────────────

/**
 * Perfil unificado para roles CLIENT y EMPLOYEE.
 * Los campos del Excel (marcados como required en el DTO) son obligatorios
 * para la carga masiva de colaboradores. El resto se completa en un
 * onboarding opcional tras el primer inicio de sesion.
 *
 * Segmentado en 8 grupos:
 *  1. Identidad
 *  2. Datos Demograficos
 *  3. Estilo de Vida / Preferencias
 *  4. Empleo
 *  5. Redes Sociales
 *  6. Datos Financieros
 *  7. Tarjetas
 *  8. Referencias Personales
 */
export interface PersonProfile {
  id: string;
  userId: string;

  // — Grupo 1: Identidad (obligatorio via Excel) —
  name: string;
  lastName: string;
  documentType: string;
  documentId: string;
  documentPhoto: string;
  email: string;
  phone: string;
  phone2: string;
  phoneType: string;
  photo: string;

  // — Grupo 2: Datos Demograficos —
  birthDate: string;
  age: number;
  gender: string;
  civilStatus: string;
  height: string;
  weight: string;
  diseases: string;
  familyDependents: number;
  countryOfOrigin: string;
  countryOfResidence: string;
  address: string;

  // — Grupo 3: Estilo de Vida / Preferencias —
  hobbies: string;
  favoriteFood: string;
  hasLaptopOrPc: boolean;
  operatingSystem: string;
  vehicleCount: number;
  hasDriverLicense: boolean;

  // — Grupo 4: Empleo (obligatorio via Excel para Collaborator) —
  enterpriseId: string | null;
  department: string;
  position: string;
  startDate: string;
  baseSalary: number;
  maxLoanLimit: number;
  employmentType: string;
  employmentSector: string;
  timeInCompanyMonths: number;
  loanPurpose: string;
  status: 'active' | 'suspended' | 'terminated';

  // — Grupo 5: Redes Sociales —
  socialMedia1: string;
  socialMedia2: string;
  socialMedia3: string;

  // — Grupo 6: Datos Financieros —
  residenceType: string;
  isResidenceOwned: boolean;
  recurringIncome: number;
  nationalBank1: string;
  nationalBank2: string;
  nationalBank3: string;
  internationalBank: string;

  // — Grupo 7: Referencias Personales —
  personalReferences: PersonalReference[];

  // — Metadatos —
  onboardingCompleted: boolean;
  createdAt: string;
}

/**
 * Datos obligatorios para la carga masiva de colaboradores via Excel.
 * Corresponde 1:1 con las columnas del archivo ejemplo_nomina_elmio.xlsx.
 */
export interface CollaboratorExcelRow {
  documentType: string;
  documentId: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  address: string;
  countryOfOrigin: string;
  familyDependents: number;
  startDate: string;
  department: string;
  position: string;
  baseSalary: number;
  maxLoanLimit: number;
}
