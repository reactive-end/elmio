'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { productService, type Product } from '@/src/services/product.service'
import { categoryService, type Categoria } from '@/src/services/category.service'

/**
 * Hook personalizado para manejar la lógica de estado y negocio de la vista de listado de productos.
 * Abstrae la carga de productos, el cambio de estado, la eliminación y la resolución de nombres de categorías.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Categoria[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Cargar productos y categorías en paralelo para mejorar eficiencia
      const [productsData, categoriesData] = await Promise.all([
        productService.list(),
        categoryService.list(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos del catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleDelete = async (id: string) => {
    try {
      await productService.remove(id)
      setSuccessMsg('Producto eliminado.')
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el producto.')
    }
  }

  const toggleActive = async (product: Product) => {
    try {
      await productService.update(product.id, { active: !product.active })
      setSuccessMsg(`Producto ${product.active ? 'desactivado' : 'activado'}.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado del producto.')
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term),
    )
  }, [search, products])

  /**
   * Resuelve el nombre legible de la categoría usando su identificador UUID.
   * Si es un ID no existente o está vacío, busca coincidencia o devuelve el valor original.
   */
  const resolveCategoryName = useCallback(
    (catIdOrName: string): string => {
      if (!catIdOrName) return '—'
      const found = categories.find((c) => c.id === catIdOrName)
      if (found) return found.name
      
      // Fallback para productos antiguos que ya tengan almacenado el nombre en texto plano
      return catIdOrName
    },
    [categories],
  )

  return {
    products,
    search,
    setSearch,
    loading,
    error,
    successMsg,
    setSuccessMsg,
    handleDelete,
    toggleActive,
    filtered,
    resolveCategoryName,
  }
}
