'use client'

import { useState, useRef, type FormEvent } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRouter } from 'next/navigation'
import { usePhoneFormat } from '@/src/utils/usePhoneFormat'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

gsap.registerPlugin(useGSAP)

export type RegisterStep = 1 | 2 | 3

interface UserFields {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
  document_letter: string
  document_digits: string
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
  userFields: UserFields
  personalFields: PersonalFields
  employmentFields: EmploymentFields
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
  handleNext: () => void
  handleBack: () => void
  handleSubmit: (e: FormEvent) => void
}

/**
 * Hook que encapsula la logica del formulario de registro en 3 pasos:
 * 1. Cuenta — datos basicos, cedula, telefono, contrasena.
 * 2. Personal — fecha de nacimiento, genero, direccion, ocupacion.
 * 3. Laboral — tipo de empleo, ingresos, vivienda, proposito.
 *
 * Cada paso se valida antes de avanzar. El envio final simula el registro.
 */
export function useRegisterForm(): UseRegisterFormReturn {
  const router = useRouter()
  const [step, setStep] = useState<RegisterStep>(1)
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

  const updateEmploymentField = (field: keyof EmploymentFields, value: string) => {
    setEmploymentFields((prev) => ({ ...prev, [field]: value }))
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
    if (!userFields.document_digits.trim() || userFields.document_digits.length < 7) {
      setAlert({ type: 'error', message: 'La cedula debe tener al menos 7 digitos' })
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
    return true
  }

  const validateStep2 = (): boolean => {
    const required: (keyof PersonalFields)[] = [
      'age', 'gender', 'birth_date', 'civil_status', 'height',
      'weight', 'address', 'occupation', 'country_of_origin', 'country_of_residence',
    ]
    const names: Record<keyof PersonalFields, string> = {
      age: 'Edad', gender: 'Genero', birth_date: 'Fecha de nacimiento',
      civil_status: 'Estado civil', height: 'Estatura', weight: 'Peso',
      address: 'Direccion', occupation: 'Ocupacion',
      country_of_origin: 'Pais de origen', country_of_residence: 'Pais de residencia',
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
      'employment_type', 'employment_sector', 'monthly_income', 'residence_type',
    ]
    const names: Record<keyof EmploymentFields, string> = {
      employment_type: 'Tipo de empleo', employment_sector: 'Sector de empleo',
      monthly_income: 'Ingreso mensual', residence_type: 'Tipo de vivienda',
      is_residence_owned: 'Vivienda propia', family_dependents: 'Dependientes familiares',
      employer_company_name: 'Nombre de empresa', time_in_company_months: 'Tiempo en la empresa',
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
    if (step === 1 && validateStep1()) {
      setStep(2); animateStepTransition(1)
    } else if (step === 2 && validateStep2()) {
      setStep(3); animateStepTransition(1)
    }
  }

  const handleBack = () => {
    setAlert(null)
    if (step === 2) { setStep(1); animateStepTransition(-1) }
    if (step === 3) { setStep(2); animateStepTransition(-1) }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)

    if (step < 3) {
      handleNext()
      return
    }

    if (!validateStep3()) return

    setIsLoading(true)

    // Simulacion de registro (sin backend)
    setTimeout(() => {
      setIsLoading(false)
      setAlert({ type: 'success', message: 'Registro exitoso. Redirigiendo al inicio de sesion...' })
      setTimeout(() => router.push('/login'), 2000)
    }, 1200)
  }

  return {
    step,
    userFields,
    personalFields,
    employmentFields,
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
    handleNext,
    handleBack,
    handleSubmit,
  }
}
