import type { Metadata } from 'next'
import { AuthTemplate } from '@/components/templates/AuthTemplate/AuthTemplate'
import { RegisterForm } from '@/components/organisms/RegisterForm/RegisterForm'

export const metadata: Metadata = {
  title: 'Crear Cuenta — ElMio',
  description: 'Registrate como cliente en ElMio',
}

/**
 * Pagina de registro de cliente.
 * Renderiza el template de autenticacion con el formulario multi-paso.
 */
export default function RegisterPage() {
  return (
    <AuthTemplate>
      <RegisterForm />
    </AuthTemplate>
  )
}
