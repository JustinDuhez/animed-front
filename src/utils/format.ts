/** Firestore Timestamp instance, or its plain serialized shape (as written by some mobile clients). */
type TimestampLike =
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number }

export type DateLike = string | number | Date | TimestampLike | null | undefined

/** Normalizes any date-ish value coming from web or mobile writers into a valid Date, or null if unparseable. */
export function toDate(value: DateLike): Date | null {
  if (value == null || value === '' || value === '—') return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      const d = value.toDate()
      return isNaN(d.getTime()) ? null : d
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000 + Math.round((value.nanoseconds ?? 0) / 1e6))
      return isNaN(d.getTime()) ? null : d
    }
    if ('_seconds' in value && typeof value._seconds === 'number') {
      const d = new Date(value._seconds * 1000 + Math.round((value._nanoseconds ?? 0) / 1e6))
      return isNaN(d.getTime()) ? null : d
    }
    return null
  }

  const s = value.trim()

  // Standard ISO / RFC parse first.
  let d = new Date(s)
  if (!isNaN(d.getTime())) return d

  // "YYYY-MM-DD HH:mm:ss" (space instead of "T") — some mobile writers omit the ISO separator.
  d = new Date(s.replace(' ', 'T'))
  if (!isNaN(d.getTime())) return d

  // "DD/MM/YYYY[ HH:mm[:ss]]" — French locale format some mobile inputs produce.
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (dmy) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = dmy
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss))
    if (!isNaN(d.getTime())) return d
  }

  return null
}

/** "14:00" */
export function formatTime(value: DateLike): string {
  const d = toDate(value)
  return d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'
}

/** "lundi 15 juin 2026" */
export function formatFullDate(value: DateLike): string {
  const d = toDate(value)
  return d ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

/** "lun. 15 juin · 14:00" */
export function formatDateTime(value: DateLike): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** "15 juin · 14:00" — used as onSelectSession labels */
export function formatSessionLabel(value: DateLike): string {
  const d = toDate(value)
  if (!d) return '—'
  return `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

/** "15 juin 2026" — short date with year, returns '—' for missing/placeholder/unparseable values */
export function formatShortDate(value: DateLike): string {
  const d = toDate(value)
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

/** "15 juin 2026" — full month name, no weekday, returns '—' for missing/unparseable values */
export function formatLongDate(value: DateLike): string {
  const d = toDate(value)
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

/** True when `value` is a valid date more than `days` days in the past. Unparseable/missing values are never overdue. */
export function isOverdue(value: DateLike, days: number): boolean {
  const d = toDate(value)
  return d ? (Date.now() - d.getTime()) > days * 24 * 60 * 60 * 1000 : false
}

/** "YYYY-MM-DD" — for binding to <input type="date">, returns '' for missing/unparseable values */
export function toDateInputValue(value: DateLike): string {
  const d = toDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "juin 2026" — used as month group headings */
export function formatMonthHeading(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
