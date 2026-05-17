import type { ReactNode, ComponentType } from 'react'

export interface CardGroupProps {
  title: string
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>
  children: ReactNode
}
