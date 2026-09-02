export type Role = 'admin' | 'editor' | 'viewer'

export type UserType =
  | 'educateur'
  | 'psychologue'
  | 'infirmier'
  | 'kinesitherapeute'
  | 'veterinaire'
  | 'benevole'
  | 'autre'

export const USER_TYPES: UserType[] = [
  'educateur', 'psychologue', 'infirmier', 'kinesitherapeute', 'veterinaire', 'benevole', 'autre',
]

export const USER_TYPE_META: Record<UserType, { label: string; bg: string; color: string; icon: string }> = {
  educateur:        { label: 'Éducateur',      bg: '#e0e7ff', color: '#4338ca', icon: '🧑‍🏫' },
  psychologue:      { label: 'Psychologue',    bg: '#fce7f3', color: '#9d174d', icon: '🧠'   },
  infirmier:        { label: 'Infirmier',      bg: '#e0f2fe', color: '#0369a1', icon: '💉'   },
  kinesitherapeute: { label: 'Kiné',           bg: '#dcfce7', color: '#15803d', icon: '🏃'   },
  veterinaire:      { label: 'Vétérinaire',    bg: '#fff7ed', color: '#c2410c', icon: '🩺'   },
  benevole:         { label: 'Bénévole',       bg: '#fef9c3', color: '#a16207', icon: '🤝'   },
  autre:            { label: 'Autre',          bg: '#f1f5f9', color: '#475569', icon: '👤'   },
}

export interface UserRecord {
  uid:              string
  email:            string
  displayName:      string
  role:             Role
  createdAt:        string
  phone?:           string
  type?:            UserType
  acacedCertified?: boolean
  notes?:           string
}
