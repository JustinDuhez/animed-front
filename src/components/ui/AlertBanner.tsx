import type { CSSProperties, ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  icon?: string
  action?: ReactNode
  style?: CSSProperties
}

export default function AlertBanner({ title, description, icon = '✕', action, style }: Props) {
  return (
    <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)', ...style }}>
      <span className="alert-icon">{icon}</span>
      <div className="alert-body">
        <div className="alert-title">{title}</div>
        {description && <div className="alert-text">{description}</div>}
      </div>
      {action}
    </div>
  )
}
