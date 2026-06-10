'use client'

import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from 'react'
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm'

export type MarketplaceActionType =
  | 'PAYMENT'
  | 'INSURANCE_FORM'
  | 'MERCANTIL-QUERY'
  | 'MERCANTIL-RCV-QUERY'
  | 'MUNDIAL-RCV-QUERY'
  | 'NONE'
  | string

interface ActionState {
  isOpen: boolean
  actionType: MarketplaceActionType
  actionData: any | null
}

const initialState: ActionState = {
  isOpen: false,
  actionType: 'NONE',
  actionData: null,
}

type Action =
  | { type: 'OPEN_ACTION'; payload: { actionType: MarketplaceActionType; actionData?: any } }
  | { type: 'CLOSE_ACTION' }

function actionReducer(state: ActionState, action: Action): ActionState {
  switch (action.type) {
    case 'OPEN_ACTION':
      return {
        isOpen: true,
        actionType: action.payload.actionType,
        actionData: action.payload.actionData || null,
      }
    case 'CLOSE_ACTION':
      return {
        ...state,
        isOpen: false,
      }
    default:
      return state
  }
}

interface LoginRequest {
  returnTo?: string
  onSuccess?: () => void
}

interface MarketplaceActionContextProps {
  state: ActionState
  openAction: (type: MarketplaceActionType, data?: any) => void
  closeAction: () => void
  /**
   * Abre el modal de login global desde cualquier punto del marketplace (no solo embebido).
   * El callback onSuccess se ejecuta cuando el usuario completa el login.
   * @param request - Configuracion opcional con returnTo y onSuccess.
   */
  openLoginModal: (request?: LoginRequest) => void
  /**
   * Cierra el modal de login global si esta abierto.
   */
  closeLoginModal: () => void
}

const MarketplaceActionContext = createContext<MarketplaceActionContextProps | undefined>(undefined)

/**
 * Provider que envuelve el marketplace para manejar ventanas de acción (pagos, seguros, modales de usuario).
 * Utiliza un reducer para despachar acciones globalmente.
 */
export function MarketplaceActionProvider({
  children,
  marketplaceId,
  marketplaceName,
}: {
  children: ReactNode
  marketplaceId?: string
  marketplaceName?: string
}) {
  const [state, dispatch] = useReducer(actionReducer, initialState)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginSuccessCallback, setLoginSuccessCallback] = useState<(() => void) | null>(null)

  const openAction = (actionType: MarketplaceActionType, actionData?: any) => {
    dispatch({ type: 'OPEN_ACTION', payload: { actionType, actionData } })
  }

  const closeAction = () => {
    dispatch({ type: 'CLOSE_ACTION' })
  }

  /**
   * Abre el modal de login premium. Si ya esta abierto, no hace nada.
   * @param request - { returnTo, onSuccess } opcionales. onSuccess se ejecuta tras login exitoso.
   */
  const openLoginModal = (request?: LoginRequest) => {
    if (isLoginOpen) return
    setLoginSuccessCallback(request?.onSuccess ?? null)
    setIsLoginOpen(true)
  }

  const closeLoginModal = () => {
    setIsLoginOpen(false)
    setLoginSuccessCallback(null)
  }

  // Escuchar mensajes provenientes del iframe embebido (completado, cancelado o requerimiento de autenticación)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data) return

      if (data.source === 'mercantil-consulta') {
        if (data.type === 'completed' || data.type === 'cancelled') {
          closeAction()
        }
      }

      if (data.source === 'mercantil-consulta-auth-required' && data.type === 'login-required') {
        // No pisar el callback si ya se abrio programaticamente
        if (loginSuccessCallback) return
        setIsLoginOpen(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [state.isOpen])

  return (
    <MarketplaceActionContext.Provider value={{ state, openAction, closeAction, openLoginModal, closeLoginModal }}>
      {children}

      {/* Aqui se renderizan dinamicamente los modales / ventanas */}
      {state.isOpen && state.actionType === 'PAYMENT' && (
        <PaymentModal data={state.actionData} onClose={closeAction} />
      )}
      {state.isOpen && state.actionType === 'INSURANCE_FORM' && (
        <InsuranceFormModal data={state.actionData} onClose={closeAction} />
      )}
      {state.isOpen && state.actionType === 'MERCANTIL-QUERY' && (
        <MercantilQueryModal data={state.actionData} onClose={closeAction} fallbackMarketplace={{ id: marketplaceId, name: marketplaceName }} />
      )}
      {state.isOpen && state.actionType === 'MERCANTIL-RCV-QUERY' && (
        <MercantilRcvQueryModal data={state.actionData} onClose={closeAction} fallbackMarketplace={{ id: marketplaceId, name: marketplaceName }} />
      )}
      {state.isOpen && state.actionType === 'MUNDIAL-RCV-QUERY' && (
        <MundialRcvQueryModal data={state.actionData} onClose={closeAction} fallbackMarketplace={{ id: marketplaceId, name: marketplaceName }} />
      )}

      {/* Modal de Login Premium Superpuesta para el Marketplace */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginOpen(false)
            setLoginSuccessCallback(null)
          }}
          onSuccess={() => {
            setIsLoginOpen(false)
            const callback = loginSuccessCallback
            setLoginSuccessCallback(null)

            // 1. Notificar al iframe de la consulta que la sesion ya esta activa (solo si existe un iframe embebido)
            const iframe = document.querySelector('iframe')
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(
                { source: 'marketplace-auth', type: 'login-success' },
                window.location.origin,
              )
            }

            // 2. Disparar evento global para que la barra de navegacion se actualice de inmediato
            window.dispatchEvent(new CustomEvent('marketplace-login-success-update'))

            // 3. Ejecutar el callback programatico si fue provisto
            if (callback) callback()
          }}
        />
      )}
    </MarketplaceActionContext.Provider>
  )
}

/**
 * Hook para invocar acciones del marketplace desde cualquier componente interno.
 */
export function useMarketplaceAction() {
  const context = useContext(MarketplaceActionContext)
  if (!context) {
    throw new Error('useMarketplaceAction debe usarse dentro de un MarketplaceActionProvider')
  }
  return context
}

// ----- Componentes Modales (Premium y adaptados) -----

/**
 * Construye la URL del iframe embebido preservando todos los params de trazabilidad
 * que llegaron al modal via openAction (productId, productSku, marketplaceId,
 * marketplaceName) y agregando cualquier param extra (p.ej. slug del aliado).
 * Se mantienen como fallback los marketplaceId/marketplaceName que el provider
 * recibio como prop, por si el href original no los inyecto.
 */
function buildEmbeddedUrl(
  basePath: string,
  data: any,
  extraParams: Record<string, string> = {},
  fallbackMarketplace: { id?: string; name?: string } = {},
) {
  const params: string[] = ['embedded=1']
  const incoming = data || {}
  for (const key of ['productId', 'productSku', 'marketplaceId', 'marketplaceName']) {
    const v = incoming[key]
    if (v) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
  }
  // Fallback del provider para marketplaceId/marketplaceName
  if (!incoming.marketplaceId && fallbackMarketplace.id) {
    params.push(`marketplaceId=${encodeURIComponent(fallbackMarketplace.id)}`)
  }
  if (!incoming.marketplaceName && fallbackMarketplace.name) {
    params.push(`marketplaceName=${encodeURIComponent(fallbackMarketplace.name)}`)
  }
  for (const [k, v] of Object.entries(extraParams)) {
    if (v) params.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  }
  return `${basePath}?${params.join('&')}`
}

function PaymentModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Procesar Pago</h2>
        <p className="text-gray-600 mb-6">Módulo de pago en construcción...</p>
        <button
          onClick={onClose}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

function InsuranceFormModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Formulario de Seguros</h2>
        <p className="text-gray-600 mb-6">Módulo de seguros en construcción...</p>
        <button
          onClick={onClose}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

/**
 * Ventana de consulta general de Mercantil idéntica a la tienda empresarial.
 */
function MercantilQueryModal({ data, onClose, fallbackMarketplace }: { data: any; onClose: () => void; fallbackMarketplace?: { id?: string; name?: string } }) {
  const embeddedUrl = buildEmbeddedUrl('/marketplace/mercantil/consulta', data, { slug: data?.slug || '' }, fallbackMarketplace)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-body">Mercantil Seguros</h3>
            <p className="mt-1 text-sm text-body-muted">
              Completa el proceso de consulta mercantil dentro de esta ventana para registrar tu
              compra.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 bg-gray-50">
          <iframe
            title="Consulta Mercantil embebida"
            src={embeddedUrl}
            className="h-full w-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Ventana de consulta RCV de Mercantil idéntica a la tienda empresarial.
 */
function MercantilRcvQueryModal({ data, onClose, fallbackMarketplace }: { data: any; onClose: () => void; fallbackMarketplace?: { id?: string; name?: string } }) {
  const embeddedUrl = buildEmbeddedUrl('/marketplace/mercantil/consulta-rcv', data, {}, fallbackMarketplace)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-body">Mercantil Seguros RCV</h3>
            <p className="mt-1 text-sm text-body-muted">
              Completa el proceso de consulta RCV mercantil dentro de esta ventana para registrar tu
              compra.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 bg-gray-50">
          <iframe
            title="Consulta Mercantil RCV embebida"
            src={embeddedUrl}
            className="h-full w-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Ventana de consulta RCV de La Mundial idéntica a la tienda empresarial.
 */
function MundialRcvQueryModal({ data, onClose, fallbackMarketplace }: { data: any; onClose: () => void; fallbackMarketplace?: { id?: string; name?: string } }) {
  const embeddedUrl = buildEmbeddedUrl('/marketplace/mundial/consulta-rcv', data, {}, fallbackMarketplace)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-body">La Mundial Seguros RCV</h3>
            <p className="mt-1 text-sm text-body-muted">
              Completa el proceso de consulta RCV La Mundial dentro de esta ventana para registrar
              tu compra.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 bg-gray-50">
          <iframe
            title="Consulta La Mundial RCV embebida"
            src={embeddedUrl}
            className="h-full w-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Modal de login premium minimalista flotante del marketplace.
 */
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-slate-950/28 px-4 py-8 backdrop-blur-sm transition-all duration-300">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[28px] overflow-hidden border border-gray-100 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <LoginForm onLoginSuccess={onSuccess} />
      </div>
    </div>
  )
}
