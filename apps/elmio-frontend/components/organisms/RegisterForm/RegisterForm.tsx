'use client'

import { User, MapPin, Briefcase } from 'lucide-react'
import { useRegisterForm } from './useRegisterForm'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { PasswordInput } from '@/components/molecules/PasswordInput/PasswordInput'
import { PhoneInput } from '@/components/molecules/PhoneInput/PhoneInput'
import CedulaInput from '@/components/molecules/CedulaInput/CedulaInput'
import { FormField } from '@/components/molecules/FormField/FormField'
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator'
import Link from 'next/link'
import type { CedulaValue } from '@/components/molecules/CedulaInput/CedulaInput.d'
import type { RegisterFormProps } from './RegisterForm.d'

const stepDefs = [
  { id: 1, title: 'Cuenta', icon: User },
  { id: 2, title: 'Personal', icon: MapPin },
  { id: 3, title: 'Laboral', icon: Briefcase },
]

/**
 * Organismo que renderiza el formulario de registro en 3 pasos con wizard visual.
 *
 * Paso 1 — Cuenta: nombre, correo, cedula, telefono, contrasena.
 * Paso 2 — Personal: fecha nacimiento, genero, direccion, ocupacion.
 * Paso 3 — Laboral: tipo de empleo, ingresos, vivienda, proposito.
 *
 * Validacion por paso. Animacion GSAP entre transiciones.
 */
export function RegisterForm({ className = '' }: RegisterFormProps) {
  const {
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
  } = useRegisterForm()

  const completedSteps = Array.from({ length: step - 1 }, (_, i) => i + 1)

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-body mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500">Completa los datos para registrarte como cliente</p>
      </div>

      {/* Step indicator */}
      <StepIndicator
        steps={stepDefs}
        currentStep={step}
        completedSteps={completedSteps}
        stepIcons={stepDefs.map((s) => s.icon)}
        onStepClick={() => {}}
      />

      {/* Alert */}
      {alert && (
        <div className="mb-5">
          <Alert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div ref={contentRef} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nombre" required>
                  <Input
                    placeholder="Juan"
                    value={userFields.first_name}
                    onChange={(e) => updateUserField('first_name', e.target.value)}
                    autoComplete="given-name"
                  />
                </FormField>
                <FormField label="Apellido">
                  <Input
                    placeholder="Perez"
                    value={userFields.last_name}
                    onChange={(e) => updateUserField('last_name', e.target.value)}
                    autoComplete="family-name"
                  />
                </FormField>
              </div>

              <FormField label="Correo electronico" required>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={userFields.email}
                  onChange={(e) => updateUserField('email', e.target.value)}
                  autoComplete="email"
                />
              </FormField>

              <FormField label="Cedula de identidad" required>
                <CedulaInput
                  value={{ letter: userFields.document_letter as CedulaValue['letter'], digits: userFields.document_digits }}
                  onChange={(v) => {
                    updateUserField('document_letter', v.letter)
                    updateUserField('document_digits', v.digits)
                  }}
                />
              </FormField>

              <FormField label="Telefono">
                <PhoneInput
                  displayValue={phoneDisplay}
                  onChange={handlePhoneChange}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  operatorPrefix={operatorPrefix}
                  onOperatorPrefixChange={setOperatorPrefix}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Contrasena" required>
                  <PasswordInput
                    placeholder="Minimo 8 caracteres"
                    value={userFields.password}
                    onChange={(e) => updateUserField('password', e.target.value)}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="Confirmar contrasena" required>
                  <PasswordInput
                    placeholder="Repite tu contrasena"
                    value={userFields.password_confirm}
                    onChange={(e) => updateUserField('password_confirm', e.target.value)}
                    autoComplete="new-password"
                  />
                </FormField>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Fecha de nacimiento" required>
                  <Input
                    type="date"
                    value={personalFields.birth_date}
                    onChange={(e) => updatePersonalField('birth_date', e.target.value)}
                  />
                </FormField>
                <FormField label="Edad" required>
                  <Input
                    type="number"
                    placeholder="25"
                    value={personalFields.age}
                    onChange={(e) => updatePersonalField('age', e.target.value)}
                    min="18"
                    max="120"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Genero" required>
                  <Select
                    value={personalFields.gender}
                    onChange={(v) => updatePersonalField('gender', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                  />
                </FormField>
                <FormField label="Estado civil" required>
                  <Select
                    value={personalFields.civil_status}
                    onChange={(v) => updatePersonalField('civil_status', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Soltero/a', label: 'Soltero/a' },
                      { value: 'Casado/a', label: 'Casado/a' },
                      { value: 'Divorciado/a', label: 'Divorciado/a' },
                      { value: 'Viudo/a', label: 'Viudo/a' },
                      { value: 'Union libre', label: 'Union libre' },
                    ]}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Estatura (cm)" required>
                  <Input
                    type="number"
                    placeholder="170"
                    value={personalFields.height}
                    onChange={(e) => updatePersonalField('height', e.target.value)}
                    step="0.01"
                  />
                </FormField>
                <FormField label="Peso (kg)" required>
                  <Input
                    type="number"
                    placeholder="70"
                    value={personalFields.weight}
                    onChange={(e) => updatePersonalField('weight', e.target.value)}
                    step="0.01"
                  />
                </FormField>
              </div>

              <FormField label="Ocupacion" required>
                <Input
                  placeholder="Ingeniero de Software"
                  value={personalFields.occupation}
                  onChange={(e) => updatePersonalField('occupation', e.target.value)}
                />
              </FormField>

              <FormField label="Direccion" required>
                <Input
                  placeholder="Av. Principal, Edificio Ejemplo, Piso 3"
                  value={personalFields.address}
                  onChange={(e) => updatePersonalField('address', e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Pais de origen" required>
                  <Input
                    placeholder="Venezuela"
                    value={personalFields.country_of_origin}
                    onChange={(e) => updatePersonalField('country_of_origin', e.target.value)}
                  />
                </FormField>
                <FormField label="Pais de residencia" required>
                  <Input
                    placeholder="Venezuela"
                    value={personalFields.country_of_residence}
                    onChange={(e) => updatePersonalField('country_of_residence', e.target.value)}
                  />
                </FormField>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tipo de empleo" required>
                  <Select
                    value={employmentFields.employment_type}
                    onChange={(v) => updateEmploymentField('employment_type', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Dependiente', label: 'Dependiente' },
                      { value: 'Independiente', label: 'Independiente' },
                      { value: 'Emprendedor', label: 'Emprendedor' },
                      { value: 'Desempleado', label: 'Desempleado' },
                      { value: 'Jubilado', label: 'Jubilado' },
                    ]}
                  />
                </FormField>
                <FormField label="Sector de empleo" required>
                  <Select
                    value={employmentFields.employment_sector}
                    onChange={(v) => updateEmploymentField('employment_sector', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Tecnologia', label: 'Tecnologia' },
                      { value: 'Salud', label: 'Salud' },
                      { value: 'Educacion', label: 'Educacion' },
                      { value: 'Comercio', label: 'Comercio' },
                      { value: 'Construccion', label: 'Construccion' },
                      { value: 'Finanzas', label: 'Finanzas' },
                      { value: 'Gobierno', label: 'Gobierno' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Ingreso mensual ($)" required>
                  <Input
                    type="number"
                    placeholder="1500"
                    value={employmentFields.monthly_income}
                    onChange={(e) => updateEmploymentField('monthly_income', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </FormField>
                <FormField label="Dependientes familiares">
                  <Input
                    type="number"
                    placeholder="0"
                    value={employmentFields.family_dependents}
                    onChange={(e) => updateEmploymentField('family_dependents', e.target.value)}
                    min="0"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tipo de vivienda" required>
                  <Select
                    value={employmentFields.residence_type}
                    onChange={(v) => updateEmploymentField('residence_type', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Casa', label: 'Casa' },
                      { value: 'Apartamento', label: 'Apartamento' },
                      { value: 'Habitacion', label: 'Habitacion' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                  />
                </FormField>
                <FormField label="Vivienda propia">
                  <Select
                    value={employmentFields.is_residence_owned}
                    onChange={(v) => updateEmploymentField('is_residence_owned', v)}
                    options={[
                      { value: 'true', label: 'Si' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                </FormField>
              </div>

              <FormField label="Empresa donde trabaja">
                <Input
                  placeholder="Nombre de la empresa"
                  value={employmentFields.employer_company_name}
                  onChange={(e) => updateEmploymentField('employer_company_name', e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tiempo en la empresa (meses)">
                  <Input
                    type="number"
                    placeholder="24"
                    value={employmentFields.time_in_company_months}
                    onChange={(e) => updateEmploymentField('time_in_company_months', e.target.value)}
                    min="0"
                  />
                </FormField>
                <FormField label="Proposito del prestamo">
                  <Select
                    value={employmentFields.loan_purpose}
                    onChange={(v) => updateEmploymentField('loan_purpose', v)}
                    placeholder="Seleccionar"
                    options={[
                      { value: 'Personal', label: 'Personal' },
                      { value: 'Vehiculo', label: 'Vehiculo' },
                      { value: 'Vivienda', label: 'Vivienda' },
                      { value: 'Educacion', label: 'Educacion' },
                      { value: 'Negocio', label: 'Negocio' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                  />
                </FormField>
              </div>
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-4">
            {step > 1 && (
              <Button type="button" variant="ghost" fullWidth onClick={handleBack}>
                Anterior
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" fullWidth onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-2">
            Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-secondary hover:text-secondary-dark font-medium transition-colors duration-200"
            >
              Iniciar sesion
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
