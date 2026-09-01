import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiEnvelope } from './types';

export const BASE_API = 'https://coochbehar-travels.onrender.com';
export const ACCESS_TOKEN_KEY = '@cobtravels/access_token';
export const REFRESH_TOKEN_KEY = '@cobtravels/refresh_token';
export const VISITOR_ID_KEY = '@cobtravels/visitor_id';
export const REFERRAL_CODE_KEY = '@cobtravels/referral_code';

export const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function saveTokens(access?: string, refresh?: string) {
  if (access) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = false
): Promise<T> {
  const token = auth ? await getAccessToken() : null;
  const url = `${BASE_API}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body as T;
}

// In-flight refresh promise to prevent multiple concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await getRefreshToken();
      const payload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {};

      const r = await request<ApiEnvelope<{ access_token?: string; refresh_token?: string }>>(
        '/api/v1/sessions/refresh',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      const accessToken = r.data?.access_token;
      const newRefreshToken = r.data?.refresh_token;

      if (accessToken) {
        await saveTokens(accessToken, newRefreshToken || storedRefreshToken || undefined);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authenticated<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, init, true);
  } catch (error) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    throw error;
  }
}
