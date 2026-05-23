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
          {
            id: 'sec-cabecera',
            name: 'Cabecera',
            type: 'header',
            visible: true,
            order: 0,
            content: {
              title: 'ElMio',
              subtitle: '',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [],
              logoUrl: '/logo.svg',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [
                { id: 'm1', label: 'Inicio', href: '#hero', icon: 'Home', submenus: [] },
                { id: 'm2', label: 'Beneficios', href: '#features', icon: 'Star', submenus: [] },
                { id: 'm3', label: 'Productos', href: '#products', icon: 'ShoppingBag', submenus: [] },
              ],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: '',
            },
            style: this.getDefaultStyle('header'),
          },
          {
            id: 'sec-principal',
            name: 'Principal',
            type: 'hero',
            visible: true,
            order: 1,
            content: {
              title: 'Tu futuro financiero, hoy.',
              subtitle: 'Gestiona tus beneficios de forma segura, rápida y transparente.',
              description: 'Accede a la red multi-aliado más confiable para maximizar tus recursos financieros.',
              buttonText: 'Explorar productos',
              buttonLink: '#products',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [
                {
                  id: 'slide1',
                  image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
                  title: 'Beneficios instantáneos',
                  subtitle: 'Solicitudes en minutos',
                  text: 'Haz tu solicitud de adelanto de salario o préstamo corporativo sin papeleos molestos.',
                  buttonText: 'Explorar',
                  buttonLink: '#products',
                }
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
            },
            style: this.getDefaultStyle('hero'),
          },
          {
            id: 'sec-caracteristicas',
            name: '¿Por qué elegir ElMio?',
            type: 'features',
            visible: true,
            order: 2,
            content: {
              title: '¿Por qué elegir ElMio?',
              subtitle: 'Todo lo que necesitas en un solo lugar.',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              diapositivas: [] as any,
              columnasPie: [] as any,
              logoUrl: '',
              copyright: '',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'features',
              elements: [
                {
                  id: 'c1',
                  title: 'Seguridad bancaria',
                  description: 'Tus datos están protegidos con los más altos estándares de cifrado.',
                  icon: 'Shield',
                  imageUrl: '',
                  linkUrl: '',
                  buttonText: '',
                  buttonLink: '',
                },
                {
                  id: 'c2',
                  title: 'Aprobación rápida',
                  description: 'Recibe respuesta a tus solicitudes en minutos.',
                  icon: 'Zap',
                  imageUrl: '',
                  linkUrl: '',
                  buttonText: '',
                  buttonLink: '',
                },
                {
                  id: 'c3',
                  title: 'Monitoreo 24/7',
                  description: 'Revisa el estado de tus transacciones en tiempo real desde cualquier lugar.',
                  icon: 'Clock',
                  imageUrl: '',
                  linkUrl: '',
                  buttonText: '',
                  buttonLink: '',
                },
              ] as any,
            } as any,
            style: this.getDefaultStyle('features'),
          },
          {
            id: 'sec-productos',
            name: 'Productos destacados',
            type: 'products',
            visible: true,
            order: 3,
            content: {
              title: 'Productos destacados',
              subtitle: 'Descubre los planes corporativos activos para ti.',
              description: '',
              buttonText: 'Ver todos',
              buttonLink: '#products',
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
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: 'products',
            },
            style: this.getDefaultStyle('products'),
          },
          {
            id: 'sec-pie',
            name: 'Pie de página',
            type: 'footer',
            visible: true,
            order: 4,
            content: {
              title: 'ElMio',
              subtitle: 'Plataforma líder de beneficios y servicios financieros.',
              description: '',
              buttonText: '',
              buttonLink: '',
              imageUrl: '',
              productIds: [],
              elements: [],
              slides: [],
              footerColumns: [
                {
                  id: 'col1',
                  title: 'Empresa',
                  links: [
                    { id: 'l1', text: 'Sobre nosotros', href: '#' },
                    { id: 'l2', text: 'Contacto', href: '#' },
                  ],
                },
                {
                  id: 'col2',
                  title: 'Legal',
                  links: [
                    { id: 'l3', text: 'Términos de servicio', href: '#' },
                    { id: 'l4', text: 'Políticas de privacidad', href: '#' },
                  ],
                },
              ],
              logoUrl: '/logo.svg',
              copyright: '2026 ElMio. Todos los derechos reservados.',
              partners: [],
              pillars: [],
              menu: [],
              bodyHtml: '',
              autoplay: false,
              autoplaySpeed: 5000,
              htmlId: '',
            },
            style: this.getDefaultStyle('footer'),
          },
        ];

        const mainMarketplace: Marketplace = {
          id: randomUUID(),
          name: 'ElMio Corporate',
          slug: slug,
          description: 'Marketplace principal predeterminado de ElMio',
          active: true,
          owner: 'system',
          logo: '/logo.svg',
          theme: {
            primaryColor: '#0f4ece',
            secondaryColor: '#13ce99',
            font: 'Inter',
          },
          sections: defaultSections,
        };

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
        backgroundGradient: 'linear-gradient(135deg, oklch(0.5 0.27 264.01) 0%, oklch(0.35 0.22 220) 100%)',
        titleColor: '#ffffff',
        subtitleColor: 'rgba(255,255,255,0.7)',
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
