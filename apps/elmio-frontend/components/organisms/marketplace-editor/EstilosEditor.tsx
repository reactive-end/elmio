'use client'

import {
  ImageIcon,
  Ruler,
  ArrowUpDown,
  Square,
  Heading1,
  Heading2,
  Heading3,
  Columns2,
  CaseSensitive,
  Sparkles,
  Layers,
} from 'lucide-react'
import { CardGroup } from '@/components/molecules/CardGroup/CardGroup'
import { PixelInput } from '@/components/molecules/PixelInput/PixelInput'
import { ColorInput } from '@/components/molecules/ColorInput/ColorInput'
import { FontSelect } from '@/components/molecules/FontSelect/FontSelect'
import { GradientBuilder } from '@/components/molecules/GradientBuilder/GradientBuilder'
import { ImagePicker } from '@/components/molecules/ImagePicker/ImagePicker'
import { Select } from '@/components/atoms/Select/Select'
import type { SeccionMarketplace, EstiloSeccion } from '@/src/utils/editor-types.d'

interface EstilosEditorProps {
  seccion: SeccionMarketplace
  fuente: string
  gradienteActivo: boolean
  gradienteInicio: string
  gradienteFin: string
  gradienteDireccion: string
  actualizarEstilo: (campo: keyof EstiloSeccion, valor: string | number | boolean) => void
  onGradienteActivoChange: (activo: boolean) => void
  onGradienteInicioChange: (color: string) => void
  onGradienteFinChange: (color: string) => void
  onGradienteDireccionChange: (direccion: string) => void
  onFuenteChange: (fuente: string) => void
}

/**
 * Editor de estilos para una seccion del marketplace.
 * Contiene grupos de configuracion: fondo, espaciado, borde, tipografia, disposicion.
 */
export function EstilosEditor({
  seccion,
  fuente,
  gradienteActivo,
  gradienteInicio,
  gradienteFin,
  gradienteDireccion,
  actualizarEstilo,
  onGradienteActivoChange,
  onGradienteInicioChange,
  onGradienteFinChange,
  onGradienteDireccionChange,
  onFuenteChange,
}: EstilosEditorProps) {
  const construirGradiente = () =>
    `linear-gradient(${gradienteDireccion}, ${gradienteInicio}, ${gradienteFin})`

  return (
    <div className="flex flex-col gap-4">
      <CardGroup title="Fondo" Icon={ImageIcon}>
        <ColorInput
          label={gradienteActivo ? 'Color solido (deshabilitado por degradado)' : 'Color solido'}
          value={seccion.estilo.colorFondo}
          onChange={(v) => actualizarEstilo('colorFondo', v)}
          disabled={gradienteActivo}
        />
        <GradientBuilder
          label="Degradado"
          colorInicio={gradienteInicio}
          colorFin={gradienteFin}
          direccion={gradienteDireccion}
          activo={gradienteActivo}
          onActivoChange={(v) => {
            onGradienteActivoChange(v)
            if (v) actualizarEstilo('gradienteFondo', construirGradiente())
            else actualizarEstilo('gradienteFondo', '')
          }}
          onColorInicioChange={(c) => {
            onGradienteInicioChange(c)
            if (gradienteActivo) actualizarEstilo('gradienteFondo', construirGradiente())
          }}
          onColorFinChange={(c) => {
            onGradienteFinChange(c)
            if (gradienteActivo) actualizarEstilo('gradienteFondo', construirGradiente())
          }}
          onDireccionChange={(d) => {
            onGradienteDireccionChange(d)
            if (gradienteActivo) actualizarEstilo('gradienteFondo', construirGradiente())
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <ImagePicker
            label="Imagen de fondo"
            value={seccion.estilo.imagenFondo}
            onChange={(value) => actualizarEstilo('imagenFondo', value ? `url(${value})` : '')}
          />
          <PixelInput
            label="Oscurecer %"
            value={seccion.estilo.opacidadOverlay}
            onChange={(v) => actualizarEstilo('opacidadOverlay', v)}
            min={0}
            max={100}
          />
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-[10px] font-medium text-gray-400">Patrón de fondo decorativo</label>
          <Select
            value={seccion.estilo.patronFondo || 'ninguno'}
            onChange={(v) => actualizarEstilo('patronFondo', v)}
            options={[
              { value: 'ninguno', label: 'Ninguno' },
              { value: 'puntos', label: 'Rejilla de Puntos (Dots)' },
              { value: 'cuadricula', label: 'Cuadrícula Técnica (Grid)' },
              { value: 'diagonal', label: 'Líneas Diagonales (Sutil)' },
              { value: 'malla', label: 'Efecto de Malla Fluida (Glow)' },
            ]}
          />
        </div>
      </CardGroup>

      <CardGroup title="Espaciado interno" Icon={Ruler}>
        <div className="grid grid-cols-2 gap-2">
          <PixelInput
            label="Arriba"
            value={seccion.estilo.paddingSuperior}
            onChange={(v) => actualizarEstilo('paddingSuperior', v)}
            min={0}
            max={200}
          />
          <PixelInput
            label="Derecha"
            value={seccion.estilo.paddingDerecho}
            onChange={(v) => actualizarEstilo('paddingDerecho', v)}
            min={0}
            max={200}
          />
          <PixelInput
            label="Abajo"
            value={seccion.estilo.paddingInferior}
            onChange={(v) => actualizarEstilo('paddingInferior', v)}
            min={0}
            max={200}
          />
          <PixelInput
            label="Izquierda"
            value={seccion.estilo.paddingIzquierdo}
            onChange={(v) => actualizarEstilo('paddingIzquierdo', v)}
            min={0}
            max={200}
          />
        </div>
      </CardGroup>

      <CardGroup title="Separacion externa" Icon={ArrowUpDown}>
        <div className="grid grid-cols-2 gap-2">
          <PixelInput
            label="Arriba"
            value={seccion.estilo.margenSuperior}
            onChange={(v) => actualizarEstilo('margenSuperior', v)}
            min={0}
            max={200}
          />
          <PixelInput
            label="Abajo"
            value={seccion.estilo.margenInferior}
            onChange={(v) => actualizarEstilo('margenInferior', v)}
            min={0}
            max={200}
          />
        </div>
      </CardGroup>

      <CardGroup title="Borde" Icon={Square}>
        <div className="grid grid-cols-2 gap-2">
          <PixelInput
            label="Grosor"
            value={seccion.estilo.anchoBorde}
            onChange={(v) => actualizarEstilo('anchoBorde', v)}
            min={0}
            max={20}
          />
          <PixelInput
            label="Redondez"
            value={seccion.estilo.radioBorde}
            onChange={(v) => actualizarEstilo('radioBorde', v)}
            min={0}
            max={100}
          />
        </div>
        <ColorInput
          label="Color del borde"
          value={seccion.estilo.colorBorde}
          onChange={(v) => actualizarEstilo('colorBorde', v)}
        />
      </CardGroup>

      <CardGroup title="Botones de la sección" Icon={Sparkles}>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput
            label="Color de fondo"
            value={seccion.estilo.botonColorFondo || '#0f4ece'}
            onChange={(v) => actualizarEstilo('botonColorFondo', v)}
          />
          <ColorInput
            label="Color de texto"
            value={seccion.estilo.botonColorTexto || '#ffffff'}
            onChange={(v) => actualizarEstilo('botonColorTexto', v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PixelInput
            label="Redondez (Radio)"
            value={seccion.estilo.botonRedondez ?? 12}
            onChange={(v) => actualizarEstilo('botonRedondez', v)}
            min={0}
            max={50}
          />
          <PixelInput
            label="Grosor del borde"
            value={seccion.estilo.botonAnchoBorde ?? 0}
            onChange={(v) => actualizarEstilo('botonAnchoBorde', v)}
            min={0}
            max={10}
          />
        </div>
        <ColorInput
          label="Color del borde"
          value={seccion.estilo.botonColorBorde || seccion.estilo.botonColorFondo || '#0f4ece'}
          onChange={(v) => actualizarEstilo('botonColorBorde', v)}
        />
      </CardGroup>

      {['caracteristicas', 'productos', 'doble-banner', 'pilares'].includes(seccion.tipo) && (
        <CardGroup title="Tarjetas y Elementos" Icon={Layers}>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput
              label="Color de fondo"
              value={seccion.estilo.tarjetaColorFondo || '#ffffff'}
              onChange={(v) => actualizarEstilo('tarjetaColorFondo', v)}
            />
            <ColorInput
              label="Color de borde"
              value={seccion.estilo.tarjetaColorBorde || '#f3f4f6'}
              onChange={(v) => actualizarEstilo('tarjetaColorBorde', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PixelInput
              label="Redondez (Radio)"
              value={seccion.estilo.tarjetaRadioBorde ?? 16}
              onChange={(v) => actualizarEstilo('tarjetaRadioBorde', v)}
              min={0}
              max={60}
            />
            <PixelInput
              label="Grosor del borde"
              value={seccion.estilo.tarjetaAnchoBorde ?? 1}
              onChange={(v) => actualizarEstilo('tarjetaAnchoBorde', v)}
              min={0}
              max={10}
            />
          </div>
        </CardGroup>
      )}

      <CardGroup title="Titulo principal" Icon={Heading1}>
        <div className="grid grid-cols-2 gap-2">
          <PixelInput
            label="Tamano"
            value={seccion.estilo.tituloTamano}
            onChange={(v) => actualizarEstilo('tituloTamano', v)}
            min={8}
            max={120}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-400">Grosor</label>
            <Select
              value={String(seccion.estilo.tituloPeso)}
              onChange={(v) => actualizarEstilo('tituloPeso', Number(v))}
              options={[
                { value: '300', label: 'Fino' },
                { value: '400', label: 'Normal' },
                { value: '500', label: 'Medio' },
                { value: '600', label: 'Seminegrupo' },
                { value: '700', label: 'Negrupo' },
                { value: '800', label: 'Extranegrupo' },
                { value: '900', label: 'Ultranegrupo' },
              ]}
            />
          </div>
        </div>
        <ColorInput
          label="Color"
          value={seccion.estilo.tituloColor}
          onChange={(v) => actualizarEstilo('tituloColor', v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-gray-400">Alineacion</label>
          <Select
            value={seccion.estilo.tituloAlineacion}
            onChange={(v) => actualizarEstilo('tituloAlineacion', v)}
            options={[
              { value: 'izquierda', label: 'Izquierda' },
              { value: 'centro', label: 'Centro' },
              { value: 'derecha', label: 'Derecha' },
            ]}
          />
        </div>
      </CardGroup>

      <CardGroup title="Subtitulo" Icon={Heading2}>
        <PixelInput
          label="Tamano"
          value={seccion.estilo.subtituloTamano}
          onChange={(v) => actualizarEstilo('subtituloTamano', v)}
          min={8}
          max={80}
        />
        <ColorInput
          label="Color"
          value={seccion.estilo.subtituloColor}
          onChange={(v) => actualizarEstilo('subtituloColor', v)}
        />
      </CardGroup>

      <CardGroup title="Texto del cuerpo" Icon={Heading3}>
        <PixelInput
          label="Tamano"
          value={seccion.estilo.cuerpoTamano}
          onChange={(v) => actualizarEstilo('cuerpoTamano', v)}
          min={8}
          max={40}
        />
        <ColorInput
          label="Color"
          value={seccion.estilo.cuerpoColor}
          onChange={(v) => actualizarEstilo('cuerpoColor', v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-gray-400">Alineacion</label>
          <Select
            value={seccion.estilo.cuerpoAlineacion}
            onChange={(v) => actualizarEstilo('cuerpoAlineacion', v)}
            options={[
              { value: 'izquierda', label: 'Izquierda' },
              { value: 'centro', label: 'Centro' },
              { value: 'derecha', label: 'Derecha' },
            ]}
          />
        </div>
      </CardGroup>

      <CardGroup title="Disposicion" Icon={Columns2}>
        <PixelInput
          label="Ancho maximo"
          value={seccion.estilo.anchoMaximo}
          onChange={(v) => actualizarEstilo('anchoMaximo', v)}
          min={200}
          max={2000}
          step={50}
        />
        <PixelInput
          label="Separacion entre elementos"
          value={seccion.estilo.espacioEntreElementos}
          onChange={(v) => actualizarEstilo('espacioEntreElementos', v)}
          min={0}
          max={100}
        />
        {seccion.tipo === 'principal' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-400">Diseño de la Portada</label>
            <Select
              value={seccion.estilo.layoutPrincipal || 'centro'}
              onChange={(v) => actualizarEstilo('layoutPrincipal', v)}
              options={[
                { value: 'centro', label: 'Minimalista Centrado' },
                { value: 'dividido', label: 'Corporativo Dividido' },
              ]}
            />
          </div>
        )}
        {seccion.tipo === 'doble-banner' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-400">Proporción de Banners</label>
            <Select
              value={seccion.estilo.proporcionColumnas || '50/50'}
              onChange={(v) => actualizarEstilo('proporcionColumnas', v)}
              options={[
                { value: '50/50', label: '50/50 Simétrico' },
                { value: '60/40', label: '60/40 Destaque Izquierdo' },
                { value: '30/70', label: '30/70 Destaque Derecho' },
              ]}
            />
          </div>
        )}
        {seccion.tipo === 'pilares' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-400">Disposición</label>
            <Select
              value={seccion.estilo.layoutPilares || 'grid'}
              onChange={(v) => actualizarEstilo('layoutPilares', v)}
              options={[
                { value: 'grid', label: 'Cuadrícula Clásica' },
                { value: 'zigzag', label: 'Zigzag (Izquierda-Derecha)' },
              ]}
            />
          </div>
        )}
      </CardGroup>

      <CardGroup title="Tipografia" Icon={CaseSensitive}>
        <FontSelect label="Fuente" value={fuente} onChange={onFuenteChange} />
      </CardGroup>
    </div>
  )
}
