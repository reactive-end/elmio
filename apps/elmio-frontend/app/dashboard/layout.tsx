'use client'

import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'

/**
 * Layout del dashboard que aplica el DashboardTemplate a todas las rutas bajo /dashboard.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardTemplate>{children}</DashboardTemplate>
}
