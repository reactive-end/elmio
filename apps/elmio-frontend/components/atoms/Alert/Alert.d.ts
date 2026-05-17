export interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}
