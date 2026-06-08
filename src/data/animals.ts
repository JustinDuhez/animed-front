export type Status = 'actif' | 'repos' | 'alerte' | 'retraite'

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

export interface Vaccine {
  name: string
  status: 'ok' | 'soon' | 'expired'
  info: string
}

export interface Session {
  id: string
  animalId: string
  date: string   // ISO datetime e.g. '2026-05-06T14:00:00'
  structure: string
  handler: string
  notes: string
  status: 'completed' | 'planned' | 'cancelled'
}

export interface Animal {
  emoji: string
  name: string
  id: string
  species: string
  status: Status
  vaccineOk: boolean
  sessions: Record<string, number>  // YYYY-MM → count
  lastSession: string
  handler: string
  // detail fields
  gender: 'Mâle' | 'Femelle'
  birthDate: string
  weight: string
  chipId: string
  lastVetCheck: string
  antiparasiteOk: boolean
  antiparasiteInfo: string
  vermifugeDaysLeft: number | null
  establishments: string[]
  nextSession: { structure: string; date: string } | null
  vaccines: Vaccine[]
}

export const ANIMALS: Animal[] = [
  {
    emoji: '🐕', name: 'Martin',   id: 'MAR-00043', species: 'Labrador Retriever', status: 'actif',    vaccineOk: false,
    sessions: { '2025-04': 6, '2026-05': 2 }, lastSession: '2026-05-13', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '2021-03-12', weight: '28,5 kg', chipId: '250269811234567', lastVetCheck: '2025-01-12',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 30/06/2025', vermifugeDaysLeft: 45,
    establishments: ['EHPAD Les Jardins', 'EHPAD Bellevue', 'IME Saint-Joseph', 'Clinique Pasteur'],
    nextSession: { structure: 'EHPAD Les Jardins', date: '2026-05-20T14:00' },
    vaccines: [
      { name: 'Antirabique',   status: 'expired', info: 'Expiré le 31/03/2025' },
      { name: 'CHPPi',         status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
      { name: 'Leptospirose',  status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Luna',     id: 'LUN-00021', species: 'Persan',              status: 'actif',    vaccineOk: true,
    sessions: { '2025-04': 4 }, lastSession: '2025-04-08', handler: 'M. Petit',
    gender: 'Femelle', birthDate: '2020-07-05', weight: '4,2 kg',  chipId: '250269800012312', lastVetCheck: '2025-02-20',
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 01/08/2025',   vermifugeDaysLeft: 90,
    establishments: ['Clinique Pasteur', 'EHPAD Bellevue'],
    nextSession: { structure: 'Clinique Pasteur', date: '2026-05-30T09:00' },
    vaccines: [
      { name: 'Typhus',  status: 'ok', info: 'Valide jusqu\'au 20/02/2026' },
      { name: 'Coryza',  status: 'ok', info: 'Valide jusqu\'au 20/02/2026' },
      { name: 'Leucose', status: 'ok', info: 'Valide jusqu\'au 20/02/2026' },
    ],
  },
  {
    emoji: '🐇', name: 'Cannelle', id: 'CAN-00012', species: 'Lapin angora',        status: 'repos',    vaccineOk: true,
    sessions: { '2025-04': 2 }, lastSession: '2025-04-01', handler: 'L. Martin',
    gender: 'Femelle', birthDate: '2022-11-18', weight: '2,8 kg',  chipId: '250269800034521', lastVetCheck: '2025-03-10',
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 10/09/2025',   vermifugeDaysLeft: 60,
    establishments: ['EHPAD Les Jardins'],
    nextSession: null,
    vaccines: [
      { name: 'VHD',        status: 'ok', info: 'Valide jusqu\'au 10/03/2026' },
      { name: 'Myxomatose', status: 'ok', info: 'Valide jusqu\'au 10/03/2026' },
    ],
  },
  {
    emoji: '🐴', name: 'Tao',      id: 'TAO-00007', species: 'Poney Shetland',      status: 'alerte',   vaccineOk: false,
    sessions: { '2025-03': 1 }, lastSession: '2025-03-22', handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '2017-06-03', weight: '180 kg',  chipId: '250269800007654', lastVetCheck: '2025-01-05',
    antiparasiteOk: false, antiparasiteInfo: 'Non renseigné',                          vermifugeDaysLeft: null,
    establishments: ['EHPAD Les Jardins'],
    nextSession: null,
    vaccines: [
      { name: 'Tétanos',        status: 'expired', info: 'Expiré le 03/01/2025' },
      { name: 'Grippe équine',  status: 'expired', info: 'Expiré le 03/01/2025' },
      { name: 'Rhinopneumonie', status: 'soon',    info: 'Expire dans 12 jours' },
    ],
  },
  {
    emoji: '🦜', name: 'Pixel',    id: 'PIX-00033', species: 'Perruche ondulée',    status: 'retraite', vaccineOk: true,
    sessions: {}, lastSession: '—', handler: '—',
    gender: 'Mâle',   birthDate: '2018-04-14', weight: '35 g',    chipId: '—', lastVetCheck: '2024-09-01',
    antiparasiteOk: true,  antiparasiteInfo: 'N/A',                                   vermifugeDaysLeft: null,
    establishments: [],
    nextSession: null,
    vaccines: [
      { name: 'Polyomavirus', status: 'ok', info: 'Valide jusqu\'au 01/09/2025' },
    ],
  },
  {
    emoji: '🐕', name: 'Buddy',    id: 'BUD-00018', species: 'Golden Retriever',    status: 'actif',    vaccineOk: false,
    sessions: { '2025-04': 5, '2026-05': 2 }, lastSession: '2026-05-12', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '2020-08-22', weight: '31,0 kg', chipId: '250269800018765', lastVetCheck: '2025-02-08',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 08/08/2025',   vermifugeDaysLeft: 20,
    establishments: ['EHPAD Les Jardins', 'IME Saint-Joseph'],
    nextSession: { structure: 'IME Saint-Joseph', date: '2026-05-19T10:00' },
    vaccines: [
      { name: 'Antirabique', status: 'soon', info: 'Expire dans 8 jours' },
      { name: 'CHPPi',       status: 'ok',   info: 'Valide jusqu\'au 08/02/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Milo',     id: 'MIL-00029', species: 'Maine Coon',          status: 'actif',    vaccineOk: false,
    sessions: { '2025-04': 3 }, lastSession: '2025-04-05', handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '2021-01-30', weight: '7,8 kg',  chipId: '250269800029876', lastVetCheck: '2025-01-15',
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 15/07/2025',    vermifugeDaysLeft: 15,
    establishments: ['Clinique Pasteur', 'EHPAD Bellevue'],
    nextSession: { structure: 'EHPAD Bellevue', date: '2026-05-21T14:00' },
    vaccines: [
      { name: 'Typhus', status: 'expired', info: 'Expiré le 15/01/2025' },
      { name: 'Coryza', status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
    ],
  },
  {
    emoji: '🐕', name: 'Rex',      id: 'REX-00011', species: 'Berger Allemand',     status: 'repos',    vaccineOk: true,
    sessions: {}, lastSession: '2025-03-15', handler: 'L. Martin',
    gender: 'Mâle',   birthDate: '2019-05-09', weight: '34,5 kg', chipId: '250269800011234', lastVetCheck: '2025-03-02',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 02/09/2025',   vermifugeDaysLeft: 75,
    establishments: ['EHPAD Les Jardins', 'EHPAD Bellevue'],
    nextSession: null,
    vaccines: [
      { name: 'Antirabique', status: 'ok', info: 'Valide jusqu\'au 02/03/2026' },
      { name: 'CHPPi',       status: 'ok', info: 'Valide jusqu\'au 02/03/2026' },
    ],
  },
  {
    emoji: '🐇', name: 'Caramel',  id: 'CAR-00041', species: 'Bélier nain',         status: 'actif',    vaccineOk: true,
    sessions: { '2025-04': 3, '2026-05': 1 }, lastSession: '2026-05-08', handler: 'M. Petit',
    gender: 'Mâle',   birthDate: '2023-03-27', weight: '1,9 kg',  chipId: '250269800041098', lastVetCheck: '2025-03-27',
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 27/09/2025',   vermifugeDaysLeft: 120,
    establishments: ['Crèche Les Lutins', 'EHPAD Les Jardins'],
    nextSession: { structure: 'Crèche Les Lutins', date: '2026-05-22T09:30' },
    vaccines: [
      { name: 'VHD',        status: 'ok', info: 'Valide jusqu\'au 27/03/2026' },
      { name: 'Myxomatose', status: 'ok', info: 'Valide jusqu\'au 27/03/2026' },
    ],
  },
  {
    emoji: '🐕', name: 'Oscar',    id: 'OSC-00025', species: 'Beagle',              status: 'actif',    vaccineOk: true,
    sessions: { '2025-04': 4, '2026-05': 1 }, lastSession: '2026-05-05', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '2021-10-16', weight: '14,2 kg', chipId: '250269800025432', lastVetCheck: '2025-01-16',
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 16/07/2025',    vermifugeDaysLeft: 88,
    establishments: ['EHPAD Les Jardins', 'IME Saint-Joseph'],
    nextSession: { structure: 'EHPAD Les Jardins', date: '2026-05-26T14:00' },
    vaccines: [
      { name: 'Antirabique', status: 'ok', info: 'Valide jusqu\'au 16/01/2026' },
      { name: 'CHPPi',       status: 'ok', info: 'Valide jusqu\'au 16/01/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Nala',     id: 'NAL-00037', species: 'Siamois',             status: 'actif',    vaccineOk: true,
    sessions: { '2025-04': 2 }, lastSession: '2025-04-03', handler: 'M. Petit',
    gender: 'Femelle', birthDate: '2021-12-11', weight: '3,6 kg',  chipId: '250269800037654', lastVetCheck: '2025-01-11',
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 11/07/2025',   vermifugeDaysLeft: 50,
    establishments: ['Clinique Pasteur'],
    nextSession: null,
    vaccines: [
      { name: 'Typhus', status: 'ok', info: 'Valide jusqu\'au 11/01/2026' },
      { name: 'Coryza', status: 'ok', info: 'Valide jusqu\'au 11/01/2026' },
    ],
  },
  {
    emoji: '🐴', name: 'Calin',    id: 'CAL-00004', species: 'Âne miniature',       status: 'actif',    vaccineOk: true,
    sessions: { '2025-04': 3, '2026-05': 1 }, lastSession: '2026-05-08', handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '2016-09-02', weight: '95 kg',   chipId: '250269800004321', lastVetCheck: '2025-02-14',
    antiparasiteOk: true,  antiparasiteInfo: 'Ivermectine · jusqu\'au 14/08/2025', vermifugeDaysLeft: 110,
    establishments: ['EHPAD Les Jardins', 'Crèche Les Lutins'],
    nextSession: { structure: 'EHPAD Les Jardins', date: '2026-05-22T10:00' },
    vaccines: [
      { name: 'Tétanos',       status: 'ok', info: 'Valide jusqu\'au 14/02/2026' },
      { name: 'Grippe équine', status: 'ok', info: 'Valide jusqu\'au 14/02/2026' },
    ],
  },
]

export const SESSIONS: Session[] = [
  // Martin — MAR-00043
  { id: 'ses-mar-001', animalId: 'MAR-00043', date: '2026-05-13T14:00:00', structure: 'EHPAD Bellevue',   handler: 'S. Durand', notes: 'Très bonne séance, Martin attentif et calme.', status: 'completed' },
  { id: 'ses-mar-002', animalId: 'MAR-00043', date: '2026-05-06T14:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: 'Résidents enthousiastes, séance prolongée de 30 min.', status: 'completed' },
  { id: 'ses-mar-003', animalId: 'MAR-00043', date: '2025-04-29T14:00:00', structure: 'EHPAD Bellevue',   handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-mar-004', animalId: 'MAR-00043', date: '2025-04-22T09:00:00', structure: 'Clinique Pasteur',  handler: 'S. Durand', notes: 'Séance en salle de rééducation.', status: 'completed' },
  { id: 'ses-mar-005', animalId: 'MAR-00043', date: '2025-04-15T14:00:00', structure: 'IME Saint-Joseph',  handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-mar-006', animalId: 'MAR-00043', date: '2025-04-10T14:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: 'Interaction positive avec 8 résidents.', status: 'completed' },

  // Buddy — BUD-00018
  { id: 'ses-bud-001', animalId: 'BUD-00018', date: '2026-05-12T10:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: 'Buddy très énergique, bonne réaction des résidents.', status: 'completed' },
  { id: 'ses-bud-002', animalId: 'BUD-00018', date: '2026-05-06T10:00:00', structure: 'IME Saint-Joseph',  handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-bud-003', animalId: 'BUD-00018', date: '2025-04-29T10:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-bud-004', animalId: 'BUD-00018', date: '2025-04-22T10:00:00', structure: 'IME Saint-Joseph',  handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-bud-005', animalId: 'BUD-00018', date: '2025-04-12T10:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: 'Séance annulée en partie (problème bâtiment).', status: 'completed' },

  // Caramel — CAR-00041
  { id: 'ses-car-001', animalId: 'CAR-00041', date: '2026-05-08T09:30:00', structure: 'Crèche Les Lutins', handler: 'M. Petit', notes: 'Excellente interaction avec les enfants.', status: 'completed' },
  { id: 'ses-car-002', animalId: 'CAR-00041', date: '2025-04-03T09:30:00', structure: 'EHPAD Les Jardins', handler: 'M. Petit', notes: '', status: 'completed' },

  // Oscar — OSC-00025
  { id: 'ses-osc-001', animalId: 'OSC-00025', date: '2026-05-05T14:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: '', status: 'completed' },
  { id: 'ses-osc-002', animalId: 'OSC-00025', date: '2025-04-09T14:00:00', structure: 'IME Saint-Joseph',  handler: 'S. Durand', notes: '', status: 'completed' },

  // Calin — CAL-00004
  { id: 'ses-cal-001', animalId: 'CAL-00004', date: '2026-05-08T10:00:00', structure: 'EHPAD Les Jardins', handler: 'A. Rossi', notes: 'Les résidents ont adoré. Calin très coopératif.', status: 'completed' },
  { id: 'ses-cal-002', animalId: 'CAL-00004', date: '2025-04-11T10:00:00', structure: 'Crèche Les Lutins', handler: 'A. Rossi', notes: '', status: 'completed' },
]
