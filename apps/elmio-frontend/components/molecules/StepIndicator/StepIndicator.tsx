import { Check } from 'lucide-react'
import type { StepIndicatorProps } from './StepIndicator.d'

/**
 * Molecula que muestra el progreso de un formulario multi-paso.
 * Renderiza circulos numerados con iconos, lineas conectoras y titulos.
 */
export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  stepIcons,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id)
        const isActive = currentStep === step.id
        const StepIcon = stepIcons[idx] ?? Check

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              disabled={!isCompleted && !isActive}
              className={`flex flex-col items-center gap-1 ${isCompleted || isActive ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                    : isCompleted
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <StepIcon className="w-4 h-4" strokeWidth={2} />}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline transition-colors duration-300 ${
                  isActive ? 'text-secondary' : isCompleted ? 'text-secondary/70' : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-300 ${
                  isCompleted ? 'bg-secondary/40' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
