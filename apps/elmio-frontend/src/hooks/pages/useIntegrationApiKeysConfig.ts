'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/src/services/auth.service'
import {
  integrationApiKeysService,
  type IntegrationApiKeyItem,
  type SaveIntegrationApiKeyInput,
} from '@/src/services/integration-api-keys.service'

type FormState = {
  bank: string
  environment: string
  name: string
  value: string
  isActive: boolean
}

const INITIAL_FORM: FormState = {
  bank: 'mercantil',
  environment: 'development',
  name: '',
  value: '',
  isActive: true,
}

/**
 * Hook para administrar la pantalla de API keys por banco e integracion.
 */
export function useIntegrationApiKeysConfig() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [items, setItems] = useState<IntegrationApiKeyItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [revealKey, setRevealKey] = useState('')
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  const loadItems = async () => {
    setLoading(true)
    setError(null)

    try {
      const session = authService.getSession()
      if (!session || session.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }

      const data = await integrationApiKeysService.list()
      setItems(data)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Error al cargar API keys.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadInitialItems = async () => {
      await loadItems()
    }

    const timeoutId = window.setTimeout(() => {
      void loadInitialItems()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
  }

  const startEdit = (item: IntegrationApiKeyItem) => {
    setEditingId(item.id)
    setForm({
      bank: item.bank,
      environment: item.environment ?? 'development',
      name: item.name,
      value: '',
      isActive: item.isActive,
    })
  }

  const submit = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload: SaveIntegrationApiKeyInput = {
        bank: form.bank,
        environment: form.environment || null,
        name: form.name,
        isActive: form.isActive,
      }

      if (editingId) {
        await integrationApiKeysService.update(editingId, {
          ...payload,
          value: form.value || undefined,
        })
      } else {
        await integrationApiKeysService.create({
          ...payload,
          value: form.value,
        })
      }

      resetForm()
      await loadItems()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Error al guardar API key.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: IntegrationApiKeyItem) => {
    setSaving(true)
    setError(null)

    try {
      await integrationApiKeysService.toggleActive(item.id, !item.isActive)
      await loadItems()
    } catch (toggleError) {
      const message =
        toggleError instanceof Error ? toggleError.message : 'Error al cambiar estado.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const reveal = async (id: string) => {
    setRevealingId(id)
    setError(null)

    try {
      const result = await integrationApiKeysService.reveal(id, revealKey)
      setRevealedValues((current) => ({
        ...current,
        [id]: result.value,
      }))
    } catch (revealError) {
      const message =
        revealError instanceof Error ? revealError.message : 'Error al revelar API key.'
      setError(message)
    } finally {
      setRevealingId(null)
    }
  }

  const hide = (id: string) => {
    setRevealedValues((current) => {
      const copy = { ...current }
      delete copy[id]
      return copy
    })
  }

  return {
    loading,
    saving,
    revealingId,
    items,
    editingId,
    revealKey,
    revealedValues,
    error,
    form,
    setRevealKey,
    setForm,
    startEdit,
    resetForm,
    submit,
    toggleActive,
    reveal,
    hide,
  }
}
