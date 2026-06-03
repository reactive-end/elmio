'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { FormField } from '@/components/molecules/FormField/FormField'
import { Alert } from '@/components/atoms/Alert/Alert'
import { rbacService, type RbacUser, type RbacUserInput } from '@/src/services/rbac.service'

interface RbacUserFormProps {
  mode: 'create' | 'edit'
  user?: RbacUser
}

const ROLES = ['ADMIN', 'FINANCE', 'COMPANY', 'EMPLOYEE', 'CLIENT', 'ALLIED']

export function RbacUserForm({ mode, user }: RbacUserFormProps) {
  const router = useRouter()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState(user?.role ?? 'ADMIN')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState(user?.slug ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios.')
      return
    }

    if (mode === 'create' && !password.trim()) {
      setError('La contraseña es obligatoria para nuevos usuarios.')
      return
    }

    try {
      setLoading(true)

      const baseData: RbacUserInput = {
        name: name.trim(),
        email: email.trim(),
        role,
        slug: slug.trim() || undefined,
        phone: phone.trim() || undefined,
      }

      if (mode === 'create') {
        await rbacService.createUser({ ...baseData, password })
      } else if (user) {
        await rbacService.updateUser(user.id, baseData)
      }

      router.push('/dashboard/config/rbac')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/config/rbac')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'create'
              ? 'Registra un nuevo usuario en el sistema.'
              : `Editando a ${user?.name}`}
          </p>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Nombre" required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Juan Pérez"
              />
            </FormField>

            <FormField label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. juan@ejemplo.com"
              />
            </FormField>

            <FormField label="Rol" required>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FormField>

            {mode === 'create' && (
              <FormField label="Contraseña" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </FormField>
            )}

            <FormField label="Teléfono">
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ej. +584247413675"
              />
            </FormField>

            <FormField label="Slug (Cédula / Identificador)">
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej. 12345678"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard/config/rbac')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
