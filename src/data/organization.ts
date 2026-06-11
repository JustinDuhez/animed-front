export type OrgType = 'ehpad' | 'ime' | 'clinique' | 'creche' | 'hopital' | 'ecole' | 'autre'

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
