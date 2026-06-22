export type StaffType =
  | 'educateur'
  | 'psychologue'
  | 'infirmier'
  | 'kinesitherapeute'
  | 'veterinaire'
  | 'benevole'
  | 'autre'

export interface StaffMember {
  id:              string
  firstName:       string
  lastName:        string
  email:           string
  phone:           string
  type:            StaffType
  status:          'active' | 'inactive'
  acacedCertified: boolean
  notes:           string
}
