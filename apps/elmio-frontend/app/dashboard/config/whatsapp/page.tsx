'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/atoms/Button/Button'
import { authService } from '@/src/services/auth.service'
import {
  whatsappService,
  type WhatsAppStatus,
  type WhatsAppStatusInfo,
} from '@/src/services/whatsapp.service'

/**
 * Pagina de configuracion de WhatsApp para administradores.
 * Permite visualizar el estado en tiempo real, escanear el codigo QR mediante SSE,
 * desvincular el dispositivo y reiniciar el servicio.
 */
export default function WhatsAppConfigPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusInfo, setStatusInfo] = useState<WhatsAppStatusInfo | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

  // 1. Validacion de Seguridad: Solo ADMIN
  useEffect(() => {
    const session = authService.getSession()
    if (!session || session.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    setIsAdmin(true)
    setLoading(false)
  }, [router])

  // 2. Cargar Estado Inicial y Configurar SSE
  const fetchStatus = async () => {
    try {
      const info = await whatsappService.getStatus()
      setStatusInfo(info)

      if (info.status === 'QR_PENDING') {
        const qrData = await whatsappService.getQr()
        setQrCode(qrData.qr)
      } else {
        setQrCode(null)
      }
    } catch (error) {
      console.error('Error al obtener estado inicial:', error)
    }
  }

  useEffect(() => {
    if (!isAdmin) return

    // Cargar estado inicial
    fetchStatus()

    // Configurar stream de Server-Sent Events (SSE)
    const streamUrl = whatsappService.getQrStreamUrl()
    const sse = new EventSource(streamUrl)
    sseRef.current = sse

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string
          qr?: string
          status?: WhatsAppStatus
        }

        if (data.type === 'qr' && data.qr) {
          setQrCode(data.qr)
          setStatusInfo((prev) => (prev ? { ...prev, status: 'QR_PENDING', hasQr: true } : null))
        } else if (data.type === 'status' && data.status) {
          const newStatus = data.status
          setStatusInfo((prev) =>
            prev ? { ...prev, status: newStatus, hasQr: newStatus === 'QR_PENDING' } : null,
          )
          if (newStatus !== 'QR_PENDING') {
            setQrCode(null)
          }
          if (newStatus === 'READY') {
            // Actualizar para obtener el telefono conectado
            fetchStatus()
          }
        }
      } catch (err) {
        console.error('Error al procesar mensaje SSE:', err)
      }
    }

    sse.onerror = async (error) => {
      console.error('Error en conexion SSE de WhatsApp:', error)

      try {
        // Intentamos invocar el endpoint de estado para diagnosticar si la causa es de autenticación
        await whatsappService.getStatus()
      } catch (statusError: unknown) {
        const errorMessage =
          statusError instanceof Error ? statusError.message : String(statusError)

        // Si hay falta de autorización (401/403), detenemos la conexión SSE para evitar bucles de reconexión infinitos
        const isAuthError =
          errorMessage.toLowerCase().includes('autenticacion') ||
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('token') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')

        if (isAuthError) {
          console.warn('Conexión SSE abortada permanentemente debido a token inválido o expirado.')
          if (sseRef.current) {
            sseRef.current.close()
          }
          authService.clearToken()
          router.push('/')
        }
      }
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close()
      }
    }
  }, [isAdmin])

  // Accion de Cerrar Sesion (Desvincular telefono)
  const handleLogout = async () => {
    setActionLoading(true)
    try {
      await whatsappService.logout()
      setShowConfirmLogout(false)
      await fetchStatus()
    } catch (error) {
      console.error('Error al desvincular WhatsApp:', error)
      alert('Error al desvincular el dispositivo. Por favor intente nuevamente.')
    } finally {
      setActionLoading(false)
    }
  }

  // Accion de Reiniciar Servicio
  const handleRestart = async () => {
    setActionLoading(true)
    try {
      await whatsappService.restart()
      await fetchStatus()
    } catch (error) {
      console.error('Error al reiniciar WhatsApp:', error)
      alert('Error al reiniciar el servicio de WhatsApp.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !statusInfo) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 font-medium animate-pulse">
            Estableciendo conexión en tiempo real...
          </p>
        </div>
      </div>
    )
  }

  const { status, connectedPhone } = statusInfo

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header limpio (mismo patron que el resto de modulos de configuracion) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">WhatsApp Web Gateway</h1>
          <p className="text-sm text-gray-500">
            Vincule un dispositivo móvil para habilitar el envío automatizado de códigos de
            recuperación de contraseñas. Si el dispositivo está desconectado, el sistema recurrirá
            automáticamente al envío por correo electrónico como fallback.
          </p>
        </div>
        <Button variant="ghost" onClick={handleRestart} isLoading={actionLoading}>
          <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> Reiniciar
        </Button>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Side: Status & Controls (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          {/* Status Display Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-gray-900 text-lg font-bold mb-4">Estado del Dispositivo</h2>

            <div className="space-y-6">
              {/* Dynamic Status Indicator */}
              <div className="flex items-start gap-4">
                {status === 'READY' && (
                  <>
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary" />
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                          CONECTADO
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-bold text-lg">
                        Servicio Listo para Enviar
                      </h3>
                      <p className="text-gray-500 text-sm">
                        El servidor de WhatsApp está autenticado y listo para enviar códigos OTP.
                      </p>
                    </div>
                  </>
                )}

                {status === 'QR_PENDING' && (
                  <>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                      <QrCode className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        PENDIENTE DE QR
                      </span>
                      <h3 className="text-gray-900 font-bold text-lg">Esperando Escaneo</h3>
                      <p className="text-gray-500 text-sm">
                        Escanee el código QR que se muestra a la derecha desde su aplicación móvil
                        de WhatsApp.
                      </p>
                    </div>
                  </>
                )}

                {status === 'AUTHENTICATING' && (
                  <>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        AUTENTICANDO
                      </span>
                      <h3 className="text-gray-900 font-bold text-lg">Estableciendo Sesión</h3>
                      <p className="text-gray-500 text-sm">
                        El servidor está procesando las credenciales de autenticación del
                        dispositivo.
                      </p>
                    </div>
                  </>
                )}

                {status === 'DISCONNECTED' && (
                  <>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center shadow-inner">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        DESCONECTADO
                      </span>
                      <h3 className="text-gray-900 font-bold text-lg">Sin Sesión Activa</h3>
                      <p className="text-gray-500 text-sm">
                        No se ha establecido una conexión. El sistema está enviando códigos por
                        Email.
                      </p>
                    </div>
                  </>
                )}

                {status === 'ERROR' && (
                  <>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
                        ERROR DE CONEXIÓN
                      </span>
                      <h3 className="text-gray-900 font-bold text-lg">Fallo en el Cliente</h3>
                      <p className="text-gray-500 text-sm">
                        Se detectó un error al inicializar el socket. Intente reiniciar el cliente.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Connected details */}
              {status === 'READY' && (
                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 rounded-2xl p-3.5 border border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold block mb-0.5">
                      TELÉFONO VINCULADO
                    </span>
                    <span className="text-gray-900 text-sm font-bold flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-secondary" />
                      {connectedPhone ? `+${connectedPhone}` : 'No disponible'}
                    </span>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-3.5 border border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold block mb-0.5">
                      ESTADO PERSISTENCIA
                    </span>
                    <span className="text-gray-900 text-sm font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                      Activa y Persistida
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Device Actions */}
          {status === 'READY' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-gray-900 text-lg font-bold">Acciones del Dispositivo</h2>

              {!showConfirmLogout ? (
                <button
                  onClick={() => setShowConfirmLogout(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-red-200 bg-red-50/20 text-red-700 hover:bg-red-50/50 active:bg-red-50 text-sm font-semibold transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Desvincular Dispositivo actual</span>
                </button>
              ) : (
                <div className="bg-red-50/30 rounded-2xl p-4 border border-red-100 space-y-3">
                  <p className="text-sm text-red-800 leading-relaxed">
                    ⚠️ <strong>¿Estás seguro de que deseas desvincular esta cuenta?</strong> Esto
                    eliminará las credenciales persistidas y el sistema volverá a enviar códigos por
                    Email hasta que se escanee un nuevo código QR.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogout}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 active:bg-red-800 text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50"
                    >
                      Sí, Desvincular
                    </button>
                    <button
                      onClick={() => setShowConfirmLogout(false)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-xs font-bold transition-all duration-150 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: QR Scanner (2 cols) */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm h-full flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-gray-900 text-lg font-bold mb-1">Código de Vinculación</h2>
              <p className="text-gray-500 text-xs">
                Escanee este código QR para activar la sesión.
              </p>
            </div>

            {/* QR Container */}
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              {status === 'READY' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-32 h-32 rounded-3xl bg-secondary/10 border border-secondary/20/50 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-12 h-12 text-secondary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-950 font-bold text-sm">¡Dispositivo Vinculado!</p>
                    <p className="text-gray-400 text-xs max-w-[200px]">
                      No se requiere código QR. El sistema está operando activamente.
                    </p>
                  </div>
                </div>
              )}

              {status === 'QR_PENDING' && qrCode ? (
                <div className="relative group p-4 border border-gray-100 rounded-3xl bg-gray-50/50 shadow-inner">
                  {/* Decorative Scan lines */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-secondary/20 pointer-events-none group-hover:border-secondary/35 transition-all duration-300" />

                  {/* QR Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="Código QR de WhatsApp"
                    className="w-52 h-52 object-contain select-none rounded-2xl bg-white p-2 shadow-sm"
                  />
                </div>
              ) : null}

              {status === 'QR_PENDING' && !qrCode && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <p className="text-gray-500 text-xs">Generando código QR...</p>
                </div>
              )}

              {status === 'AUTHENTICATING' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center animate-pulse">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-bold text-sm">Iniciando sesión...</p>
                    <p className="text-gray-400 text-xs">Aceptando sesión en el dispositivo.</p>
                  </div>
                </div>
              )}

              {status === 'DISCONNECTED' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <button
                    onClick={handleRestart}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary active:bg-secondary text-white font-semibold text-xs transition-all duration-150 cursor-pointer shadow-md shadow-sm"
                  >
                    Generar Código QR
                  </button>
                </div>
              )}

              {status === 'ERROR' && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                  <p className="text-red-800 text-xs font-semibold">Error al inicializar.</p>
                  <button
                    onClick={handleRestart}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-semibold text-xs transition-all duration-150 cursor-pointer"
                  >
                    Reintentar Conexión
                  </button>
                </div>
              )}
            </div>

            {/* Instruction Steps */}
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <span className="text-gray-900 font-bold text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-secondary" />
                Instrucciones para Vincular
              </span>
              <ol className="text-gray-500 text-xs space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                <li>
                  Abra la aplicación de <strong>WhatsApp</strong> en su teléfono móvil.
                </li>
                <li>
                  Toque sobre <strong>Menú</strong> o <strong>Configuración</strong> en la pantalla
                  principal.
                </li>
                <li>
                  Seleccione la opción de <strong>Dispositivos vinculados</strong>.
                </li>
                <li>
                  Toque en el botón <strong>Vincular un dispositivo</strong> y apunte la cámara al
                  código QR.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
