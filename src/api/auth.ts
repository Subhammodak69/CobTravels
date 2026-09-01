import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  request,
  authenticated,
  saveTokens,
  clearTokens,
  getRefreshToken,
  REFERRAL_CODE_KEY,
} from './client';
import {
  ApiEnvelope,
  AuthTokenData,
  AuthUser,
  OtpRequestData,
  CustomerOtpPurpose,
  SessionItem,
} from './types';
import { getAuthVisitorId } from './visitors';

export async function getStoredReferralCode(): Promise<string | null> {
  return AsyncStorage.getItem(REFERRAL_CODE_KEY);
}

function extractTokens(data: any): { access?: string; refresh?: string } {
  return {
    access:
      data?.access_token ||
      data?.accessToken ||
      data?.token ||
      data?.data?.access_token,
    refresh:
      data?.refresh_token ||
      data?.refreshToken ||
      data?.data?.refresh_token,
  };
}

export async function requestOtp(
  identifier: string,
  purpose: CustomerOtpPurpose = 'LOGIN',
  referralCode?: string
): Promise<ApiEnvelope<OtpRequestData>> {
  return request<ApiEnvelope<OtpRequestData>>('/api/v1/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      purpose,
      visitor_id: await getAuthVisitorId(),
      ...(referralCode ? { referral_code: referralCode } : {}),
    }),
  });
}

export async function verifyOtp(
  identifier: string,
  otp: string,
  name = '',
  purpose: CustomerOtpPurpose = 'LOGIN',
  referralCode?: string
): Promise<ApiEnvelope<AuthTokenData>> {
  const r = await request<ApiEnvelope<AuthTokenData>>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      otp,
      name,
      purpose,
      visitor_id: await getAuthVisitorId(),
      ...(referralCode ? { referral_code: referralCode } : {}),
    }),
  });
  const t = extractTokens(r);
  if (!t.access) {
    throw new Error('The server did not return an access token.');
  }
  await saveTokens(t.access, t.refresh);
  return r;
}

export async function googleAuth(
  idToken: string,
  referralCode?: string
): Promise<ApiEnvelope<AuthTokenData>> {
  const r = await request<ApiEnvelope<AuthTokenData>>('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      id_token: idToken,
      visitor_id: await getAuthVisitorId(),
      ...(referralCode ? { referral_code: referralCode } : {}),
    }),
  });
  const t = extractTokens(r);
  if (!t.access) {
    throw new Error('The server did not return an access token.');
  }
  await saveTokens(t.access, t.refresh);
  return r;
}

export async function logout(): Promise<void> {
  try {
    const storedRefreshToken = await getRefreshToken();
    const payload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {};
    await request('/api/v1/sessions/logout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  } finally {
    await clearTokens();
  }
}

export async function logoutAllSessions(): Promise<ApiEnvelope<any>> {
  return authenticated<ApiEnvelope<any>>('/api/v1/sessions/logout-all', {
    method: 'POST',
  });
}

export async function fetchMe(): Promise<ApiEnvelope<AuthUser>> {
  return authenticated<ApiEnvelope<AuthUser>>('/api/v1/account/me');
}

export async function updateMe(payload: Partial<AuthUser>): Promise<ApiEnvelope<AuthUser>> {
  return authenticated<ApiEnvelope<AuthUser>>('/api/v1/account/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(payload: { identifier: string; otp: string }): Promise<ApiEnvelope<null>> {
  return authenticated<ApiEnvelope<null>>('/api/v1/account/me', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

export async function fetchSessions(): Promise<ApiEnvelope<SessionItem[]>> {
  return authenticated<ApiEnvelope<SessionItem[]>>('/api/v1/sessions/');
}

export async function deleteSession(id: string): Promise<any> {
  return authenticated(`/api/v1/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
