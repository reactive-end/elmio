'use client'

import { useLoginForm } from './useLoginForm'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Input } from '@/components/atoms/Input/Input'
import { PasswordInput } from '@/components/molecules/PasswordInput/PasswordInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import { FormField } from '@/components/molecules/FormField/FormField'
import Link from 'next/link'
import { createPortal } from 'react-dom'
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
          {stage === 'identifier' ? (
            loginMethod === 'email' ? (
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
            )
          ) : (
            <>
              <div className="rounded-2xl border border-secondary/15 bg-secondary/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/70">
                  Perfil seleccionado
                </p>
                <p className="mt-1 text-sm font-semibold text-body">{selectedProfile?.name}</p>
                <p className="text-xs text-body-muted">{identifierLabel}</p>
              </div>

              <FormField label="Contrasena" required>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FormField>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBackToIdentifier}
                  className="text-xs text-body-muted hover:text-body transition-colors duration-200"
                >
                  Cambiar correo o telefono
                </button>
                <button
                  type="button"
                  className="text-xs text-secondary hover:text-secondary-dark transition-colors duration-200"
                >
                  Olvidaste tu contrasena?
                </button>
              </div>
            </>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
            {isLoading ? 'Procesando...' : stage === 'identifier' ? 'Continuar' : 'Iniciar sesion'}
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

      {/* Selector de Perfiles (Modal Ultra-Premium) */}
      {showSelector && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-slate-950/28 px-4 py-8 backdrop-blur-sm transition-all duration-300">
              <div className="w-full max-w-lg rounded-[28px] overflow-hidden border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in duration-200">
                <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-7 py-6 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                    Seleccion de acceso
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-body">
                    {selectorStage === 'profiles' ? 'Elige un perfil' : 'Ingresa tu contrasena'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-body-muted">
                    {selectorStage === 'profiles'
                      ? 'Tienes varios perfiles asociados a este acceso. Selecciona uno para continuar con tu contrasena.'
                      : 'Confirma la contrasena del perfil seleccionado para ingresar a la plataforma.'}
                  </p>
                </div>

                <div className="p-6">
                  {alert && (
                    <div className="mb-4">
                      <Alert
                        type={alert.type}
                        message={alert.message}
                        onDismiss={() => setAlert(null)}
                      />
                    </div>
                  )}

                  {selectorStage === 'profiles' ? (
                    <div className="flex flex-col gap-3">
                      {profiles.map((profile) => {
                        let roleLabel = 'Usuario'

                        if (profile.role === 'ADMIN') {
                          roleLabel = 'Administrador'
                        } else if (profile.role === 'COMPANY') {
                          roleLabel = 'Empresa'
                        } else if (profile.role === 'EMPLOYEE') {
                          roleLabel = 'Colaborador'
                        } else if (profile.role === 'CLIENT') {
                          roleLabel = 'Cliente'
                        }

                        return (
                          <button
                            key={profile.userId}
                            type="button"
                            onClick={() => handleSelectProfile(profile.userId)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition-all duration-200 hover:border-secondary/35 hover:bg-secondary/[0.03] hover:shadow-[0_10px_28px_rgba(37,99,235,0.10)] focus:outline-none focus:ring-2 focus:ring-ring/20"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-secondary transition-colors duration-200 group-hover:border-secondary/25 group-hover:bg-secondary/10">
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.7}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-body">
                                {profile.name}
                              </p>
                              <p className="mt-0.5 text-xs text-body-muted">{roleLabel}</p>
                            </div>

                            <svg
                              className="h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-secondary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void handleSelectorPasswordSubmit()
                      }}
                    >
                      <FormField label="Contrasena" required>
                        <PasswordInput
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                      </FormField>

                      <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                      >
                        {isLoading ? 'Procesando...' : 'Iniciar sesion'}
                      </Button>
                    </form>
                  )}

                  <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs leading-5 text-body-muted">
                      Si necesitas cambiar el correo o telefono ingresado, vuelve al paso anterior y
                      corrige el acceso.
                    </p>
                  </div>

                  <div className="mt-5">
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={handleSelectorBack}
                      className="rounded-2xl border-gray-200 text-body hover:border-gray-300 hover:bg-gray-50"
                    >
                      Volver
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
