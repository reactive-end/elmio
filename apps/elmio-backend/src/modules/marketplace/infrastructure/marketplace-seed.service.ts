import { Injectable, OnApplicationBootstrap, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  MARKETPLACE_REPOSITORY_PORT,
  type MarketplaceRepositoryPort,
} from '../domain/ports/marketplace-repository.port';
import type { Marketplace, MarketplaceSection } from '../domain/marketplace';

@Injectable()
export class MarketplaceSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketplaceSeedService.name);

  constructor(
    @Inject(MARKETPLACE_REPOSITORY_PORT)
    private readonly repository: MarketplaceRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedMainMarketplace();
  }

  private async seedMainMarketplace(): Promise<void> {
    const slug = 'elmio';
    try {
      const existing = await this.repository.findBySlug(slug);

      if (!existing) {
        const now = new Date().toISOString();

        const defaultSections: MarketplaceSection[] = [
          // 1. Cabecera (header)
          {
            id: 'sec-cabecera',
            name: 'Cabecera',
            type: 'header',
            visible: true,
            order: 0,
            content: {
              title: 'ElMio Marketplace',
              subtitle: '',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: 'https://storage.googleapis.com/elmio-img/marketplace/Logo_Oscuro.svg',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [
                {
                  id: 'm1',
                  label: 'Home',
                  icon: 'grid',
                  submenus: [
                    { id: 'sub1', label: '¿Qué es ElMio?', href: '#', description: 'Visión y Misión' },
                    { id: 'sub2', label: 'Nuestras Soluciones', href: '#', description: 'Facilitan la vida de Empresas y Empleados' },
                    { id: 'sub3', label: 'Nuestros Clientes', href: '#', description: 'Empresas, Empleados y Personas Independientes' },
                  ],
                },
                {
                  id: 'm2',
                  label: 'Detrás de Elmio',
                  icon: 'building',
                  submenus: [
                    { id: 'sub4', label: 'Aliados', href: '#', description: 'Nuestros socios comerciales' },
                    { id: 'sub5', label: 'Proveedores', href: '#', description: 'Catálogo de proveedores' },
                    { id: 'sub6', label: 'Nueva Empresa', href: '#', description: 'Registra tu empresa' },
                  ],
                },
                {
                  id: 'm3',
                  label: 'Únete',
                  icon: 'users',
                  submenus: [
                    { id: 'sub7', label: 'Directorio', href: '#', description: 'Lista de empleados' },
                    { id: 'sub8', label: 'Beneficios', href: '#', description: 'Ventajas y descuentos' },
                    { id: 'sub9', label: 'Capacitación', href: '#', description: 'Programas de formación' },
                  ],
                },
              ] as any,
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: '',
              identifyButtonText: 'Iniciar Sesión',
              cartButtonText: 'Mi Carrito',
              categories: ['Tecnología', 'Hogar', 'Moda', 'Ofertas', 'Más vendidos'],
            } as any,
            style: {
              ...this.getDefaultStyle('header'),
              navBackgroundColor: '#ffffff',
              navTextColor: '#001b36',
              navHoverTextColor: '#0f4ecf',
              navLinkFontSize: '14px',
              navPadding: '0.25rem 1rem',
              menuWidth: '256px',
              menuPadding: '0.5rem',
              submenuTextColor: '#0F172A',
              submenuHoverTextColor: '#1D4ED8',
              topBarLayout: 'default',
              topBarJustify: 'space-between',
              topBarAlign: 'center',
              topBarPadding: '0.75rem 1rem',
              searchBarColor: 'rgba(0,0,0,0.05)',
              searchBarTextColor: '#001b36',
              searchBarIconColor: '#001b36',
              searchBarBorderColor: '#e5e7eb',
              searchBarButtonColor: '#001b36',
              searchBarPlaceholderColor: '#64748B',
            } as any,
          },
          // 2. Portada (hero)
          {
            id: 'sec-principal',
            name: 'Principal',
            type: 'hero',
            visible: true,
            order: 1,
            content: {
              title: 'ELMIO te resuelve',
              subtitle: 'Plataforma Worker Tech',
              description: 'Préstamos rápidos, seguros y beneficios corporativos integrados en un solo lugar.',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [
                {
                  id: 'slide1',
                  image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
                  title: 'Beneficios Financieros Instantáneos',
                  subtitle: 'Adelanto de nómina en minutos',
                  text: 'Accede a tus recursos acumulados sin esperar al final de mes de forma segura.',
                  buttonText: 'Explorar Planes',
                  buttonLink: '#products',
                },
                {
                  id: 'slide2',
                  image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
                  title: 'Respaldo de Seguros Integrado',
                  subtitle: 'Mercantil Seguros te acompaña',
                  text: 'Planes de salud, vida y previsión a tu disposición con facilidades corporativas.',
                  buttonText: 'Ver Seguros',
                  buttonLink: '#seguros',
                },
              ],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: true,
              autoplaySpeed: 5000,
              htmlId: 'hero',
              promoBarText: 'ELMIO te resuelve - ConDiFlex Corporativo',
              promoBarUrl: 'https://somosrpc.com/',
              promoBarLogo: 'https://storage.googleapis.com/elmio-img/marketplace/Logo_Oscuro.svg',
            } as any,
            style: {
              ...this.getDefaultStyle('hero'),
              backgroundColor: '#FFFFFF',
              textColor: '#0F172A',
              promoBarBackgroundColor: '#001b36',
              promoBarTextColor: '#ffffff',
              promoBarHeight: '35px',
              promoBarTextSize: '14px',
              promoBarFontFamily: 'Inter',
            } as any,
          },
          // 3. Banner Informativo (banner)
          {
            id: 'sec-banner-confianza',
            name: 'Tu Plataforma de Confianza',
            type: 'banner',
            visible: true,
            order: 2,
            content: {
              title: 'Tu Plataforma de Confianza',
              subtitle: '',
              description: 'Somos la Plataforma Worker Tech líder en Venezuela, ofreciendo herramientas que potencian la estabilidad financiera y el bienestar laboral de los Empleados.',
              buttonText: 'Conocer más',
              buttonLink: '#pillars',
              imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'confianza',
            } as any,
            style: {
              ...this.getDefaultStyle('banner'),
              backgroundColor: '#ffffff',
              textColor: '#2d2d2d',
              titleSize: 36,
            } as any,
          },
          // 4. Productos (products)
          {
            id: 'sec-productos-destacados',
            name: 'Nuestros Productos',
            type: 'products',
            visible: true,
            order: 3,
            content: {
              title: 'Nuestros Productos',
              subtitle: 'Descubre los planes corporativos activos para ti.',
              description: 'Fáciles de solicitar, rápidos en aprobación y directo a tu cuenta de nómina.',
              buttonText: 'Ver Todos',
              buttonLink: '#',
              imageUrl: '',
              productIds: [], // Se autocompleta con los del backend
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: true,
              autoplaySpeed: 3000,
              htmlId: 'products',
              autoPoblarProductos: true,
            } as any,
            style: {
              ...this.getDefaultStyle('products'),
              backgroundColor: '#ffffff',
              titleColor: '#001b36',
              ratingIcon: 'star',
              ratingColor: '#ff841f',
              useCustomRatingIcons: false,
              titleGap: 5,
            } as any,
          },
          // 5. Seguros Mercantil (products con IDs específicos)
          {
            id: 'sec-productos-seguros',
            name: 'Mercantil Seguros',
            type: 'products',
            visible: true,
            order: 4,
            content: {
              title: 'Mercantil Seguros',
              subtitle: 'Protección integral corporativa',
              description: 'Adquiere tu póliza de salud y accidentes personales con financiamiento preferencial.',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [
                '32a02f85-0381-403d-8dc5-3fc6b7cec71e',
                'aa83951e-4843-4bf9-9060-09e09a31f363'
              ],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: true,
              autoplaySpeed: 4000,
              htmlId: 'seguros',
              autoPoblarProductos: false,
            } as any,
            style: {
              ...this.getDefaultStyle('products'),
              backgroundColor: '#f8fafc',
              titleColor: '#1d2734',
              ratingIcon: 'shield',
              ratingColor: '#4680f6',
              useCustomRatingIcons: true,
              titleGap: 8,
            } as any,
          },
          // 6. Banners dobles (double-banner)
          {
            id: 'sec-banners-dobles',
            name: 'Banners Informativos',
            type: 'dual-banner',
            visible: true,
            order: 5,
            content: {
              title: '',
              subtitle: '',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [
                {
                  id: 'db1',
                  title: 'Para Empresas',
                  description: 'Mejora la estabilidad laboral de tu nómina sin costos administrativos adicionales.',
                  icon: '',
                  imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
                  linkUrl: '#',
                  buttonText: 'Registrar Empresa',
                  buttonLink: '#',
                },
                {
                  id: 'db2',
                  title: 'Para Empleados',
                  description: 'Solicita adelantos o financiamientos de forma directa en nuestra app web.',
                  icon: '',
                  imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600&auto=format&fit=crop',
                  linkUrl: '#',
                  buttonText: 'Saber Más',
                  buttonLink: '#',
                },
              ] as any,
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'banners',
            } as any,
            style: {
              ...this.getDefaultStyle('dual-banner'),
              backgroundColor: '#ffffff',
              paddingTop: 48,
              paddingBottom: 48,
            } as any,
          },
          // 7. Pilares Corporativos (pillars)
          {
            id: 'sec-pillars-valores',
            name: 'Nuestros Valores',
            type: 'pillars',
            visible: true,
            order: 6,
            content: {
              title: 'Nuestros Valores',
              subtitle: 'La esencia de lo que nos mueve día a día.',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'pillars',
              pillars: [
                {
                  id: 'pilar1',
                  icon: 'Award',
                  title: 'Detrás de ElMio',
                  text: 'El equipo de ElMio nació con una misión clara: brindar acceso a soluciones financieras flexibles que mejoren la calidad de vida de trabajadores y empresas de forma innovadora.',
                  buttonText: '',
                  buttonLink: '',
                },
                {
                  id: 'pilar2',
                  icon: 'Eye',
                  title: 'Visión',
                  text: 'Facilitamos a empresas, colaboradores y trabajadores independientes el acceso a condiciones diferenciadoras flexibles laborales (ConDiFlex). Queremos transformar el trabajo en una experiencia más justa.',
                  buttonText: '',
                  buttonLink: '',
                },
                {
                  id: 'pilar3',
                  icon: 'TrendingUp',
                  title: 'Misión',
                  text: 'Ser la plataforma líder en Worker Tech en Latinoamérica, integrando herramientas que potencien la estabilidad financiera y el bienestar corporativo de toda la fuerza laboral.',
                  buttonText: '',
                  buttonLink: '',
                },
              ] as any,
            } as any,
            style: {
              ...this.getDefaultStyle('pillars'),
              backgroundColor: '#010131',
              textColor: '#ffffff',
              pillarCardBgColor: '#ffffff',
              pillarTitleColor: '#000000',
              pillarTextColor: '#334155',
            } as any,
          },
          // 8. InfoText enriquecido (text)
          {
            id: 'sec-acerca-de',
            name: 'Acerca de ElMio',
            type: 'text',
            visible: true,
            order: 7,
            content: {
              title: 'Líderes en Tecnología y Finanzas',
              subtitle: 'Transformando la experiencia laboral',
              description: 'Nuestra plataforma une la seguridad bancaria de última generación con la agilidad digital requerida por el mercado moderno.',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '<h3>Por qué confiar en nosotros</h3><p>Ofrecemos integraciones automáticas con sistemas bancarios locales para asegurar transacciones en tiempo real. Adicionalmente, nuestro equipo está disponible 24/7 para garantizar un flujo continuo y un soporte impecable en tus operaciones.</p>',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'about',
            } as any,
            style: {
              ...this.getDefaultStyle('text'),
              backgroundColor: '#f8fafc',
            } as any,
          },
          // 9. Segundo Doble Banner (double-banner)
          {
            id: 'sec-dual-banner-soporte',
            name: 'Contacto y Soporte',
            type: 'dual-banner',
            visible: true,
            order: 8,
            content: {
              title: '',
              subtitle: '',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [
                {
                  id: 'db3',
                  title: 'Contacto Directo',
                  description: '¿Tienes dudas sobre la plataforma? Escríbenos directamente a través de WhatsApp.',
                  icon: '',
                  imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop',
                  linkUrl: '#',
                  buttonText: 'Iniciar Chat',
                  buttonLink: '#',
                },
                {
                  id: 'db4',
                  title: 'Seguridad en Datos',
                  description: 'Tus transacciones están seguras con nosotros. Conoce nuestro protocolo de privacidad.',
                  icon: '',
                  imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=600&auto=format&fit=crop',
                  linkUrl: '#',
                  buttonText: 'Ver Protocolo',
                  buttonLink: '#',
                },
              ] as any,
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'support',
            } as any,
            style: {
              ...this.getDefaultStyle('dual-banner'),
              backgroundColor: '#ffffff',
              paddingTop: 30,
              paddingBottom: 30,
            } as any,
          },
          // 10. Aliados (partners)
          {
            id: 'sec-aliados-logos',
            name: 'Nuestros Aliados',
            type: 'partners',
            visible: true,
            order: 9,
            content: {
              title: 'Nuestros Aliados',
              subtitle: 'Las instituciones que respaldan el ecosistema ElMio.',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '',
              copyright: '',
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: true,
              autoplaySpeed: 4000,
              htmlId: 'aliados',
              partners: [
                {
                  id: 'aliado1',
                  name: 'Banco Activo',
                  logo: 'https://storage.googleapis.com/elmio-img/marketplace/partners/activo_banco_universal_3__1_.png',
                  href: 'https://www.bancoactivo.com/',
                },
                {
                  id: 'aliado2',
                  name: 'Mercantil Seguros',
                  logo: 'https://storage.googleapis.com/elmio-img/marketplace/partners/Seguros-Mercantil-v2.png',
                  href: 'https://www.mercantilseguros.com/',
                },
                {
                  id: 'aliado3',
                  name: 'RPC',
                  logo: 'https://storage.googleapis.com/elmio-img/marketplace/partners/rpc-logo-01.png',
                  href: 'https://somosrpc.com/',
                },
              ] as any,
            } as any,
            style: {
              ...this.getDefaultStyle('partners'),
              backgroundColor: '#F8FAFC',
              textColor: '#0F172A',
            } as any,
          },
          // 11. Pie de Página (footer)
          {
            id: 'sec-pie',
            name: 'Pie de Página',
            type: 'footer',
            visible: true,
            order: 10,
            content: {
              title: 'ElMio',
              subtitle: '',
              description: 'Encuentra todos los productos y ofertas en un solo lugar. Tu marketplace de confianza para compras inteligentes.',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              logoUrl: 'https://storage.googleapis.com/elmio-img/marketplace/Logo_Oscuro.svg',
              logoAlt: 'ElMio Marketplace Logo',
              copyright: '© 2026 ElMio. Todos los derechos reservados.',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: '',
              showLogo: true,
              showDescription: true,
              showBottomLinks: true,
              footerColumns: [
                {
                  id: 'col1',
                  title: 'Información',
                  links: [
                    { id: 'l1', text: 'Acuerdo de Privacidad', href: '#' },
                    { id: 'l2', text: 'Condiciones de Uso', href: '#' },
                    { id: 'l3', text: 'Ayuda', href: '#' },
                  ],
                },
                {
                  id: 'col2',
                  title: 'Contacto',
                  links: [
                    { id: 'l4', text: 'Centro de contacto', href: '#' },
                    { id: 'l5', text: 'Ventas', href: '#' },
                    { id: 'l6', text: 'Soporte', href: '#' },
                  ],
                },
              ] as any,
              bottomLinks: [
                { id: 'bl1', label: 'Privacidad', href: '#' },
                { id: 'bl2', label: 'Condiciones', href: '#' },
                { id: 'bl3', label: 'Contacto', href: '#' },
              ],
            } as any,
            style: {
              ...this.getDefaultStyle('footer'),
              backgroundColor: '#001b36',
              textColor: '#E5E7EB',
              linkHoverColor: '#0f4ecf',
            } as any,
          },
        ];

        const mainMarketplace: Marketplace = {
          id: randomUUID(),
          name: 'ElMio Corporate',
          slug: slug,
          description: 'Marketplace principal predeterminado de ElMio',
          active: true,
          owner: 'system',
          logo: 'https://storage.googleapis.com/elmio-img/marketplace/Logo_Oscuro.svg',
          theme: {
            primaryColor: '#0f4ece',
            secondaryColor: '#13ce99',
            font: 'Inter',
          },
          whatsapp: {
            activo: true,
            telefono: '584241511705',
            mensaje: 'Hola, me gustaría obtener más información sobre sus productos.',
            textoTooltip: '¿Necesitas ayuda?',
            colorFlotante: '#25D366',
            posicion: 'derecha',
            delayMostrar: 3,
          },
          carrito: {
            activo: true,
            textoBoton: 'Añadir al carrito',
            colorBadge: '#ef4444',
            permitirInvitados: true,
          },
          sections: defaultSections,
        } as any;

        await this.repository.create(mainMarketplace);
        this.logger.log(`Sembrado exitoso de marketplace principal predeterminado ('${slug}')`);
      }
    } catch (err) {
      this.logger.warn(`No se pudo sembrar el marketplace principal: ${(err as Error).message}`);
    }
  }

  private getDefaultStyle(type: string) {
    const base = {
      paddingTop: 80,
      paddingRight: 24,
      paddingBottom: 80,
      paddingLeft: 24,
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: '#ffffff',
      backgroundGradient: '',
      backgroundImage: '',
      overlayOpacity: 0,
      borderWidth: 0,
      borderColor: '#e5e7eb',
      borderRadius: 0,
      borderStyle: 'solid',
      titleSize: 36,
      titleWeight: 700,
      titleColor: '#111827',
      titleAlignment: 'center',
      subtitleSize: 18,
      subtitleColor: '#6b7280',
      bodySize: 16,
      bodyColor: '#374151',
      bodyAlignment: 'center',
      maxWidth: 1200,
      elementSpacing: 24,
      buttonBackgroundColor: '#0f4ece',
      buttonTextColor: '#ffffff',
      buttonBorderRadius: 12,
      productImageHeight: 200,
      carouselAuto: true,
      carouselSpeed: 5,
    };

    if (type === 'hero') {
      return {
        ...base,
        titleColor: '#111827',
        subtitleColor: '#4b5563',
        paddingTop: 120,
        paddingBottom: 120,
        titleSize: 48,
      };
    }

    if (type === 'features') {
      return { ...base, backgroundColor: '#f9fafb', titleSize: 32, elementSpacing: 32 };
    }

    if (type === 'products') {
      return { ...base, titleSize: 32, elementSpacing: 24, productImageHeight: 220 };
    }

    if (type === 'footer') {
      return {
        ...base,
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        subtitleColor: '#9ca3af',
        bodyColor: '#6b7280',
        paddingTop: 48,
        paddingBottom: 48,
        titleSize: 16,
        titleWeight: 600,
        elementSpacing: 16,
      };
    }

    if (type === 'header') {
      return {
        ...base,
        backgroundColor: '#ffffff',
        paddingTop: 12,
        paddingBottom: 12,
        titleSize: 18,
        titleWeight: 600,
      };
    }

    return base;
  }
}
