/**
 * Represents a complete marketplace with its sections and theme.
 * Mirrors the frontend MarketplaceData type.
 */
export interface Marketplace {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  owner: string;
  logo: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };
  whatsapp?: {
    activo: boolean;
    telefono: string;
    mensaje: string;
    textoTooltip: string;
    colorFlotante?: string;
    posicion?: 'izquierda' | 'derecha';
    delayMostrar?: number;
  } | null;
  carrito?: {
    activo: boolean;
    textoBoton?: string;
    colorBadge?: string;
    permitirInvitados?: boolean;
  } | null;
  sections: MarketplaceSection[];
}

export interface MarketplaceSection {
  id: string;
  name: string;
  type: SectionType;
  visible: boolean;
  order: number;
  content: SectionContent;
  style: SectionStyle;
}

export type SectionType =
  | 'hero'
  | 'features'
  | 'products'
  | 'partners'
  | 'banner'
  | 'double-banner'
  | 'dual-banner'
  | 'strip'
  | 'pillars'
  | 'text'
  | 'footer'
  | 'header'
  | 'custom';

export interface SectionStyle {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  overlayOpacity: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  borderStyle: string;
  titleSize: number;
  titleWeight: number;
  titleColor: string;
  titleAlignment: string;
  subtitleSize: number;
  subtitleColor: string;
  bodySize: number;
  bodyColor: string;
  bodyAlignment: string;
  maxWidth: number;
  elementSpacing: number;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  productImageHeight: number;
  productCardWidth?: number;
  showShadow?: boolean;
  pilarTitleColor?: string;
  carouselAuto: boolean;
  carouselSpeed: number;
}

export interface SectionContent {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  productIds: string[];
  elements: SectionElement[];
  slides: Slide[];
  footerColumns: FooterColumn[];
  logoUrl: string;
  copyright: string;
  partners: PartnerLogo[];
  pillars: PillarItem[];
  menu: MenuItem[];
  bodyHtml: string;
  autoplay: boolean;
  autoplaySpeed: number;
  htmlId: string;
  imagePosition?: string;
}

interface SectionElement {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  buttonLink: string;
}

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  text: string;
  buttonText: string;
  buttonLink: string;
}

interface FooterColumn {
  id: string;
  title: string;
  links: { id: string; text: string; href: string }[];
}

interface PartnerLogo {
  id: string;
  name: string;
  logo: string;
  href: string;
}

interface PillarItem {
  id: string;
  icon: string;
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
  esPersonalizado?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  submenus: { id: string; label: string; href: string; description: string; icon?: string }[];
}
