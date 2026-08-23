import Toast from 'react-native-toast-message';

const REDACTED_KEYS = new Set(['otp', 'id_token', 'access_token', 'refresh_token']);

function safePayload(payload: unknown) {
  if (!payload) return '{}';
  try {
    const value = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const redact = (item: any): any => {
      if (Array.isArray(item)) return item.map(redact);
      if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, REDACTED_KEYS.has(key) ? '<redacted>' : redact(value)]));
      return item;
    };
    return JSON.stringify(redact(value));
  } catch { return String(payload); }
}

export function showApiRequest(method: string, url: string, payload?: unknown) {
  Toast.show({type: 'api', text1: `${method.toUpperCase()} ${url}`, text2: safePayload(payload), position: 'top', topOffset: 12, visibilityTime: 5000});
}

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
