import type { ReactNode } from 'react'

export interface FormFieldProps {
  label: string | ReactNode
  error?: string
  children: ReactNode
  required?: boolean
}
