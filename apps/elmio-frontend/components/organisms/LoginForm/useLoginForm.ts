'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { formatPhoneDisplay, stripPhoneFormat } from '@/src/utils/phoneFormat'
import type {
  CountryCode,
  OperatorPrefix,
} from '@/components/molecules/PhoneInput/PhoneInput.d'

gsap.registerPlugin(useGSAP)

type LoginMethod = 'phone' | 'email'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [operatorPrefix, setOperatorPrefix] = useState<OperatorPrefix>('412')
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [rawDigits, setRawDigits] = useState('')

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
    if (contentRef.current) {
      const direction = method === 'email' ? 1 : -1
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: direction * 16 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' },
      )
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setAlert(null)
    setIsLoading(true)

    setTimeout(() => {
      router.push('/dashboard')
    }, 400)
  }

  return {
    loginMethod,
    email,
    phoneDisplay,
    password,
    countryCode,
    operatorPrefix,
    isLoading,
    alert,
    containerRef,
    contentRef,
    tabIndicatorRef,
    setEmail,
    setPassword,
    setCountryCode,
    setOperatorPrefix,
    setAlert,
    handlePhoneChange,
    handleSubmit,
    switchTab,
  }
}
