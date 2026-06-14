interface Listener {
  remove: () => void;
}

interface MockConfiguration {
  id?: string;
}

const createStorage = (configuration: MockConfiguration = {}) => {
  const values = new Map<string, boolean | string | number | ArrayBuffer>();
  const listeners = new Set<(key: string) => void>();

  const notify = (key: string) => {
    listeners.forEach(listener => listener(key));
  };

  return {
    id: configuration.id ?? 'mmkv.default',
    get length() {
      return values.size;
    },
    get size() {
      return this.byteSize;
    },
    get byteSize() {
      return JSON.stringify(Array.from(values.entries())).length;
    },
    isReadOnly: false,
    isEncrypted: false,
    set(key: string, value: boolean | string | number | ArrayBuffer) {
      values.set(key, value);
      notify(key);
    },
    getBoolean(key: string) {
      const value = values.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getString(key: string) {
      const value = values.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber(key: string) {
      const value = values.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getBuffer(key: string) {
      const value = values.get(key);
      return value instanceof ArrayBuffer ? value : undefined;
    },
    contains(key: string) {
      return values.has(key);
    },
    remove(key: string) {
      const removed = values.delete(key);
      notify(key);
      return removed;
    },
    getAllKeys() {
      return Array.from(values.keys());
    },
    clearAll() {
      const keys = Array.from(values.keys());
      values.clear();
      keys.forEach(notify);
    },
    recrypt() {},
    encrypt() {},
    decrypt() {},
    trim() {},
    addOnValueChangedListener(listener: (key: string) => void): Listener {
      listeners.add(listener);
      return {
        remove: () => listeners.delete(listener),
      };
    },
    importAllFrom() {
      return 0;
    },
    name: 'MMKV',
    dispose() {},
    equals() {
      return false;
    },
  };
};

export const createMMKV = createStorage;
export const useMMKV = createStorage;
export const useMMKVString = () => [undefined, () => undefined] as const;
export const useMMKVBoolean = () => [undefined, () => undefined] as const;
export const useMMKVNumber = () => [undefined, () => undefined] as const;
export const useMMKVBuffer = () => [undefined, () => undefined] as const;
export const useMMKVObject = () => [undefined, () => undefined] as const;
export const useMMKVKeys = () => [] as string[];
export const useMMKVListener = () => undefined;
export const existsMMKV = () => true;
export const deleteMMKV = () => true;
