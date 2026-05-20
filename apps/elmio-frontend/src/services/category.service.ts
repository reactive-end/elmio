import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface Categoria {
  id: string
  name: string
  description: string
  slug: string
  active: boolean
  createdAt: string
}

/**
 * Servicio de comunicacion con el backend de categorias de productos.
 */
export const categoryService = {
  /**
   * Lista todas las categorias de productos.
   * GET /api/categories
   */
  async list(): Promise<Categoria[]> {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al listar categorías: ${response.statusText}`)
    }

    return response.json() as Promise<Categoria[]>
  },

  /**
   * Obtiene el detalle de una categoria.
   * GET /api/categories/:id
   */
  async getById(id: string): Promise<Categoria> {
    const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Categoría "${id}" no encontrada.`)
    }

    return response.json() as Promise<Categoria>
  },

  /**
   * Crea una nueva categoria.
   * POST /api/categories
   */
  async create(data: { name: string; description: string; active?: boolean }): Promise<Categoria> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = (await response.json()) as { message?: string }
      throw new Error(error.message ?? 'Error al crear la categoría.')
    }

    return response.json() as Promise<Categoria>
  },

  /**
   * Modifica una categoria existente.
   * PUT /api/categories/:id
   */
  async update(
    id: string,
    data: { name: string; description: string; active: boolean },
  ): Promise<Categoria> {
    const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = (await response.json()) as { message?: string }
      throw new Error(error.message ?? 'Error al actualizar la categoría.')
    }

    return response.json() as Promise<Categoria>
  },

  /**
   * Elimina una categoria.
   * DELETE /api/categories/:id
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al eliminar categoría: ${response.statusText}`)
    }
  },
}
