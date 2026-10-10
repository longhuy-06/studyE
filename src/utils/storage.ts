/**
 * Safe storage wrapper to prevent crashes when localStorage is blocked
 * (e.g. cross-origin iframes, strict privacy mode, disabled cookies)
 */

class MemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const memoryFallback = new MemoryStorage();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const isAvailable = isLocalStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    if (isAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryFallback.getItem(key);
      }
    }
    return memoryFallback.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (isAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory
      }
    }
    memoryFallback.setItem(key, value);
  },

  removeItem(key: string): void {
    if (isAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Fallback to memory
      }
    }
    memoryFallback.removeItem(key);
  },

  clear(): void {
    if (isAvailable) {
      try {
        window.localStorage.clear();
      } catch {
        // Fallback to memory
      }
    }
    memoryFallback.clear();
  },
};
