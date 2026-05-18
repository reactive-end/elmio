'use client'

import { useState, useCallback } from 'react'
import {
  enterpriseService,
  type Enterprise,
  type CreateEnterpriseInput,
  type UpdateEnterpriseInput,
  type CollaboratorInput,
  type Shareholder,
  type BankAccount,
} from '@/src/services/empresa.service'

type OnboardingStep =
  | 'company-data'
  | 'legal-docs'
  | 'legal-rep'
  | 'shareholders'
  | 'bank-accounts'
  | 'payroll'

interface UseOnboardingReturn {
  step: OnboardingStep
  enterprise: Enterprise | null
  loading: boolean
  error: string | null

  // Paso 1: Datos generales
  companyData: CreateEnterpriseInput
  setCompanyData: (data: CreateEnterpriseInput) => void
  submitCompanyData: () => Promise<void>

  // Paso 2: Documentos legales
  legalDocs: LegalDocsForm
  setLegalDocs: (data: LegalDocsForm) => void
  submitLegalDocs: () => Promise<void>

  // Paso 3: Representante legal + encargado de cuenta
  legalRep: LegalRepForm
  setLegalRep: (data: LegalRepForm) => void
  submitLegalRep: () => Promise<void>

  // Paso 4: Accionistas
  shareholderCount: number
  setShareholderCount: (n: number) => void
  shareholders: Shareholder[]
  setShareholders: (items: Shareholder[]) => void
  submitShareholders: () => Promise<void>

  // Paso 5: Cuentas bancarias
  bankAccounts: BankAccount[]
  setBankAccounts: (items: BankAccount[]) => void
  submitBankAccounts: () => Promise<void>

  // Paso 6: Nomina
  payrollItems: CollaboratorInput[]
  setPayrollItems: (items: CollaboratorInput[]) => void
  submitPayroll: () => Promise<void>
  skipPayroll: () => Promise<void>
}

interface LegalDocsForm {
  taxIdPhoto: string
  constitutiveActPhoto: string
  lastAssemblyPhoto: string
  serviceReceiptPhoto: string
  bankStatementsPhotos: string[]
  bankReferencePhotos: string[]
}

interface LegalRepForm {
  legalRepDocumentId: string
  legalRepDocumentPhoto: string
  accountManagerDocumentId: string
  accountManagerDocumentPhoto: string
  website: string
  headquartersLocation: string
  socialMediaInstagram: string
  socialMediaFacebook: string
  socialMediaTwitter: string
  socialMediaLinkedin: string
  socialMediaTiktok: string
  socialMediaOther: string
}

const EMPTY_SHAREHOLDER: Shareholder = {
  name: '',
  lastName: '',
  documentId: '',
  documentPhoto: '',
  phone: '',
  email: '',
}

const EMPTY_BANK_ACCOUNT: BankAccount = {
  accountNumber: '',
  accountType: 'checking',
  bank: '',
}

/**
 * Hook que gestiona el flujo de onboarding empresarial en 6 pasos:
 * 1. Datos generales de empresa
 * 2. Documentos legales
 * 3. Representante legal + encargado + web/redes
 * 4. Accionistas
 * 5. Cuentas bancarias (max 3)
 * 6. Carga de nomina (opcional)
 */
export function useOnboarding(): UseOnboardingReturn {
  const [step, setStep] = useState<OnboardingStep>('company-data')
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyData, setCompanyData] = useState<CreateEnterpriseInput>({
    companyName: '',
    sector: '',
    employeeCount: 0,
    phone: '',
    email: '',
    taxId: '',
  })

  const [legalDocs, setLegalDocs] = useState<LegalDocsForm>({
    taxIdPhoto: '',
    constitutiveActPhoto: '',
    lastAssemblyPhoto: '',
    serviceReceiptPhoto: '',
    bankStatementsPhotos: [],
    bankReferencePhotos: [],
  })

  const [legalRep, setLegalRep] = useState<LegalRepForm>({
    legalRepDocumentId: '',
    legalRepDocumentPhoto: '',
    accountManagerDocumentId: '',
    accountManagerDocumentPhoto: '',
    website: '',
    headquartersLocation: '',
    socialMediaInstagram: '',
    socialMediaFacebook: '',
    socialMediaTwitter: '',
    socialMediaLinkedin: '',
    socialMediaTiktok: '',
    socialMediaOther: '',
  })

  const [shareholderCount, setShareholderCount] = useState(1)
  const [shareholders, setShareholders] = useState<Shareholder[]>([{ ...EMPTY_SHAREHOLDER }])

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([{ ...EMPTY_BANK_ACCOUNT }])

  const [payrollItems, setPayrollItems] = useState<CollaboratorInput[]>([])

  const withLoading = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        setLoading(true)
        setError(null)
        await fn()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error inesperado.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const submitCompanyData = useCallback(async () => {
    await withLoading(async () => {
      const emp = await enterpriseService.create({
        companyName: companyData.companyName.trim(),
        sector: companyData.sector.trim(),
        employeeCount: companyData.employeeCount,
        phone: companyData.phone.trim(),
        email: companyData.email.trim(),
        taxId: companyData.taxId.trim(),
      })
      setEnterprise(emp)
      setStep('legal-docs')
    })
  }, [companyData, withLoading])

  const submitLegalDocs = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      const updated = await enterpriseService.updateEnterprise(enterprise.id, {
        taxIdPhoto: legalDocs.taxIdPhoto,
        constitutiveActPhoto: legalDocs.constitutiveActPhoto,
        lastAssemblyPhoto: legalDocs.lastAssemblyPhoto,
        serviceReceiptPhoto: legalDocs.serviceReceiptPhoto,
        bankStatementsPhotos: legalDocs.bankStatementsPhotos,
        bankReferencePhotos: legalDocs.bankReferencePhotos,
      })
      setEnterprise(updated)
      setStep('legal-rep')
    })
  }, [enterprise, legalDocs, withLoading])

  const submitLegalRep = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      const updateData: UpdateEnterpriseInput = {
        legalRepDocumentId: legalRep.legalRepDocumentId,
        legalRepDocumentPhoto: legalRep.legalRepDocumentPhoto,
        accountManagerDocumentId: legalRep.accountManagerDocumentId,
        accountManagerDocumentPhoto: legalRep.accountManagerDocumentPhoto,
        website: legalRep.website,
        headquartersLocation: legalRep.headquartersLocation,
        socialMedia: {
          instagram: legalRep.socialMediaInstagram,
          facebook: legalRep.socialMediaFacebook,
          twitter: legalRep.socialMediaTwitter,
          linkedin: legalRep.socialMediaLinkedin,
          tiktok: legalRep.socialMediaTiktok,
          other: legalRep.socialMediaOther,
        },
      }
      const updated = await enterpriseService.updateEnterprise(enterprise.id, updateData)
      setEnterprise(updated)
      setStep('shareholders')
    })
  }, [enterprise, legalRep, withLoading])

  const submitShareholders = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      const updated = await enterpriseService.updateEnterprise(enterprise.id, {
        shareholderCount,
        shareholders: shareholders.slice(0, shareholderCount),
      })
      setEnterprise(updated)
      setStep('bank-accounts')
    })
  }, [enterprise, shareholderCount, shareholders, withLoading])

  const submitBankAccounts = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      const validAccounts = bankAccounts.filter((a) => a.accountNumber.trim() && a.bank.trim())
      const updated = await enterpriseService.updateEnterprise(enterprise.id, {
        bankAccounts: validAccounts,
      })
      setEnterprise(updated)
      setStep('payroll')
    })
  }, [enterprise, bankAccounts, withLoading])

  const submitPayroll = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      if (payrollItems.length > 0) {
        await enterpriseService.bulkUploadCollaborators(enterprise.id, payrollItems)
      }
      await enterpriseService.completeOnboarding(enterprise.id)
      window.location.href = '/dashboard/enterprise/account-statement'
    })
  }, [enterprise, payrollItems, withLoading])

  const skipPayroll = useCallback(async () => {
    if (!enterprise) return
    await withLoading(async () => {
      await enterpriseService.completeOnboarding(enterprise.id)
      window.location.href = '/dashboard/enterprise/account-statement'
    })
  }, [enterprise, withLoading])

  return {
    step,
    enterprise,
    loading,
    error,
    companyData,
    setCompanyData,
    submitCompanyData,
    legalDocs,
    setLegalDocs,
    submitLegalDocs,
    legalRep,
    setLegalRep,
    submitLegalRep,
    shareholderCount,
    setShareholderCount,
    shareholders,
    setShareholders,
    submitShareholders,
    bankAccounts,
    setBankAccounts,
    submitBankAccounts,
    payrollItems,
    setPayrollItems,
    submitPayroll,
    skipPayroll,
  }
}
