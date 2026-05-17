import type { LucideIcon } from 'lucide-react'

export interface Step {
  id: number
  title: string
}

export interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
  stepIcons: LucideIcon[]
  onStepClick: (step: number) => void
}
