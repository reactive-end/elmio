import type { Metadata } from 'next'
import { AuthTemplate } from '@/components/templates/AuthTemplate/AuthTemplate'
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar Sesion — ElMio',
  description: 'Accede a tu cuenta de ElMio',
}

/**
 * Pagina de inicio de sesion.
 * Renderiza el template de autenticacion con el formulario de login.
 */
export default function LoginPage() {
  return (
    <AuthTemplate>
      <LoginForm />
    </AuthTemplate>
  )
}
