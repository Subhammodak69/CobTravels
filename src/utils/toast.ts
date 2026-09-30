import Toast from 'react-native-toast-message';

export function showSuccess(message: string) {
  Toast.show({
    type: 'success',
    text1: 'Download complete',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
}

export function showApiError(error: unknown, fallback = 'Please try again in a moment.') {
  const message = error instanceof Error && error.message ? error.message : fallback;
  Toast.show({
    type: 'error',
    text1: 'Unable to complete request',
    text2: message,
    position: 'top',
    visibilityTime: 3600,
  });
}
