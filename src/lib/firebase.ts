/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Document, AppSettings } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore using the custom database ID provided in the configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Subscribe to the real-time stream of documents in Firestore.
 * Documents are ordered by createdAt descending.
 */
export function subscribeToDocuments(onUpdate: (docs: Document[]) => void, onError?: (error: any) => void) {
  const docsCollection = collection(db, 'documents');
  const q = query(docsCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const docs: Document[] = [];
    snapshot.forEach((docSnap) => {
      docs.push({
        ...docSnap.data(),
        id: docSnap.id
      } as Document);
    });
    onUpdate(docs);
  }, (error) => {
    console.error('Error listening to documents:', error);
    if (onError) onError(error);
  });
}

/**
 * Add or update a document in Firestore.
 */
export async function saveDocumentToFirestore(document: Document): Promise<void> {
  const docRef = doc(db, 'documents', document.id);
  // Clean undefined fields to prevent Firestore serialization errors
  const cleanDoc = JSON.parse(JSON.stringify(document));
  await setDoc(docRef, cleanDoc, { merge: true });
}

/**
 * Delete a document from Firestore.
 */
export async function deleteDocumentFromFirestore(docId: string): Promise<void> {
  const docRef = doc(db, 'documents', docId);
  await deleteDoc(docRef);
}

/**
 * Fetch settings for a specific user. If not found, falls back to default.
 */
export async function getSettingsFromFirestore(username: string): Promise<AppSettings | null> {
  const docRef = doc(db, 'settings', username || 'global');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as AppSettings;
  }
  return null;
}

/**
 * Save settings for a specific user in Firestore.
 */
export async function saveSettingsToFirestore(username: string, settings: AppSettings): Promise<void> {
  const docRef = doc(db, 'settings', username || 'global');
  const cleanSettings = JSON.parse(JSON.stringify(settings));
  await setDoc(docRef, cleanSettings, { merge: true });
}

/**
 * Seed initial mock documents to Firestore if the collection is empty.
 */
export async function seedInitialDataIfEmpty(initialDocs: Document[], initialSettings: AppSettings): Promise<void> {
  const docsCollection = collection(db, 'documents');
  
  // We can do a quick check onsnapshot/getDoc, but to be clean, let's write a batch
  // if requested or handle seeding directly in the App.tsx with state check.
}
