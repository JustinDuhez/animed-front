export const ORG_TYPES = ['ehpad', 'ets', 'scolaire', 'petiteEnfance', 'individuel'] as const
export type OrgType = typeof ORG_TYPES[number]

export const ORG_TYPE_META: Record<OrgType, { label: string; bg: string; color: string; icon: string }> = {
  ehpad:         { label: 'EHPAD',                  bg: '#dcfce7', color: '#15803d', icon: '🏥' },
  ets:           { label: 'Établissement Spécialisé', bg: '#e0e7ff', color: '#4338ca', icon: '🏫' },
  scolaire:      { label: 'Scolaire',               bg: '#fef9c3', color: '#a16207', icon: '🎒' },
  petiteEnfance: { label: 'Petite Enfance',         bg: '#fff7ed', color: '#c2410c', icon: '🧸' },
  individuel:    { label: 'Individuel',             bg: '#f1f5f9', color: '#475569', icon: '🏡' },
}

export const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = ORG_TYPES.map(t => ({
  value: t,
  label: ORG_TYPE_META[t].label,
}))

export interface Organization {
  id: string
  name: string
  type: OrgType
  address: string
  phone: string
  email: string
  contact: string
  notes: string
  status: 'active' | 'inactive'
}
