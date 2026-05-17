'use client'

import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'

type PestanaEditor = 'vista-previa' | 'edicion' | 'secciones'

interface EditorTopBarProps {
  nombre: string
  slug: string
  pestana: PestanaEditor
  onNombreChange: (nombre: string) => void
  onPestanaChange: (pestana: PestanaEditor) => void
  onGuardar: () => void
}

/**
 * Barra superior del editor de marketplace.
 * Contiene navegacion atras, nombre/slug editables, tabs y boton de guardar.
 */
export function EditorTopBar({
  nombre,
  slug,
  pestana,
  onNombreChange,
  onPestanaChange,
  onGuardar,
}: EditorTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/marketplaces"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Link>
        <div>
          <Input
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            className="text-lg font-semibold border-none !px-0 !py-0 bg-transparent !rounded-none focus:ring-0 w-64"
          />
          <p className="text-xs text-gray-400">{slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          {[
            { id: 'secciones' as PestanaEditor, label: 'Secciones' },
            { id: 'edicion' as PestanaEditor, label: 'Edicion' },
            { id: 'vista-previa' as PestanaEditor, label: 'Vista previa' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPestanaChange(tab.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                pestana === tab.id
                  ? 'bg-white text-body shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={onGuardar}>
          <Save className="w-4 h-4" strokeWidth={1.5} />
          Guardar
        </Button>
      </div>
    </div>
  )
}
