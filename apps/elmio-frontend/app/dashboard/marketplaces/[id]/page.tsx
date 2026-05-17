'use client'

import { use } from 'react'
import { EditorShell } from '@/components/organisms/marketplace-editor/EditorShell'

interface MarketplaceEditorPageProps {
  params: Promise<{ id: string }>
}

/**
 * Pagina del editor de marketplace.
 * Extrae el ID de los parametros de ruta y lo pasa al EditorShell.
 */
export default function MarketplaceEditorPage({ params }: MarketplaceEditorPageProps) {
  const { id } = use(params)

  return <EditorShell id={id} />
}
