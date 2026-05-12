export type Status = 'actif' | 'repos' | 'alerte' | 'retraite'

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
  sessions: number
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
    emoji: '🐕', name: 'Martin',   id: 'MAR-00043', species: 'Labrador Retriever', status: 'actif',    vaccineOk: false, sessions: 6, lastSession: '10 avr. 2025', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '12/03/2021', weight: '28,5 kg', chipId: '250269811234567', lastVetCheck: '12 jan. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 30/06/2025', vermifugeDaysLeft: 45,
    establishments: ['EHPAD Les Jardins', 'EHPAD Bellevue', 'IME Saint-Joseph', 'Clinique Pasteur'],
    nextSession: { structure: 'EHPAD Les Jardins', date: 'Lun 28 avr. · 14h00–16h00' },
    vaccines: [
      { name: 'Antirabique',   status: 'expired', info: 'Expiré le 31/03/2025' },
      { name: 'CHPPi',         status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
      { name: 'Leptospirose',  status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Luna',     id: 'LUN-00021', species: 'Persan',              status: 'actif',    vaccineOk: true,  sessions: 4, lastSession: '8 avr. 2025',  handler: 'M. Petit',
    gender: 'Femelle', birthDate: '05/07/2020', weight: '4,2 kg',  chipId: '250269800012312', lastVetCheck: '20 fév. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 01/08/2025',   vermifugeDaysLeft: 90,
    establishments: ['Clinique Pasteur', 'EHPAD Bellevue'],
    nextSession: { structure: 'Clinique Pasteur', date: 'Ven 30 mai · 09h00' },
    vaccines: [
      { name: 'Typhus',        status: 'ok',      info: 'Valide jusqu\'au 20/02/2026' },
      { name: 'Coryza',        status: 'ok',      info: 'Valide jusqu\'au 20/02/2026' },
      { name: 'Leucose',       status: 'ok',      info: 'Valide jusqu\'au 20/02/2026' },
    ],
  },
  {
    emoji: '🐇', name: 'Cannelle', id: 'CAN-00012', species: 'Lapin angora',        status: 'repos',    vaccineOk: true,  sessions: 2, lastSession: '1 avr. 2025',  handler: 'L. Martin',
    gender: 'Femelle', birthDate: '18/11/2022', weight: '2,8 kg',  chipId: '250269800034521', lastVetCheck: '10 mars 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 10/09/2025',   vermifugeDaysLeft: 60,
    establishments: ['EHPAD Les Jardins'],
    nextSession: null,
    vaccines: [
      { name: 'VHD',           status: 'ok',      info: 'Valide jusqu\'au 10/03/2026' },
      { name: 'Myxomatose',    status: 'ok',      info: 'Valide jusqu\'au 10/03/2026' },
    ],
  },
  {
    emoji: '🐴', name: 'Tao',      id: 'TAO-00007', species: 'Poney Shetland',      status: 'alerte',   vaccineOk: false, sessions: 1, lastSession: '22 mars 2025', handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '03/06/2017', weight: '180 kg',  chipId: '250269800007654', lastVetCheck: '5 jan. 2025',
    antiparasiteOk: false, antiparasiteInfo: 'Non renseigné',                          vermifugeDaysLeft: null,
    establishments: ['EHPAD Les Jardins'],
    nextSession: null,
    vaccines: [
      { name: 'Tétanos',       status: 'expired', info: 'Expiré le 03/01/2025' },
      { name: 'Grippe équine', status: 'expired', info: 'Expiré le 03/01/2025' },
      { name: 'Rhinopneumonie',status: 'soon',    info: 'Expire dans 12 jours' },
    ],
  },
  {
    emoji: '🦜', name: 'Pixel',    id: 'PIX-00033', species: 'Perruche ondulée',    status: 'retraite', vaccineOk: true,  sessions: 0, lastSession: '—',            handler: '—',
    gender: 'Mâle',   birthDate: '14/04/2018', weight: '35 g',    chipId: '—',                         lastVetCheck: '1 sept. 2024',
    antiparasiteOk: true,  antiparasiteInfo: 'N/A',                                   vermifugeDaysLeft: null,
    establishments: [],
    nextSession: null,
    vaccines: [
      { name: 'Polyomavirus',  status: 'ok',      info: 'Valide jusqu\'au 01/09/2025' },
    ],
  },
  {
    emoji: '🐕', name: 'Buddy',    id: 'BUD-00018', species: 'Golden Retriever',    status: 'actif',    vaccineOk: false, sessions: 5, lastSession: '12 avr. 2025', handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '22/08/2020', weight: '31,0 kg', chipId: '250269800018765', lastVetCheck: '8 fév. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 08/08/2025',   vermifugeDaysLeft: 20,
    establishments: ['EHPAD Les Jardins', 'IME Saint-Joseph'],
    nextSession: { structure: 'IME Saint-Joseph', date: 'Mar 6 mai · 10h00' },
    vaccines: [
      { name: 'Antirabique',   status: 'soon',    info: 'Expire dans 8 jours' },
      { name: 'CHPPi',         status: 'ok',      info: 'Valide jusqu\'au 08/02/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Milo',     id: 'MIL-00029', species: 'Maine Coon',          status: 'actif',    vaccineOk: false, sessions: 3, lastSession: '5 avr. 2025',  handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '30/01/2021', weight: '7,8 kg',  chipId: '250269800029876', lastVetCheck: '15 jan. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 15/07/2025',    vermifugeDaysLeft: 15,
    establishments: ['Clinique Pasteur', 'EHPAD Bellevue'],
    nextSession: { structure: 'EHPAD Bellevue', date: 'Mer 7 mai · 14h00' },
    vaccines: [
      { name: 'Typhus',        status: 'expired', info: 'Expiré le 15/01/2025' },
      { name: 'Coryza',        status: 'ok',      info: 'Valide jusqu\'au 15/01/2026' },
    ],
  },
  {
    emoji: '🐕', name: 'Rex',      id: 'REX-00011', species: 'Berger Allemand',     status: 'repos',    vaccineOk: true,  sessions: 0, lastSession: '15 mars 2025', handler: 'L. Martin',
    gender: 'Mâle',   birthDate: '09/05/2019', weight: '34,5 kg', chipId: '250269800011234', lastVetCheck: '2 mars 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Frontline · jusqu\'au 02/09/2025',   vermifugeDaysLeft: 75,
    establishments: ['EHPAD Les Jardins', 'EHPAD Bellevue'],
    nextSession: null,
    vaccines: [
      { name: 'Antirabique',   status: 'ok',      info: 'Valide jusqu\'au 02/03/2026' },
      { name: 'CHPPi',         status: 'ok',      info: 'Valide jusqu\'au 02/03/2026' },
    ],
  },
  {
    emoji: '🐇', name: 'Caramel',  id: 'CAR-00041', species: 'Bélier nain',         status: 'actif',    vaccineOk: true,  sessions: 3, lastSession: '7 avr. 2025',  handler: 'M. Petit',
    gender: 'Mâle',   birthDate: '27/03/2023', weight: '1,9 kg',  chipId: '250269800041098', lastVetCheck: '27 mars 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Revolution · jusqu\'au 27/09/2025',   vermifugeDaysLeft: 120,
    establishments: ['Crèche Les Lutins', 'EHPAD Les Jardins'],
    nextSession: { structure: 'Crèche Les Lutins', date: 'Jeu 1 mai · 09h30' },
    vaccines: [
      { name: 'VHD',           status: 'ok',      info: 'Valide jusqu\'au 27/03/2026' },
      { name: 'Myxomatose',    status: 'ok',      info: 'Valide jusqu\'au 27/03/2026' },
    ],
  },
  {
    emoji: '🐕', name: 'Oscar',    id: 'OSC-00025', species: 'Beagle',              status: 'actif',    vaccineOk: true,  sessions: 4, lastSession: '9 avr. 2025',  handler: 'S. Durand',
    gender: 'Mâle',   birthDate: '16/10/2021', weight: '14,2 kg', chipId: '250269800025432', lastVetCheck: '16 jan. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Bravecto · jusqu\'au 16/07/2025',    vermifugeDaysLeft: 88,
    establishments: ['EHPAD Les Jardins', 'IME Saint-Joseph'],
    nextSession: { structure: 'EHPAD Les Jardins', date: 'Lun 5 mai · 14h00' },
    vaccines: [
      { name: 'Antirabique',   status: 'ok',      info: 'Valide jusqu\'au 16/01/2026' },
      { name: 'CHPPi',         status: 'ok',      info: 'Valide jusqu\'au 16/01/2026' },
    ],
  },
  {
    emoji: '🐈', name: 'Nala',     id: 'NAL-00037', species: 'Siamois',             status: 'actif',    vaccineOk: true,  sessions: 2, lastSession: '3 avr. 2025',  handler: 'M. Petit',
    gender: 'Femelle', birthDate: '11/12/2021', weight: '3,6 kg',  chipId: '250269800037654', lastVetCheck: '11 janv. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Advantage · jusqu\'au 11/07/2025',   vermifugeDaysLeft: 50,
    establishments: ['Clinique Pasteur'],
    nextSession: null,
    vaccines: [
      { name: 'Typhus',        status: 'ok',      info: 'Valide jusqu\'au 11/01/2026' },
      { name: 'Coryza',        status: 'ok',      info: 'Valide jusqu\'au 11/01/2026' },
    ],
  },
  {
    emoji: '🐴', name: 'Calin',    id: 'CAL-00004', species: 'Âne miniature',       status: 'actif',    vaccineOk: true,  sessions: 3, lastSession: '11 avr. 2025', handler: 'A. Rossi',
    gender: 'Mâle',   birthDate: '02/09/2016', weight: '95 kg',   chipId: '250269800004321', lastVetCheck: '14 fév. 2025',
    antiparasiteOk: true,  antiparasiteInfo: 'Ivermectine · jusqu\'au 14/08/2025', vermifugeDaysLeft: 110,
    establishments: ['EHPAD Les Jardins', 'Crèche Les Lutins'],
    nextSession: { structure: 'EHPAD Les Jardins', date: 'Jeu 8 mai · 10h00' },
    vaccines: [
      { name: 'Tétanos',       status: 'ok',      info: 'Valide jusqu\'au 14/02/2026' },
      { name: 'Grippe équine', status: 'ok',      info: 'Valide jusqu\'au 14/02/2026' },
    ],
  },
]
