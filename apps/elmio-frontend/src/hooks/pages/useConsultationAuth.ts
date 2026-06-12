/**
 * @fileoverview Hook de autenticación para ventanas de consulta de seguros.
 * @description
 * Orquesta el gate de identidad en dos fases para las 3 ventanas de consulta
 * (mercantil/consulta, mercantil/consulta-rcv, mundial/consulta-rcv):
 *
 *   Fase 1 — Login modal: si no hay sesión, abre el `LoginModal` global del
 *   `MarketplaceActionProvider` (reutilizando el existente, no se crea uno
 *   nuevo). El `LoginForm` ya gestiona internamente la selección de perfil
 *   cuando el usuario tiene varios.
 *
 *   Fase 2 — Validación de identidad: una vez con sesión activa, evalúa el rol:
 *     - `EMPLOYEE` → redirige al shop con highlight al producto y aborta la consulta.
 *     - `CLIENT`   → autoriza y continúa la consulta.
 *     - `ADMIN|COMPANY|FINANCE|ALLIED` → llama `discoverProfiles(session.email)`:
 *         * Si hay perfiles compatibles → muestra `ProfileSelectorModal` para cambiar.
 *         * Si no hay ninguno → muestra `BlockedAccessModal`.
 *     - `CLIENT + EMPLOYEE` (multi-perfil) → muestra `ProfileSelectorModal` para elegir.
 *
 * @module hooks/pages/useConsultationAuth
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/src/services/auth.service'
import { useMarketplaceAction } from '@/src/providers/MarketplaceActionProvider'

/** Roles que puede tener un usuario segun el backend. Espejo de auth.service. */
export type UserRole = 'ADMIN' | 'COMPANY' | 'EMPLOYEE' | 'CLIENT' | 'ALLIED' | 'FINANCE'

/** Roles compatibles para comprar seguros en línea. */
export type CompatibleRole = 'CLIENT' | 'EMPLOYEE'

/** Roles que deben ser redirigidos al shop de la empresa para gestionar la compra. */
export type CompanyShoppingRole = 'COMPANY'

/** Roles que NO pueden comprar seguros en línea (ni siquiera redirigidos). */
const INCOMPATIBLE_ROLES: ReadonlyArray<UserRole> = ['ADMIN', 'FINANCE', 'ALLIED']

/** Resumen de un perfil de usuario (compatible o no). */
export interface ProfileSummary {
  userId: string
  name: string
  role: UserRole
}

/** Contexto del producto que se está intentando comprar. */
export interface ConsultationContext {
  productId?: string
  productSku?: string
  marketplaceId?: string
  marketplaceName?: string
  /**
   * Ruta base del shop destino cuando el rol es redirigido (EMPLOYEE o
   * COMPANY). Lo completa el hook segun el rol; las pages no lo setean.
   * Default: `/dashboard/collaborator/shop`.
   */
  basePath?: string
}

/** Estado de la vista que la page debe renderizar. */
export type ConsultationAuthView =
  | { kind: 'idle' }
  | { kind: 'resolving' }
  | { kind: 'login_modal' }
  | { kind: 'profile_selector'; profiles: ProfileSummary[]; reason: 'multi' | 'role_mismatch' }
  | { kind: 'blocked'; reason: 'incompatible' }
  | { kind: 'resolved'; profile: ProfileSummary }

interface ConsultationAuthOptions {
  /** Indica si la consulta está embebida en un iframe del marketplace. */
  isEmbedded: boolean
  /** Callback cuando el usuario es CLIENT y está listo para continuar la consulta. */
  onResolved: (profile: ProfileSummary) => void
  /** Callback cuando el usuario es EMPLOYEE: debe redirigir al shop con highlight. */
  onEmployeeRedirect: (profile: ProfileSummary, context: ConsultationContext) => void
  /**
   * Callback opcional cuando el usuario es COMPANY: debe redirigir al shop
   * de la empresa (no al del colaborador) para que gestione la compra
   * con cargo a su estado de cuenta. Si no se provee, se reusa
   * `onEmployeeRedirect` apuntando al shop de empresa.
   */
  onCompanyRedirect?: (profile: ProfileSummary, context: ConsultationContext) => void
}

interface ConsultationAuthReturn {
  view: ConsultationAuthView
  /**
   * Llamar al hacer "Continuar" desde el paso de selección de planes.
   * @param returnTo URL a la que el flujo debe regresar tras un login modal.
   * @param context Datos del producto que se intenta comprar.
   * @returns true si el flujo de consulta puede continuar (CLIENT); false en cualquier otro caso.
   */
  guard: (returnTo: string, context: ConsultationContext) => Promise<boolean>
  /** El usuario eligió un perfil desde el `ProfileSelectorModal`. */
  selectProfile: (profile: ProfileSummary) => Promise<void>
  /** Cierra el estado visual (selector / bloqueo) y vuelve a idle. */
  cancel: () => void
  /** Rol compatible actual resuelto (CLIENT o EMPLOYEE), o null si aún no se ha resuelto. */
  currentCompatibleRole: () => CompatibleRole | null
  /** Perfil actualmente resuelto. */
  currentProfile: () => ProfileSummary | null
}

/**
 * Hook reutilizable que gestiona el gate de identidad para las ventanas
 * de consulta de seguros del marketplace.
 *
 * @param options Configuración de callbacks e indicador de embebido.
 * @returns API pública del gate.
 */
export function useConsultationAuth(options: ConsultationAuthOptions): ConsultationAuthReturn {
  const router = useRouter()
  const { openLoginModal } = useMarketplaceAction()
  const [view, setView] = useState<ConsultationAuthView>({ kind: 'idle' })
  const resolvedProfileRef = useRef<ProfileSummary | null>(null)
  const pendingContextRef = useRef<ConsultationContext | null>(null)
  const pendingReturnToRef = useRef<string | null>(null)

  const isCompatibleRole = (role: UserRole): role is CompatibleRole =>
    role === 'CLIENT' || role === 'EMPLOYEE'

  const currentCompatibleRole = (): CompatibleRole | null => {
    const p = resolvedProfileRef.current
    return p && isCompatibleRole(p.role) ? p.role : null
  }

  const currentProfile = (): ProfileSummary | null => resolvedProfileRef.current

  /**
   * Notifica al parent (cuando la consulta está embebida) que debe redirigir
   * al shop con highlight al producto del pilar.
   * @param context Contexto del producto.
   * @param basePath Ruta base del shop destino (colaborador o empresa).
   */
  const notifyEmployeeRedirectEmbedded = (
    context: ConsultationContext,
    basePath: string = '/dashboard/collaborator/shop',
  ) => {
    if (typeof window === 'undefined') return
    const url = buildShopRedirect(context, basePath)
    window.parent.postMessage(
      { source: 'mercantil-consulta', type: 'redirect-external', url },
      window.location.origin,
    )
  }

  /**
   * Aplica la decisión de la fase 2 en función del rol resuelto de la sesión.
   * @param sessionRole Rol de la sesión actual.
   * @param sessionEmail Email de la sesión actual.
   * @param context Contexto del producto.
   * @returns true si la consulta puede continuar.
   */
  const applyRoleDecision = async (
    sessionRole: UserRole,
    sessionEmail: string,
    context: ConsultationContext,
  ): Promise<boolean> => {
    // 1. Sesión EMPLOYEE directa → redirigir al shop del colaborador.
    if (sessionRole === 'EMPLOYEE') {
      const profile: ProfileSummary = {
        userId: authService.getSession()?.userId ?? '',
        name: '',
        role: 'EMPLOYEE',
      }
      resolvedProfileRef.current = profile
      setView({ kind: 'resolved', profile })
      if (options.isEmbedded) {
        notifyEmployeeRedirectEmbedded(context, '/dashboard/collaborator/shop')
      } else {
        options.onEmployeeRedirect(profile, context)
      }
      return false
    }

    // 1b. Sesión COMPANY directa → redirigir al shop de la empresa.
    // Las empresas pueden comprar seguros pero el cargo se registra
    // contra su estado de cuenta, por lo que el flujo correcto es
    // guiarlas al shop de empresa con el producto destacado.
    if (sessionRole === 'COMPANY') {
      const profile: ProfileSummary = {
        userId: authService.getSession()?.userId ?? '',
        name: '',
        role: 'COMPANY',
      }
      resolvedProfileRef.current = profile
      setView({ kind: 'resolved', profile })
      if (options.isEmbedded) {
        notifyEmployeeRedirectEmbedded(context, '/dashboard/enterprise/shop')
      } else if (options.onCompanyRedirect) {
        options.onCompanyRedirect(profile, context)
      } else {
        // Fallback: reutiliza el callback de EMPLOYEE con un context anotado
        // para que la page pueda redirigir al shop de empresa.
        options.onEmployeeRedirect(profile, { ...context, basePath: '/dashboard/enterprise/shop' })
      }
      return false
    }

    // 2. Sesión CLIENT directa → continuar.
    if (sessionRole === 'CLIENT') {
      const profile: ProfileSummary = {
        userId: authService.getSession()?.userId ?? '',
        name: '',
        role: 'CLIENT',
      }
      // Aún así, descubrimos si el mismo correo tiene un perfil EMPLOYEE adicional
      // para mostrar el selector de multi-perfil.
      try {
        const result = await authService.discoverProfiles(sessionEmail)
        const compatible = (result.profiles ?? []).filter((p) => isCompatibleRole(p.role))
        if (compatible.length >= 2) {
          setView({
            kind: 'profile_selector',
            profiles: compatible,
            reason: 'multi',
          })
          return false
        }
      } catch {
        // Si falla discoverProfiles, no bloqueamos; continuamos como CLIENT.
      }
      resolvedProfileRef.current = profile
      setView({ kind: 'resolved', profile })
      options.onResolved(profile)
      return true
    }

    // 3. Sesión incompatible (ADMIN / COMPANY / FINANCE / ALLIED) → buscar perfil compatible.
    if (INCOMPATIBLE_ROLES.includes(sessionRole)) {
      setView({ kind: 'resolving' })
      try {
        const result = await authService.discoverProfiles(sessionEmail)
        const compatible = (result.profiles ?? []).filter((p) => isCompatibleRole(p.role))
        if (compatible.length === 0) {
          setView({ kind: 'blocked', reason: 'incompatible' })
          return false
        }
        setView({
          kind: 'profile_selector',
          profiles: compatible,
          reason: 'role_mismatch',
        })
        return false
      } catch {
        setView({ kind: 'blocked', reason: 'incompatible' })
        return false
      }
    }

    // Rol no contemplado explícitamente: tratar como incompatible.
    setView({ kind: 'blocked', reason: 'incompatible' })
    return false
  }

  const guard = useCallback(
    async (returnTo: string, context: ConsultationContext): Promise<boolean> => {
      pendingContextRef.current = context
      pendingReturnToRef.current = returnTo

      // Si ya hay un login modal abierto o un selector pendiente, no hacer nada.
      if (
        view.kind === 'login_modal' ||
        view.kind === 'profile_selector' ||
        view.kind === 'resolving'
      ) {
        return false
      }

      // FASE 1 — Login modal si no hay sesión.
      const session = authService.getSession()
      if (!session) {
        if (options.isEmbedded) {
          // Preservar comportamiento actual: el provider abre su LoginModal via postMessage.
          if (typeof window !== 'undefined') {
            window.parent.postMessage(
              { source: 'mercantil-consulta-auth-required', type: 'login-required' },
              window.location.origin,
            )
          }
        } else {
          // Flujo no embebido: abrir el LoginModal global programaticamente.
          setView({ kind: 'login_modal' })
          openLoginModal({
            returnTo,
            onSuccess: () => {
              // Reintentar la validación con la sesión ya activa.
              void guard(returnTo, context)
            },
          })
        }
        return false
      }

      // FASE 2 — Validación de identidad con sesión existente.
      return await applyRoleDecision(session.role, session.email, context)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.kind, openLoginModal, options.isEmbedded],
  )

  const selectProfile = useCallback(
    async (profile: ProfileSummary): Promise<void> => {
      const session = authService.getSession()
      if (!session) {
        setView({ kind: 'idle' })
        return
      }
      const context = pendingContextRef.current

      if (profile.role === 'EMPLOYEE') {
        resolvedProfileRef.current = profile
        setView({ kind: 'resolved', profile })
        if (options.isEmbedded && context) {
          notifyEmployeeRedirectEmbedded(context, '/dashboard/collaborator/shop')
        } else if (context) {
          options.onEmployeeRedirect(profile, context)
        }
        return
      }

      if (profile.role === 'COMPANY') {
        resolvedProfileRef.current = profile
        setView({ kind: 'resolved', profile })
        if (options.isEmbedded && context) {
          notifyEmployeeRedirectEmbedded(context, '/dashboard/enterprise/shop')
        } else if (context) {
          if (options.onCompanyRedirect) {
            options.onCompanyRedirect(profile, context)
          } else {
            options.onEmployeeRedirect(profile, {
              ...context,
              basePath: '/dashboard/enterprise/shop',
            })
          }
        }
        return
      }

      // Perfil CLIENT → autorizar y continuar (o reautenticar si el actual
      // no coincide, vía redirección a /login con userId para re-login).
      if (profile.userId && session.userId !== profile.userId) {
        const returnTo =
          pendingReturnToRef.current ?? (typeof window !== 'undefined' ? window.location.href : '/')
        const params = new URLSearchParams({
          redirect: returnTo,
          userId: profile.userId,
          identifier: session.email,
        })
        router.push(`/login?${params.toString()}`)
        return
      }

      resolvedProfileRef.current = profile
      setView({ kind: 'resolved', profile })
      options.onResolved(profile)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.isEmbedded, options.onResolved, options.onEmployeeRedirect],
  )

  const cancel = useCallback(() => {
    setView({ kind: 'idle' })
  }, [])

  return {
    view,
    guard,
    selectProfile,
    cancel,
    currentCompatibleRole,
    currentProfile,
  }
}

// ── Helpers puros exportados ──────────────────────────────────────────────────

/**
 * Construye la URL de retorno codificando los query params actuales y
 * marcando `returnAuth=1` para que la page reanude el flujo al re-montarse.
 * @param pathname Ruta actual de la consulta.
 * @param searchParams Query params actuales.
 * @returns URL completa de retorno.
 */
export function buildReturnTo(pathname: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString())
  params.set('returnAuth', '1')
  return `${pathname}?${params.toString()}`
}

/**
 * Construye la URL del shop destino con el producto destacado.
 * El query param `highlight` (gemelo de `product`) marca explícitamente
 * que el producto debe recibir scroll + ring visual.
 *
 * El `basePath` permite redirigir al shop apropiado segun el rol:
 *  - EMPLOYEE -> `/dashboard/collaborator/shop`
 *  - COMPANY  -> `/dashboard/enterprise/shop`
 *  - sin param -> default al shop del colaborador
 *
 * @param context Contexto del producto.
 * @param basePath Ruta base del shop a redirigir (default: colaborador).
 * @returns URL del shop con query params de highlight.
 */
export function buildShopRedirect(
  context: ConsultationContext,
  basePath: string = '/dashboard/collaborator/shop',
): string {
  const params = new URLSearchParams()
  if (context.productId) {
    params.set('product', context.productId)
    params.set('highlight', context.productId)
  }
  if (context.marketplaceId) {
    params.set('marketplace', context.marketplaceId)
  }
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}
