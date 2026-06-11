interface Props {
  placeholder: string
  value: string
  onChange: (v: string) => void
  maxWidth?: number
}

export default function SearchBar({ placeholder, value, onChange, maxWidth = 280 }: Props) {
  return (
    <div className="search-bar" style={{ maxWidth }}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
