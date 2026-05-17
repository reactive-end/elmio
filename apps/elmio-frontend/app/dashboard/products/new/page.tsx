import { ProductForm } from '@/components/organisms/ProductForm/ProductForm'

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-body mb-6">Nuevo producto</h1>
      <ProductForm />
    </div>
  )
}
