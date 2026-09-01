const androidPlatform = require('@react-native-community/cli-platform-android');

module.exports = {
  platforms: {
    android: {
      npmPackageName: '@react-native-community/cli-platform-android',
      projectConfig: androidPlatform.projectConfig,
      dependencyConfig: androidPlatform.dependencyConfig,
    },
  },
  project: {
    android: {
      sourceDir: './android',
      appName: 'app',
      packageName: 'com.cobtravels',
    },
    ios: {},
  },
};
