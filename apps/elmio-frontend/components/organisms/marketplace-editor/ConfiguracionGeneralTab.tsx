'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input/Input'
import { ColorInput } from '@/components/molecules/ColorInput/ColorInput'
import { Select } from '@/components/atoms/Select/Select'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'
import type { ConfiguracionWhatsApp } from '@/src/utils/editor-types.d'

const COUNTRY_CODES: CountryCode[] = [
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Espana' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru' },
]

const OPERATOR_PREFIXES: OperatorPrefix[] = ['412', '422', '414', '424', '416', '426']

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
    colorFlotante: '#25D366',
    posicion: 'derecha',
    delayMostrar: 3,
  }

  const [countryCode, setCountryCode] = useState<CountryCode>({
    code: 'VE',
    dial: '+58',
    flag: '🇻🇪',
    name: 'Venezuela',
  })
  const [operatorPrefix, setOperatorPrefix] = useState<OperatorPrefix>('412')
  const [rawDigits, setRawDigits] = useState('')

  useEffect(() => {
    if (!ws.telefono) {
      setRawDigits('')
      return
    }

    // Encuentra el dial que coincide
    let dialEncontrado = '+58'
    let codeEncontrado = 'VE'
    let flagEncontrado = '🇻🇪'
    let nameEncontrado = 'Venezuela'

    for (const c of COUNTRY_CODES) {
      if (ws.telefono.startsWith(c.dial)) {
        dialEncontrado = c.dial
        codeEncontrado = c.code
        flagEncontrado = c.flag
        nameEncontrado = c.name
        break
      }
    }

    setCountryCode({
      code: codeEncontrado,
      dial: dialEncontrado,
      flag: flagEncontrado,
      name: nameEncontrado,
    })

    const resto = ws.telefono.slice(dialEncontrado.length)

    // Intenta encontrar un prefijo
    let prefijoEncontrado: OperatorPrefix = '412'
    let digitosRestantes = resto

    for (const p of OPERATOR_PREFIXES) {
      if (resto.startsWith(p)) {
        prefijoEncontrado = p
        digitosRestantes = resto.slice(p.length)
        break
      }
    }

    setOperatorPrefix(prefijoEncontrado)
    setRawDigits(digitosRestantes.slice(0, 7)) // limita a 7 digitos
  }, [ws.telefono])

  const handlePhoneChange = (
    newCountry: CountryCode,
    newPrefix: OperatorPrefix,
    newDigits: string
  ) => {
    const combined = `${newCountry.dial}${newPrefix}${newDigits}`
    onChangeWhatsapp({ ...ws, telefono: combined })
  }

  const handleUpdateWhatsapp = (campo: keyof ConfiguracionWhatsApp, valor: string | boolean | number) => {
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f4ece]"></div>
            </label>
          </div>

          {ws.activo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 space-y-2 md:space-y-0">
              <div className="col-span-full space-y-2">
                <label className="text-sm font-medium text-gray-700">Número de teléfono</label>
                <PhoneInput
                  displayValue={formatPhoneDisplay(rawDigits)}
                  onChange={(e) => {
                    const digits = stripPhoneFormat(e.target.value).slice(0, 7)
                    setRawDigits(digits)
                    handlePhoneChange(countryCode, operatorPrefix, digits)
                  }}
                  countryCode={countryCode}
                  onCountryCodeChange={(code) => {
                    setCountryCode(code)
                    handlePhoneChange(code, operatorPrefix, rawDigits)
                  }}
                  operatorPrefix={operatorPrefix}
                  onOperatorPrefixChange={(prefix) => {
                    setOperatorPrefix(prefix)
                    handlePhoneChange(countryCode, prefix, rawDigits)
                  }}
                />
                <p className="text-xs text-gray-500">Selecciona el código de país, operadora e introduce los 7 dígitos de tu número de WhatsApp.</p>
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

            </div>
          )}
        </section>
      </div>
    </div>
  )
}
