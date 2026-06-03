'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { RbacUserForm } from '../RbacUserForm'
import { rbacService, type RbacUser } from '@/src/services/rbac.service'

export default function RbacEditUserPage() {
  const params = useParams()
  const id = params.id as string
  const [user, setUser] = useState<RbacUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await rbacService.getUser(id)
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar usuario.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return <div className="text-sm text-gray-400 py-12 text-center">Cargando usuario...</div>
  }

  if (error || !user) {
    return <div className="text-sm text-red-500 py-12 text-center">{error ?? 'Usuario no encontrado.'}</div>
  }

  return <RbacUserForm mode="edit" user={user} />
}
