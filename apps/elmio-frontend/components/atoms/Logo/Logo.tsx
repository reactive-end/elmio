import Image from 'next/image'
import type { LogoProps } from './Logo.d'

/**
 * Componente atomo que renderiza el logo de ElMio.
 * Usa next/image para optimizacion automatica.
 */
export function Logo({ width = 160, height = 48, className = '' }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="ElMio"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
