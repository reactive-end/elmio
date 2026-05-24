'use client'

import { Input } from '@/components/atoms/Input/Input'
import { ColorInput } from '@/components/molecules/ColorInput/ColorInput'
import { Select } from '@/components/atoms/Select/Select'
import { SwitchField } from '@/components/molecules/SwitchField/SwitchField'
import type { ConfiguracionWhatsApp, ConfiguracionCarrito } from '@/src/utils/editor-types.d'

interface ConfiguracionGeneralTabProps {
  whatsapp?: ConfiguracionWhatsApp
  onChangeWhatsapp: (data: ConfiguracionWhatsApp) => void
  carrito?: ConfiguracionCarrito
  onChangeCarrito: (data: ConfiguracionCarrito) => void
}

/**
 * Pestaña de configuración general del marketplace.
 * Administra integraciones externas como el botón de WhatsApp flotante y el carrito de compras.
 */
export function ConfiguracionGeneralTab({
  whatsapp,
  onChangeWhatsapp,
  carrito,
  onChangeCarrito,
}: ConfiguracionGeneralTabProps) {
  const ws = whatsapp ?? {
    activo: false,
    telefono: '',
    mensaje: '',
    textoTooltip: '',
    colorFlotante: '#25D366',
    posicion: 'derecha',
    delayMostrar: 3,
  }

  const cart = carrito ?? {
    activo: true,
    textoBoton: 'Añadir al carrito',
    colorBadge: '#ef4444',
    permitirInvitados: true,
  }

  const handleUpdateWhatsapp = (campo: keyof ConfiguracionWhatsApp, valor: string | boolean | number) => {
    onChangeWhatsapp({ ...ws, [campo]: valor })
  }

  const handleUpdateCarrito = (campo: keyof ConfiguracionCarrito, valor: string | boolean) => {
    onChangeCarrito({ ...cart, [campo]: valor })
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

        {/* Sección: WhatsApp */}
        <section className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-900">Botón Flotante de WhatsApp</h3>
              <p className="text-sm text-gray-500">
                Muestra un botón de contacto flotante en todas las páginas de la tienda.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={ws.activo}
                onChange={(e) => handleUpdateWhatsapp('activo', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {ws.activo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 space-y-2 md:space-y-0">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Número de teléfono</label>
                <Input
                  value={ws.telefono}
                  onChange={(e) => handleUpdateWhatsapp('telefono', e.target.value)}
                  placeholder="Ej: +584141234567"
                />
                <p className="text-xs text-gray-500">Incluye el código de área internacional.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mensaje predeterminado</label>
                <Input
                  value={ws.mensaje}
                  onChange={(e) => handleUpdateWhatsapp('mensaje', e.target.value)}
                  placeholder="Hola, me gustaría más información."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Texto del Tooltip</label>
                <Input
                  value={ws.textoTooltip}
                  onChange={(e) => handleUpdateWhatsapp('textoTooltip', e.target.value)}
                  placeholder="¡Chatea con nosotros!"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Color del botón</label>
                <ColorInput
                  label="Color del botón de WhatsApp"
                  value={ws.colorFlotante || '#25D366'}
                  onChange={(c) => handleUpdateWhatsapp('colorFlotante', c)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Posición en pantalla</label>
                <Select
                  value={ws.posicion || 'derecha'}
                  onChange={(v) => handleUpdateWhatsapp('posicion', v)}
                  options={[
                    { value: 'derecha', label: 'Abajo a la Derecha' },
                    { value: 'izquierda', label: 'Abajo a la Izquierda' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Retardo de visualización (segundos)</label>
                <Input
                  type="number"
                  value={String(ws.delayMostrar || 3)}
                  onChange={(e) => handleUpdateWhatsapp('delayMostrar', Number(e.target.value) || 0)}
                  placeholder="3"
                />
              </div>
            </div>
          )}
        </section>

        {/* Sección: Carrito de Compras */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-900">Carrito de Compras</h3>
              <p className="text-sm text-gray-500">
                Habilita o deshabilita la compra y almacenamiento local del carrito.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={cart.activo}
                onChange={(e) => handleUpdateCarrito('activo', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {cart.activo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 space-y-2 md:space-y-0">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Texto del botón Añadir</label>
                <Input
                  value={cart.textoBoton}
                  onChange={(e) => handleUpdateCarrito('textoBoton', e.target.value)}
                  placeholder="Ej: Añadir al carrito"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Color del badge de contador</label>
                <ColorInput
                  label="Color del badge"
                  value={cart.colorBadge || '#ef4444'}
                  onChange={(c) => handleUpdateCarrito('colorBadge', c)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <SwitchField
                  label="Permitir compras a invitados (sin registro previo)"
                  checked={cart.permitirInvitados ?? true}
                  onChange={(v) => handleUpdateCarrito('permitirInvitados', v)}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

