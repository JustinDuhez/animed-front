import { useState } from 'react'

const MINUTE_STEPS = ['00', '15', '30', '45']
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

interface Props {
  value: string // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void
  required?: boolean
}

/** Date + time input where the minute dropdown only offers :00/:15/:30/:45 — native
 *  datetime-local pickers only validate against `step`, they don't filter the popup list.
 *
 *  Date and time are tracked as local state (seeded once from `value`) rather than derived
 *  fresh from `value` on every render: `onChange` only fires a combined string once a date is
 *  picked, so re-deriving from the (still empty) parent value would wipe out an hour/minute
 *  picked before the date — this lets either be set first, in any order. */
export default function DateTimeStepInput({ value, onChange, required }: Props) {
  const [initialDate, initialTime] = value ? value.split('T') : ['', '']
  const [initialHour, initialMinute] = initialTime ? initialTime.split(':') : ['', '']

  const [datePart, setDatePart] = useState(initialDate)
  const [hour,      setHour]    = useState(initialHour || '09')
  const [minute,    setMinute]  = useState(initialMinute || '00')

  function emit(d: string, h: string, m: string) {
    setDatePart(d)
    setHour(h)
    setMinute(m)
    onChange(d ? `${d}T${h}:${m}` : '')
  }

  const minuteOptions = MINUTE_STEPS.includes(minute) ? MINUTE_STEPS : [minute, ...MINUTE_STEPS]

  return (
    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
      <input
        className="form-input"
        type="date"
        value={datePart}
        onChange={e => emit(e.target.value, hour, minute)}
        required={required}
        style={{ flex: 2 }}
      />
      <select className="form-select" value={hour} onChange={e => emit(datePart, e.target.value, minute)} style={{ flex: 1 }}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select className="form-select" value={minute} onChange={e => emit(datePart, hour, e.target.value)} style={{ flex: 1 }}>
        {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )
}
