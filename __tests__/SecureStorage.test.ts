import {NativeModules} from 'react-native';
import * as Keychain from 'react-native-keychain';

import {secureStorage} from '@/services/secureStorage';

jest.mock('react-native', () => ({NativeModules: {RNKeychainManager: {}}}));
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device'},
  STORAGE_TYPE: {AES_GCM_NO_AUTH: 'aes'},
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const development = __DEV__;
const setDevelopment = (value: boolean) => {
  Object.defineProperty(global, '__DEV__', {
    value,
    writable: true,
    configurable: true,
  });
};

afterEach(() => {
  setDevelopment(development);
  NativeModules.RNKeychainManager = {};
  jest.clearAllMocks();
});

test('surfaces native Keychain write and removal failures', async () => {
  jest.mocked(Keychain.setGenericPassword).mockResolvedValueOnce(false);
  jest.mocked(Keychain.resetGenericPassword).mockResolvedValueOnce(false);
  await expect(
    secureStorage.setCredentials('test', 'user', 'secret'),
  ).rejects.toThrow('Failed to save');
  await expect(secureStorage.removeCredentials('test')).rejects.toThrow(
    'Failed to remove',
  );
});

test('release builds fail when native Keychain is missing', async () => {
  NativeModules.RNKeychainManager = null;
  setDevelopment(false);
  await expect(secureStorage.getCredentials('test')).rejects.toThrow(
    'Native Keychain is unavailable',
  );
  await expect(
    secureStorage.setCredentials('test', 'user', 'secret'),
  ).rejects.toThrow('Native Keychain is unavailable');
});

test('development fallback retains credentials and supports removal', async () => {
  NativeModules.RNKeychainManager = null;
  setDevelopment(true);
  await secureStorage.setCredentials('test', 'user', 'secret');
  expect(await secureStorage.getCredentials('test')).toEqual({
    username: 'user',
    password: 'secret',
    service: 'test',
  });
  await secureStorage.removeCredentials('test');
  expect(await secureStorage.getCredentials('test')).toBeNull();
});
