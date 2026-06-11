interface Props {
  icon: string
  iconColor: string
  value: string
  label: string
  sub: string
  trend?: string
  trendLabel?: string
  sparks?: number[] | null
  sparkColor?: string
}

export default function KpiCard({ icon, iconColor, value, label, sub, trend, trendLabel, sparks, sparkColor }: Props) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <div className={`kpi-icon ${iconColor}`}>{icon}</div>
        {trendLabel && <span className={`kpi-trend ${trend}`}>{trendLabel}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
      {sparks && sparks.length > 0 && (
        <div className="kpi-spark">
          {sparks.map((h, i) => (
            <div
              key={i}
              className={`spark-bar${i === sparks.length - 1 ? ' active' : ''}`}
              style={{ height: `${h}%`, ...(sparkColor ? { background: sparkColor } : {}) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
