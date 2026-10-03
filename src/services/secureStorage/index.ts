import {NativeModules} from 'react-native';
import * as Keychain from 'react-native-keychain';

interface SecureCredentials {
  username: string;
  password: string;
  service: string;
}

const memoryCredentials = new Map<string, SecureCredentials>();
const hasNativeKeychain = () => Boolean(NativeModules.RNKeychainManager);

const assertDevelopmentFallback = () => {
  if (!__DEV__) {
    throw new Error(
      'Native Keychain is unavailable. Rebuild the app with react-native-keychain.',
    );
  }
};

const keychainOptions = (service: string): Keychain.SetOptions => ({
  service,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
});

export const secureStorage = {
  async getCredentials(service: string) {
    if (!hasNativeKeychain()) {
      assertDevelopmentFallback();
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
      assertDevelopmentFallback();
      memoryCredentials.set(service, {username, password, service});
      return;
    }

    const result = await Keychain.setGenericPassword(
      username,
      password,
      keychainOptions(service),
    );

    if (result === false) {
      throw new Error('Failed to save secure credentials.');
    }
  },

  async removeCredentials(service: string) {
    if (!hasNativeKeychain()) {
      assertDevelopmentFallback();
      memoryCredentials.delete(service);
      return;
    }

    const removed = await Keychain.resetGenericPassword({service});

    if (!removed) {
      throw new Error('Failed to remove secure credentials.');
    }
  },
};
