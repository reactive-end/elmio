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
import { useMarketplaceEditor } from '@/src/hooks/pages/useMarketplaceEditor'
import type { SeccionMarketplace, TipoSeccion } from '@/src/utils/editor-types.d'
import { MERCADO_PRUEBA, etiquetaTipo } from './mock-data'

type PestanaEditor = 'vista-previa' | 'edicion' | 'secciones'
type PestanaPropiedades = 'contenido' | 'estilos' | 'elementos'

const tiposDisponibles: TipoSeccion[] = ['principal', 'caracteristicas', 'productos', 'aliados', 'banner', 'texto', 'pie', 'personalizado']

export default function MarketplaceEditorPage() {
  const editor = useMarketplaceEditor(MERCADO_PRUEBA)
  const [seccionArrastradaId, setSeccionArrastradaId] = useState<string | null>(null)
  const [objetivoArrastre, setObjetivoArrastre] = useState<{
    id: string
    posicion: 'antes' | 'despues'
  } | null>(null)

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
                <VistaPreviaSeccion key={seccion.id} seccion={seccion} seleccionada={editor.seleccionadaId === seccion.id}
                  onClick={() => { editor.setSeleccionadaId(seccion.id); editor.setPestana('edicion') }} />
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
                <div className="relative">
                  <button type="button" onClick={() => editor.setMostrarMenuAgregar(!editor.mostrarMenuAgregar)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-white hover:bg-secondary-dark transition-colors">
                    <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  {editor.mostrarMenuAgregar && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-52">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Agregar seccion</div>
                      {tiposDisponibles.map((tipo) => (
                        <button key={tipo} type="button" onClick={() => editor.agregarSeccion(tipo)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-body hover:bg-surface-muted transition-colors">
                          {etiquetaTipo[tipo]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                    <div className="flex flex-col gap-4">
                      <Grupo etiqueta="Texto principal">
                        <CampoTexto etiqueta="Titulo" valor={editor.seleccionada.contenido.titulo} onChange={(v) => editor.actualizarContenido('titulo', v)} placeholder="Ej: Tu futuro financiero, hoy." />
                        <CampoTexto etiqueta="Subtitulo" valor={editor.seleccionada.contenido.subtitulo} onChange={(v) => editor.actualizarContenido('subtitulo', v)} placeholder="Un texto breve debajo del titulo" />
                        <CampoArea etiqueta="Descripcion" valor={editor.seleccionada.contenido.descripcion} onChange={(v) => editor.actualizarContenido('descripcion', v)} placeholder="Texto descriptivo mas extenso..." />
                      </Grupo>
                      <Grupo etiqueta="Boton de accion">
                        <CampoTexto etiqueta="Texto del boton" valor={editor.seleccionada.contenido.textoBoton} onChange={(v) => editor.actualizarContenido('textoBoton', v)} placeholder="Ej: Ver productos" />
                        <CampoTexto etiqueta="Pagina de destino" valor={editor.seleccionada.contenido.enlaceBoton} onChange={(v) => editor.actualizarContenido('enlaceBoton', v)} placeholder="Ej: /productos" />
                      </Grupo>
                      <Grupo etiqueta="Imagen de fondo">
                        <CampoTexto etiqueta="Direccion de la imagen" valor={editor.seleccionada.contenido.imagenUrl} onChange={(v) => editor.actualizarContenido('imagenUrl', v)} placeholder="https://..." />
                      </Grupo>
                    </div>
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
                          <CampoTexto etiqueta="Imagen de fondo" valor={editor.seleccionada.estilo.imagenFondo} onChange={(v) => editor.actualizarEstilo('imagenFondo', v)} placeholder="url(...)" />
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
                          <CampoTexto etiqueta="Imagen" valor={elem.imagenUrl} onChange={(v) => editor.actualizarElemento(elem.id, 'imagenUrl', v)} />
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
              <div className="relative">
                <button type="button" onClick={() => editor.setMostrarMenuAgregar(!editor.mostrarMenuAgregar)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-dark rounded-lg px-3 py-1.5 transition-colors">
                  <Plus className="w-3 h-3" strokeWidth={2} /> Agregar seccion
                </button>
                {editor.mostrarMenuAgregar && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-52">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Tipo de seccion</div>
                    {tiposDisponibles.map((tipo) => (
                      <button key={tipo} type="button" onClick={() => editor.agregarSeccion(tipo)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-body hover:bg-surface-muted transition-colors">
                        {etiquetaTipo[tipo]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
    </DashboardTemplate>
  )
}

/* ─── Vista previa ─── */

function VistaPreviaSeccion({ seccion, seleccionada, onClick }: {
  seccion: SeccionMarketplace; seleccionada: boolean; onClick: () => void
}) {
  const { contenido, estilo } = seccion
  const estiloFondo: React.CSSProperties = {}
  if (estilo.gradienteFondo) estiloFondo.backgroundImage = estilo.gradienteFondo
  else if (estilo.colorFondo !== 'transparente') estiloFondo.backgroundColor = estilo.colorFondo
  if (estilo.imagenFondo) estiloFondo.backgroundImage = estilo.imagenFondo

  return (
    <div onClick={onClick}
      className={`relative cursor-pointer transition-all ${seleccionada ? 'ring-2 ring-secondary ring-offset-2 rounded-lg z-10 scale-[1.01]' : 'hover:ring-1 hover:ring-secondary/30'}`}
      style={{ marginTop: estilo.margenSuperior, marginBottom: estilo.margenInferior }}>
      <div style={{ ...estiloFondo, paddingTop: estilo.paddingSuperior, paddingRight: estilo.paddingDerecho, paddingBottom: estilo.paddingInferior, paddingLeft: estilo.paddingIzquierdo, borderWidth: estilo.anchoBorde, borderColor: estilo.colorBorde, borderRadius: estilo.radioBorde, borderStyle: estilo.anchoBorde > 0 ? (estilo.estiloBorde || 'solid') : undefined }}>
        {estilo.opacidadOverlay > 0 && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${estilo.opacidadOverlay / 100})`, borderRadius: estilo.radioBorde }} />}
        <div className="relative" style={{ maxWidth: estilo.anchoMaximo || 1200, margin: '0 auto' }}>
          {contenido.titulo && <h2 style={{ fontSize: estilo.tituloTamano, fontWeight: estilo.tituloPeso, color: estilo.tituloColor, textAlign: estilo.tituloAlineacion as never }}>{contenido.titulo}</h2>}
          {contenido.subtitulo && <p style={{ fontSize: estilo.subtituloTamano, color: estilo.subtituloColor, textAlign: estilo.tituloAlineacion as never, marginTop: 8 }}>{contenido.subtitulo}</p>}
          {contenido.descripcion && <div style={{ fontSize: estilo.cuerpoTamano, color: estilo.cuerpoColor, textAlign: estilo.cuerpoAlineacion as never, marginTop: 12 }}>{contenido.descripcion}</div>}
          {contenido.elementos.length > 0 && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: estilo.espacioEntreElementos, marginTop: 16 }}>
              {contenido.elementos.map((elem) => (
                <div key={elem.id} className="bg-white/10 backdrop-blur rounded-xl p-4" style={{ color: estilo.cuerpoColor }}>
                  {elem.imagenUrl && <div className="w-12 h-12 rounded-lg bg-gray-200 mb-3 flex items-center justify-center text-gray-400 text-[10px]">img</div>}
                  <h4 className="text-sm font-semibold mb-1" style={{ color: estilo.tituloColor, fontSize: estilo.cuerpoTamano }}>{elem.titulo}</h4>
                  {elem.descripcion && <p className="text-xs opacity-70">{elem.descripcion}</p>}
                </div>
              ))}
            </div>
          )}
          {contenido.textoBoton && <button type="button" className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-sm mt-4" style={{ backgroundColor: estilo.tituloColor || '#0f4ece', color: '#fff' }}>{contenido.textoBoton}</button>}
        </div>
      </div>
    </div>
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
