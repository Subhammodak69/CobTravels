import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_API, getAccessToken } from '../api/client';
import { getTrackedVisitorId } from '../api/visitors';

const VISITOR_SESSION_ID_KEY = '@cobtravels/visitor_session_id';

export async function createVisitorSocket(customerId = ''): Promise<Socket> {
  const [token, visitorId, sessionId] = await Promise.all([
    getAccessToken(),
    getTrackedVisitorId(),
    AsyncStorage.getItem(VISITOR_SESSION_ID_KEY),
  ]);

  const socket = io(BASE_API, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    auth: {
      token: token || undefined,
      visitor_id: visitorId || undefined,
      session_id: sessionId || undefined,
      customer_id: customerId || undefined,
      source: 'mobile',
      device: 'mobile',
    },
  });

  socket.connect();
  return socket;
}

export function createNotificationSocket(
  token: string,
  onMessage: (message: any) => void
): WebSocket | null {
  if (!token) return null;

  const url = `${BASE_API.replace(/^http/, 'ws')}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(url);
  socket.onmessage = event => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // Ignore malformed server messages.
    }
  };
  return socket;
}
