/**
 * DTO para crear una API key de integracion.
 */
export class CreateIntegrationApiKeyDto {
  bank!: string;
  environment?: string | null;
  name!: string;
  value!: string;
  isActive?: boolean;
}

/**
 * DTO para actualizar una API key de integracion.
 */
export class UpdateIntegrationApiKeyDto {
  bank?: string;
  environment?: string | null;
  name?: string;
  value?: string;
  isActive?: boolean;
}

/**
 * DTO para revelar una API key cifrada.
 */
export class RevealIntegrationApiKeyDto {
  revealKey!: string;
}

/**
 * DTO para activar o desactivar una API key.
 */
export class ToggleIntegrationApiKeyDto {
  isActive!: boolean;
}
