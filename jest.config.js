module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.ts',
    '^react-native-vector-icons/Ionicons$': '<rootDir>/__mocks__/Ionicons.tsx',
    '^react-native-toast-message$': '<rootDir>/__mocks__/react-native-toast-message.tsx',
    '^@react-native-documents/picker$': '<rootDir>/__mocks__/react-native-document-picker.ts',
    '^@react-native-google-signin/google-signin$': '<rootDir>/__mocks__/google-signin.ts',
  },
};
