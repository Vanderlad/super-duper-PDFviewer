// idb_store.js
const DB_NAME = "pdfbg";
const STORE = "files";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveFile(file) {
  const db = await openDb();
  const id = crypto.randomUUID();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  return id;
}

export async function idbGetBlobUrl(id) {
  if (!id) throw new Error("No localId set");

  const db = await openDb();

  const blob = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!blob) throw new Error("Local file missing");
  return URL.createObjectURL(blob);
}