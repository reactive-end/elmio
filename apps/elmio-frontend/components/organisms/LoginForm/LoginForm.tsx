'use client'

import { useLoginForm } from './useLoginForm'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Input } from '@/components/atoms/Input/Input'
import { PasswordInput } from '@/components/molecules/PasswordInput/PasswordInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { FormField } from '@/components/molecules/FormField/FormField'
import Link from 'next/link'
import type { LoginFormProps } from './LoginForm.d'

/**
 * Organismo que renderiza el formulario de inicio de sesion con dos tabs:
 * telefono (predeterminado) y correo electronico.
 *
 * Animado con GSAP: fade-in del formulario, slide horizontal al cambiar tabs.
 */
export function LoginForm({ className = '' }: LoginFormProps) {
  const {
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
  } = useLoginForm()

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-body mb-1">Bienvenido</h1>
        <p className="text-sm text-gray-500">Inicia sesion para continuar</p>
      </div>

      {/* Tabs */}
      <div className="relative flex mb-8 border-b border-gray-100">
        <button
          type="button"
          onClick={() => switchTab('phone')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors duration-200 ${
            loginMethod === 'phone' ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Telefono
        </button>
        <button
          type="button"
          onClick={() => switchTab('email')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors duration-200 ${
            loginMethod === 'email' ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Correo electronico
        </button>
        <div
          ref={tabIndicatorRef}
          className="absolute bottom-0 h-0.5 bg-secondary transition-all duration-300 ease-out"
          style={{
            width: '50%',
            left: loginMethod === 'phone' ? '0%' : '50%',
          }}
        />
      </div>

      {/* Alert */}
      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div ref={contentRef} className="flex flex-col gap-5">
          {loginMethod === 'email' ? (
            <FormField label="Correo electronico" required>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FormField>
          ) : (
            <FormField label="Numero de telefono" required>
              <PhoneInput
                displayValue={phoneDisplay}
                onChange={handlePhoneChange}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                operatorPrefix={operatorPrefix}
                onOperatorPrefixChange={setOperatorPrefix}
              />
            </FormField>
          )}

          <FormField label="Contrasena" required>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-secondary hover:text-secondary-dark transition-colors duration-200"
            >
              Olvidaste tu contrasena?
            </button>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
            {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-2">
            No tienes cuenta?{' '}
            <Link
              href="/registro"
              className="text-secondary hover:text-secondary-dark font-medium transition-colors duration-200"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
