export interface Session {
  id: string
  animalId: string
  date: string   // ISO datetime e.g. '2026-05-06T14:00:00'
  structure: string
  handler: string
  notes: string
  status: 'completed' | 'planned' | 'cancelled'
}

export const SESSIONS: Session[] = [
  // Martin — MAR-00043
  { id: 'ses-mar-001', animalId: 'MAR-00043', date: '2026-05-13T14:00:00', structure: 'EHPAD Bellevue',    handler: 'S. Durand', notes: 'Très bonne séance, Martin attentif et calme.', status: 'completed' },
  { id: 'ses-mar-002', animalId: 'MAR-00043', date: '2026-05-06T14:00:00', structure: 'EHPAD Les Jardins', handler: 'S. Durand', notes: 'Résidents enthousiastes, séance prolongée de 30 min.', status: 'completed' },
  { id: 'ses-mar-003', animalId: 'MAR-00043', date: '2025-04-29T14:00:00', structure: 'EHPAD Bellevue',    handler: 'S. Durand', notes: '', status: 'completed' },
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
