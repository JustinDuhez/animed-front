export const ORG_TYPES = ['ehpad', 'ets', 'scolaire', 'petiteEnfance', 'individuel'] as const
export type OrgType = typeof ORG_TYPES[number]

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
