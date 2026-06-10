import type { ConsultationAuthView, ProfileSummary, ConsultationContext } from './useConsultationAuth'

export type { ConsultationAuthView, ProfileSummary, ConsultationContext }

export interface ConsultationAuthReturn {
  view: ConsultationAuthView
  guard: (returnTo: string, context: ConsultationContext) => Promise<boolean>
  selectProfile: (profile: ProfileSummary) => Promise<void>
  cancel: () => void
  currentCompatibleRole: () => 'CLIENT' | 'EMPLOYEE' | null
  currentProfile: () => ProfileSummary | null
}
