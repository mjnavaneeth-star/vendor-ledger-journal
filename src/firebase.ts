import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";
import { LedgerEntry, UserProfile } from "./types";

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Firestore with custom database ID if provisioned
export const db: Firestore = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Helpers - Google Sign-In ONLY (No guest/anonymous fallback)
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google Sign-In popup error:", error);
    // If popup is blocked by sandbox iframe restrictions, surface clear message
    if (error.code === "auth/popup-blocked") {
      throw new Error(
        "Sign-in popup was blocked by the browser. Please allow popups or open this app in a new window/tab."
      );
    }
    throw error;
  }
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

// Sync Notification & Warning State
export interface SyncNotification {
  type: "read_error" | "write_error" | "retry_success";
  message: string;
  timestamp: number;
  errorDetails?: string;
}

type SyncListener = (notification: SyncNotification | null) => void;
const syncListeners: Set<SyncListener> = new Set();
let currentSyncIssue: SyncNotification | null = null;

export function subscribeSyncStatus(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncIssue);
  return () => {
    syncListeners.delete(listener);
  };
}

export function notifySyncIssue(notification: SyncNotification | null) {
  currentSyncIssue = notification;
  syncListeners.forEach((l) => l(notification));
}

export function clearSyncIssue() {
  notifySyncIssue(null);
}

// Local Storage Fallback Cache Key
const LOCAL_STORAGE_KEY_PREFIX = "vendor_ledger_entries_";

export function getLocalLedgerEntries(userId: string): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalLedgerEntries(userId: string, entries: LedgerEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save local ledger entries:", e);
  }
}

// Ledger Data Service (Firestore with explicit local-fallback error surfacing)
export async function saveLedgerEntryToFirestore(
  entry: Omit<LedgerEntry, "id" | "createdAt" | "isLocalOnly" | "syncError">,
  user: User
): Promise<LedgerEntry> {
  const newRecordData = {
    userId: user.uid,
    date: entry.date,
    totalSales: Number(entry.totalSales) || 0,
    totalExpenses: Number(entry.totalExpenses) || 0,
    netAmount: Number(entry.netAmount) || 0,
    notes: entry.notes || "",
    createdAt: serverTimestamp(),
  };

  try {
    // Attempt Firestore write directly
    const docRef = await addDoc(collection(db, "ledgerEntries"), newRecordData);
    const created: LedgerEntry = {
      ...newRecordData,
      id: docRef.id,
      createdAt: Date.now(),
      isLocalOnly: false,
    };

    // Also update local cache for offline/fast read
    const current = getLocalLedgerEntries(user.uid);
    saveLocalLedgerEntries(user.uid, [created, ...current.filter((c) => c.id !== created.id)]);

    // Check if there are still other unsynced entries
    const remainingUnsynced = current.filter((c) => c.isLocalOnly && c.id !== created.id);
    if (remainingUnsynced.length === 0) {
      clearSyncIssue();
    }

    return created;
  } catch (err: any) {
    const errorMsg =
      err?.message || "Cloud Firestore could not be reached (Network or permission error).";
    console.error("Firestore write failed, falling back to local storage:", err);

    // Save locally, but explicitly flag as unsynced
    const fallbackId = "loc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const fallbackEntry: LedgerEntry = {
      ...newRecordData,
      id: fallbackId,
      createdAt: Date.now(),
      isLocalOnly: true,
      syncError: errorMsg,
    };

    const current = getLocalLedgerEntries(user.uid);
    saveLocalLedgerEntries(user.uid, [fallbackEntry, ...current.filter((c) => c.id !== fallbackId)]);

    // Trigger visible sync warning
    notifySyncIssue({
      type: "write_error",
      message: `Your entry for ${entry.date} did NOT sync to your Firestore cloud account and is saved locally only. It may be lost if browser cache is cleared.`,
      timestamp: Date.now(),
      errorDetails: errorMsg,
    });

    return fallbackEntry;
  }
}

export async function fetchUserLedgerEntries(userId: string): Promise<LedgerEntry[]> {
  try {
    const q = query(
      collection(db, "ledgerEntries"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const cloudEntries: LedgerEntry[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      cloudEntries.push({
        id: d.id,
        userId: data.userId,
        date: data.date,
        totalSales: Number(data.totalSales) || 0,
        totalExpenses: Number(data.totalExpenses) || 0,
        netAmount: Number(data.netAmount) || 0,
        notes: data.notes || "",
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        isLocalOnly: false,
      });
    });

    // Check if local cache has any unsynced local-only entries that still need to be uploaded
    const local = getLocalLedgerEntries(userId);
    const unsyncedLocal = local.filter((e) => e.isLocalOnly || e.id.startsWith("loc_"));

    // Merge cloud entries with any unsynced local entries
    const combinedMap = new Map<string, LedgerEntry>();
    cloudEntries.forEach((ce) => combinedMap.set(ce.id, ce));
    unsyncedLocal.forEach((le) => {
      if (!combinedMap.has(le.id)) {
        combinedMap.set(le.id, le);
      }
    });

    const entries = Array.from(combinedMap.values());
    entries.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    // Update local cache
    saveLocalLedgerEntries(userId, entries);

    if (unsyncedLocal.length > 0) {
      notifySyncIssue({
        type: "write_error",
        message: `${unsyncedLocal.length} entry in your ledger did NOT sync to your Firestore cloud account and may be lost if your cache is cleared.`,
        timestamp: Date.now(),
      });
    } else {
      clearSyncIssue();
    }

    return entries;
  } catch (err: any) {
    const errorMsg =
      err?.message || "Cloud Firestore could not be reached (Network or permission error).";
    console.error("Firestore fetch error, reading from local fallback cache:", err);

    const local = getLocalLedgerEntries(userId).map((e) => ({
      ...e,
      isLocalOnly: true,
      syncError: e.syncError || errorMsg,
    }));
    local.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    notifySyncIssue({
      type: "read_error",
      message: `Cloud Firestore could not be reached. Showing entries from local device storage only — these are NOT verified with your cloud account and may be lost.`,
      timestamp: Date.now(),
      errorDetails: errorMsg,
    });

    return local;
  }
}

// Retry syncing any local-only entries to Firestore
export async function retrySyncLocalEntries(user: User): Promise<{
  syncedCount: number;
  remainingUnsynced: number;
  errors: string[];
}> {
  const current = getLocalLedgerEntries(user.uid);
  const unsynced = current.filter((e) => e.isLocalOnly || e.id.startsWith("loc_"));

  if (unsynced.length === 0) {
    clearSyncIssue();
    return { syncedCount: 0, remainingUnsynced: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];
  const updatedEntries = [...current];

  for (const entry of unsynced) {
    try {
      const newRecordData = {
        userId: user.uid,
        date: entry.date,
        totalSales: Number(entry.totalSales) || 0,
        totalExpenses: Number(entry.totalExpenses) || 0,
        netAmount: Number(entry.netAmount) || 0,
        notes: entry.notes || "",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "ledgerEntries"), newRecordData);
      const index = updatedEntries.findIndex((e) => e.id === entry.id);
      if (index !== -1) {
        updatedEntries[index] = {
          ...entry,
          id: docRef.id,
          isLocalOnly: false,
          syncError: undefined,
        };
      }
      syncedCount++;
    } catch (err: any) {
      errors.push(err.message || String(err));
    }
  }

  saveLocalLedgerEntries(user.uid, updatedEntries);

  const remaining = updatedEntries.filter((e) => e.isLocalOnly || e.id.startsWith("loc_")).length;
  if (remaining === 0) {
    clearSyncIssue();
  } else {
    notifySyncIssue({
      type: "write_error",
      message: `${remaining} entry remains unsynced in local storage only and may be lost.`,
      timestamp: Date.now(),
      errorDetails: errors.join("; "),
    });
  }

  return { syncedCount, remainingUnsynced: remaining, errors };
}

export async function deleteUserLedgerEntry(entryId: string, userId: string): Promise<void> {
  try {
    if (!entryId.startsWith("loc_")) {
      await deleteDoc(doc(db, "ledgerEntries", entryId));
    }
  } catch (err: any) {
    console.error("Firestore delete failed:", err);
    notifySyncIssue({
      type: "write_error",
      message: "Failed to delete entry from Cloud Firestore: " + (err.message || "Unknown error"),
      timestamp: Date.now(),
    });
    throw err;
  } finally {
    const local = getLocalLedgerEntries(userId);
    saveLocalLedgerEntries(userId, local.filter((e) => e.id !== entryId));
  }
}

// User Profile Service (Jurisdiction & Trading History in users/{userId})
const USER_PROFILE_CACHE_PREFIX = "vendor_user_profile_";

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const profile: UserProfile = {
        country: data.country || "",
        region: data.region || "",
        tradingDuration: data.tradingDuration || "",
        languageCode: data.languageCode || "",
        languageName: data.languageName || "",
        currencyCode: data.currencyCode || "",
        currencySymbol: data.currencySymbol || "",
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      };
      localStorage.setItem(USER_PROFILE_CACHE_PREFIX + userId, JSON.stringify(profile));
      return profile;
    }
  } catch (err) {
    console.warn("Firestore user profile fetch error, checking local storage cache:", err);
  }

  // Fallback to local cache
  try {
    const raw = localStorage.getItem(USER_PROFILE_CACHE_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const dataToSave: Record<string, any> = {
    country: profile.country.trim(),
    region: profile.region.trim(),
    tradingDuration: profile.tradingDuration.trim(),
    updatedAt: serverTimestamp(),
  };

  if (profile.languageCode) dataToSave.languageCode = profile.languageCode.trim();
  if (profile.languageName) dataToSave.languageName = profile.languageName.trim();
  if (profile.currencyCode) dataToSave.currencyCode = profile.currencyCode.trim();
  if (profile.currencySymbol) dataToSave.currencySymbol = profile.currencySymbol.trim();

  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn("Firestore user profile write failed, caching locally:", err);
  }

  // Always cache locally
  try {
    localStorage.setItem(
      USER_PROFILE_CACHE_PREFIX + userId,
      JSON.stringify({ ...profile, updatedAt: Date.now() })
    );
  } catch (e) {
    console.warn("Failed to cache user profile locally:", e);
  }
}

