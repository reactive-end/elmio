/**
 * @fileoverview Servicio de API para interactuar con los endpoints de La Mundial de Seguros.
 * @description Provee funciones para catálogos, cotizar, validar y emitir pólizas RCV.
 * @module services/mundial
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export interface MundialCategoryResult {
  category: string
  categoryTitle?: string
  products: any[]
}

export interface ClientExistsResult {
  exists: boolean
  clientId?: string
  needsCompletion?: boolean
}

export interface FinalizePersistencePayload {
  client: Record<string, unknown>
  vehicle?: Record<string, unknown>
  dniDocument?: Record<string, unknown>
  vehiclePropertyDocument?: Record<string, unknown>
}

export interface Country {
  id: string
  name: string
}

export interface AdministrativeArea {
  id: string
  name: string
}

export interface Locality {
  id: string
  name: string
}

export interface SubAdministrativeArea {
  id: string
  name: string
}

export interface Zone {
  id: string
  name: string
}

export interface CountryLocations {
  id: string
  name: string
  administrativeAreas?: AdministrativeArea[]
}

/**
 * Realiza una llamada HTTP de tipo GET o POST/PUT con manejo de errores estandarizado.
 * @async
 * @template T
 * @param {string} path - Ruta relativa de la API.
 * @param {RequestInit} [init] - Opciones de inicialización de la solicitud.
 * @returns {Promise<T>} Respuesta parseada en formato JSON.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let errorMsg = 'Error en la comunicación con el servicio de La Mundial'
    try {
      const errBody = await response.json()
      errorMsg = errBody?.message || errBody?.upstream?.message || errorMsg
    } catch {
      // Ignorar fallo de parseo de error
    }
    throw new Error(errorMsg)
  }

  return response.json() as Promise<T>
}

export const mundialService = {
  /**
   * Obtiene los años habilitados de vehículos.
   * @async
   */
  async getYears(): Promise<number[]> {
    const res = await apiFetch<{ status: boolean; data: number[] }>('/mundial/inma/year', {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Obtiene las marcas habilitadas por año.
   * @async
   */
  async getBrands(fano: number): Promise<Array<{ cmarca: string; xmarca: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ cmarca: string; xmarca: string }>
    }>('/mundial/inma/marca', {
      method: 'POST',
      body: JSON.stringify({ fano }),
    })
    return res.data
  },

  /**
   * Obtiene los modelos por año y marca.
   * @async
   */
  async getModels(
    fano: number,
    cmarca: string,
  ): Promise<Array<{ cmodelo: string; xmodelo: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ cmodelo: string; xmodelo: string }>
    }>('/mundial/inma/modelo', {
      method: 'POST',
      body: JSON.stringify({ fano, cmarca }),
    })
    return res.data
  },

  /**
   * Obtiene las versiones por año, marca y modelo.
   * @async
   */
  async getVersions(
    fano: number,
    cmarca: string,
    cmodelo: string,
  ): Promise<Array<{ cversion: string; xversion: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ cversion: string; xversion: string }>
    }>('/mundial/inma/version', {
      method: 'POST',
      body: JSON.stringify({ fano, cmarca, cmodelo }),
    })
    return res.data
  },

  /**
   * Obtiene las categorías de uso por vehículo.
   * @async
   */
  async getCategoriasUso(
    fano: number,
    cmarca: string,
    cmodelo: string,
    cversion: string,
  ): Promise<Array<{ ccategoria_uso: number; xcategoria_uso: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ ccategoria_uso: number; xcategoria_uso: string }>
    }>('/mundial/external/getCategoriasUso', {
      method: 'POST',
      body: JSON.stringify({ fano, cmarca, cmodelo, cversion }),
    })
    return res.data
  },

  /**
   * Realiza la cotización de automóvil RCV.
   * @async
   */
  async getCotizacionAuto(body: {
    fano: number
    cmarca: string
    cmodelo: string
    cversion: string
    cplan: string
    ccategoria_uso: number
  }): Promise<{ mprima: number; mprimaext: number }> {
    const res = await apiFetch<{ status: boolean; data: { mprima: number; mprimaext: number } }>(
      '/mundial/external/getCotizacionAuto',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
    return res.data
  },

  /**
   * Valida los datos del automóvil antes de la emisión.
   * @async
   */
  async validateEmissionAuto(body: {
    plan: string
    placa: string
    serial_carroceria: string
    serial_motor?: string
  }): Promise<{ status: boolean; message: string }> {
    return apiFetch<{ status: boolean; message: string }>(
      '/mundial/external/validateEmissionAuto',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  /**
   * Emite la póliza RCV final.
   * @async
   */
  async createEmissionAuto(shopcartId: string, body: Record<string, unknown>): Promise<any> {
    return apiFetch<any>(
      `/mundial/external/createEmissionAuto?shopcartId=${encodeURIComponent(shopcartId)}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  /**
   * Obtiene el catálogo de estados.
   * @async
   */
  async getStates(): Promise<Array<{ cestado: number; xestado: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ cestado: number; xestado: string }>
    }>('/mundial/valrep/state', {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Obtiene el catálogo de ciudades por estado.
   * @async
   */
  async getCities(cestado: number): Promise<Array<{ cciudad: number; xciudad: string }>> {
    const res = await apiFetch<{
      status: boolean
      data: Array<{ cciudad: number; xciudad: string }>
    }>('/mundial/valrep/city', {
      method: 'POST',
      body: JSON.stringify({ cestado }),
    })
    return res.data
  },

  /**
   * Obtiene un catálogo secundario (SEXO, EDOCIVIL, PARENTESCOS).
   * @async
   */
  async getValrepList(type: 'SEXO' | 'EDOCIVIL' | 'PARENTESCOS'): Promise<any[]> {
    const res = await apiFetch<{ status: boolean; data: any[] }>(`/mundial/valrep/list/${type}`)
    return res.data
  },

  /**
   * Realiza el guardado final local en la DB.
   * @async
   */
  async finalizePersistence(shopcartId: string, body: FinalizePersistencePayload): Promise<any> {
    return apiFetch<any>(
      `/mundial/storage/finalize-persistence?shopcartId=${encodeURIComponent(shopcartId)}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  /**
   * Sube la cédula de forma genérica al bucket de persistencia digital de ElMio para Mundial.
   * @async
   */
  async uploadDniToBucket(file: File, fileName: string): Promise<any> {
    const formData = new FormData()
    formData.append('dniFile', file)
    formData.append('fileName', fileName)
    return apiFetch<any>('/mundial/storage/dni-upload', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * Sube el título de propiedad del vehículo al bucket de persistencia de ElMio para Mundial.
   * @async
   */
  async uploadVehiclePropertyToBucket(file: File, fileName: string): Promise<any> {
    const formData = new FormData()
    formData.append('vehiclePropertyFile', file)
    formData.append('fileName', fileName)
    return apiFetch<any>('/mundial/storage/vehicle-property-upload', {
      method: 'POST',
      body: formData,
    })
  },
}
