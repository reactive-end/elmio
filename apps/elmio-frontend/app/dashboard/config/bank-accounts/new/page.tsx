'use client'

import { BankAccountForm } from '../BankAccountForm'

export default function NewBankAccountPage() {
  return (
    <div className="w-full space-y-6">
      <BankAccountForm mode="create" />
    </div>
  )
}
