import {NativeModules} from 'react-native';
import * as Keychain from 'react-native-keychain';

interface SecureCredentials {
  username: string;
  password: string;
  service: string;
}

const memoryCredentials = new Map<string, SecureCredentials>();

const hasNativeKeychain = () => Boolean(NativeModules.RNKeychainManager);

const keychainOptions = (service: string): Keychain.SetOptions => ({
  service,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
});

export const secureStorage = {
  async getCredentials(service: string) {
    if (!hasNativeKeychain()) {
      return memoryCredentials.get(service) ?? null;
    }

    const credentials = await Keychain.getGenericPassword({service});

    if (!credentials) {
      return null;
    }

    return {
      username: credentials.username,
      password: credentials.password,
      service: credentials.service,
    };
  },

  async setCredentials(service: string, username: string, password: string) {
    if (!hasNativeKeychain()) {
      memoryCredentials.set(service, {username, password, service});
      return;
    }

    await Keychain.setGenericPassword(
      username,
      password,
      keychainOptions(service),
    );
  },

  async removeCredentials(service: string) {
    if (!hasNativeKeychain()) {
      memoryCredentials.delete(service);
      return;
    }

    await Keychain.resetGenericPassword({service});
  },
};
