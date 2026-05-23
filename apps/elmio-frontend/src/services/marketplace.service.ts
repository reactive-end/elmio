import type { DatosMarketplace, SeccionMarketplace, EstiloSeccion, ContenidoSeccion, ElementoSeccion, Diapositiva, ColumnaPie, AliadoLogo, PilarItem, MenuItem, TipoSeccion } from '@/src/utils/editor-types.d'
import { authService } from './auth.service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface MarketplaceListItem {
  id: string
  nombre: string
  slug: string
  descripcion: string
  activo: boolean
  propietario: string
  logo: string
}

// ── Mapeadores Lingüísticos (Inglés <-> Español) ────────────────────────────────

function mapSectionTypeToFrontend(type: string): TipoSeccion {
  const map: Record<string, TipoSeccion> = {
    header: 'cabecera',
    hero: 'principal',
    features: 'caracteristicas',
    products: 'productos',
    footer: 'pie',
    partners: 'aliados',
    pillars: 'pilares',
    text: 'texto',
    strip: 'franja',
    'dual-banner': 'doble-banner',
  }
  return map[type] ?? (type as TipoSeccion)
}

function mapSectionTypeToBackend(tipo: TipoSeccion): string {
  const map: Record<TipoSeccion, string> = {
    cabecera: 'header',
    principal: 'hero',
    caracteristicas: 'features',
    productos: 'products',
    pie: 'footer',
    aliados: 'partners',
    pilares: 'pillars',
    texto: 'text',
    franja: 'strip',
    'doble-banner': 'dual-banner',
    banner: 'banner',
  }
  return map[tipo] ?? tipo
}

function mapToFrontend(item: any): DatosMarketplace {
  if (!item) throw new Error('Datos de marketplace inválidos.')

  // Mapear tema
  const tema = {
    colorPrimario: item.theme?.primaryColor ?? item.tema?.colorPrimario ?? '#0f4ece',
    colorSecundario: item.theme?.secondaryColor ?? item.tema?.colorSecundario ?? '#13ce99',
    fuente: item.theme?.font ?? item.tema?.fuente ?? 'Inter',
  }

  // Mapear secciones
  const rawSections = item.sections ?? item.secciones ?? []
  const secciones = rawSections.map((s: any): SeccionMarketplace => {
    // Mapear estilo de sección
    const rawEstilo = s.style ?? s.estilo ?? {}
    const estilo: EstiloSeccion = {
      paddingSuperior: rawEstilo.paddingTop ?? rawEstilo.paddingSuperior ?? 80,
      paddingDerecho: rawEstilo.paddingRight ?? rawEstilo.paddingDerecho ?? 24,
      paddingInferior: rawEstilo.paddingBottom ?? rawEstilo.paddingInferior ?? 80,
      paddingIzquierdo: rawEstilo.paddingLeft ?? rawEstilo.paddingIzquierdo ?? 24,
      margenSuperior: rawEstilo.marginTop ?? rawEstilo.margenSuperior ?? 0,
      margenInferior: rawEstilo.marginBottom ?? rawEstilo.margenInferior ?? 0,
      colorFondo: rawEstilo.backgroundColor ?? rawEstilo.colorFondo ?? '#ffffff',
      gradienteFondo: rawEstilo.backgroundGradient ?? rawEstilo.gradienteFondo ?? '',
      imagenFondo: rawEstilo.backgroundImage ?? rawEstilo.imagenFondo ?? '',
      opacidadOverlay: rawEstilo.overlayOpacity ?? rawEstilo.opacidadOverlay ?? 0,
      anchoBorde: rawEstilo.borderWidth ?? rawEstilo.anchoBorde ?? 0,
      colorBorde: rawEstilo.borderColor ?? rawEstilo.colorBorde ?? '#e5e7eb',
      radioBorde: rawEstilo.borderRadius ?? rawEstilo.radioBorde ?? 0,
      estiloBorde: rawEstilo.borderStyle ?? rawEstilo.estiloBorde ?? 'solid',
      tituloTamano: rawEstilo.titleSize ?? rawEstilo.tituloTamano ?? 36,
      tituloPeso: rawEstilo.titleWeight ?? rawEstilo.tituloPeso ?? 700,
      tituloColor: rawEstilo.titleColor ?? rawEstilo.tituloColor ?? '#111827',
      tituloAlineacion: rawEstilo.titleAlignment ?? rawEstilo.tituloAlineacion ?? 'center',
      subtituloTamano: rawEstilo.subtitleSize ?? rawEstilo.subtituloTamano ?? 18,
      subtituloColor: rawEstilo.subtitleColor ?? rawEstilo.subtituloColor ?? '#6b7280',
      cuerpoTamano: rawEstilo.bodySize ?? rawEstilo.cuerpoTamano ?? 16,
      cuerpoColor: rawEstilo.bodyColor ?? rawEstilo.cuerpoColor ?? '#374151',
      cuerpoAlineacion: rawEstilo.bodyAlignment ?? rawEstilo.cuerpoAlineacion ?? 'center',
      anchoMaximo: rawEstilo.maxWidth ?? rawEstilo.anchoMaximo ?? 1200,
      espacioEntreElementos: rawEstilo.elementSpacing ?? rawEstilo.espacioEntreElementos ?? 24,
      botonColorFondo: rawEstilo.buttonBackgroundColor ?? rawEstilo.botonColorFondo ?? '#0f4ece',
      botonColorTexto: rawEstilo.buttonTextColor ?? rawEstilo.botonColorTexto ?? '#ffffff',
      botonRedondez: rawEstilo.buttonBorderRadius ?? rawEstilo.botonRedondez ?? 12,
      altoImagenProducto: rawEstilo.productImageHeight ?? rawEstilo.altoImagenProducto ?? 200,
      carruselAuto: rawEstilo.carouselAuto ?? rawEstilo.carruselAuto ?? true,
      carruselVelocidad: rawEstilo.carouselSpeed ?? rawEstilo.carruselVelocidad ?? 5,
      layoutPilares: rawEstilo.layoutPilares,
      proporcionColumnas: rawEstilo.proporcionColumnas,
      layoutPrincipal: rawEstilo.layoutPrincipal,
      patronFondo: rawEstilo.patronFondo,
      botonAnchoBorde: rawEstilo.botonAnchoBorde,
      botonColorBorde: rawEstilo.botonColorBorde,
      tarjetaColorFondo: rawEstilo.tarjetaColorFondo,
      tarjetaRadioBorde: rawEstilo.tarjetaRadioBorde,
      tarjetaAnchoBorde: rawEstilo.tarjetaAnchoBorde,
      tarjetaColorBorde: rawEstilo.tarjetaColorBorde,
    }

    // Mapear contenido de sección
    const rawContenido = s.content ?? s.contenido ?? {}
    const contenido: ContenidoSeccion = {
      titulo: rawContenido.title ?? rawContenido.titulo ?? '',
      subtitulo: rawContenido.subtitle ?? rawContenido.subtitulo ?? '',
      descripcion: rawContenido.description ?? rawContenido.descripcion ?? '',
      textoBoton: rawContenido.buttonText ?? rawContenido.textoBoton ?? '',
      enlaceBoton: rawContenido.buttonLink ?? rawContenido.enlaceBoton ?? '',
      imagenUrl: rawContenido.imageUrl ?? rawContenido.imagenUrl ?? '',
      productosIds: rawContenido.productIds ?? rawContenido.productosIds ?? [],
      autoPoblarProductos: rawContenido.autoPopulateProducts ?? rawContenido.autoPoblarProductos ?? false,
      logoUrl: rawContenido.logoUrl ?? '',
      copyright: rawContenido.copyright ?? '',
      cuerpoHtml: rawContenido.bodyHtml ?? rawContenido.cuerpoHtml ?? '',
      autoplay: rawContenido.autoplay ?? true,
      autoplayVelocidad: rawContenido.autoplaySpeed ?? rawContenido.autoplayVelocidad ?? 5000,
      htmlId: rawContenido.htmlId ?? '',
      elementos: (rawContenido.elements ?? rawContenido.elementos ?? []).map((el: any): ElementoSeccion => ({
        id: el.id,
        titulo: el.title ?? el.titulo ?? '',
        descripcion: el.description ?? el.descripcion ?? '',
        icono: el.icon ?? el.icono ?? '',
        imagenUrl: el.imageUrl ?? el.imagenUrl ?? '',
        enlaceUrl: el.linkUrl ?? el.enlaceUrl ?? '',
        textoBoton: el.buttonText ?? el.textoBoton ?? '',
        enlaceBoton: el.buttonLink ?? el.enlaceBoton ?? '',
      })),
      diapositivas: (rawContenido.slides ?? rawContenido.diapositivas ?? []).map((slide: any): Diapositiva => ({
        id: slide.id,
        imagen: slide.image ?? slide.imagen ?? '',
        titulo: slide.title ?? slide.titulo ?? '',
        subtitulo: slide.subtitle ?? slide.subtitulo ?? '',
        texto: slide.text ?? slide.texto ?? '',
        textoBoton: slide.buttonText ?? slide.textoBoton ?? '',
        enlaceBoton: slide.buttonLink ?? slide.enlaceBoton ?? '',
      })),
      columnasPie: (rawContenido.footerColumns ?? rawContenido.columnasPie ?? []).map((col: any): ColumnaPie => ({
        id: col.id,
        titulo: col.title ?? col.titulo ?? '',
        enlaces: (col.links ?? col.enlaces ?? []).map((link: any) => ({
          id: link.id,
          texto: link.text ?? link.texto ?? '',
          href: link.href ?? '',
        })),
      })),
      aliados: (rawContenido.partners ?? rawContenido.aliados ?? []).map((partner: any): AliadoLogo => ({
        id: partner.id,
        nombre: partner.name ?? partner.nombre ?? '',
        logo: partner.logo ?? '',
        href: partner.href ?? '',
      })),
      pilares: (rawContenido.pillars ?? rawContenido.pilares ?? []).map((pilar: any): PilarItem => ({
        id: pilar.id,
        icono: pilar.icon ?? pilar.icono ?? '',
        titulo: pilar.title ?? pilar.titulo ?? '',
        texto: pilar.text ?? pilar.texto ?? '',
        textoBoton: pilar.buttonText ?? pilar.textoBoton ?? '',
        enlaceBoton: pilar.buttonLink ?? pilar.enlaceBoton ?? '',
      })),
      menu: (rawContenido.menu ?? []).map((menuItem: any): MenuItem => ({
        id: menuItem.id,
        label: menuItem.label ?? '',
        href: menuItem.href ?? '',
        icono: menuItem.icon ?? menuItem.icono ?? '',
        submenus: (menuItem.submenus ?? []).map((sub: any) => ({
          id: sub.id,
          label: sub.label ?? '',
          href: sub.href ?? '',
          descripcion: sub.descripcion ?? sub.descripcion ?? '',
        })),
      })),
    }

    return {
      id: s.id,
      nombre: s.name ?? s.nombre ?? '',
      tipo: mapSectionTypeToFrontend(s.type ?? s.tipo ?? 'hero'),
      visible: s.visible ?? true,
      orden: s.order ?? s.orden ?? 0,
      estilo,
      contenido,
    }
  })

  return {
    id: item.id,
    nombre: item.name ?? item.nombre ?? '',
    slug: item.slug ?? '',
    descripcion: item.description ?? item.description ?? '',
    activo: typeof item.active === 'boolean' ? item.active : (item.activo ?? false),
    propietario: item.owner ?? item.propietario ?? '',
    logo: item.logo ?? '',
    tema,
    whatsapp: item.whatsapp,
    secciones,
  }
}

function mapToBackend(frontendItem: DatosMarketplace): any {
  if (!frontendItem) return null

  const theme = {
    primaryColor: frontendItem.tema?.colorPrimario ?? '#0f4ece',
    secondaryColor: frontendItem.tema?.colorSecundario ?? '#13ce99',
    font: frontendItem.tema?.fuente ?? 'Inter',
  }

  const sections = (frontendItem.secciones || []).map((s) => {
    const style = {
      paddingTop: s.estilo?.paddingSuperior ?? 80,
      paddingRight: s.estilo?.paddingDerecho ?? 24,
      paddingBottom: s.estilo?.paddingInferior ?? 80,
      paddingLeft: s.estilo?.paddingIzquierdo ?? 24,
      marginTop: s.estilo?.margenSuperior ?? 0,
      marginBottom: s.estilo?.margenInferior ?? 0,
      backgroundColor: s.estilo?.colorFondo ?? '#ffffff',
      backgroundGradient: s.estilo?.gradienteFondo ?? '',
      backgroundImage: s.estilo?.imagenFondo ?? '',
      overlayOpacity: s.estilo?.opacidadOverlay ?? 0,
      borderWidth: s.estilo?.anchoBorde ?? 0,
      borderColor: s.estilo?.colorBorde ?? '#e5e7eb',
      borderRadius: s.estilo?.radioBorde ?? 0,
      borderStyle: s.estilo?.estiloBorde ?? 'solid',
      titleSize: s.estilo?.tituloTamano ?? 36,
      titleWeight: s.estilo?.tituloPeso ?? 700,
      titleColor: s.estilo?.tituloColor ?? '#111827',
      titleAlignment: s.estilo?.tituloAlineacion ?? 'center',
      subtitleSize: s.estilo?.subtituloTamano ?? 18,
      subtitleColor: s.estilo?.subtituloColor ?? '#6b7280',
      bodySize: s.estilo?.cuerpoTamano ?? 16,
      bodyColor: s.estilo?.cuerpoColor ?? '#374151',
      bodyAlignment: s.estilo?.cuerpoAlineacion ?? 'center',
      maxWidth: s.estilo?.anchoMaximo ?? 1200,
      elementSpacing: s.estilo?.espacioEntreElementos ?? 24,
      buttonBackgroundColor: s.estilo?.botonColorFondo ?? '#0f4ece',
      buttonTextColor: s.estilo?.botonColorTexto ?? '#ffffff',
      buttonBorderRadius: s.estilo?.botonRedondez ?? 12,
      productImageHeight: s.estilo?.altoImagenProducto ?? 200,
      carouselAuto: s.estilo?.carruselAuto ?? true,
      carouselSpeed: s.estilo?.carruselVelocidad ?? 5,
      layoutPilares: s.estilo?.layoutPilares,
      proporcionColumnas: s.estilo?.proporcionColumnas,
      layoutPrincipal: s.estilo?.layoutPrincipal,
      patronFondo: s.estilo?.patronFondo,
      botonAnchoBorde: s.estilo?.botonAnchoBorde,
      botonColorBorde: s.estilo?.botonColorBorde,
      tarjetaColorFondo: s.estilo?.tarjetaColorFondo,
      tarjetaRadioBorde: s.estilo?.tarjetaRadioBorde,
      tarjetaAnchoBorde: s.estilo?.tarjetaAnchoBorde,
      tarjetaColorBorde: s.estilo?.tarjetaColorBorde,
    }

    const content = {
      title: s.contenido?.titulo ?? '',
      subtitle: s.contenido?.subtitulo ?? '',
      description: s.contenido?.descripcion ?? '',
      buttonText: s.contenido?.textoBoton ?? '',
      buttonLink: s.contenido?.enlaceBoton ?? '',
      imageUrl: s.contenido?.imagenUrl ?? '',
      productIds: s.contenido?.productosIds ?? [],
      autoPopulateProducts: s.contenido?.autoPoblarProductos ?? false,
      logoUrl: s.contenido?.logoUrl ?? '',
      copyright: s.contenido?.copyright ?? '',
      bodyHtml: s.contenido?.cuerpoHtml ?? '',
      autoplay: s.contenido?.autoplay ?? true,
      autoplaySpeed: s.contenido?.autoplayVelocidad ?? 5000,
      htmlId: s.contenido?.htmlId ?? '',
      elements: (s.contenido?.elementos || []).map((el) => ({
        id: el.id,
        title: el.titulo,
        description: el.descripcion,
        icon: el.icono,
        imageUrl: el.imagenUrl,
        linkUrl: el.enlaceUrl,
        buttonText: el.textoBoton,
        buttonLink: el.enlaceBoton,
      })),
      slides: (s.contenido?.diapositivas || []).map((slide) => ({
        id: slide.id,
        image: slide.imagen,
        title: slide.titulo,
        subtitle: slide.subtitulo,
        text: slide.texto,
        buttonText: slide.textoBoton,
        buttonLink: slide.enlaceBoton,
      })),
      footerColumns: (s.contenido?.columnasPie || []).map((col) => ({
        id: col.id,
        title: col.titulo,
        links: (col.enlaces || []).map((link) => ({
          id: link.id,
          text: link.texto,
          href: link.href,
        })),
      })),
      partners: (s.contenido?.aliados || []).map((partner) => ({
        id: partner.id,
        name: partner.nombre,
        logo: partner.logo,
        href: partner.href,
      })),
      pillars: (s.contenido?.pilares || []).map((pilar) => ({
        id: pilar.id,
        icon: pilar.icono,
        title: pilar.titulo,
        text: pilar.texto,
        buttonText: pilar.textoBoton,
        buttonLink: pilar.enlaceBoton,
      })),
      menu: (s.contenido?.menu || []).map((menuItem) => ({
        id: menuItem.id,
        label: menuItem.label,
        href: menuItem.href,
        icon: menuItem.icono,
        submenus: (menuItem.submenus || []).map((sub) => ({
          id: sub.id,
          label: sub.label,
          href: sub.href,
          description: sub.descripcion,
        })),
      })),
    }

    return {
      id: s.id,
      name: s.nombre,
      type: mapSectionTypeToBackend(s.tipo),
      visible: s.visible,
      order: s.orden,
      style,
      content,
    }
  })

  return {
    id: frontendItem.id,
    name: frontendItem.nombre,
    slug: frontendItem.slug,
    description: frontendItem.descripcion,
    active: frontendItem.activo,
    owner: frontendItem.propietario,
    logo: frontendItem.logo,
    theme,
    whatsapp: frontendItem.whatsapp,
    sections,
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Servicio de comunicacion con el backend de marketplaces.
 * Encapsula todas las llamadas HTTP al modulo marketplace del backend NestJS.
 */
export const marketplaceService = {
  /**
   * Lista todos los marketplaces disponibles.
   * GET /api/marketplaces
   * @returns Lista de marketplaces.
   */
  async list(): Promise<MarketplaceListItem[]> {
    const response = await fetch(`${API_BASE}/marketplaces`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al listar marketplaces: ${response.statusText}`)
    }

    const rawList = (await response.json()) as any[]
    return rawList.map((item) => ({
      id: item.id,
      nombre: item.name ?? item.nombre ?? '',
      slug: item.slug ?? '',
      descripcion: item.description ?? item.descripcion ?? '',
      activo: typeof item.active === 'boolean' ? item.active : (item.activo ?? false),
      propietario: item.owner ?? item.propietario ?? '',
      logo: item.logo ?? '',
    }))
  },

  /**
   * Obtiene la configuracion completa de un marketplace por su slug.
   * GET /api/marketplaces/slug/:slug
   * @param slug Slug del marketplace.
   * @returns Configuracion completa del marketplace para renderizado publico.
   */
  async getBySlug(slug: string): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces/slug/${encodeURIComponent(slug)}`)

    if (!response.ok) {
      throw new Error(`Marketplace "${slug}" no encontrado.`)
    }

    const backendItem = await response.json()
    return mapToFrontend(backendItem)
  },

  /**
   * Obtiene la configuracion completa de un marketplace por su ID.
   * GET /api/marketplaces/:id
   * @param id Identificador del marketplace.
   * @returns Configuracion completa del marketplace para el editor.
   */
  async getById(id: string): Promise<DatosMarketplace> {
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Marketplace "${id}" no encontrado.`)
    }

    const backendItem = await response.json()
    return mapToFrontend(backendItem)
  },

  /**
   * Crea un nuevo marketplace con datos basicos.
   * POST /api/marketplaces
   * @param data Datos basicos del nuevo marketplace.
   * @returns Marketplace creado.
   */
  async create(data: {
    nombre: string
    slug: string
    descripcion?: string
    propietario?: string
    logo?: string
  }): Promise<DatosMarketplace> {
    const backendData = {
      name: data.nombre,
      slug: data.slug,
      description: data.descripcion ?? '',
      owner: data.propietario ?? '',
      logo: data.logo ?? '',
    }
    const response = await fetch(`${API_BASE}/marketplaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
      body: JSON.stringify(backendData),
    })

    if (!response.ok) {
      throw new Error(`Error al crear marketplace: ${response.statusText}`)
    }

    const backendItem = await response.json()
    return mapToFrontend(backendItem)
  },

  /**
   * Actualiza la configuracion completa de un marketplace.
   * PUT /api/marketplaces/:id
   * @param id Identificador del marketplace.
   * @param data Configuracion completa actualizada desde el editor.
   * @returns Marketplace actualizado.
   */
  async update(id: string, data: DatosMarketplace): Promise<DatosMarketplace> {
    const backendData = mapToBackend(data)
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
      body: JSON.stringify(backendData),
    })

    if (!response.ok) {
      throw new Error(`Error al guardar marketplace: ${response.statusText}`)
    }

    const backendItem = await response.json()
    return mapToFrontend(backendItem)
  },

  /**
   * Elimina un marketplace.
   * DELETE /api/marketplaces/:id
   * @param id Identificador del marketplace.
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/marketplaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authService.getAuthHeaders() },
    })

    if (!response.ok) {
      throw new Error(`Error al eliminar marketplace: ${response.statusText}`)
    }
  },
}
