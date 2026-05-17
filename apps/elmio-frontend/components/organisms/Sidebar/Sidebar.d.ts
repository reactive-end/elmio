export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  openGroups: string[]
  onToggleGroup: (key: string) => void
  isGroupOpen: (key: string) => boolean
  currentPath: string
}
