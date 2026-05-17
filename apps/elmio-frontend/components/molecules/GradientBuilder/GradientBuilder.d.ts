export interface GradientBuilderProps {
  label: string
  colorInicio: string
  colorFin: string
  direccion: string
  activo: boolean
  onActivoChange: (activo: boolean) => void
  onColorInicioChange: (color: string) => void
  onColorFinChange: (color: string) => void
  onDireccionChange: (direccion: string) => void
}
