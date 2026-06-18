export type Role = 'admin' | 'editor' | 'viewer'

export interface UserRecord {
  uid:         string
  email:       string
  displayName: string
  role:        Role
  createdAt:   string
}
