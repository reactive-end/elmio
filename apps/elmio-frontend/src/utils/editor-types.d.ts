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
  | 'personalizado'

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
  /** Reproduccion automatica de carrusel */
  carruselAuto: boolean
  /** Velocidad del carrusel en segundos */
  carruselVelocidad: number
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
}

export interface MenuItem {
  id: string
  label: string
  href: string
  icono: string
  submenus: { id: string; label: string; href: string; descripcion: string }[]
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
  secciones: SeccionMarketplace[]
}
