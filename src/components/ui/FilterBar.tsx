interface Chip {
  key: string
  label: string
  count?: number
}

interface Props {
  chips: Chip[]
  active: string
  onChange: (key: string) => void
}

export default function FilterBar({ chips, active, onChange }: Props) {
  return (
    <div className="filter-bar" style={{ flex: 1 }}>
      {chips.map(chip => (
        <div
          key={chip.key}
          className={`filter-chip${active === chip.key ? ' active' : ''}`}
          onClick={() => onChange(chip.key)}
        >
          {chip.label}
          {chip.count !== undefined && (
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, marginLeft: 3 }}>
              {chip.count}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
