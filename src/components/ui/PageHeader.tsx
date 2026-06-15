import type { CSSProperties, ReactNode } from 'react'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  subtitleStyle?: CSSProperties
  children?: ReactNode
}

export default function PageHeader({ title, subtitle, subtitleStyle, children }: Props) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle !== undefined && (
          <p className="page-subtitle" style={subtitleStyle}>{subtitle}</p>
        )}
      </div>
      {children && (
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>{children}</div>
      )}
    </div>
  )
}
