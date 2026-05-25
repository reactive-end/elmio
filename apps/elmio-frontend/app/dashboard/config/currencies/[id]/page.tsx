'use client'

import { use } from 'react'
import CurrencyForm from '../CurrencyForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditCurrencyPage({ params }: PageProps) {
  const resolvedParams = use(params)
  return <CurrencyForm mode="edit" id={resolvedParams.id} />
}
