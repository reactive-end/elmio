import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

/** Configuracion de la fuente Geist Sans para usar en toda la aplicacion. */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

/** Metadatos globales de la aplicacion. */
export const metadata: Metadata = {
  title: 'ElMio',
  description: 'Frontend base de ElMio',
}

/**
 * Layout raiz de la aplicacion Next.js.
 * Define el HTML base, la fuente global y el contenedor del cuerpo.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">{children}</body>
    </html>
  )
}
