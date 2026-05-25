'use client'

import { use } from 'react'
import { BankAccountForm } from '../BankAccountForm'

interface PageProps {
  readonly params: Promise<{ id: string }>
}

export default function EditBankAccountPage({ params }: PageProps) {
  const resolvedParams = use(params)

  return (
    <div className="w-full space-y-6">
      <BankAccountForm mode="edit" id={resolvedParams.id} />
    </div>
  )
}
