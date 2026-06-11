import type { CSSProperties, ReactNode } from 'react'

interface Props {
  icon: string
  title: string
  description?: string
  action?: ReactNode
  style?: CSSProperties
}

export default function EmptyState({ icon, title, description, action, style }: Props) {
  return (
    <div className="empty-state" style={style}>
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-text">{description}</div>}
      {action}
    </div>
  )
}
