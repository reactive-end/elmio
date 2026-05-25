'use client'

import { AlliedForm } from '../AlliedForm'

interface EditAlliedPageProps {
  params: {
    id: string
  }
}

export default function EditAlliedPage({ params }: EditAlliedPageProps) {
  const allyId = params.id

  return (
    <div className="w-full space-y-6">
      <AlliedForm mode="edit" id={allyId} />
    </div>
  )
}
