export type Status = 'actif' | 'repos' | 'alerte' | 'retraite'

export interface AnimalDocument {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  storagePath: string
  uploadedAt: string
}

export interface Vaccine {
  name: string
  status: 'ok' | 'soon' | 'expired'
  info: string
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
  gender: 'Mâle' | 'Femelle'
  birthDate: string
  weight: string
  chipId: string
  lastVetCheck: string
  antiparasiteOk: boolean
  antiparasiteInfo: string
  vermifugeLastDate: string
  establishments: string[]
  nextSession: { structure: string; date: string } | null
  vaccines: Vaccine[]
  qrCode?: string
}

export const ANIMALS: Animal[] = [
  {
    emoji: '🐕', name: 'Martin',   id: 'MAR-00043', species: 'Labrador Retriever', status: 'actif',    vaccineOk: false,
    sessions: { '2025-04': 6, '2026-05': 2 }, lastSession: '2026-05-13', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '2021-03-12', weight: '28,5 kg', chipId: '250269811234567', lastVetCheck: '2025-01-12',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 30/06/2025', vermifugeLastDate: '2026-03-10',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 01/08/2025',   vermifugeLastDate: '2026-01-15',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 10/09/2025',   vermifugeLastDate: '2026-02-01',
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
    antiparasiteOk: false, antiparasiteInfo: 'Non renseigné',                          vermifugeLastDate: '—',
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
    antiparasiteOk: true,  antiparasiteInfo: 'N/A',                                   vermifugeLastDate: '—',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 08/08/2025',   vermifugeLastDate: '2025-12-01',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 15/07/2025',    vermifugeLastDate: '2025-12-10',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 02/09/2025',   vermifugeLastDate: '2026-02-15',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 27/09/2025',   vermifugeLastDate: '2026-01-01',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 16/07/2025',    vermifugeLastDate: '2026-02-01',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 11/07/2025',   vermifugeLastDate: '2026-01-20',
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
    antiparasiteOk: true,  antiparasiteInfo: 'Ivermectine · jusqu\'au 14/08/2025', vermifugeLastDate: '2025-12-20',
    establishments: ['EHPAD Les Jardins', 'Crèche Les Lutins'],
    nextSession: { structure: 'EHPAD Les Jardins', date: '2026-05-22T10:00' },
    vaccines: [
      { name: 'Tétanos',       status: 'ok', info: 'Valide jusqu\'au 14/02/2026' },
      { name: 'Grippe équine', status: 'ok', info: 'Valide jusqu\'au 14/02/2026' },
    ],
  },
]
