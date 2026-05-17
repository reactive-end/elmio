import type { DatosMarketplace } from '@/src/utils/editor-types.d'
import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface MarketplaceListItem {
  id: string
  nombre: string
  slug: string
  descripcion: string
  activo: boolean
  propietario: string
  logo: string
}

/**
 * Servicio de comunicacion con el backend de marketplaces.
 * Encapsula todas las llamadas HTTP al modulo marketplace del backend NestJS.
 */
export const marketplaceService = {
  /**
   * Lista todos los marketplaces disponibles.
   * GET /api/marketplaces
   * @returns Lista de marketplaces.
   */
  async list(): Promise<MarketplaceListItem[]> {
    const response = await fetch(`${API_BASE}/marketplaces`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al listar marketplaces: ${response.statusText}`)
    }

    return response.json() as Promise<MarketplaceListItem[]>
  },

  /**
   * Obtiene la configuracion completa de un marketplace por su slug.
   * GET /api/marketplaces/slug/:slug
   * @param slug Slug del marketplace.
   * @returns Configuracion completa del marketplace para renderizado publico.
   */
  async getBySlug(slug: string): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces/slug/${encodeURIComponent(slug)}`)

    if (!response.ok) {
      throw new Error(`Marketplace "${slug}" no encontrado.`)
    }

    return response.json() as Promise<DatosMarketplace>
  },

  /**
   * Obtiene la configuracion completa de un marketplace por su ID.
   * GET /api/marketplaces/:id
   * @param id Identificador del marketplace.
   * @returns Configuracion completa del marketplace para el editor.
   */
  async getById(id: string): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Marketplace "${id}" no encontrado.`)
    }

    return response.json() as Promise<DatosMarketplace>
  },

  /**
   * Crea un nuevo marketplace con datos basicos.
   * POST /api/marketplaces
   * @param data Datos basicos del nuevo marketplace.
   * @returns Marketplace creado.
   */
  async create(data: {
    nombre: string
    slug: string
    descripcion?: string
    propietario?: string
    logo?: string
  }): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Error al crear marketplace: ${response.statusText}`)
    }

    return response.json() as Promise<DatosMarketplace>
  },

  /**
   * Actualiza la configuracion completa de un marketplace.
   * PUT /api/marketplaces/:id
   * @param id Identificador del marketplace.
   * @param data Configuracion completa actualizada desde el editor.
   * @returns Marketplace actualizado.
   */
  async update(id: string, data: DatosMarketplace): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Error al guardar marketplace: ${response.statusText}`)
    }

    return response.json() as Promise<DatosMarketplace>
  },

  /**
   * Elimina un marketplace.
   * DELETE /api/marketplaces/:id
   * @param id Identificador del marketplace.
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al eliminar marketplace: ${response.statusText}`)
    }
  },
}
