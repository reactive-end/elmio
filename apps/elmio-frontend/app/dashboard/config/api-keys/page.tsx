'use client'

import { useState } from 'react'
import { Select } from '@/components/atoms/Select/Select'
import { Save, KeyRound, Eye, EyeOff, Pencil, ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react'
import { useIntegrationApiKeysConfig } from '@/src/hooks/pages/useIntegrationApiKeysConfig'

const BANK_OPTIONS = [
  { value: 'mercantil', label: 'Mercantil' },
  { value: 'banco_plaza', label: 'Banco Plaza' },
  { value: 'banco_r4', label: 'Banco R4' },
  { value: 'banco_exterior', label: 'Banco Exterior' },
]

const ENVIRONMENT_OPTIONS = [
  { value: 'development', label: 'Desarrollo' },
  { value: 'production', label: 'Produccion' },
]

import { notFound } from 'next/navigation'

/**
 * Pantalla admin para gestionar API keys por banco.
 */
export default function ApiKeysConfigPage() {
  notFound()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const {
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
  } = useIntegrationApiKeysConfig()

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando API keys...</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-body mb-1">Credenciales de Integración</h1>
          <p className="text-sm text-gray-500">
            Administra las llaves de API y credenciales de integración por cada banco y ambiente.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar credencial' : 'Nueva credencial'}
              </h2>
              <p className="text-xs text-gray-500">Configura el banco, ambiente y las llaves de seguridad de integración.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 select-none">Banco de Integración</label>
              <Select
                options={BANK_OPTIONS}
                value={form.bank}
                onChange={(value) => setForm((current) => ({ ...current, bank: value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 select-none">Ambiente</label>
              <Select
                options={ENVIRONMENT_OPTIONS}
                value={form.environment}
                onChange={(value) => setForm((current) => ({ ...current, environment: value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 select-none">Nombre descriptivo</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ej: API Key de Producción"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 select-none">
                {editingId ? 'Rotar Valor Secreto (Opcional)' : 'Valor secreto'}
              </label>
              <input
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                placeholder={editingId ? 'Ingresa un nuevo valor solo para rotar el secreto' : 'Ingresa la API Key o llave secreta'}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-3 bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
              <label className="text-sm font-medium text-body flex-1 select-none cursor-pointer" onClick={() => setForm((c) => ({ ...c, isActive: !c.isActive }))}>
                ¿Dejar activa esta credencial?
                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                  Si activas esta key, reemplazará automáticamente cualquier otra activa del mismo banco y ambiente.
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

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving || (!editingId && !form.value.trim())}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-8 py-3 text-sm font-semibold text-white transition hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : editingId ? 'Actualizar Credencial' : 'Crear Credencial'}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Credenciales registradas</h2>
              <p className="text-xs text-gray-500">Mercantil usa internamente la integracion `ally-api`.</p>
            </div>
            <input
              value={revealKey}
              onChange={(event) => setRevealKey(event.target.value)}
              placeholder="Clave de revelado"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Banco / Nombre</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ambiente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor Secreto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última Rotación</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide w-fit">
                          {item.bank}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {item.environment ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.environment === 'production' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/30' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/30'
                        }`}>
                          {item.environment === 'production' ? 'Producción' : 'Desarrollo'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs text-gray-800 bg-gray-50 px-2.5 py-1 rounded border border-gray-100 select-none">
                        {revealedValues[item.id] ? revealedValues[item.id] : '••••••••••••••••'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-gray-100 text-gray-600 border border-gray-200/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {item.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-gray-500">
                      {item.lastRotatedAt ? new Date(item.lastRotatedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin registro'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-2 rounded-xl text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-all border border-transparent hover:border-secondary/10 cursor-pointer"
                          title="Editar credencial"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {revealedValues[item.id] ? (
                          <button
                            type="button"
                            onClick={() => hide(item.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-all border border-transparent hover:border-secondary/10 cursor-pointer"
                            title="Ocultar valor"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!revealKey.trim()) {
                                setAlertMessage('Por favor, ingresa la "Clave de revelado" en el campo de texto ubicado arriba a la derecha para poder descifrar y visualizar este secreto.');
                                setShowAlert(true);
                                return;
                              }
                              void reveal(item.id);
                            }}
                            disabled={revealingId === item.id}
                            className="p-2 rounded-xl text-gray-400 hover:text-secondary hover:bg-secondary/5 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-all border border-transparent hover:border-secondary/10 cursor-pointer"
                            title={revealingId === item.id ? 'Revelando...' : 'Ver valor'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void toggleActive(item)}
                          disabled={saving}
                          className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer ${
                            item.isActive 
                              ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-100'
                              : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-100'
                          }`}
                          title={item.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {item.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100/80 overflow-hidden transform scale-100 transition-all duration-300">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-secondary">
              <ShieldAlert className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                Clave Requerida
              </h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed px-1">
                {alertMessage}
              </p>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAlert(false)}
                className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-secondary-dark cursor-pointer shadow-lg shadow-secondary/15"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
