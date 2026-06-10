'use client'

import { useState, useRef, type FormEvent } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRouter } from 'next/navigation'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import { authService } from '@/src/services/auth.service'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

gsap.registerPlugin(useGSAP)

export type AccountRole = 'CLIENT' | 'COMPANY'
export type RegisterStep = 0 | 1 | 2 | 3

interface UserFields {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
  document_letter: string
  document_digits: string
}

export interface CompanyFields {
  companyName: string
  taxId_letter: string
  taxId_digits: string
  sector: string
  employeeCount: string
}

interface PersonalFields {
  age: string
  gender: string
  birth_date: string
  civil_status: string
  height: string
  weight: string
  address: string
  occupation: string
  country_of_origin: string
  country_of_residence: string
}

interface EmploymentFields {
  employment_type: string
  employment_sector: string
  monthly_income: string
  residence_type: string
  is_residence_owned: string
  family_dependents: string
  employer_company_name: string
  time_in_company_months: string
  loan_purpose: string
}

interface AlertState {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
}

const DEFAULT_COUNTRY: CountryCode = {
  code: 'VE',
  dial: '+58',
  flag: '🇻🇪',
  name: 'Venezuela',
}

export interface UseRegisterFormReturn {
  step: RegisterStep
  accountRole: AccountRole | null
  userFields: UserFields
  personalFields: PersonalFields
  employmentFields: EmploymentFields
  companyFields: CompanyFields
  countryCode: CountryCode
  operatorPrefix: OperatorPrefix
  phoneDisplay: string
  isLoading: boolean
  alert: AlertState | null
  containerRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  setAlert: (a: AlertState | null) => void
  setCountryCode: (c: CountryCode) => void
  setOperatorPrefix: (p: OperatorPrefix) => void
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  updateUserField: (field: keyof UserFields, value: string) => void
  updatePersonalField: (field: keyof PersonalFields, value: string) => void
  updateEmploymentField: (field: keyof EmploymentFields, value: string) => void
  updateCompanyField: (field: keyof CompanyFields, value: string) => void
  selectRole: (role: AccountRole) => void
  handleNext: () => void
  handleBack: () => void
  handleSubmit: (e: FormEvent) => void
}

/**
 * Hook que encapsula la logica del formulario de registro.
 * Paso 0 — Tipo de cuenta: Empresa o Persona Natural.
 * Persona Natural:
 *   Paso 1 — Cuenta: datos basicos, cedula, telefono, contrasena.
 *   Paso 2 — Personal: fecha de nacimiento, genero, direccion, ocupacion.
 *   Paso 3 — Laboral: tipo de empleo, ingresos, vivienda, proposito.
 * Empresa:
 *   Paso 1 — Solo nombre, email y contrasena. Luego redirige a onboarding.
 */
export function useRegisterForm(): UseRegisterFormReturn {
  const router = useRouter()
  const [step, setStep] = useState<RegisterStep>(0)
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [operatorPrefix, setOperatorPrefix] = useState<OperatorPrefix>('412')
  const { displayValue: phoneDisplay, handleChange: handlePhoneChange } = usePhoneFormat()

  const [userFields, setUserFields] = useState<UserFields>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    document_letter: 'V',
    document_digits: '',
  })

  const [personalFields, setPersonalFields] = useState<PersonalFields>({
    age: '',
    gender: '',
    birth_date: '',
    civil_status: '',
    height: '',
    weight: '',
    address: '',
    occupation: '',
    country_of_origin: 'Venezuela',
    country_of_residence: 'Venezuela',
  })

  const [employmentFields, setEmploymentFields] = useState<EmploymentFields>({
    employment_type: '',
    employment_sector: '',
    monthly_income: '',
    residence_type: '',
    is_residence_owned: 'false',
    family_dependents: '0',
    employer_company_name: '',
    time_in_company_months: '',
    loan_purpose: '',
  })

  const [companyFields, setCompanyFields] = useState<CompanyFields>({
    companyName: '',
    taxId_letter: 'J',
    taxId_digits: '',
    sector: '',
    employeeCount: '',
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power2.out',
      })
    },
    { scope: containerRef },
  )

  const animateStepTransition = (direction: 1 | -1) => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: direction * 30 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' },
      )
    }
  }

  const updateUserField = (field: keyof UserFields, value: string) => {
    setUserFields((prev) => ({ ...prev, [field]: value }))
  }

  const updatePersonalField = (field: keyof PersonalFields, value: string) => {
    setPersonalFields((prev) => ({ ...prev, [field]: value }))
  }

  const updateCompanyField = (field: keyof CompanyFields, value: string) => {
    setCompanyFields((prev) => ({ ...prev, [field]: value }))
  }

  const updateEmploymentField = (field: keyof EmploymentFields, value: string) => {
    setEmploymentFields((prev) => ({ ...prev, [field]: value }))
  }

  const selectRole = (role: AccountRole) => {
    setAccountRole(role)
    setStep(1)
    animateStepTransition(1)
  }

  const validateStep1 = (): boolean => {
    if (!userFields.first_name.trim()) {
      setAlert({ type: 'error', message: 'El nombre es requerido' })
      return false
    }
    if (!userFields.email.trim()) {
      setAlert({ type: 'error', message: 'El correo electronico es requerido' })
      return false
    }
    if (userFields.password.length < 8) {
      setAlert({ type: 'error', message: 'La contrasena debe tener al menos 8 caracteres' })
      return false
    }
    if (userFields.password !== userFields.password_confirm) {
      setAlert({ type: 'error', message: 'Las contrasenas no coinciden' })
      return false
    }
    if (
      accountRole === 'CLIENT' &&
      (!userFields.document_digits.trim() || userFields.document_digits.length < 7)
    ) {
      setAlert({ type: 'error', message: 'La cedula debe tener al menos 7 digitos' })
      return false
    }
    return true
  }

  const validateCompanyStep = (): boolean => {
    if (!companyFields.companyName.trim()) {
      setAlert({ type: 'error', message: 'La razon social es requerida' })
      return false
    }
    if (!companyFields.taxId_digits.trim() || companyFields.taxId_digits.length < 7) {
      setAlert({ type: 'error', message: 'El RIF debe tener al menos 7 digitos' })
      return false
    }
    if (!companyFields.sector) {
      setAlert({ type: 'error', message: 'El sector es requerido' })
      return false
    }
    if (!companyFields.employeeCount || parseInt(companyFields.employeeCount) < 1) {
      setAlert({ type: 'error', message: 'El numero de empleados es requerido' })
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    const required: (keyof PersonalFields)[] = [
      'age',
      'gender',
      'birth_date',
      'civil_status',
      'height',
      'weight',
      'address',
      'occupation',
      'country_of_origin',
      'country_of_residence',
    ]
    const names: Record<keyof PersonalFields, string> = {
      age: 'Edad',
      gender: 'Genero',
      birth_date: 'Fecha de nacimiento',
      civil_status: 'Estado civil',
      height: 'Estatura',
      weight: 'Peso',
      address: 'Direccion',
      occupation: 'Ocupacion',
      country_of_origin: 'Pais de origen',
      country_of_residence: 'Pais de residencia',
    }
    for (const field of required) {
      if (!personalFields[field].trim()) {
        setAlert({ type: 'error', message: `${names[field]} es requerido` })
        return false
      }
    }
    return true
  }

  const validateStep3 = (): boolean => {
    const required: (keyof EmploymentFields)[] = [
      'employment_type',
      'employment_sector',
      'monthly_income',
      'residence_type',
    ]
    const names: Record<keyof EmploymentFields, string> = {
      employment_type: 'Tipo de empleo',
      employment_sector: 'Sector de empleo',
      monthly_income: 'Ingreso mensual',
      residence_type: 'Tipo de vivienda',
      is_residence_owned: 'Vivienda propia',
      family_dependents: 'Dependientes familiares',
      employer_company_name: 'Nombre de empresa',
      time_in_company_months: 'Tiempo en la empresa',
      loan_purpose: 'Proposito',
    }
    for (const field of required) {
      if (!employmentFields[field].trim()) {
        setAlert({ type: 'error', message: `${names[field]} es requerido` })
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    setAlert(null)
    if (step === 1) {
      if (accountRole === 'COMPANY' && validateCompanyStep()) {
        setStep(2)
        animateStepTransition(1)
      } else if (accountRole === 'CLIENT' && validateStep1()) {
        setStep(2)
        animateStepTransition(1)
      }
    } else if (step === 2 && accountRole === 'CLIENT' && validateStep2()) {
      setStep(3)
      animateStepTransition(1)
    }
  }

  const handleBack = () => {
    setAlert(null)
    if (step === 1) {
      setStep(0)
      setAccountRole(null)
      animateStepTransition(-1)
    }
    if (step === 2) {
      setStep(1)
      animateStepTransition(-1)
    }
    if (step === 3) {
      setStep(2)
      animateStepTransition(-1)
    }
  }

  /**
   * Inicia sesion del usuario recen registrado y selecciona el perfil adecuado.
   * Funciona tanto si el email es nuevo (un solo perfil) como si ya existia
   * con un perfil previo (multi-perfil tras nuestro fix). El backend exige
   * que la contrasena coincida con la del primer perfil existente cuando
   * el email ya estaba registrado, asi que usamos el flujo de descubrimiento
   * de perfiles y login con `userId` especifico para que el token JWT quede
   * atado al perfil COMPANY o CLIENT que acabamos de crear.
   */
  const autologinAfterRegister = async (): Promise<void> => {
    const discovery = await authService.discoverProfiles(userFields.email.trim())
    const profiles = discovery.profiles ?? []
    if (profiles.length === 0) {
      throw new Error('No se encontro un perfil para el correo registrado.')
    }

    const targetProfile = profiles.find((p) => p.role === accountRole) ?? profiles[0]
    if (!targetProfile) {
      throw new Error('No se encontro el perfil recen creado.')
    }

    await authService.login(userFields.email.trim(), userFields.password, targetProfile.userId)
  }

  const doRegister = async () => {
    if (!accountRole) return

    try {
      setIsLoading(true)
      setAlert(null)

      const fullName = `${userFields.first_name} ${userFields.last_name}`.trim()

      await authService.register({
        name: fullName,
        email: userFields.email,
        password: userFields.password,
        role: accountRole,
        owner: 'default',
      })

      // Autologuear usando el flujo de descubrimiento de perfiles.
      // Esto funciona tanto si el email es nuevo (un solo perfil) como si ya
      // existia con un perfil previo (multi-perfil tras nuestro fix).
      await autologinAfterRegister()

      if (accountRole === 'COMPANY') {
        const { enterpriseService } = await import('@/src/services/empresa.service')

        const fullPhone = `${countryCode.dial}${operatorPrefix}${phoneDisplay.replace(/\D/g, '')}`
        const taxId = `${companyFields.taxId_letter}-${companyFields.taxId_digits}`

        await enterpriseService.create({
          companyName: companyFields.companyName.trim(),
          taxId,
          sector: companyFields.sector,
          employeeCount: parseInt(companyFields.employeeCount) || 0,
          phone: fullPhone,
          email: userFields.email,
        })
      }

      if (accountRole === 'CLIENT') {
        const { enterpriseService } = await import('@/src/services/empresa.service')

        await enterpriseService.updateMyProfile({
          name: userFields.first_name,
          lastName: userFields.last_name,
          documentType: userFields.document_letter,
          documentId: userFields.document_digits,
          email: userFields.email,
          phone: `${countryCode.dial}${operatorPrefix}${phoneDisplay.replace(/\D/g, '')}`,
          age: parseInt(personalFields.age) || 0,
          gender: personalFields.gender,
          birthDate: personalFields.birth_date,
          civilStatus: personalFields.civil_status,
          height: personalFields.height,
          weight: personalFields.weight,
          address: personalFields.address,
          countryOfOrigin: personalFields.country_of_origin,
          countryOfResidence: personalFields.country_of_residence,
          employmentType: employmentFields.employment_type,
          employmentSector: employmentFields.employment_sector,
          recurringIncome: parseFloat(employmentFields.monthly_income) || 0,
          residenceType: employmentFields.residence_type,
          isResidenceOwned: employmentFields.is_residence_owned === 'true',
          familyDependents: parseInt(employmentFields.family_dependents) || 0,
          timeInCompanyMonths: parseInt(employmentFields.time_in_company_months) || 0,
          loanPurpose: employmentFields.loan_purpose,
        })

        await enterpriseService.completeProfileOnboarding()
      }

      setAlert({
        type: 'success',
        message: 'Registro exitoso. Redirigiendo...',
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al registrar usuario.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)

    if (accountRole === 'COMPANY') {
      if (step === 1) {
        handleNext()
        return
      }
      if (step === 2) {
        if (validateStep1()) {
          void doRegister()
        }
        return
      }
    }

    if (accountRole === 'CLIENT') {
      if (step < 3) {
        handleNext()
        return
      }
      if (!validateStep3()) return
      void doRegister()
    }
  }

  return {
    step,
    accountRole,
    userFields,
    personalFields,
    employmentFields,
    companyFields,
    countryCode,
    operatorPrefix,
    phoneDisplay,
    isLoading,
    alert,
    containerRef,
    contentRef,
    setAlert,
    setCountryCode,
    setOperatorPrefix,
    handlePhoneChange,
    updateUserField,
    updatePersonalField,
    updateEmploymentField,
    updateCompanyField,
    selectRole,
    handleNext,
    handleBack,
    handleSubmit,
  }
}
