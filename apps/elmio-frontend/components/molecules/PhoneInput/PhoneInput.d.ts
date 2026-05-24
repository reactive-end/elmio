export interface CountryCode {
  code: string
  dial: string
  flag: string
  name: string
}

export type OperatorPrefix = '412' | '422' | '414' | '424' | '416' | '426'

export interface PhoneInputProps {
  displayValue: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  countryCode: CountryCode
  onCountryCodeChange: (code: CountryCode) => void
  operatorPrefix: OperatorPrefix
  onOperatorPrefixChange: (prefix: OperatorPrefix) => void
  hasError?: boolean
  hideCountrySelector?: boolean
}
