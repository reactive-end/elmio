'use client'

import { useState } from 'react'
import {
  ArrowLeft, Plus, GripVertical, Trash2, Eye, EyeOff, Save,
  Palette, Type, LayoutGrid, X, Ruler, ArrowUpDown, Square,
  Heading1, Heading2, Heading3, Columns2, CaseSensitive, ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/atoms/Alert/Alert'
import { Select } from '@/components/atoms/Select/Select'
import { PixelInput } from '@/components/molecules/PixelInput/PixelInput'
import { ColorInput } from '@/components/molecules/ColorInput/ColorInput'
import { FontSelect } from '@/components/molecules/FontSelect/FontSelect'
import { GradientBuilder } from '@/components/molecules/GradientBuilder/GradientBuilder'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { SectionRenderer } from '@/components/renderers/SectionRenderer'
import { useMarketplaceEditor } from '@/src/hooks/pages/useMarketplaceEditor'
import type { SeccionMarketplace, TipoSeccion, Diapositiva, ColumnaPie, AliadoLogo, PilarItem, MenuItem } from '@/src/utils/editor-types.d'
import { MERCADO_PRUEBA, etiquetaTipo } from './mock-data'

type PestanaEditor = 'vista-previa' | 'edicion' | 'secciones'
type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

interface ProductoMarketplace {
  id: string
  nombre: string
  categoria: string
  precio: string
  imagenUrl: string
  accionTipo: 'redirect' | 'trigger'
  accionEtiqueta: string
  destinoUrl: string
}

const tiposDisponibles: TipoSeccion[] = ['cabecera', 'principal', 'caracteristicas', 'productos', 'banner', 'doble-banner', 'aliados', 'pilares', 'franja', 'texto', 'pie']

const productosDisponibles: ProductoMarketplace[] = [
  { id: 'prod-loan-001', nombre: 'Prestamo Personal', categoria: 'Prestamos', precio: '$500', imagenUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80', accionTipo: 'trigger', accionEtiqueta: 'Simular cuotas', destinoUrl: '' },
  { id: 'prod-loan-002', nombre: 'Prestamo Vehicular', categoria: 'Prestamos', precio: '$5,000', imagenUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80', accionTipo: 'redirect', accionEtiqueta: 'Ir al flujo vehicular', destinoUrl: '/productos/prestamo-vehicular' },
  { id: 'prod-ins-001', nombre: 'Seguro de Vida', categoria: 'Seguros', precio: '$50', imagenUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80', accionTipo: 'trigger', accionEtiqueta: 'Cotizar cobertura', destinoUrl: '' },
  { id: 'prod-ins-002', nombre: 'Seguro Vehicular', categoria: 'Seguros', precio: '$80', imagenUrl: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=900&q=80', accionTipo: 'redirect', accionEtiqueta: 'Abrir landing', destinoUrl: '/productos/seguro-vehicular' },
]

export default function MarketplaceEditorPage() {
  const editor = useMarketplaceEditor(MERCADO_PRUEBA)
  const [seccionArrastradaId, setSeccionArrastradaId] = useState<string | null>(null)
  const [objetivoArrastre, setObjetivoArrastre] = useState<{
    id: string
    posicion: 'antes' | 'despues'
  } | null>(null)
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoSeccion>('principal')

  const abrirModalAgregar = () => {
    setTipoSeleccionado('principal')
    setModalAgregarAbierto(true)
  }

  const confirmarAgregarSeccion = () => {
    editor.agregarSeccion(tipoSeleccionado)
    setModalAgregarAbierto(false)
  }

  return (
    <DashboardTemplate>
      <div className="h-[calc(100dvh-8rem)] flex flex-col">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/marketplaces" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <div>
              <Input
                value={editor.marketplace.nombre}
                onChange={(e) => editor.setMarketplace({ ...editor.marketplace, nombre: e.target.value })}
                className="text-lg font-semibold border-none !px-0 !py-0 bg-transparent !rounded-none focus:ring-0 w-64"
              />
              <p className="text-xs text-gray-400">{editor.marketplace.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              {([
                { id: 'secciones' as PestanaEditor, label: 'Secciones' },
                { id: 'edicion' as PestanaEditor, label: 'Edicion' },
                { id: 'vista-previa' as PestanaEditor, label: 'Vista previa' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => editor.setPestana(tab.id)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    editor.pestana === tab.id ? 'bg-white text-body shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button onClick={editor.guardar}>
              <Save className="w-4 h-4" strokeWidth={1.5} />
              Guardar
            </Button>
          </div>
        </div>

        {editor.alerta && (
          <div className="mb-4 flex-shrink-0">
            <Alert type={editor.alerta.type} message={editor.alerta.message} onDismiss={() => editor.setAlerta(null)} />
          </div>
        )}

        {/* Vista previa */}
        {editor.pestana === 'vista-previa' && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <Eye className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Vista previa — {editor.secciones.filter((s) => s.visible).length} secciones visibles
              </span>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100">
              {editor.secciones.filter((s) => s.visible).sort((a, b) => a.orden - b.orden).map((seccion) => (
                <SectionRenderer
                  key={seccion.id}
                  seccion={seccion}
                  previewMode
                  seleccionada={editor.seleccionadaId === seccion.id}
                  onClick={() => { editor.setSeleccionadaId(seccion.id); editor.setPestana('edicion') }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Edicion */}
        {editor.pestana === 'edicion' && (
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Secciones</h3>
                <button type="button" onClick={abrirModalAgregar} className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-white hover:bg-secondary-dark transition-colors">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {editor.secciones.map((seccion) => (
                  <button key={seccion.id} type="button" onClick={() => editor.setSeleccionadaId(seccion.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                      editor.seleccionadaId === seccion.id ? 'bg-secondary/10 text-secondary font-medium' : 'text-body hover:bg-gray-50'
                    }`}>
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm flex-1 truncate">{seccion.nombre}</span>
                    <span className="text-[10px] font-medium text-gray-400 uppercase flex-shrink-0">{etiquetaTipo[seccion.tipo]}</span>
                    {!seccion.visible && <EyeOff className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto min-w-0">
              {editor.seleccionada ? (
                <div className="p-5 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-medium text-gray-400">Nombre de la seccion</label>
                    <Input value={editor.seleccionada.nombre} onChange={(e) => editor.actualizarSeccion(editor.seleccionada!.id, { nombre: e.target.value })} className="text-sm font-semibold" />
                    <label className="text-[10px] font-medium text-gray-400">Tipo de seccion</label>
                    <Select value={editor.seleccionada.tipo} onChange={(v) => editor.actualizarSeccion(editor.seleccionada!.id, { tipo: v as TipoSeccion })}
                      options={tiposDisponibles.map((t) => ({ value: t, label: etiquetaTipo[t] }))} />
                  </div>

                  <div className="flex border-b border-gray-100">
                    {([{ id: 'contenido', icon: Type, label: 'Contenido' },
                      { id: 'estilos', icon: Palette, label: 'Estilos' },
                      { id: 'elementos', icon: LayoutGrid, label: `Elementos (${editor.seleccionada.contenido.elementos.length})` },
                    ] as { id: PestanaPropiedades; icon: typeof Type; label: string }[]).map((tab) => (
                      <button key={tab.id} type="button" onClick={() => editor.setPestanaProp(tab.id)}
                        className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium transition-colors border-b-2 ${
                          editor.pestanaProp === tab.id ? 'text-secondary border-secondary' : 'text-gray-400 border-transparent hover:text-gray-600'
                        }`}>
                        <tab.icon className="w-3 h-3" strokeWidth={1.5} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Contenido */}
                  {editor.pestanaProp === 'contenido' && (
                    <ContenidoSeccionPanel
                      seccion={editor.seleccionada}
                      actualizarContenido={editor.actualizarContenido}
                      actualizarSeccion={editor.actualizarSeccion}
                    />
                  )}

                  {/* Estilos */}
                  {editor.pestanaProp === 'estilos' && (
                    <div className="flex flex-col gap-4">
                      <TarjetaGrupo titulo="Fondo" Icono={ImageIcon}>
                        <ColorInput
                          label={editor.gradienteActivo ? 'Color solido (deshabilitado por degradado)' : 'Color solido'}
                          value={editor.seleccionada.estilo.colorFondo}
                          onChange={(v) => editor.actualizarEstilo('colorFondo', v)}
                          disabled={editor.gradienteActivo}
                        />
                        <GradientBuilder
                          label="Degradado"
                          colorInicio={editor.gradienteInicio}
                          colorFin={editor.gradienteFin}
                          direccion={editor.gradienteDireccion}
                          activo={editor.gradienteActivo}
                          onActivoChange={(v) => {
                            editor.setGradienteActivo(v)
                            if (v) editor.actualizarEstilo('gradienteFondo', editor.construirGradiente())
                            else editor.actualizarEstilo('gradienteFondo', '')
                          }}
                          onColorInicioChange={(c) => { editor.setGradienteInicio(c); if (editor.gradienteActivo) editor.actualizarEstilo('gradienteFondo', `linear-gradient(${editor.gradienteDireccion}, ${c}, ${editor.gradienteFin})`) }}
                          onColorFinChange={(c) => { editor.setGradienteFin(c); if (editor.gradienteActivo) editor.actualizarEstilo('gradienteFondo', `linear-gradient(${editor.gradienteDireccion}, ${editor.gradienteInicio}, ${c})`) }}
                          onDireccionChange={(d) => { editor.setGradienteDireccion(d); if (editor.gradienteActivo) editor.actualizarEstilo('gradienteFondo', `linear-gradient(${d}, ${editor.gradienteInicio}, ${editor.gradienteFin})`) }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <ImagePicker
                            label="Imagen de fondo"
                            value={editor.seleccionada.estilo.imagenFondo}
                            onChange={(value) => editor.actualizarEstilo('imagenFondo', value ? `url(${value})` : '')}
                          />
                          <PixelInput label="Oscurecer %" value={editor.seleccionada.estilo.opacidadOverlay} onChange={(v) => editor.actualizarEstilo('opacidadOverlay', v)} min={0} max={100} />
                        </div>
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Espaciado interno" Icono={Ruler}>
                        <div className="grid grid-cols-2 gap-2">
                          <PixelInput label="Arriba" value={editor.seleccionada.estilo.paddingSuperior} onChange={(v) => editor.actualizarEstilo('paddingSuperior', v)} min={0} max={200} />
                          <PixelInput label="Derecha" value={editor.seleccionada.estilo.paddingDerecho} onChange={(v) => editor.actualizarEstilo('paddingDerecho', v)} min={0} max={200} />
                          <PixelInput label="Abajo" value={editor.seleccionada.estilo.paddingInferior} onChange={(v) => editor.actualizarEstilo('paddingInferior', v)} min={0} max={200} />
                          <PixelInput label="Izquierda" value={editor.seleccionada.estilo.paddingIzquierdo} onChange={(v) => editor.actualizarEstilo('paddingIzquierdo', v)} min={0} max={200} />
                        </div>
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Separacion externa" Icono={ArrowUpDown}>
                        <div className="grid grid-cols-2 gap-2">
                          <PixelInput label="Arriba" value={editor.seleccionada.estilo.margenSuperior} onChange={(v) => editor.actualizarEstilo('margenSuperior', v)} min={0} max={200} />
                          <PixelInput label="Abajo" value={editor.seleccionada.estilo.margenInferior} onChange={(v) => editor.actualizarEstilo('margenInferior', v)} min={0} max={200} />
                        </div>
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Borde" Icono={Square}>
                        <div className="grid grid-cols-2 gap-2">
                          <PixelInput label="Grosor" value={editor.seleccionada.estilo.anchoBorde} onChange={(v) => editor.actualizarEstilo('anchoBorde', v)} min={0} max={20} />
                          <PixelInput label="Redondez" value={editor.seleccionada.estilo.radioBorde} onChange={(v) => editor.actualizarEstilo('radioBorde', v)} min={0} max={100} />
                        </div>
                        <ColorInput label="Color del borde" value={editor.seleccionada.estilo.colorBorde} onChange={(v) => editor.actualizarEstilo('colorBorde', v)} />
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Titulo principal" Icono={Heading1}>
                        <div className="grid grid-cols-2 gap-2">
                          <PixelInput label="Tamano" value={editor.seleccionada.estilo.tituloTamano} onChange={(v) => editor.actualizarEstilo('tituloTamano', v)} min={8} max={120} />
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-400">Grosor</label>
                            <Select value={String(editor.seleccionada.estilo.tituloPeso)} onChange={(v) => editor.actualizarEstilo('tituloPeso', Number(v))}
                              options={[
                                { value: '300', label: 'Fino' }, { value: '400', label: 'Normal' },
                                { value: '500', label: 'Medio' }, { value: '600', label: 'Seminegrupo' },
                                { value: '700', label: 'Negrupo' }, { value: '800', label: 'Extranegrupo' },
                                { value: '900', label: 'Ultranegrupo' },
                              ]} />
                          </div>
                        </div>
                        <ColorInput label="Color" value={editor.seleccionada.estilo.tituloColor} onChange={(v) => editor.actualizarEstilo('tituloColor', v)} />
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-medium text-gray-400">Alineacion</label>
                          <Select value={editor.seleccionada.estilo.tituloAlineacion} onChange={(v) => editor.actualizarEstilo('tituloAlineacion', v)}
                            options={[{ value: 'izquierda', label: 'Izquierda' }, { value: 'centro', label: 'Centro' }, { value: 'derecha', label: 'Derecha' }]} />
                        </div>
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Subtitulo" Icono={Heading2}>
                        <PixelInput label="Tamano" value={editor.seleccionada.estilo.subtituloTamano} onChange={(v) => editor.actualizarEstilo('subtituloTamano', v)} min={8} max={80} />
                        <ColorInput label="Color" value={editor.seleccionada.estilo.subtituloColor} onChange={(v) => editor.actualizarEstilo('subtituloColor', v)} />
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Texto del cuerpo" Icono={Heading3}>
                        <PixelInput label="Tamano" value={editor.seleccionada.estilo.cuerpoTamano} onChange={(v) => editor.actualizarEstilo('cuerpoTamano', v)} min={8} max={40} />
                        <ColorInput label="Color" value={editor.seleccionada.estilo.cuerpoColor} onChange={(v) => editor.actualizarEstilo('cuerpoColor', v)} />
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-medium text-gray-400">Alineacion</label>
                          <Select value={editor.seleccionada.estilo.cuerpoAlineacion} onChange={(v) => editor.actualizarEstilo('cuerpoAlineacion', v)}
                            options={[{ value: 'izquierda', label: 'Izquierda' }, { value: 'centro', label: 'Centro' }, { value: 'derecha', label: 'Derecha' }]} />
                        </div>
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Disposicion" Icono={Columns2}>
                        <PixelInput label="Ancho maximo" value={editor.seleccionada.estilo.anchoMaximo} onChange={(v) => editor.actualizarEstilo('anchoMaximo', v)} min={200} max={2000} step={50} />
                        <PixelInput label="Separacion entre elementos" value={editor.seleccionada.estilo.espacioEntreElementos} onChange={(v) => editor.actualizarEstilo('espacioEntreElementos', v)} min={0} max={100} />
                      </TarjetaGrupo>

                      <TarjetaGrupo titulo="Tipografia" Icono={CaseSensitive}>
                        <FontSelect label="Fuente" value={editor.marketplace.tema.fuente} onChange={(v) => editor.setMarketplace({ ...editor.marketplace, tema: { ...editor.marketplace.tema, fuente: v } })} />
                      </TarjetaGrupo>
                    </div>
                  )}

                  {/* Elementos */}
                  {editor.pestanaProp === 'elementos' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">{editor.seleccionada.contenido.elementos.length} elementos</span>
                        <button type="button" onClick={editor.agregarElemento} className="text-xs text-secondary hover:text-secondary-dark font-medium">+ Agregar elemento</button>
                      </div>
                      {editor.seleccionada.contenido.elementos.map((elem, idx) => (
                        <div key={elem.id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Elemento {idx + 1}</span>
                            <button type="button" onClick={() => editor.eliminarElemento(elem.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          </div>
                          <CampoTexto etiqueta="Titulo" valor={elem.titulo} onChange={(v) => editor.actualizarElemento(elem.id, 'titulo', v)} />
                          <CampoTexto etiqueta="Descripcion" valor={elem.descripcion} onChange={(v) => editor.actualizarElemento(elem.id, 'descripcion', v)} />
                          <CampoTexto etiqueta="Icono" valor={elem.icono} onChange={(v) => editor.actualizarElemento(elem.id, 'icono', v)} placeholder="Star" />
                          <ImagePicker
                            label="Imagen"
                            value={elem.imagenUrl}
                            onChange={(value) => editor.actualizarElemento(elem.id, 'imagenUrl', value)}
                          />
                          <CampoTexto etiqueta="Enlace" valor={elem.enlaceUrl} onChange={(v) => editor.actualizarElemento(elem.id, 'enlaceUrl', v)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
                  Selecciona una seccion en el panel izquierdo para editar sus propiedades
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secciones */}
        {editor.pestana === 'secciones' && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestion de secciones — {editor.secciones.length} total</span>
              </div>
              <button type="button" onClick={abrirModalAgregar}
                className="flex items-center gap-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-dark rounded-lg px-3 py-1.5 transition-colors">
                <Plus className="w-3 h-3" strokeWidth={2} /> Agregar seccion
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                {editor.secciones.sort((a, b) => a.orden - b.orden).map((seccion) => (
                  <div
                    key={seccion.id}
                    onDragOver={(event) => {
                      event.preventDefault()

                      const limites = event.currentTarget.getBoundingClientRect()
                      const posicion = event.clientY < limites.top + limites.height / 2 ? 'antes' : 'despues'

                      setObjetivoArrastre({ id: seccion.id, posicion })
                    }}
                    onDrop={() => {
                      if (!seccionArrastradaId || !objetivoArrastre) return

                      editor.reordenarSeccion(
                        seccionArrastradaId,
                        objetivoArrastre.id,
                        objetivoArrastre.posicion,
                      )

                      setSeccionArrastradaId(null)
                      setObjetivoArrastre(null)
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setObjetivoArrastre((actual) => (actual?.id === seccion.id ? null : actual))
                      }
                    }}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${seccion.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'} ${seccionArrastradaId === seccion.id ? 'scale-[0.985] opacity-45 shadow-none' : 'shadow-sm hover:border-gray-300 hover:shadow-md'}`}
                  >
                    {objetivoArrastre?.id === seccion.id && objetivoArrastre.posicion === 'antes' && (
                      <div className="absolute left-3 right-3 top-0 h-0.5 rounded-full bg-secondary shadow-[0_0_0_3px_rgba(15,78,206,0.12)]" />
                    )}
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setSeccionArrastradaId(seccion.id)}
                      onDragEnd={() => {
                        setSeccionArrastradaId(null)
                        setObjetivoArrastre(null)
                      }}
                      className={`cursor-grab active:cursor-grabbing rounded-lg p-1.5 transition-all ${seccionArrastradaId === seccion.id ? 'bg-secondary/10 text-secondary' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                      aria-label={`Reordenar ${seccion.nombre}`}
                      title="Arrastra para reordenar"
                    >
                      <GripVertical className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    </button>
                    <span className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 uppercase flex-shrink-0">{etiquetaTipo[seccion.tipo]}</span>
                    <span className={`text-sm flex-1 ${seccion.visible ? 'text-body font-medium' : 'text-gray-400'}`}>{seccion.nombre}</span>
                    <button type="button" onClick={() => editor.toggleVisibilidad(seccion.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${seccion.visible ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={seccion.visible ? 'Ocultar' : 'Mostrar'}>
                      {seccion.visible ? <Eye className="w-4 h-4" strokeWidth={1.5} /> : <EyeOff className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                    <button type="button" onClick={() => { editor.setSeleccionadaId(seccion.id); editor.setPestana('edicion') }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors" title="Editar">
                      <Palette className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button type="button" onClick={() => editor.eliminarSeccion(seccion.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    {objetivoArrastre?.id === seccion.id && objetivoArrastre.posicion === 'despues' && (
                      <div className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-secondary shadow-[0_0_0_3px_rgba(15,78,206,0.12)]" />
                    )}
                  </div>
                ))}
              </div>
              {editor.secciones.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-sm mb-2">No hay secciones aun</p>
                  <button type="button" onClick={() => editor.setMostrarMenuAgregar(true)} className="text-secondary hover:text-secondary-dark text-sm font-medium">Agregar la primera seccion</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalAgregarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => setModalAgregarAbierto(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Nueva seccion</p>
              <h3 className="mt-1 text-lg font-semibold text-body">Selecciona el tipo de seccion</h3>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-gray-400">Tipo de seccion</label>
                <Select
                  value={tipoSeleccionado}
                  onChange={(v) => setTipoSeleccionado(v as TipoSeccion)}
                  options={tiposDisponibles.map((tipo) => ({ value: tipo, label: etiquetaTipo[tipo] }))}
                />
              </div>
              <p className="text-xs leading-5 text-gray-400">
                Cada tipo tiene su propio panel de configuracion en la pestaña Contenido del editor.
              </p>
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <Button type="button" variant="ghost" fullWidth onClick={() => setModalAgregarAbierto(false)}>Cancelar</Button>
              <Button type="button" fullWidth onClick={confirmarAgregarSeccion}>Agregar seccion</Button>
            </div>
          </div>
        </div>
      )}

    </DashboardTemplate>
  )
}

/* ─── Componentes auxiliares ─── */

function TarjetaGrupo({ titulo, Icono, children }: {
  titulo: string
  Icono: React.ComponentType<{ className?: string; strokeWidth?: number }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <Icono className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{titulo}</span>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Grupo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{etiqueta}</span>
      {children}
    </div>
  )
}

function ContenidoSeccionPanel({
  seccion,
  actualizarContenido,
  actualizarSeccion,
}: {
  seccion: SeccionMarketplace
  actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void
  actualizarSeccion: (id: string, cambios: Partial<SeccionMarketplace>) => void
}) {
  const contenido = seccion.contenido

  if (seccion.tipo === 'cabecera') return <PanelCabecera contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'principal') return <PanelPrincipal contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'productos') return <PanelProductos contenido={contenido} actualizarContenido={actualizarContenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'banner') return <PanelBanner contenido={contenido} actualizarContenido={actualizarContenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'doble-banner') return <PanelDobleBanner contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'aliados') return <PanelAliados contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'pilares') return <PanelPilares contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'franja') return <PanelFranja contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'texto') return <PanelTexto contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'pie') return <PanelPie contenido={contenido} actualizarSeccion={actualizarSeccion} seccion={seccion} />
  if (seccion.tipo === 'caracteristicas') return <PanelCaracteristicas contenido={contenido} actualizarContenido={actualizarContenido} />

  return <BloqueContenidoBase contenido={contenido} actualizarContenido={actualizarContenido} />
}

function BloqueContenidoBase({
  contenido,
  actualizarContenido,
}: {
  contenido: SeccionMarketplace['contenido']
  actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Texto principal">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarContenido('titulo', v)} placeholder="Ej: Tu futuro financiero, hoy." />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarContenido('subtitulo', v)} placeholder="Un texto breve debajo del titulo" />
        <CampoArea etiqueta="Descripcion" valor={contenido.descripcion} onChange={(v) => actualizarContenido('descripcion', v)} placeholder="Texto descriptivo mas extenso..." />
      </Grupo>
      <Grupo etiqueta="Boton de accion">
        <CampoTexto etiqueta="Texto del boton" valor={contenido.textoBoton} onChange={(v) => actualizarContenido('textoBoton', v)} placeholder="Ej: Ver productos" />
        <CampoTexto etiqueta="Pagina de destino" valor={contenido.enlaceBoton} onChange={(v) => actualizarContenido('enlaceBoton', v)} placeholder="Ej: /productos" />
      </Grupo>
      <Grupo etiqueta="Imagen principal">
        <ImagePicker label="Imagen de la seccion" value={contenido.imagenUrl} onChange={(value) => actualizarContenido('imagenUrl', value)} />
      </Grupo>
    </div>
  )
}

function CampoSwitch({ etiqueta, activo, onChange }: { etiqueta: string; activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
      <span className="text-xs font-medium text-body">{etiqueta}</span>
      <button type="button" onClick={() => onChange(!activo)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-secondary' : 'bg-gray-200'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

/* ─── Paneles por tipo ─── */

function PanelCabecera({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Marca de la cabecera">
        <CampoTexto etiqueta="Titulo de la pagina" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: ElMio" />
        <ImagePicker label="Logo de la cabecera" value={contenido.logoUrl} onChange={(value) => actualizarSeccion(seccion.id, { contenido: { ...contenido, logoUrl: value } })} />
      </Grupo>
      <Grupo etiqueta="Menu de navegacion">
        <EditorMenu menu={contenido.menu ?? []} onChange={(menu) => actualizarSeccion(seccion.id, { contenido: { ...contenido, menu } })} />
      </Grupo>
    </div>
  )
}

function PanelPrincipal({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Diapositivas del hero">
        <EditorDiapositivas diapositivas={contenido.diapositivas ?? []} onChange={(d) => actualizarSeccion(seccion.id, { contenido: { ...contenido, diapositivas: d } })} />
      </Grupo>
      <CampoSwitch etiqueta="Reproduccion automatica" activo={contenido.autoplay} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplay: v } })} />
      {contenido.autoplay && (
        <CampoTexto etiqueta="Velocidad (ms)" valor={String(contenido.autoplayVelocidad || 5000)} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplayVelocidad: Number(v) || 5000 } })} placeholder="5000" />
      )}
      <CampoTexto etiqueta="ID HTML (anclaje)" valor={contenido.htmlId} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, htmlId: v } })} placeholder="hero" />
    </div>
  )
}

function PanelProductos({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Encabezado del carrusel">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: Productos destacados" />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, subtitulo: v } })} placeholder="Texto auxiliar del carrusel" />
        <CampoArea etiqueta="Descripcion" valor={contenido.descripcion} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, descripcion: v } })} placeholder="Mensaje de apoyo para la seccion" />
      </Grupo>
      <Grupo etiqueta="CTA global">
        <CampoTexto etiqueta="Texto del boton (opcional)" valor={contenido.textoBoton} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, textoBoton: v } })} placeholder="Ej: Ver todos los productos" />
        <CampoTexto etiqueta="Pagina de destino" valor={contenido.enlaceBoton} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, enlaceBoton: v } })} placeholder="Ej: /productos" />
      </Grupo>
      <CampoSwitch etiqueta="Carrusel automatico" activo={contenido.autoplay} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplay: v } })} />
      {contenido.autoplay && (
        <CampoTexto etiqueta="Velocidad (ms)" valor={String(contenido.autoplayVelocidad || 5000)} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplayVelocidad: Number(v) || 5000 } })} placeholder="5000" />
      )}
      <Grupo etiqueta="Productos del carrusel">
        <SelectorProductos seleccionados={contenido.productosIds}
          onToggle={(productoId) => {
            const productoSeleccionado = contenido.productosIds.includes(productoId)
            const productosIds = productoSeleccionado ? contenido.productosIds.filter((id) => id !== productoId) : [...contenido.productosIds, productoId]
            actualizarSeccion(seccion.id, { contenido: { ...contenido, productosIds } })
          }} />
      </Grupo>
    </div>
  )
}

function PanelBanner({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Texto principal">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: Eres una empresa?" />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, subtitulo: v } })} placeholder="Texto secundario" />
        <CampoArea etiqueta="Descripcion" valor={contenido.descripcion} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, descripcion: v } })} placeholder="Texto descriptivo..." />
      </Grupo>
      <Grupo etiqueta="Imagen del banner">
        <ImagePicker label="Imagen" value={contenido.imagenUrl} onChange={(value) => actualizarSeccion(seccion.id, { contenido: { ...contenido, imagenUrl: value } })} />
      </Grupo>
      <Grupo etiqueta="Accion">
        <CampoTexto etiqueta="Texto del boton" valor={contenido.textoBoton} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, textoBoton: v } })} placeholder="Ej: Ser aliado" />
        <CampoTexto etiqueta="Pagina de destino" valor={contenido.enlaceBoton} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, enlaceBoton: v } })} placeholder="Ej: /aliados" />
      </Grupo>
    </div>
  )
}

function PanelDobleBanner({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  const banners = contenido.elementos.slice(0, 2)

  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Dos banners lado a lado">
        {[0, 1].map((idx) => {
          const banner = banners[idx]
          return (
            <div key={idx} className="rounded-xl border border-gray-100 p-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Banner {idx + 1}</p>
              <div className="flex flex-col gap-2">
                <CampoTexto etiqueta="Titulo" valor={banner?.titulo ?? ''} onChange={(v) => {
                  const nuevos = [...banners]
                  if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], titulo: v }
                  else nuevos[idx] = { id: crypto.randomUUID(), titulo: v, descripcion: '', icono: '', imagenUrl: '', enlaceUrl: '', textoBoton: '', enlaceBoton: '' }
                  actualizarSeccion(seccion.id, { contenido: { ...contenido, elementos: nuevos } })
                }} placeholder="Titulo del banner" />
                <ImagePicker label="Imagen" value={banner?.imagenUrl ?? ''} onChange={(v) => {
                  const nuevos = [...banners]
                  if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], imagenUrl: v }
                  else nuevos[idx] = { id: crypto.randomUUID(), titulo: '', descripcion: '', icono: '', imagenUrl: v, enlaceUrl: '', textoBoton: '', enlaceBoton: '' }
                  actualizarSeccion(seccion.id, { contenido: { ...contenido, elementos: nuevos } })
                }} />
                <CampoTexto etiqueta="Texto del boton" valor={banner?.textoBoton ?? ''} onChange={(v) => {
                  const nuevos = [...banners]
                  if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], textoBoton: v }
                  actualizarSeccion(seccion.id, { contenido: { ...contenido, elementos: nuevos } })
                }} placeholder="Texto del CTA" />
                <CampoTexto etiqueta="Enlace del boton" valor={banner?.enlaceBoton ?? ''} onChange={(v) => {
                  const nuevos = [...banners]
                  if (nuevos[idx]) nuevos[idx] = { ...nuevos[idx], enlaceBoton: v }
                  actualizarSeccion(seccion.id, { contenido: { ...contenido, elementos: nuevos } })
                }} placeholder="/productos" />
              </div>
            </div>
          )
        })}
      </Grupo>
    </div>
  )
}

function PanelAliados({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Encabezado">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: Nuestros aliados" />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, subtitulo: v } })} placeholder="Texto auxiliar" />
      </Grupo>
      <Grupo etiqueta="Logos de aliados">
        <EditorAliados aliados={contenido.aliados ?? []} onChange={(a) => actualizarSeccion(seccion.id, { contenido: { ...contenido, aliados: a } })} />
      </Grupo>
    </div>
  )
}

function PanelPilares({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Encabezado">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: Por que elegirnos" />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, subtitulo: v } })} placeholder="Texto auxiliar" />
      </Grupo>
      <Grupo etiqueta="Pilares">
        <EditorPilares pilares={contenido.pilares ?? []} onChange={(p) => actualizarSeccion(seccion.id, { contenido: { ...contenido, pilares: p } })} />
      </Grupo>
    </div>
  )
}

function PanelFranja({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Diapositivas de la franja">
        <EditorDiapositivas diapositivas={contenido.diapositivas ?? []} onChange={(d) => actualizarSeccion(seccion.id, { contenido: { ...contenido, diapositivas: d } })} />
      </Grupo>
      <CampoSwitch etiqueta="Reproduccion automatica" activo={contenido.autoplay} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplay: v } })} />
      {contenido.autoplay && (
        <CampoTexto etiqueta="Velocidad (ms)" valor={String(contenido.autoplayVelocidad || 5000)} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, autoplayVelocidad: Number(v) || 5000 } })} placeholder="5000" />
      )}
    </div>
  )
}

function PanelTexto({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Encabezado">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Titulo de la seccion" />
        <CampoTexto etiqueta="Subtitulo" valor={contenido.subtitulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, subtitulo: v } })} placeholder="Subtitulo" />
      </Grupo>
      <Grupo etiqueta="Cuerpo del texto">
        <CampoArea etiqueta="Texto plano" valor={contenido.descripcion} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, descripcion: v } })} placeholder="Texto del cuerpo de la seccion" />
      </Grupo>
      <Grupo etiqueta="HTML enriquecido (opcional)">
        <CampoArea etiqueta="HTML" valor={contenido.cuerpoHtml} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, cuerpoHtml: v } })} placeholder="<p>HTML personalizado...</p>" />
        <p className="text-xs text-gray-400">Si defines HTML, el renderizador usara este contenido en vez del texto plano.</p>
      </Grupo>
    </div>
  )
}

function PanelPie({ contenido, actualizarSeccion, seccion }: { contenido: SeccionMarketplace['contenido']; actualizarSeccion: (id: string, c: Partial<SeccionMarketplace>) => void; seccion: SeccionMarketplace }) {
  return (
    <div className="flex flex-col gap-4">
      <Grupo etiqueta="Marca del pie">
        <CampoTexto etiqueta="Titulo" valor={contenido.titulo} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, titulo: v } })} placeholder="Ej: ElMio" />
        <CampoTexto etiqueta="Descripcion" valor={contenido.descripcion} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, descripcion: v } })} placeholder="Mensaje corto de marca" />
        <ImagePicker label="Logo" value={contenido.logoUrl} onChange={(value) => actualizarSeccion(seccion.id, { contenido: { ...contenido, logoUrl: value } })} />
        <CampoTexto etiqueta="Copyright" valor={contenido.copyright} onChange={(v) => actualizarSeccion(seccion.id, { contenido: { ...contenido, copyright: v } })} placeholder="Ej: 2026 ElMio. Todos los derechos reservados." />
      </Grupo>
      <Grupo etiqueta="Columnas del pie">
        <EditorColumnasPie columnas={contenido.columnasPie ?? []} onChange={(c) => actualizarSeccion(seccion.id, { contenido: { ...contenido, columnasPie: c } })} />
      </Grupo>
    </div>
  )
}

function PanelCaracteristicas({ contenido, actualizarContenido }: { contenido: SeccionMarketplace['contenido']; actualizarContenido: (campo: keyof SeccionMarketplace['contenido'], valor: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <BloqueContenidoBase contenido={contenido} actualizarContenido={actualizarContenido} />
      <Grupo etiqueta="Elementos de la grilla">
        <p className="text-xs text-gray-400">Agrega o ajusta los items desde la pestaña <span className="font-medium text-body">Elementos</span>.</p>
      </Grupo>
    </div>
  )
}

/* ─── Editores especificos ─── */

function EditorDiapositivas({ diapositivas, onChange }: { diapositivas: Diapositiva[]; onChange: (d: Diapositiva[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {diapositivas.map((slide, idx) => (
        <div key={slide.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Slide {idx + 1}</span>
            <button type="button" onClick={() => onChange(diapositivas.filter((_, i) => i !== idx))} className="text-gray-300 transition-colors hover:text-red-500">
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <ImagePicker label="Imagen" value={slide.imagen} onChange={(v) => {
              const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, imagen: v } : s)
              onChange(nuevos)
            }} />
            <CampoTexto etiqueta="Titulo" valor={slide.titulo} onChange={(v) => {
              const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, titulo: v } : s)
              onChange(nuevos)
            }} placeholder="Titulo de la slide" />
            <CampoTexto etiqueta="Subtitulo" valor={slide.subtitulo} onChange={(v) => {
              const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, subtitulo: v } : s)
              onChange(nuevos)
            }} placeholder="Subtitulo" />
            <CampoArea etiqueta="Texto" valor={slide.texto} onChange={(v) => {
              const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, texto: v } : s)
              onChange(nuevos)
            }} placeholder="Texto descriptivo" />
            <div className="grid grid-cols-2 gap-2">
              <CampoTexto etiqueta="Texto boton" valor={slide.textoBoton} onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, textoBoton: v } : s)
                onChange(nuevos)
              }} placeholder="CTA" />
              <CampoTexto etiqueta="Enlace" valor={slide.enlaceBoton} onChange={(v) => {
                const nuevos = diapositivas.map((s, i) => i === idx ? { ...s, enlaceBoton: v } : s)
                onChange(nuevos)
              }} placeholder="/productos" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...diapositivas, { id: crypto.randomUUID(), imagen: '', titulo: '', subtitulo: '', texto: '', textoBoton: '', enlaceBoton: '' }])}
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5">
        + Agregar slide
      </button>
    </div>
  )
}

function EditorMenu({ menu, onChange }: { menu: MenuItem[]; onChange: (m: MenuItem[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {menu.map((item, idx) => (
        <div key={item.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Item {idx + 1}</span>
            <button type="button" onClick={() => onChange(menu.filter((_, i) => i !== idx))} className="text-gray-300 transition-colors hover:text-red-500">
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <CampoTexto etiqueta="Etiqueta" valor={item.label} onChange={(v) => { const n = menu.map((m, i) => i === idx ? { ...m, label: v } : m); onChange(n) }} placeholder="Ej: Productos" />
            <CampoTexto etiqueta="Ruta" valor={item.href} onChange={(v) => { const n = menu.map((m, i) => i === idx ? { ...m, href: v } : m); onChange(n) }} placeholder="/productos" />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...menu, { id: crypto.randomUUID(), label: '', href: '', icono: '', submenus: [] }])}
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5">
        + Agregar item de menu
      </button>
    </div>
  )
}

function EditorAliados({ aliados, onChange }: { aliados: AliadoLogo[]; onChange: (a: AliadoLogo[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {aliados.map((aliado, idx) => (
        <div key={aliado.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Aliado {idx + 1}</span>
            <button type="button" onClick={() => onChange(aliados.filter((_, i) => i !== idx))} className="text-gray-300 transition-colors hover:text-red-500">
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <CampoTexto etiqueta="Nombre" valor={aliado.nombre} onChange={(v) => { const n = aliados.map((a, i) => i === idx ? { ...a, nombre: v } : a); onChange(n) }} placeholder="Ej: Mercantil Seguros" />
            <ImagePicker label="Logo" value={aliado.logo} onChange={(v) => { const n = aliados.map((a, i) => i === idx ? { ...a, logo: v } : a); onChange(n) }} />
            <CampoTexto etiqueta="Enlace" valor={aliado.href} onChange={(v) => { const n = aliados.map((a, i) => i === idx ? { ...a, href: v } : a); onChange(n) }} placeholder="/aliados/mercantil" />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...aliados, { id: crypto.randomUUID(), nombre: '', logo: '', href: '' }])}
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5">
        + Agregar aliado
      </button>
    </div>
  )
}

function EditorPilares({ pilares, onChange }: { pilares: PilarItem[]; onChange: (p: PilarItem[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {pilares.map((pilar, idx) => (
        <div key={pilar.id} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pilar {idx + 1}</span>
            <button type="button" onClick={() => onChange(pilares.filter((_, i) => i !== idx))} className="text-gray-300 transition-colors hover:text-red-500">
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <CampoTexto etiqueta="Titulo" valor={pilar.titulo} onChange={(v) => { const n = pilares.map((p, i) => i === idx ? { ...p, titulo: v } : p); onChange(n) }} placeholder="Ej: Seguridad" />
            <ImagePicker label="Icono" value={pilar.icono} onChange={(v) => { const n = pilares.map((p, i) => i === idx ? { ...p, icono: v } : p); onChange(n) }} />
            <CampoArea etiqueta="Texto" valor={pilar.texto} onChange={(v) => { const n = pilares.map((p, i) => i === idx ? { ...p, texto: v } : p); onChange(n) }} placeholder="Descripcion del pilar" />
            <div className="grid grid-cols-2 gap-2">
              <CampoTexto etiqueta="Texto boton" valor={pilar.textoBoton} onChange={(v) => { const n = pilares.map((p, i) => i === idx ? { ...p, textoBoton: v } : p); onChange(n) }} placeholder="CTA" />
              <CampoTexto etiqueta="Enlace" valor={pilar.enlaceBoton} onChange={(v) => { const n = pilares.map((p, i) => i === idx ? { ...p, enlaceBoton: v } : p); onChange(n) }} placeholder="/ruta" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...pilares, { id: crypto.randomUUID(), icono: '', titulo: '', texto: '', textoBoton: '', enlaceBoton: '' }])}
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5">
        + Agregar pilar
      </button>
    </div>
  )
}

function EditorColumnasPie({ columnas, onChange }: { columnas: ColumnaPie[]; onChange: (c: ColumnaPie[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {columnas.map((columna, idx) => (
        <div key={columna.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <CampoTexto etiqueta="" valor={columna.titulo} onChange={(v) => {
              const n = columnas.map((c, i) => i === idx ? { ...c, titulo: v } : c)
              onChange(n)
            }} placeholder="Titulo de la columna" />
            <button type="button" onClick={() => onChange(columnas.filter((_, i) => i !== idx))} className="ml-2 text-gray-300 transition-colors hover:text-red-500">
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {columna.enlaces.map((enlace, linkIdx) => (
              <div key={enlace.id} className="flex items-center gap-2">
                <CampoTexto etiqueta="" valor={enlace.texto} onChange={(v) => {
                  const n = columnas.map((c, i) => i === idx ? { ...c, enlaces: c.enlaces.map((l, li) => li === linkIdx ? { ...l, texto: v } : l) } : c)
                  onChange(n)
                }} placeholder="Texto del enlace" />
                <CampoTexto etiqueta="" valor={enlace.href} onChange={(v) => {
                  const n = columnas.map((c, i) => i === idx ? { ...c, enlaces: c.enlaces.map((l, li) => li === linkIdx ? { ...l, href: v } : l) } : c)
                  onChange(n)
                }} placeholder="/ruta" />
                <button type="button" onClick={() => {
                  const n = columnas.map((c, i) => i === idx ? { ...c, enlaces: c.enlaces.filter((_, li) => li !== linkIdx) } : c)
                  onChange(n)
                }} className="text-gray-300 transition-colors hover:text-red-500">
                  <X className="h-3 w-3" strokeWidth={1.5} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => {
              const n = columnas.map((c, i) => i === idx ? { ...c, enlaces: [...c.enlaces, { id: crypto.randomUUID(), texto: '', href: '' }] } : c)
              onChange(n)
            }} className="text-[11px] font-medium text-secondary">+ Agregar enlace</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...columnas, { id: crypto.randomUUID(), titulo: '', enlaces: [] }])}
        className="rounded-xl border border-dashed border-gray-200 py-3 text-xs font-medium text-secondary transition-colors hover:border-secondary hover:bg-secondary/5">
        + Agregar columna
      </button>
    </div>
  )
}

function SelectorProductos({
  seleccionados,
  onToggle,
}: {
  seleccionados: string[]
  onToggle: (productoId: string) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {productosDisponibles.map((producto) => {
        const activo = seleccionados.includes(producto.id)

        return (
          <button
            key={producto.id}
            type="button"
            onClick={() => onToggle(producto.id)}
            className={`overflow-hidden rounded-2xl border text-left transition-all duration-200 ${activo ? 'border-secondary bg-secondary/5 shadow-sm ring-2 ring-secondary/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}
          >
            <div className="relative h-32 bg-gray-100">
              {producto.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={producto.imagenUrl} alt={producto.nombre} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-secondary shadow-sm">
                {activo ? 'Incluido' : 'Disponible'}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-body">{producto.nombre}</p>
              <div className="mt-3 space-y-1 text-[11px] text-gray-500">
                <p>
                  {producto.accionTipo === 'redirect'
                    ? `Accion: redireccion a ${producto.destinoUrl}`
                    : `Accion: ${producto.accionEtiqueta}`}
                </p>
                <p>
                  {activo ? 'Se mostrara en el carrusel renderizado.' : 'Disponible para agregar al carrusel.'}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function CampoTexto({ etiqueta, valor, onChange, placeholder }: {
  etiqueta: string; valor: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400">{etiqueta}</label>
      <Input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="!py-2 !text-xs" />
    </div>
  )
}

function CampoArea({ etiqueta, valor, onChange, placeholder }: {
  etiqueta: string; valor: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400">{etiqueta}</label>
      <textarea value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-body placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-border-focus focus:ring-2 focus:ring-ring/20 resize-none" />
    </div>
  )
}
