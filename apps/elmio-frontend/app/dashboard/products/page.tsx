'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Search, Trash2 } from 'lucide-react'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'

interface ProductoFalso { id: string; sku: string; nombre: string; categoria: string; tipo: string; precio: number; activo: boolean }

const MOCK: ProductoFalso[] = [
  { id: 'p1', sku: 'LOAN-001', nombre: 'Prestamo Personal', categoria: 'Prestamos', tipo: 'Prestamo', precio: 500, activo: true },
  { id: 'p2', sku: 'LOAN-002', nombre: 'Prestamo Vehicular', categoria: 'Prestamos', tipo: 'Prestamo', precio: 5000, activo: true },
  { id: 'p3', sku: 'INS-001', nombre: 'Seguro de Vida', categoria: 'Seguros', tipo: 'Servicio', precio: 50, activo: true },
  { id: 'p4', sku: 'INS-002', nombre: 'Seguro Vehicular', categoria: 'Seguros', tipo: 'Servicio', precio: 80, activo: false },
  { id: 'p5', sku: 'PROD-001', nombre: 'Laptop Pro', categoria: 'Electronica', tipo: 'Producto', precio: 1200, activo: true },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const filtered = MOCK.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardTemplate>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-body mb-1">Productos</h1>
            <p className="text-sm text-gray-500">Gestiona el catalogo de productos del marketplace</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button><Plus className="w-4 h-4" strokeWidth={1.5} /> Nuevo producto</Button>
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">SKU</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Nombre</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Categoria</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Precio</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Estado</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4"><code className="text-xs bg-gray-100 rounded-md px-2 py-1 text-gray-600">{p.sku}</code></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-body">{p.nombre}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-500">{p.categoria}</span></td>
                    <td className="px-6 py-4"><span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 uppercase">{p.tipo}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-500">${p.precio}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ${p.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/products/new`} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                        <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><p className="text-sm">No se encontraron productos</p></div>}
        </div>
      </div>
    </DashboardTemplate>
  )
}
