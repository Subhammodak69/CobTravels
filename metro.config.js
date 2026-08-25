const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// React Native 0.87.0's virtualized-lists package imports a private
// feature-flags path that is not present in react-native's exports map.
// Alias only that path while keeping package exports enabled for assets.
const path = require('path');

const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'react-native/src/private/featureflags/ReactNativeFeatureFlags') {
        return {
          type: 'sourceFile',
          filePath: path.join(
            __dirname,
            'node_modules/react-native/src/private/featureflags/ReactNativeFeatureFlags.js',
          ),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
