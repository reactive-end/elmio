'use client'

import { Input } from '@/components/atoms/Input/Input'
import type { ConfiguracionWhatsApp } from '@/src/utils/editor-types.d'

interface ConfiguracionGeneralTabProps {
  whatsapp?: ConfiguracionWhatsApp
  onChangeWhatsapp: (data: ConfiguracionWhatsApp) => void
}

/**
 * Pestaña de configuración general del marketplace.
 * Administra integraciones externas como el botón de WhatsApp flotante.
 */
export function ConfiguracionGeneralTab({
  whatsapp,
  onChangeWhatsapp,
}: ConfiguracionGeneralTabProps) {
  const ws = whatsapp ?? {
    activo: false,
    telefono: '',
    mensaje: '',
    textoTooltip: '',
  }

  const handleUpdate = (campo: keyof ConfiguracionWhatsApp, valor: string | boolean) => {
    onChangeWhatsapp({ ...ws, [campo]: valor })
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-1">Configuración General</h2>
          <p className="text-sm text-gray-500">
            Administra las integraciones y configuraciones globales de tu marketplace.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-900">Botón Flotante de WhatsApp</h3>
              <p className="text-sm text-gray-500">
                Muestra un botón de contacto en todas las páginas de la tienda.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={ws.activo}
                onChange={(e) => handleUpdate('activo', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {ws.activo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Número de teléfono</label>
                <Input
                  value={ws.telefono}
                  onChange={(e) => handleUpdate('telefono', e.target.value)}
                  placeholder="Ej: +584141234567"
                />
                <p className="text-xs text-gray-500">Incluye el código de área.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mensaje predeterminado</label>
                <Input
                  value={ws.mensaje}
                  onChange={(e) => handleUpdate('mensaje', e.target.value)}
                  placeholder="Hola, me gustaría más información."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Texto del Tooltip</label>
                <Input
                  value={ws.textoTooltip}
                  onChange={(e) => handleUpdate('textoTooltip', e.target.value)}
                  placeholder="¡Chatea con nosotros!"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
