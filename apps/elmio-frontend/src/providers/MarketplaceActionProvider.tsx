'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'

export type MarketplaceActionType = 'PAYMENT' | 'INSURANCE_FORM' | 'NONE' | string

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

interface MarketplaceActionContextProps {
  state: ActionState
  openAction: (type: MarketplaceActionType, data?: any) => void
  closeAction: () => void
}

const MarketplaceActionContext = createContext<MarketplaceActionContextProps | undefined>(undefined)

/**
 * Provider que envuelve el marketplace para manejar ventanas de acción (pagos, seguros, modales de usuario).
 * Utiliza un reducer para despachar acciones globalmente.
 */
export function MarketplaceActionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(actionReducer, initialState)

  const openAction = (actionType: MarketplaceActionType, actionData?: any) => {
    dispatch({ type: 'OPEN_ACTION', payload: { actionType, actionData } })
  }

  const closeAction = () => {
    dispatch({ type: 'CLOSE_ACTION' })
  }

  return (
    <MarketplaceActionContext.Provider value={{ state, openAction, closeAction }}>
      {children}
      
      {/* Aqui se renderizan dinamicamente los modales / ventanas */}
      {state.isOpen && state.actionType === 'PAYMENT' && (
        <PaymentModal data={state.actionData} onClose={closeAction} />
      )}
      {state.isOpen && state.actionType === 'INSURANCE_FORM' && (
        <InsuranceFormModal data={state.actionData} onClose={closeAction} />
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

// ----- Componentes Modales (Placeholders escalables) -----

function PaymentModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Procesar Pago</h2>
        <p className="text-gray-600 mb-6">Módulo de pago en construcción...</p>
        <button onClick={onClose} className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
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
        <button onClick={onClose} className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  )
}
