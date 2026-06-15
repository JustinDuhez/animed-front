/** "14:00" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** "lundi 15 juin 2026" */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** "lun. 15 juin · 14:00" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** "15 juin · 14:00" — used as onSelectSession labels */
export function formatSessionLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'long' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

/** "15 juin 2026" — short date with year, returns '—' for missing/placeholder values */
export function formatShortDate(iso: string): string {
  if (!iso || iso === '—') return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "juin 2026" — used as month group headings */
export function formatMonthHeading(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
