'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Alert } from '@/components/atoms/Alert/Alert'
import { FormField } from '@/components/molecules/FormField/FormField'
import { bankAccountsAdminService } from '@/src/services/bank-accounts-admin.service'

interface CurrencyFormProps {
  mode: 'create' | 'edit'
  id?: string
}

export default function CurrencyForm({ mode, id }: CurrencyFormProps) {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [exchangeRate, setExchangeRate] = useState<number>(0)

  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [syncingR4, setSyncingR4] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isUsd = code === 'USD'
  const isVes = code === 'VES'

  useEffect(() => {
    if (mode === 'edit' && id) {
      void loadCurrencyData()
    }
  }, [mode, id])

  const loadCurrencyData = async () => {
    try {
      setLoading(true)
      const currency = await bankAccountsAdminService.getCurrencyById(id!)
      setCode(currency.code)
      setName(currency.name)
      setSymbol(currency.symbol)
      setExchangeRate(Number(currency.exchangeRate))
      setError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos de la moneda.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncR4 = async () => {
    try {
      setSyncingR4(true)
      setError(null)
      setSuccess(null)

      const rate = await bankAccountsAdminService.getR4DollarRate()
      setExchangeRate(Number(rate))
      setSuccess('Tasa de cambio del Dólar sincronizada con Banco R4 exitosamente.')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar tasa de Banco R4.'
      setError(`No se pudo obtener la tasa desde R4: ${msg}`)
    } finally {
      setSyncingR4(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const cleanedCode = code.trim().toUpperCase()
    const cleanedName = name.trim()
    const cleanedSymbol = symbol.trim()

    if (!cleanedName || !cleanedSymbol || (mode === 'create' && !cleanedCode)) {
      setError('Todos los campos son obligatorios.')
      return
    }

    if (mode === 'create' && cleanedCode.length !== 3) {
      setError('El código ISO de la moneda debe ser exactamente de 3 letras (ej. EUR).')
      return
    }

    if (exchangeRate <= 0 && cleanedCode !== 'VES') {
      setError('La tasa de cambio debe ser un valor mayor a cero.')
      return
    }

    try {
      setSubmitting(true)

      if (mode === 'create') {
        await bankAccountsAdminService.createCurrency({
          code: cleanedCode,
          name: cleanedName,
          symbol: cleanedSymbol,
          exchangeRate: Number(exchangeRate),
        })
        router.push('/dashboard/config/currencies?success=created')
      } else {
        if (!id) return
        await bankAccountsAdminService.updateCurrency(id, {
          name: isUsd ? undefined : cleanedName,
          symbol: isUsd ? undefined : cleanedSymbol,
          exchangeRate: Number(exchangeRate),
        })
        router.push('/dashboard/config/currencies?success=updated')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la moneda.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[30vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
        <span className="text-sm text-gray-500 font-medium">Cargando datos de la moneda...</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div>
          <h1 className="text-xl font-semibold text-body leading-snug">
            {mode === 'create' ? 'Registrar Nueva Moneda' : `Editar Moneda: ${code}`}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'create'
              ? 'Completa los detalles de la nueva moneda para integrarla en transacciones y cuentas.'
              : isUsd
                ? 'Actualiza la tasa de cambio vigente del Dólar (los metadatos están protegidos).'
                : 'Modifica la cotización o detalles visibles de la moneda.'}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}

        {success && (
          <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Código ISO (3 Letras)" required>
              <Input
                type="text"
                disabled={mode === 'edit'}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3))}
                placeholder="ej. EUR"
                className="font-mono tracking-wide"
              />
            </FormField>

            <FormField label="Nombre de la Moneda" required>
              <Input
                type="text"
                disabled={isUsd}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Euro"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Símbolo" required>
              <Input
                type="text"
                disabled={isUsd}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="ej. €"
              />
            </FormField>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-body-secondary">
                  Tasa de Cambio (en Bolívares)
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                {isUsd && (
                  <button
                    type="button"
                    disabled={syncingR4}
                    onClick={() => void handleSyncR4()}
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-secondary-dark font-medium transition-colors cursor-pointer select-none"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingR4 ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    Sincronizar Tasa (R4)
                  </button>
                )}
              </div>
              <div className="relative flex items-center w-full">
                <Input
                  type="number"
                  step="0.0001"
                  disabled={isVes}
                  value={exchangeRate || ''}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  placeholder="ej. 36.5432"
                  className="pr-12 w-full font-medium"
                />
                <span className="absolute right-4 text-xs font-semibold text-gray-400 select-none">
                  VES
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50 justify-end">
            <Link href="/dashboard/config/currencies">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>

            <Button type="submit" isLoading={submitting}>
              {mode === 'create' ? 'Registrar Moneda' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
