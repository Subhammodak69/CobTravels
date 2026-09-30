import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';

export interface SharedFile {
  uri: string;
  name: string;
  type?: string;
}

const nativeShareIntent = NativeModules.ShareIntent as {
  getInitialShare?: () => Promise<SharedFile | null>;
} | undefined;

export async function getInitialSharedFile(): Promise<SharedFile | null> {
  if (Platform.OS !== 'android' || !nativeShareIntent?.getInitialShare) return null;
  return nativeShareIntent.getInitialShare();
}

export function subscribeToSharedFiles(listener: (file: SharedFile) => void) {
  if (Platform.OS !== 'android') return {remove: () => undefined};
  return DeviceEventEmitter.addListener('shareIntentReceived', listener);
}
