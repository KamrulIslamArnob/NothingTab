// Thin wrapper around chrome.storage so the rest of the codebase
// only depends on a minimal get/set/list/delete surface.
// Hardcoded to use chrome.storage.local.

export class ChromeStorageClient {
  get area() { return "local"; }

  async getAll(key) {
    const out = await chrome.storage.local.get(key);
    return out[key] ?? [];
  }

  async getOne(key) {
    const out = await chrome.storage.local.get(key);
    return out[key] ?? null;
  }

  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (err) {
      console.warn(`Failed to save ${key} to local storage:`, err);
    }
  }

  async remove(key) {
    await chrome.storage.local.remove(key);
  }

  // Cross-context change subscription — wired into the EventBus.
  onChanged(callback) {
    const listener = (changes, area) => {
      if (area !== "local") return;
      callback(changes);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}