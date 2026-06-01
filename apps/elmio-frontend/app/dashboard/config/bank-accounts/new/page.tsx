import { notFound } from 'next/navigation'
import { BankAccountForm } from '../BankAccountForm'

export default function NewBankAccountPage() {
  notFound()
  return (
    <div className="w-full space-y-6">
      <BankAccountForm mode="create" />
    </div>
  )
}
