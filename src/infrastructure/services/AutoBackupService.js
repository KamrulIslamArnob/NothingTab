export class AutoBackupService {
  constructor() {
    this.dbName = 'neptab-backup-db';
    this.storeName = 'handles';
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveHandle(handle) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(handle, 'backup-file');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getHandle() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get('backup-file');

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async setupWithSavePicker() {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'Nothing-Tab-backup.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
      });
      await this.saveHandle(handle);
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to setup auto backup:', e);
        throw e;
      }
      return false;
    }
  }

  async checkPermission() {
    const handle = await this.getHandle();
    if (!handle) return false;
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    return perm === 'granted';
  }

  async requestPermission() {
    const handle = await this.getHandle();
    if (!handle) return false;
    try {
      const perm = await handle.requestPermission({ mode: 'readwrite' });
      return perm === 'granted';
    } catch (e) {
      console.error('Failed to request permission:', e);
      return false;
    }
  }

  async performBackup() {
    try {
      const handle = await this.getHandle();
      if (!handle) return false;

      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        // Return a special flag so the UI can show the resume button
        return 'requires_permission';
      }

      const data = await chrome.storage.local.get();
      const content = JSON.stringify(data, null, 2);

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (e) {
      console.error('AutoBackupService: Backup failed', e);
      return false;
    }
  }
}
