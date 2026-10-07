import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserData, EveningEntry, MissionProgress, ChatMessage } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local mode.');
    }
    return false;
  }
}
testConnection();

// Authentication Helpers
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Cloud Firestore Sync Helpers
export async function saveUserToFirestore(
  userId: string,
  data: Partial<UserData>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function loadUserFromFirestore(
  userId: string
): Promise<UserData | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserData;
    }
  } catch (err) {
    console.error('Error loading user from Firestore:', err);
  }
  return null;
}

export async function saveDiaryToFirestore(
  userId: string,
  entry: EveningEntry
): Promise<void> {
  try {
    const entryRef = doc(db, 'users', userId, 'diary', entry.id);
    await setDoc(entryRef, entry, { merge: true });
  } catch (err) {
    console.error('Error saving diary to Firestore:', err);
  }
}

export async function loadDiaryFromFirestore(
  userId: string
): Promise<EveningEntry[]> {
  try {
    const colRef = collection(db, 'users', userId, 'diary');
    const snap = await getDocs(colRef);
    const entries: EveningEntry[] = [];
    snap.forEach((d) => entries.push(d.data() as EveningEntry));
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error loading diary from Firestore:', err);
    return [];
  }
}

export async function deleteDiaryFromFirestore(
  userId: string,
  entryId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'diary', entryId));
  } catch (err) {
    console.error('Error deleting diary entry from Firestore:', err);
  }
}
