'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EditorShell } from '@/components/organisms/marketplace-editor/EditorShell'
import { authService } from '@/src/services/auth.service'

interface MarketplaceEditorPageProps {
  params: Promise<{ id: string }>
}

/**
 * Pagina del editor de marketplace.
 * Extrae el ID de los parametros de ruta y lo pasa al EditorShell.
 */
export default function MarketplaceEditorPage({ params }: MarketplaceEditorPageProps) {
  const router = useRouter()
  const { id } = use(params)

  useEffect(() => {
    const session = authService.getSession()
    if (session?.role === 'COMPANY') {
      router.replace('/dashboard/enterprise/shop')
    }
  }, [router])

  return <EditorShell id={id} />
}
