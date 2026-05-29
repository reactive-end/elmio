'use client'

import { use } from 'react'
import { FinanceUserForm } from '../FinanceUserForm'

interface EditFinanceUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditFinanceUserPage({ params }: EditFinanceUserPageProps) {
  const resolvedParams = use(params)
  const userId = resolvedParams.id

  return (
    <div className="w-full space-y-6">
      <FinanceUserForm mode="edit" id={userId} />
    </div>
  )
}
