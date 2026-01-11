import { openDB } from 'idb';

const DB_NAME = 'avatar-creator-db';
const STORE_NAME = 'reference-images';
const CONFIG_STORE_NAME = 'configuration';
const DB_VERSION = 2;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
        db.createObjectStore(CONFIG_STORE_NAME);
      }
    },
  });
}

export async function saveImages(files: File[]) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await store.clear();
  
  for (const file of files) {
    // We can't store File objects directly in some browsers/versions reliably without blob serialization, 
    // but modern IDB supports Blobs/Files. 
    // Storing as { file: file } or just the file.
    await store.add({ file, name: file.name, type: file.type, lastModified: file.lastModified });
  }
  
  await tx.done;
}

export async function loadImages(): Promise<File[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const records = await store.getAll();
  // Records are { file: File, ... }
  // We return just the File objects
  return records.map((r: any) => r.file);
}

export async function clearImages() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}

export async function saveConfig(config: any) {
  const db = await initDB();
  await db.put(CONFIG_STORE_NAME, config, 'current-config');
}

export async function loadConfig(): Promise<any> {
    const db = await initDB();
    return await db.get(CONFIG_STORE_NAME, 'current-config');
}

export async function clearConfig() {
    const db = await initDB();
    await db.delete(CONFIG_STORE_NAME, 'current-config');
}
