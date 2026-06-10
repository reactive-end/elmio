export type TipoSeccion =
  | 'principal'
  | 'caracteristicas'
  | 'productos'
  | 'aliados'
  | 'banner'
  | 'doble-banner'
  | 'franja'
  | 'pilares'
  | 'texto'
  | 'pie'
  | 'cabecera'

export interface EstiloSeccion {
  paddingSuperior: number
  paddingDerecho: number
  paddingInferior: number
  paddingIzquierdo: number
  margenSuperior: number
  margenInferior: number
  colorFondo: string
  gradienteFondo: string
  imagenFondo: string
  opacidadOverlay: number
  anchoBorde: number
  colorBorde: string
  radioBorde: number
  estiloBorde: string
  tituloTamano: number
  tituloPeso: number
  tituloColor: string
  tituloAlineacion: string
  subtituloTamano: number
  subtituloColor: string
  cuerpoTamano: number
  cuerpoColor: string
  cuerpoAlineacion: string
  anchoMaximo: number
  espacioEntreElementos: number
  /** Color del boton */
  botonColorFondo: string
  /** Color del texto del boton */
  botonColorTexto: string
  /** Redondez del boton */
  botonRedondez: number
  /** Altura de imagenes de producto en carrusel */
  altoImagenProducto: number
  /** Ancho de las tarjetas de producto en carrusel */
  tarjetaAncho?: number
  /** Reproduccion automatica de carrusel */
  carruselAuto: boolean
  /** Velocidad del carrusel en segundos */
  carruselVelocidad: number
  /** Layouts opcionales */
  layoutPilares?: 'grid' | 'zigzag'
  proporcionColumnas?: '50/50' | '60/40' | '40/60' | '30/70' | '70/30' | '25/75' | '75/25'
  layoutPrincipal?: 'centro' | 'dividido'
  /** Patrón visual de fondo superpuesto */
  patronFondo?: 'ninguno' | 'puntos' | 'cuadricula' | 'diagonal' | 'malla'
  /** Ancho del borde del botón */
  botonAnchoBorde?: number
  /** Color del borde del botón */
  botonColorBorde?: string
  /** Fondo de las tarjetas/elementos de la sección */
  tarjetaColorFondo?: string
  /** Redondez de las tarjetas/elementos de la sección */
  tarjetaRadioBorde?: number
  /** Grosor del borde de las tarjetas/elementos de la sección */
  tarjetaAnchoBorde?: number
  /** Color del borde de las tarjetas/elementos de la sección */
  tarjetaColorBorde?: string

  // ==========================================
  // ESTILOS EXTENDIDOS (Detalle Quirúrgico)
  // ==========================================
  
  // Cabecera (header)
  navBackgroundColor?: string
  navTextColor?: string
  navHoverTextColor?: string
  navLinkFontSize?: string
  navPadding?: string
  menuWidth?: string
  menuPadding?: string
  submenuTextColor?: string
  submenuHoverTextColor?: string
  topBarLayout?: string
  topBarJustify?: string
  topBarAlign?: string
  topBarPadding?: string
  searchBarColor?: string
  searchBarTextColor?: string
  searchBarIconColor?: string
  searchBarBorderColor?: string
  searchBarButtonColor?: string
  searchBarPlaceholderColor?: string
  fontFamily?: string

  // Portada (hero/principal)
  promoBarBackgroundColor?: string
  promoBarHeight?: string
  promoBarLogoSize?: string
  promoBarTextColor?: string
  promoBarTextSize?: string
  promoBarFontFamily?: string

  // Productos
  ratingIcon?: string
  ratingColor?: string
  useCustomRatingIcons?: boolean
  titleGap?: number

  // Pie de página (footer)
  linkHoverColor?: string

  // Pilares / Características
  pilarTituloColor?: string
  mostrarSombra?: boolean
}

export interface ElementoSeccion {
  id: string
  titulo: string
  descripcion: string
  icono: string
  imagenUrl: string
  enlaceUrl: string
  textoBoton: string
  enlaceBoton: string
}

export interface Diapositiva {
  id: string
  imagen: string
  titulo: string
  subtitulo: string
  texto: string
  textoBoton: string
  enlaceBoton: string
}

export interface ColumnaPie {
  id: string
  titulo: string
  enlaces: { id: string; texto: string; href: string }[]
}

export interface AliadoLogo {
  id: string
  nombre: string
  logo: string
  href: string
}

export interface PilarItem {
  id: string
  icono: string
  titulo: string
  texto: string
  textoBoton: string
  enlaceBoton: string
  esPersonalizado?: boolean
}

export interface MenuItem {
  id: string
  label: string
  href: string
  icono: string
  submenus: { id: string; label: string; href: string; descripcion: string; icono?: string }[]
}

export interface ContenidoSeccion {
  titulo: string
  subtitulo: string
  descripcion: string
  textoBoton: string
  enlaceBoton: string
  imagenUrl: string
  /** IDs de productos referenciados (para carrusel de productos) */
  productosIds: string[]
  /** Poblar los productos automaticamente en base a los ultimos agregados */
  autoPoblarProductos?: boolean
  elementos: ElementoSeccion[]
  diapositivas: Diapositiva[]
  columnasPie: ColumnaPie[]
  /** Logo URL para cabecera y pie */
  logoUrl: string
  /** Copyright para el pie */
  copyright: string
  /** Aliados/logos partners */
  aliados: AliadoLogo[]
  /** Pilares (para seccion de pilares) */
  pilares: PilarItem[]
  /** Menu de navegacion (para cabecera) */
  menu: MenuItem[]
  /** Texto enriquecido (para infoText) */
  cuerpoHtml: string
  /** Configuracion de autoplay para carruseles */
  autoplay: boolean
  /** Velocidad de autoplay en milisegundos */
  autoplayVelocidad: number
  /** Identificador HTML para anclaje */
  htmlId: string
  imagenPosicion?: string

  // ==========================================
  // CONTENIDO EXTENDIDO
  // ==========================================
  
  // Cabecera (header)
  identifyButtonText?: string
  cartButtonText?: string
  categories?: string[]

  // Portada (hero/principal)
  promoBarText?: string
  promoBarUrl?: string
  promoBarLogo?: string
  showPromoBar?: boolean

  // Pie de página (footer)
  logoAlt?: string
  showLogo?: boolean
  showDescription?: boolean
  showBottomLinks?: boolean
  bottomLinks?: { id: string; label: string; href: string }[]
  mostrarBoton?: boolean
}

export interface SeccionMarketplace {
  id: string
  nombre: string
  tipo: TipoSeccion
  visible: boolean
  orden: number
  contenido: ContenidoSeccion
  estilo: EstiloSeccion
}

export interface ConfiguracionWhatsApp {
  activo: boolean
  telefono: string
  mensaje: string
  textoTooltip: string
  colorFlotante?: string
  posicion?: 'izquierda' | 'derecha'
  delayMostrar?: number
}

export interface ConfiguracionCarrito {
  activo: boolean
  textoBoton?: string
  colorBadge?: string
  permitirInvitados?: boolean
}

export interface DatosMarketplace {
  id: string
  nombre: string
  slug: string
  descripcion: string
  activo: boolean
  propietario: string
  logo: string
  tema: {
    colorPrimario: string
    colorSecundario: string
    fuente: string
  }
  whatsapp?: ConfiguracionWhatsApp
  carrito?: ConfiguracionCarrito
  login?: { habilitado: boolean }
  secciones: SeccionMarketplace[]
}

