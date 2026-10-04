const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Build environment values come from react-native-config's native module.
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
