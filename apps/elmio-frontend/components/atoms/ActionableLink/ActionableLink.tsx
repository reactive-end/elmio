'use client'

import React from 'react'
import Link, { LinkProps } from 'next/link'
import { useMarketplaceAction } from '@/src/providers/MarketplaceActionProvider'

interface ActionableLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  href: string
  children: React.ReactNode
}

/**
 * Un componente Link inteligente que intercepta rutas con formato "action:TYPE".
 * Si detecta una accion, previene la navegacion y abre el modal correspondiente en el Provider.
 * De lo contrario, navega normalmente usando next/link.
 */
export function ActionableLink({ href, children, onClick, ...props }: ActionableLinkProps) {
  const { openAction } = useMarketplaceAction()

  const isAction = href?.startsWith('action:')
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAction) {
      e.preventDefault()
      const actionType = href.replace('action:', '').toUpperCase()
      openAction(actionType)
    }
    if (onClick) {
      onClick(e)
    }
  }

  if (isAction) {
    return (
      <a href="#" onClick={handleClick} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}
