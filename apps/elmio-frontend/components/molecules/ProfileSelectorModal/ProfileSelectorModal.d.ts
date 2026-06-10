import type { UserRole } from '@/src/services/auth.service'

export interface ProfileSummary {
  userId: string
  name: string
  role: UserRole
}

export interface ProfileSelectorModalProps {
  isOpen: boolean
  profiles: ProfileSummary[]
  reason: 'multi' | 'role_mismatch'
  isLoading?: boolean
  onSelect: (profile: ProfileSummary) => Promise<void> | void
  onClose: () => void
}
