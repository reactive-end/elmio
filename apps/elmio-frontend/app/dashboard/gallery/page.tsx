import type { Metadata } from 'next'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { GalleryManager } from '@/components/organisms/GalleryManager/GalleryManager'

export const metadata: Metadata = {
  title: 'Galeria - ElMio',
  description: 'Biblioteca de imagenes para el dashboard administrador de ElMio',
}

/**
 * Ruta del dashboard que expone la biblioteca de imagenes del administrador.
 * Permite organizar recursos bajo el tenant elmio mientras llega la integracion con el bucket real.
 */
export default function GalleryPage() {
  return (
    <DashboardTemplate>
      <div className="mx-auto w-full max-w-7xl">
        <GalleryManager />
      </div>
    </DashboardTemplate>
  )
}
