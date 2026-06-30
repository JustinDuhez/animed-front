import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'
import type { Role } from '../data/user.js'

export const ANIMAL_STATUS_MAP: Record<Animal['status'], { cls: string; label: string }> = {
  actif:    { cls: 'badge-actif',    label: 'Actif' },
  repos:    { cls: 'badge-repos',    label: 'Repos' },
  alerte:   { cls: 'badge-alerte',   label: 'Alerte' },
  retraite: { cls: 'badge-retraite', label: 'Retraité' },
}

export const SESSION_STATUS_MAP: Record<Session['status'], { cls: string; label: string }> = {
  completed: { cls: 'badge-actif',  label: 'Effectuée' },
  planned:   { cls: 'badge-repos',  label: 'Planifiée' },
  cancelled: { cls: 'badge-alerte', label: 'Annulée'   },
}

export const ROLE_LABELS: Record<Role, string> = {
  admin:  'Administrateur',
  editor: 'Éditeur',
  viewer: 'Lecteur',
}

export const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  admin:  { bg: '#fee2e2', color: '#b91c1c' },
  editor: { bg: '#e0e7ff', color: '#4338ca' },
  viewer: { bg: '#f1f5f9', color: '#475569' },
}

const VACCINE_ALERT_EMOJIS = new Set(['🐕', '🐈', '🐴'])

export function requiresVaccineAlert(emoji: string): boolean {
  return VACCINE_ALERT_EMOJIS.has(emoji)
}
