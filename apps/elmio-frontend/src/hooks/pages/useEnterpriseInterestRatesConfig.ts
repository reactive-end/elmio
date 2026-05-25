'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/src/services/auth.service'
import {
  enterpriseInterestConfigService,
  type EnterpriseInterestConfigItem,
  type UpdateEnterpriseInterestConfigInput,
} from '@/src/services/enterprise-interest-config.service'

type FormState = UpdateEnterpriseInterestConfigInput

const INITIAL_FORM: FormState = {
  interestType: 'none',
  interestRate: 0,
  isActive: false,
}

/**
 * Hook para administrar la configuracion global de interes por empresa.
 */
export function useEnterpriseInterestRatesConfig() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<EnterpriseInterestConfigItem[]>([])
  const [selected, setSelected] = useState<EnterpriseInterestConfigItem | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    setLoading(true)
    setError(null)

    try {
      const session = authService.getSession()
      if (!session || session.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }

      const data = await enterpriseInterestConfigService.list()
      setItems(data)
      if (!selected && data.length > 0) {
        const firstItem = data[0]
        setSelected(firstItem)
        setForm({
          interestType: firstItem.interestType,
          interestRate: firstItem.interestRate,
          isActive: firstItem.isActive,
        })
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Error al cargar tasas.'
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

  const selectItem = (item: EnterpriseInterestConfigItem) => {
    setSelected(item)
    setForm({
      interestType: item.interestType,
      interestRate: item.interestRate,
      isActive: item.isActive,
    })
  }

  const submit = async () => {
    if (!selected) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await enterpriseInterestConfigService.update(selected.enterpriseId, form)
      setSelected(updated)
      await loadItems()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Error al guardar tasa.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return {
    loading,
    saving,
    items,
    selected,
    form,
    error,
    setForm,
    selectItem,
    submit,
  }
}
