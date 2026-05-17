'use client'

import { useState } from 'react'

export interface UseSidebarReturn {
  collapsed: boolean
  toggleCollapsed: () => void
  openGroups: string[]
  toggleGroup: (key: string) => void
  isGroupOpen: (key: string) => boolean
}

/**
 * Hook que maneja el estado del sidebar: colapsado/expandido y grupos abiertos.
 */
export function useSidebar(): UseSidebarReturn {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const toggleCollapsed = () => setCollapsed((v) => !v)
  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  const isGroupOpen = (key: string) => openGroups.includes(key)

  return { collapsed, toggleCollapsed, openGroups, toggleGroup, isGroupOpen }
}
