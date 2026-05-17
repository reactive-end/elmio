'use client'

import { useState, useCallback } from 'react'
import { enterpriseService, type Enterprise } from '@/src/services/empresa.service'
import type { CollaboratorInput } from '@/src/services/empresa.service'

type OnboardingStep = 'company-data' | 'domiciliation' | 'payroll'

interface CompanyDataForm {
  companyName: string
  taxId: string
}

interface DomiciliationForm {
  bank: string
  accountType: 'checking' | 'savings'
  accountNumber: string
  holderName: string
  holderId: string
  debitAuthorized: boolean
}

interface UseOnboardingReturn {
  step: OnboardingStep
  enterprise: Enterprise | null
  loading: boolean
  error: string | null

  companyData: CompanyDataForm
  setCompanyData: (data: CompanyDataForm) => void
  submitCompanyData: () => Promise<void>

  domiciliation: DomiciliationForm
  setDomiciliation: (data: DomiciliationForm) => void
  submitDomiciliation: () => Promise<void>

  payrollItems: CollaboratorInput[]
  setPayrollItems: (items: CollaboratorInput[]) => void
  submitPayroll: () => Promise<void>
  skipPayroll: () => Promise<void>
}

/**
 * Hook que gestiona el flujo de onboarding empresarial en 3 pasos:
 * 1. Datos de empresa (razon social, RIF)
 * 2. Domiciliacion bancaria (obligatorio)
 * 3. Carga de nomina (opcional)
 * @returns Estado del flujo, formularios y acciones.
 */
export function useOnboarding(): UseOnboardingReturn {
  const [step, setStep] = useState<OnboardingStep>('company-data')
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyData, setCompanyData] = useState<CompanyDataForm>({
    companyName: '',
    taxId: '',
  })

  const [domiciliation, setDomiciliation] = useState<DomiciliationForm>({
    bank: '',
    accountType: 'checking',
    accountNumber: '',
    holderName: '',
    holderId: '',
    debitAuthorized: false,
  })

  const [payrollItems, setPayrollItems] = useState<CollaboratorInput[]>([])

  const submitCompanyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const emp = await enterpriseService.getOrCreate(
        companyData.companyName.trim(),
        companyData.taxId.trim(),
      )

      setEnterprise(emp)

      if (emp.domiciliation) {
        setStep('payroll')
      } else {
        setStep('domiciliation')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al registrar empresa.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [companyData])

  const submitDomiciliation = useCallback(async () => {
    if (!enterprise) return

    try {
      setLoading(true)
      setError(null)

      await enterpriseService.saveDomiciliation(enterprise.id, domiciliation)
      setStep('payroll')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar domiciliacion.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [enterprise, domiciliation])

  const submitPayroll = useCallback(async () => {
    if (!enterprise) return

    try {
      setLoading(true)
      setError(null)

      if (payrollItems.length > 0) {
        await enterpriseService.bulkUploadCollaborators(enterprise.id, payrollItems)
      }

      await enterpriseService.completeOnboarding(enterprise.id)
      window.location.href = '/dashboard/enterprise/account-statement'
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar nomina.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [enterprise, payrollItems])

  const skipPayroll = useCallback(async () => {
    if (!enterprise) return

    try {
      setLoading(true)
      setError(null)

      await enterpriseService.completeOnboarding(enterprise.id)
      window.location.href = '/dashboard/enterprise/account-statement'
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al completar onboarding.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [enterprise])

  return {
    step,
    enterprise,
    loading,
    error,
    companyData,
    setCompanyData,
    submitCompanyData,
    domiciliation,
    setDomiciliation,
    submitDomiciliation,
    payrollItems,
    setPayrollItems,
    submitPayroll,
    skipPayroll,
  }
}
