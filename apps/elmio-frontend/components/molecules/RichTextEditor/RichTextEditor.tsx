'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Eraser,
  Heading2,
  Heading3,
  Type,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  label?: string
}

/**
 * Editor de texto enriquecido (WYSIWYG) nativo para el panel de administración.
 * Permite dar formato a textos sin escribir código HTML directamente.
 */
export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [estaEnfocado, setEstaEnfocado] = useState(false)

  // Sincronizar el valor inicial una sola vez, o si cambia externamente de forma radical.
  useEffect(() => {
    if (editorRef.current) {
      const contenidoActual = editorRef.current.innerHTML
      // Evitar sobreescribir si el cambio es causado por el propio usuario escribiendo
      if (contenidoActual !== value) {
        editorRef.current.innerHTML = value || '<p><br></p>'
      }
    }
  }, [value])

  const manejarCambio = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      // Si el editor queda vacío o solo tiene un breakline, retornar string vacío
      if (html === '<p><br></p>' || html === '<br>' || html === '') {
        onChange('')
      } else {
        onChange(html)
      }
    }
  }

  const ejecutarComando = (comando: string, valor: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(comando, false, valor)
      manejarCambio()
    }
  }

  const insertarEnlace = () => {
    if (typeof window !== 'undefined') {
      const url = window.prompt('Introduce la dirección URL para el enlace (ej: https://elmio.co):', 'https://')
      if (url !== null && url !== '') {
        ejecutarComando('createLink', url)
      }
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</label>}
      <div
        className={`flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
          estaEnfocado
            ? 'border-secondary ring-2 ring-secondary/20 shadow-sm'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Barra de Herramientas */}
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-150 bg-gray-50/80 p-2 backdrop-blur-xs">
          {/* Formatos de bloque */}
          <button
            type="button"
            onClick={() => ejecutarComando('formatBlock', '<p>')}
            title="Párrafo normal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('formatBlock', '<h2>')}
            title="Título Grande"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('formatBlock', '<h3>')}
            title="Título Mediano"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Formatos de fuente */}
          <button
            type="button"
            onClick={() => ejecutarComando('bold')}
            title="Negrita"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('italic')}
            title="Cursiva"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('underline')}
            title="Subrayado"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Underline className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Alineaciones */}
          <button
            type="button"
            onClick={() => ejecutarComando('justifyLeft')}
            title="Alinear izquierda"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('justifyCenter')}
            title="Centrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('justifyRight')}
            title="Alinear derecha"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Listas */}
          <button
            type="button"
            onClick={() => ejecutarComando('insertUnorderedList')}
            title="Lista con viñetas"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('insertOrderedList')}
            title="Lista numerada"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-gray-200 mx-1" />

          {/* Enlaces y Acciones */}
          <button
            type="button"
            onClick={insertarEnlace}
            title="Insertar enlace"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ejecutarComando('removeFormat')}
            title="Borrar formato"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Área de Escritura */}
        <div
          ref={editorRef}
          contentEditable
          onInput={manejarCambio}
          onFocus={() => setEstaEnfocado(true)}
          onBlur={() => {
            setEstaEnfocado(false)
            manejarCambio()
          }}
          className="prose prose-sm max-w-none min-h-[160px] max-h-[300px] overflow-y-auto bg-white px-4 py-3 text-sm text-body focus:outline-none"
          style={{ outline: 'none' }}
        />
      </div>
    </div>
  )
}
