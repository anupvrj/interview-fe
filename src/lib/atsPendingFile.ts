/**
 * The PDF someone uploaded, kept until their check is done so they never upload it twice:
 * across sign-up (even when email verification opens another tab), a refresh mid-scan, or
 * the hop from the public page to the dashboard. IndexedDB holds files of any size and is
 * shared by tabs; a copy in memory covers in-app navigation and browsers without it.
 */

const DB_NAME = "interviewtrix-ats";
const STORE = "pending";
const KEY = "upload";
/** Same lifetime as a signed-out check. */
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
/** sessionStorage, from before IndexedDB; still read once so an upload in flight survives. */
const LEGACY_KEY = "ats-checker-pending-upload";

export type PendingUpload = { file: File; jobDescription: string };

type Stored = { blob: Blob; name: string; type: string; jobDescription: string; savedAt: number };

let inMemory: (PendingUpload & { savedAt: number }) | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function savePendingUpload(file: File, jobDescription: string): Promise<void> {
  const savedAt = Date.now();
  inMemory = { file, jobDescription, savedAt };
  const stored: Stored = { blob: file, name: file.name, type: file.type || "application/pdf", jobDescription, savedAt };
  await withStore("readwrite", (store) => store.put(stored, KEY));
}

function readLegacy(): PendingUpload | null {
  try {
    const raw = sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LEGACY_KEY);
    const { fileDataUrl, fileName, fileType, jobDescription } = JSON.parse(raw) as Record<string, string>;
    const binary = atob(fileDataUrl.split(",")[1] ?? "");
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { file: new File([bytes], fileName, { type: fileType || "application/pdf" }), jobDescription: jobDescription ?? "" };
  } catch {
    return null;
  }
}

export async function loadPendingUpload(): Promise<PendingUpload | null> {
  if (inMemory && Date.now() - inMemory.savedAt < MAX_AGE_MS) {
    return { file: inMemory.file, jobDescription: inMemory.jobDescription };
  }
  const stored = await withStore<Stored | undefined>("readonly", (store) => store.get(KEY));
  if (stored?.blob && Date.now() - stored.savedAt < MAX_AGE_MS) {
    return {
      file: new File([stored.blob], stored.name, { type: stored.type }),
      jobDescription: stored.jobDescription ?? "",
    };
  }
  if (stored) await clearPendingUpload();
  return readLegacy();
}

export async function clearPendingUpload(): Promise<void> {
  inMemory = null;
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode */
  }
  await withStore("readwrite", (store) => store.delete(KEY));
}
