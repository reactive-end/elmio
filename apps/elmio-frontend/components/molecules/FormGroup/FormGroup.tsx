'use client'

import type { FormGroupProps } from './FormGroup.d'

/**
 * Componente molecule de grupo de formulario con etiqueta.
 * Agrupa campos relacionados bajo una misma etiqueta semantica.
 */
export function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      {children}
    </div>
  )
}
