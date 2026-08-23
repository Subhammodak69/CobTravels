import Toast from 'react-native-toast-message';

export function showApiError(error: unknown, fallback = 'Please try again in a moment.') {
  const message = error instanceof Error && error.message ? error.message : fallback;
  Toast.show({
    type: 'error',
    text1: 'Unable to complete request',
    text2: message,
    position: 'top',
    topOffset: 12,
    visibilityTime: 3600,
  });
}
