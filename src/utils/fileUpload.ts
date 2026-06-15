import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

export interface StoredDocument {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  storagePath: string
  uploadedAt: string
}

export function docIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('csv')) return '📊'
  if (mimeType.startsWith('video/')) return '🎥'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/**
 * Uploads a file to Firebase Storage and saves its metadata to Firestore.
 * @param entityPath - shared path used for both storage and Firestore, e.g. 'animals/ANI-001/documents'
 */
export async function uploadDocument(
  file: File,
  entityPath: string,
  db: Firestore,
  storage: FirebaseStorage,
  onProgress: (percent: number) => void,
): Promise<StoredDocument> {
  const docId       = `doc-${Date.now()}`
  const storagePath = `${entityPath}/${docId}`

  const task = uploadBytesResumable(ref(storage, storagePath), file)
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed',
      snap => onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      resolve,
    )
  })

  const url = await getDownloadURL(ref(storage, storagePath))
  const stored: StoredDocument = {
    id: docId,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    url,
    storagePath,
    uploadedAt: new Date().toISOString(),
  }
  await setDoc(doc(db, `${entityPath}/${docId}`), stored)
  return stored
}

/**
 * Deletes a document from Firebase Storage and Firestore.
 * Storage deletion is best-effort (ignores errors if the file is already gone).
 * @param entityPath - Firestore collection path, e.g. 'animals/ANI-001/documents'
 */
export async function deleteDocument(
  stored: Pick<StoredDocument, 'id' | 'storagePath'>,
  entityPath: string,
  db: Firestore,
  storage: FirebaseStorage,
): Promise<void> {
  try {
    await deleteObject(ref(storage, stored.storagePath))
  } catch { /* file may already be gone */ }
  await deleteDoc(doc(db, `${entityPath}/${stored.id}`))
}
