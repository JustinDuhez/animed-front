import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import type { Organization } from '../data/animals.js'

const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-ehpad-les-jardins',
    name: 'EHPAD Les Jardins',
    type: 'ehpad',
    address: '12 rue des Lilas, 75014 Paris',
    phone: '01 45 23 67 89',
    email: 'contact@ehpad-lesjardins.fr',
    contact: 'Mme D. Lambert',
    notes: '',
    status: 'active',
  },
  {
    id: 'org-ehpad-bellevue',
    name: 'EHPAD Bellevue',
    type: 'ehpad',
    address: '8 avenue du Parc, 92100 Boulogne-Billancourt',
    phone: '01 46 78 12 34',
    email: 'direction@ehpad-bellevue.fr',
    contact: 'M. F. Bernard',
    notes: '',
    status: 'active',
  },
  {
    id: 'org-ime-saint-joseph',
    name: 'IME Saint-Joseph',
    type: 'ime',
    address: '45 rue Saint-Joseph, 75010 Paris',
    phone: '01 42 08 99 12',
    email: 'secretariat@ime-saintjoseph.fr',
    contact: 'Mme C. Moreau',
    notes: '',
    status: 'active',
  },
  {
    id: 'org-clinique-pasteur',
    name: 'Clinique Pasteur',
    type: 'clinique',
    address: '3 boulevard Pasteur, 75015 Paris',
    phone: '01 53 46 28 00',
    email: 'accueil@clinique-pasteur.fr',
    contact: 'Dr. L. Fontaine',
    notes: '',
    status: 'active',
  },
  {
    id: 'org-creche-les-lutins',
    name: 'Crèche Les Lutins',
    type: 'creche',
    address: '22 rue de la Paix, 92130 Issy-les-Moulineaux',
    phone: '01 41 23 55 67',
    email: 'creche.leslutins@mairie-issy.fr',
    contact: 'Mme S. Girard',
    notes: '',
    status: 'active',
  },
]

export async function seedOrganizationsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, 'organizations'))
  if (!snap.empty) return

  for (const org of SEED_ORGANIZATIONS) {
    await setDoc(doc(db, 'organizations', org.id), org)
  }
}
