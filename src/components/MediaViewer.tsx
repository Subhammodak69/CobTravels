import React from 'react';
import {Modal, View, Text, Pressable, Image, Share, StatusBar, StyleSheet, Linking} from 'react-native';
import Video from 'react-native-video';
import {COLORS} from '../theme/theme';

export interface MediaSelection {
  uri: string;
  type: 'image' | 'video';
  title?: string;
}

function getVideoHeaders(uri: string) {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
    Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
  };
  if (uri.includes('mixkit.co')) {
    headers.Referer = 'https://mixkit.co/';
    headers.Origin = 'https://mixkit.co';
  }
  return headers;
}

interface Props {
  media: MediaSelection | null;
  onClose: () => void;
}

export const MediaViewer: React.FC<Props> = ({media, onClose}) => {
  const [error, setError] = React.useState('');
  if (!media) return null;
  const share = () => Share.share({message: media.uri, title: media.title || 'Coochbehar Travel media'});
  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconButton} accessibilityLabel="Close media viewer">
            <Text style={styles.icon}>×</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>{media.title || 'Coochbehar Travel'}</Text>
          <Pressable onPress={share} style={styles.iconButton} accessibilityLabel="Share media">
            <Text style={styles.share}>↗</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          {media.type === 'video' ? (
            <>
              <Video
                source={{uri: media.uri, type: 'mp4', headers: getVideoHeaders(media.uri)}}
                style={styles.video}
                resizeMode="contain"
                controls
                paused={false}
                fullscreenAutorotate
                fullscreenOrientation="all"
                preventsDisplaySleepDuringVideoPlayback
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                onLoad={() => setError('')}
                onError={(event) => {
                  const detail = event?.error;
                  const message = detail?.errorString || detail?.localizedDescription || 'This video could not be played on this device.';
                  setError(message);
                  console.warn('Media playback error', JSON.stringify(event));
                }}
              />
              {error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Unable to play this video</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={() => Linking.openURL(media.uri)} style={styles.browserButton}>
                    <Text style={styles.browserButtonText}>Open in browser</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : (
            <Image source={{uri: media.uri}} style={styles.image} resizeMode="contain" />
          )}
        </View>
        <Pressable onPress={onClose} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  header: {height: 72, paddingHorizontal: 16, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  iconButton: {width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center'},
  icon: {fontSize: 30, lineHeight: 31, color: '#fff', fontWeight: '300'},
  share: {fontSize: 24, color: COLORS.gold, fontWeight: '800'},
  title: {flex: 1, color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '700', marginHorizontal: 12},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  image: {width: '100%', height: '100%'},
  video: {width: '100%', height: '100%'},
  errorCard: {position: 'absolute', left: 20, right: 20, bottom: 82, padding: 16, borderRadius: 12, backgroundColor: 'rgba(15,23,42,.94)'},
  errorTitle: {color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 6},
  errorText: {color: '#cbd5e1', fontSize: 11, lineHeight: 16, marginBottom: 12},
  browserButton: {alignSelf: 'flex-start', backgroundColor: COLORS.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18},
  browserButtonText: {color: COLORS.primaryDark, fontSize: 11, fontWeight: '800'},
  doneButton: {alignSelf: 'center', marginBottom: 22, paddingHorizontal: 26, paddingVertical: 11, borderRadius: 22, backgroundColor: COLORS.primary},
  doneText: {color: '#fff', fontSize: 13, fontWeight: '800'},
});
