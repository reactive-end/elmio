export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange'
> {
  options: SelectOption[]
  placeholder?: string
  hasError?: boolean
  onChange?: (value: string) => void
}
