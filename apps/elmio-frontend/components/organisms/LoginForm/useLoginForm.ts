'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'
import { authService } from '@/src/services/auth.service'
import { recoveryService } from '@/src/services/recovery.service'
import type { CountryCode, OperatorPrefix } from '@/components/molecules/PhoneInput/PhoneInput.d'

gsap.registerPlugin(useGSAP)

type LoginMethod = 'phone' | 'email'
type LoginStage = 'identifier'
type SelectorStage = 'profiles' | 'password' | 'recovery-otp' | 'recovery-reset'

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

interface ProfileItem {
  userId: string
  name: string
  role: 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT'
  email: string
}

/**
 * Hook que encapsula toda la logica del formulario de inicio de sesion,
 * la modal de seleccion de perfiles, ingreso de contrasena y el flujo
 * ultra-premium de recuperacion de contrasena via OTP en varios pasos.
 */
export function useLoginForm(onLoginSuccess?: () => void) {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone')
  // El stage principal se mantiene siempre en identifier
  const [stage] = useState<LoginStage>('identifier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [operatorPrefix, setOperatorPrefix] = useState<OperatorPrefix>('412')
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [rawDigits, setRawDigits] = useState('')

  // Estados para el selector/modal
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [showSelector, setShowSelector] = useState(false)
  const [selectorStage, setSelectorStage] = useState<SelectorStage>('profiles')
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null)

  // Estados para el flujo de recuperacion de contrasena
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [recoveryChannel, setRecoveryChannel] = useState<'whatsapp' | 'email' | null>(null)

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

  // 1. Envío del Identificador
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

      // Descubrir perfiles
      const res = await authService.discoverProfiles(loginVal) as { profiles: ProfileItem[] }

      if (res.profiles.length > 1) {
        setProfiles(res.profiles)
        setSelectedProfile(null)
        setPassword('')
        setSelectorStage('profiles')
        setShowSelector(true)
        return
      }

      if (res.profiles.length === 1) {
        setProfiles(res.profiles)
        setSelectedProfile(res.profiles[0])
        setPassword('')
        setSelectorStage('password')
        setShowSelector(true)
        return
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al iniciar sesión.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Selección de perfil (Múltiples perfiles)
  const handleSelectProfile = (userId: string) => {
    const profile = profiles.find((item) => item.userId === userId) ?? null
    if (!profile) return

    setSelectedProfile(profile)
    setSelectorStage('password')
    setAlert(null)
    setPassword('')
  }

  // 2. Envío de Contraseña en la Modal
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
        throw new Error('La contraseña es obligatoria.')
      }

      await authService.login(loginVal, password, selectedProfile.userId)
      setShowSelector(false)
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        const searchParams = new URLSearchParams(window.location.search)
        const redirect = searchParams.get('redirect')
        if (redirect) {
          const session = authService.getSession()
          const isEmployee = session?.role === 'EMPLOYEE'
          
          if (isEmployee && redirect.includes('/dashboard/enterprise/shop')) {
            try {
              const dummyUrl = new URL(redirect, window.location.origin)
              const productId = dummyUrl.searchParams.get('product')
              if (productId) {
                router.push(`/dashboard/collaborator/shop?product=${productId}`)
                return
              }
              router.push('/dashboard/collaborator/shop')
              return
            } catch (e) {
              console.error('Error parseando redirección del colaborador:', e)
            }
          }
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al iniciar sesión.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Solicitar Código OTP desde la modal
  const handleRequestRecovery = async () => {
    if (!selectedProfile) return
    setAlert(null)
    setIsLoading(true)

    try {
      const res = await recoveryService.request(selectedProfile.email)
      setRecoveryChannel(res.channel)
      setOtpCode('')
      setSelectorStage('recovery-otp')
      setAlert({
        type: 'success',
        message: `Se ha enviado un código de recuperación a tu ${
          res.channel === 'whatsapp' ? 'WhatsApp' : 'Correo electrónico'
        }.`,
      })
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Fallo al solicitar código.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Verificar Código OTP en la modal
  const handleVerifyOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedProfile) return
    if (otpCode.length < 6) {
      setAlert({ type: 'error', message: 'El código OTP debe ser de 6 dígitos.' })
      return
    }

    setAlert(null)
    setIsLoading(true)

    try {
      const res = await recoveryService.verify(selectedProfile.email, otpCode)
      setResetToken(res.resetToken)
      setNewPassword('')
      setConfirmNewPassword('')
      setSelectorStage('recovery-reset')
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Código incorrecto.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 5. Restablecer contraseña final en la modal
  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      setAlert({ type: 'error', message: 'La nueva contraseña es obligatoria.' })
      return
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }
    if (newPassword !== confirmNewPassword) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden.' })
      return
    }

    setAlert(null)
    setIsLoading(true)

    try {
      await recoveryService.reset(resetToken, newPassword)
      
      // Volver a la modal de contraseña para ingresar con la nueva contrasena
      setSelectorStage('password')
      setPassword('')
      setAlert({
        type: 'success',
        message: 'Contraseña actualizada correctamente. Ingresa ahora con tu nueva contraseña.',
      })
    } catch (error) {
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al restablecer la contraseña.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Retroceder de paso en la modal
  const handleSelectorBack = () => {
    if (selectorStage === 'recovery-otp') {
      setSelectorStage('password')
      setAlert(null)
      return
    }

    if (selectorStage === 'recovery-reset') {
      setSelectorStage('recovery-otp')
      setAlert(null)
      return
    }

    if (selectorStage === 'password') {
      if (profiles.length > 1) {
        setSelectorStage('profiles')
        setSelectedProfile(null)
        setPassword('')
        setAlert(null)
      } else {
        setShowSelector(false)
        setSelectedProfile(null)
        setPassword('')
        setAlert(null)
      }
      return
    }

    setShowSelector(false)
    setSelectedProfile(null)
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
    otpCode,
    newPassword,
    confirmNewPassword,
    recoveryChannel,
    containerRef,
    contentRef,
    tabIndicatorRef,
    setEmail,
    setPassword,
    setCountryCode,
    setOperatorPrefix,
    setAlert,
    setShowSelector,
    setOtpCode,
    setNewPassword,
    setConfirmNewPassword,
    handlePhoneChange,
    handleSubmit,
    handleSelectProfile,
    handleSelectorPasswordSubmit,
    handleRequestRecovery,
    handleVerifyOtpSubmit,
    handleResetPasswordSubmit,
    handleSelectorBack,
    switchTab,
  }
}
