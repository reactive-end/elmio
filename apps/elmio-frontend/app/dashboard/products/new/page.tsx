import { ProductForm } from '@/components/organisms/ProductForm/ProductForm'

interface NewProductPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { id } = await searchParams
  const isEdit = Boolean(id)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-body mb-6">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>
      <ProductForm />
    </div>
  )
}
