'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'
import { authService } from '@/src/services/auth.service'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

gsap.registerPlugin(useGSAP)

type LoginMethod = 'phone' | 'email'
type LoginStage = 'identifier' | 'password'
type SelectorStage = 'profiles' | 'password'

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

/**
 * Hook que encapsula toda la logica del formulario de inicio de sesion:
 * cambio de tabs, validacion, estado de carga y animaciones GSAP.
 */
export function useLoginForm() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone')
  const [stage, setStage] = useState<LoginStage>('identifier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [operatorPrefix, setOperatorPrefix] = useState<OperatorPrefix>('412')
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [rawDigits, setRawDigits] = useState('')

  // Estados para manejo de múltiples perfiles
  const [profiles, setProfiles] = useState<
    Array<{ userId: string; name: string; role: 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT' }>
  >([])
  const [showSelector, setShowSelector] = useState(false)
  const [selectorStage, setSelectorStage] = useState<SelectorStage>('profiles')
  const [selectedProfile, setSelectedProfile] = useState<{
    userId: string
    name: string
    role: 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT'
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tabIndicatorRef = useRef<HTMLDivElement>(null)

  const phoneDisplay = formatPhoneDisplay(rawDigits)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripPhoneFormat(e.target.value).slice(0, 7)
    setRawDigits(digits)
  }

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

  const switchTab = (method: LoginMethod) => {
    if (method === loginMethod) return
    setLoginMethod(method)
    setStage('identifier')
    setAlert(null)
    setPassword('')
    setProfiles([])
    setSelectorStage('profiles')
    setSelectedProfile(null)
    setShowSelector(false)
    if (contentRef.current) {
      const direction = method === 'email' ? 1 : -1
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: direction * 16 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' },
      )
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)
    setIsLoading(true)

    try {
      const loginVal =
        loginMethod === 'email' ? email.trim() : `${countryCode.dial}${operatorPrefix}${rawDigits}`

      if (loginMethod === 'email') {
        if (!email.trim()) {
          throw new Error('El correo electrónico es obligatorio.')
        }
      } else if (rawDigits.length < 7) {
        throw new Error('El número de teléfono debe tener 7 dígitos.')
      }

      if (stage === 'identifier') {
        const res = await authService.discoverProfiles(loginVal)

        if (res.profiles.length > 1) {
          setProfiles(res.profiles)
          setSelectedProfile(null)
          setPassword('')
          setSelectorStage('profiles')
          setShowSelector(true)
          return
        }

        if (res.profiles.length === 1) {
          setSelectedProfile(res.profiles[0])
          setStage('password')
          return
        }
      }

      if (!password.trim()) {
        throw new Error('La contrasena es obligatoria.')
      }

      await authService.login(loginVal, password, selectedProfile?.userId)
      router.push('/dashboard')
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al iniciar sesión.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectProfile = (userId: string) => {
    const profile = profiles.find((item) => item.userId === userId) ?? null
    if (!profile) return

    setSelectedProfile(profile)
    setSelectorStage('password')
    setAlert(null)
    setPassword('')
  }

  const handleSelectorPasswordSubmit = async () => {
    setAlert(null)
    setIsLoading(true)

    try {
      const loginVal =
        loginMethod === 'email' ? email.trim() : `${countryCode.dial}${operatorPrefix}${rawDigits}`

      if (!selectedProfile) {
        throw new Error('Selecciona un perfil para continuar.')
      }

      if (!password.trim()) {
        throw new Error('La contrasena es obligatoria.')
      }

      await authService.login(loginVal, password, selectedProfile.userId)
      setShowSelector(false)
      router.push('/dashboard')
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al iniciar sesión.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectorBack = () => {
    if (selectorStage === 'password') {
      setSelectorStage('profiles')
      setSelectedProfile(null)
      setPassword('')
      setAlert(null)
      return
    }

    setShowSelector(false)
    setSelectedProfile(null)
    setPassword('')
    setAlert(null)
  }

  const handleBackToIdentifier = () => {
    setStage('identifier')
    setSelectedProfile(null)
    setProfiles([])
    setSelectorStage('profiles')
    setPassword('')
    setAlert(null)
  }

  const identifierLabel =
    loginMethod === 'email' ? email : `${countryCode.dial}${operatorPrefix}${rawDigits}`

  return {
    loginMethod,
    stage,
    selectedProfile,
    identifierLabel,
    email,
    phoneDisplay,
    password,
    countryCode,
    operatorPrefix,
    isLoading,
    alert,
    profiles,
    showSelector,
    selectorStage,
    containerRef,
    contentRef,
    tabIndicatorRef,
    setEmail,
    setPassword,
    setCountryCode,
    setOperatorPrefix,
    setAlert,
    setShowSelector,
    handlePhoneChange,
    handleSubmit,
    handleSelectProfile,
    handleSelectorPasswordSubmit,
    handleSelectorBack,
    handleBackToIdentifier,
    switchTab,
  }
}
