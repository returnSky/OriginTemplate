import {createMMKV} from 'react-native-mmkv';

import {appConfig} from '@/config';

export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface SyncStringStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const mmkvStorage = createMMKV(appConfig.storage.mmkv);

export const syncStringStorage: SyncStringStorage = {
  getItem(key) {
    return mmkvStorage.getString(key) ?? null;
  },

  setItem(key, value) {
    mmkvStorage.set(key, value);
  },

  removeItem(key) {
    mmkvStorage.remove(key);
  },
};

export const appStorage: KeyValueStorage = {
  async getItem(key) {
    return syncStringStorage.getItem(key);
  },

  async setItem(key, value) {
    syncStringStorage.setItem(key, value);
  },

  async removeItem(key) {
    syncStringStorage.removeItem(key);
  },

  async clear() {
    mmkvStorage.clearAll();
  },
};

export const getStorageInfo = () => ({
  id: mmkvStorage.id,
  keys: mmkvStorage.getAllKeys(),
  length: mmkvStorage.length,
  byteSize: mmkvStorage.byteSize,
  isEncrypted: mmkvStorage.isEncrypted,
});
