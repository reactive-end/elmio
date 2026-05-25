'use client'

import { Landmark, Save } from 'lucide-react'
import { useEnterpriseInterestRatesConfig } from '@/src/hooks/pages/useEnterpriseInterestRatesConfig'

/**
 * Pantalla admin para gestionar la tasa global de interes por empresa.
 */
export default function EnterpriseInterestRatesPage() {
  const { loading, saving, items, selected, form, error, setForm, selectItem, submit } =
    useEnterpriseInterestRatesConfig()

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando tasas por empresa...</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Tasas globales por empresa</h1>
          <p className="text-sm text-gray-500">
            Define la tasa que se aplicará de forma global a préstamos, productos y operaciones financieras asociadas a cada empresa.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Empresas</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <button
                key={item.enterpriseId}
                type="button"
                onClick={() => selectItem(item)}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  selected?.enterpriseId === item.enterpriseId
                    ? 'border-secondary/35 bg-secondary/5'
                    : 'border-gray-100 bg-slate-50/70 hover:border-secondary/20 hover:bg-secondary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{item.companyName}</h3>
                    <p className="mt-1 text-sm text-gray-500">RIF: {item.taxId}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                  {item.sector && (
                    <span className="rounded-full bg-white px-3 py-1 border border-gray-100">Rubro: {item.sector}</span>
                  )}
                  <span className="rounded-full bg-white px-3 py-1 border border-gray-100">
                    Tasa: {item.interestType === 'none' ? 'Sin interés' : item.interestType === 'percentage' ? `${item.interestRate}%` : `${item.interestRate} Fijo`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar tasa</h2>
              <p className="text-xs text-gray-500">
                {selected ? `${selected.companyName} (${selected.taxId})` : 'Selecciona una empresa'}
              </p>
            </div>
          </div>

          {selected ? (
            <div className="mt-6 space-y-4">
              <select
                value={form.interestType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    interestType: event.target.value as 'none' | 'percentage' | 'fixed',
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              >
                <option value="none">Sin interes</option>
                <option value="percentage">Porcentaje</option>
                <option value="fixed">Monto fijo</option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.interestRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    interestRate: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />

              <div className="flex items-center justify-between gap-3 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <label 
                  className="text-sm font-medium text-body flex-1 cursor-pointer select-none" 
                  onClick={() => setForm((c) => ({ ...c, isActive: !c.isActive }))}
                >
                  Configuración activa para esta empresa
                  <span className="block text-xs text-gray-400 font-normal mt-0.5">
                    Habilita o deshabilita la aplicación de esta tasa a las operaciones de la empresa.
                  </span>
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isActive}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      isActive: !current.isActive,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    form.isActive ? 'bg-secondary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      form.isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar configuracion'}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500">No hay empresas disponibles para configurar.</p>
          )}
        </section>
      </div>
    </div>
  )
}
