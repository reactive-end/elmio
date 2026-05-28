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
  Search,
  Menu,
  Megaphone,
  Star,
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
          {seccion.tipo === 'productos' && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
              <PixelInput
                label="Ancho de tarjeta (px)"
                value={seccion.estilo.tarjetaAncho ?? 208}
                onChange={(v) => actualizarEstilo('tarjetaAncho', v)}
                min={150}
                max={400}
              />
              <PixelInput
                label="Alto de imagen (px)"
                value={seccion.estilo.altoImagenProducto ?? 200}
                onChange={(v) => actualizarEstilo('altoImagenProducto', v)}
                min={100}
                max={400}
              />
            </div>
          )}
          {['pilares', 'caracteristicas'].includes(seccion.tipo) && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <ColorInput
                label="Color de título de pilares"
                value={seccion.estilo.pilarTituloColor || seccion.estilo.tituloColor || '#111827'}
                onChange={(v) => actualizarEstilo('pilarTituloColor', v)}
              />
            </div>
          )}
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

      {/* =======================================================
          ESTILOS QUIRÚRGICOS POR TIPO DE SECCIÓN (SABOR ANTIGUO)
          ======================================================= */}

      {/* Cabecera: Configuración de Menú, Submenús y Navbar */}
      {seccion.tipo === 'cabecera' && (
        <>
          <CardGroup title="Estilos de Menú y Navegación" Icon={Menu}>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Fondo Navbar"
                value={seccion.estilo.navBackgroundColor || '#ffffff'}
                onChange={(v) => actualizarEstilo('navBackgroundColor', v)}
              />
              <ColorInput
                label="Color de Texto"
                value={seccion.estilo.navTextColor || '#001b36'}
                onChange={(v) => actualizarEstilo('navTextColor', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Hover Texto"
                value={seccion.estilo.navHoverTextColor || '#0f4ecf'}
                onChange={(v) => actualizarEstilo('navHoverTextColor', v)}
              />
              <FontSelect
                label="Fuente Navbar"
                value={seccion.estilo.fontFamily || fuente}
                onChange={(f) => actualizarEstilo('fontFamily', f)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-400">Disposición</label>
                <Select
                  value={seccion.estilo.topBarLayout || 'default'}
                  onChange={(v) => actualizarEstilo('topBarLayout', v)}
                  options={[
                    { value: 'default', label: 'Estándar' },
                    { value: 'compact', label: 'Compacto' },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-400">Justificación</label>
                <Select
                  value={seccion.estilo.topBarJustify || 'space-between'}
                  onChange={(v) => actualizarEstilo('topBarJustify', v)}
                  options={[
                    { value: 'space-between', label: 'Separado' },
                    { value: 'space-around', label: 'Alrededor' },
                    { value: 'center', label: 'Centrado' },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-400">Alineación</label>
                <Select
                  value={seccion.estilo.topBarAlign || 'center'}
                  onChange={(v) => actualizarEstilo('topBarAlign', v)}
                  options={[
                    { value: 'center', label: 'Centro' },
                    { value: 'flex-start', label: 'Inicio' },
                    { value: 'flex-end', label: 'Fin' },
                  ]}
                />
              </div>
              <PixelInput
                label="Tamaño Fuente"
                value={parseInt(seccion.estilo.navLinkFontSize || '14') || 14}
                onChange={(v) => actualizarEstilo('navLinkFontSize', `${v}px`)}
                min={8}
                max={24}
              />
            </div>
          </CardGroup>

          <CardGroup title="Estilos de Submenú Desplegable" Icon={Layers}>
            <div className="grid grid-cols-2 gap-2">
              <PixelInput
                label="Ancho de Menú"
                value={parseInt(seccion.estilo.menuWidth || '256') || 256}
                onChange={(v) => actualizarEstilo('menuWidth', `${v}px`)}
                min={150}
                max={400}
              />
              <ColorInput
                label="Color Texto Submenú"
                value={seccion.estilo.submenuTextColor || '#0F172A'}
                onChange={(v) => actualizarEstilo('submenuTextColor', v)}
              />
            </div>
            <ColorInput
              label="Hover Texto Submenú"
              value={seccion.estilo.submenuHoverTextColor || '#1D4ED8'}
              onChange={(v) => actualizarEstilo('submenuHoverTextColor', v)}
            />
          </CardGroup>

          <CardGroup title="Estilos del Buscador" Icon={Search}>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Fondo Buscador"
                value={seccion.estilo.searchBarColor || 'rgba(0,0,0,0.05)'}
                onChange={(v) => actualizarEstilo('searchBarColor', v)}
              />
              <ColorInput
                label="Texto Buscador"
                value={seccion.estilo.searchBarTextColor || '#000000'}
                onChange={(v) => actualizarEstilo('searchBarTextColor', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Color de Icono"
                value={seccion.estilo.searchBarIconColor || '#000000'}
                onChange={(v) => actualizarEstilo('searchBarIconColor', v)}
              />
              <ColorInput
                label="Color de Borde"
                value={seccion.estilo.searchBarBorderColor || '#e5e7eb'}
                onChange={(v) => actualizarEstilo('searchBarBorderColor', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Fondo Botón Buscar"
                value={seccion.estilo.searchBarButtonColor || '#000000'}
                onChange={(v) => actualizarEstilo('searchBarButtonColor', v)}
              />
              <ColorInput
                label="Placeholder"
                value={seccion.estilo.searchBarPlaceholderColor || '#9ca3af'}
                onChange={(v) => actualizarEstilo('searchBarPlaceholderColor', v)}
              />
            </div>
          </CardGroup>
        </>
      )}

      {/* Hero / Principal: Barra Promocional */}
      {seccion.tipo === 'principal' && (
        <CardGroup title="Barra Promocional Superior" Icon={Megaphone}>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput
              label="Fondo Barra"
              value={seccion.estilo.promoBarBackgroundColor || '#878787'}
              onChange={(v) => actualizarEstilo('promoBarBackgroundColor', v)}
            />
            <ColorInput
              label="Color de Texto"
              value={seccion.estilo.promoBarTextColor || '#ffffff'}
              onChange={(v) => actualizarEstilo('promoBarTextColor', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PixelInput
              label="Altura (px)"
              value={parseInt(seccion.estilo.promoBarHeight || '35') || 35}
              onChange={(v) => actualizarEstilo('promoBarHeight', `${v}px`)}
              min={20}
              max={60}
            />
            <PixelInput
              label="Tamaño Logo (px)"
              value={parseInt(seccion.estilo.promoBarLogoSize || '48') || 48}
              onChange={(v) => actualizarEstilo('promoBarLogoSize', `${v}px`)}
              min={20}
              max={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PixelInput
              label="Tamaño Texto (px)"
              value={parseInt(seccion.estilo.promoBarTextSize || '16') || 16}
              onChange={(v) => actualizarEstilo('promoBarTextSize', `${v}px`)}
              min={10}
              max={24}
            />
            <FontSelect
              label="Fuente Barra"
              value={seccion.estilo.promoBarFontFamily || 'Georgia'}
              onChange={(f) => actualizarEstilo('promoBarFontFamily', f)}
            />
          </div>
        </CardGroup>
      )}

      {/* Productos: Ajustes de Calificación / Stars */}
      {seccion.tipo === 'productos' && (
        <CardGroup title="Calificación de Productos" Icon={Star}>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-400">Icono Calificación</label>
              <Select
                value={seccion.estilo.ratingIcon || 'star'}
                onChange={(v) => actualizarEstilo('ratingIcon', v)}
                options={[
                  { value: 'star', label: 'Estrella ★' },
                  { value: 'shield', label: 'Escudo 🛡' },
                  { value: 'check', label: 'Verificado ✓' },
                  { value: 'heart', label: 'Corazón ♥' },
                ]}
              />
            </div>
            <ColorInput
              label="Color de Calificación"
              value={seccion.estilo.ratingColor || '#ff841f'}
              onChange={(v) => actualizarEstilo('ratingColor', v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex flex-col justify-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={seccion.estilo.useCustomRatingIcons ?? false}
                  onChange={(e) => actualizarEstilo('useCustomRatingIcons', e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-2 text-[10px] font-medium text-gray-500">Usar Iconos Propios</span>
              </label>
            </div>
            <PixelInput
              label="Separación del Título"
              value={seccion.estilo.titleGap ?? 5}
              onChange={(v) => actualizarEstilo('titleGap', v)}
              min={0}
              max={30}
            />
          </div>
        </CardGroup>
      )}

      {/* Pie de Página: Hover de Enlaces */}
      {['pie', 'footer'].includes(seccion.tipo) && (
        <CardGroup title="Estilos de Enlaces Corporativos" Icon={Sparkles}>
          <ColorInput
            label="Color de Hover en Enlaces"
            value={seccion.estilo.linkHoverColor || '#0f4ecf'}
            onChange={(v) => actualizarEstilo('linkHoverColor', v)}
          />
        </CardGroup>
      )}

      <CardGroup title="Tipografia" Icon={CaseSensitive}>
        <FontSelect label="Fuente" value={fuente} onChange={onFuenteChange} />
      </CardGroup>
    </div>
  )
}
