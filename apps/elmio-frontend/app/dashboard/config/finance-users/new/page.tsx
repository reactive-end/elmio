'use client'

import { FinanceUserForm } from '../FinanceUserForm'

export default function NewFinanceUserPage() {
  return (
    <div className="w-full space-y-6">
      <FinanceUserForm mode="create" />
    </div>
  )
}
