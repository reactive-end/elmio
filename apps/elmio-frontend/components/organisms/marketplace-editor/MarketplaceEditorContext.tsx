'use client'

import { createContext, useContext } from 'react'

interface MarketplaceEditorContextProps {
  tenantDirectory: string
}

const MarketplaceEditorContext = createContext<MarketplaceEditorContextProps | null>(null)

export function MarketplaceEditorProvider({
  children,
  tenantDirectory,
}: {
  children: React.ReactNode
  tenantDirectory: string
}) {
  return (
    <MarketplaceEditorContext.Provider value={{ tenantDirectory }}>
      {children}
    </MarketplaceEditorContext.Provider>
  )
}

export function useMarketplaceEditorContext() {
  const context = useContext(MarketplaceEditorContext)
  return context
}
