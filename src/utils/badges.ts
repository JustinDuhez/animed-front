import type { Animal } from '../data/animal.js'
import type { Session } from '../data/session.js'

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
