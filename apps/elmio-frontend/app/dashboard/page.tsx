import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'

/**
 * Pagina principal del dashboard.
 * Muestra el template con sidebar y topbar.
 * El contenido se agregara en futuras iteraciones.
 */
export default function DashboardPage() {
  return (
    <DashboardTemplate>
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-body mb-2">Bienvenido a ElMio</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Selecciona una opcion en el menu lateral para comenzar.
        </p>
      </div>
    </DashboardTemplate>
  )
}
