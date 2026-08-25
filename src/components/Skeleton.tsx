import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, useColors } from '../theme/theme';

const SkeletonBlock: React.FC<{ style?: any }> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[styles.block, style, { opacity }]} />;
};

export const TourSkeleton: React.FC = () => (
  <View style={styles.card}>
    <SkeletonBlock style={styles.image} />
    <View style={styles.content}>
      <SkeletonBlock style={styles.small} />
      <SkeletonBlock style={styles.title} />
      <SkeletonBlock style={styles.description} />
      <SkeletonBlock style={styles.descriptionShort} />
      <View style={styles.footer}><SkeletonBlock style={styles.price} /><SkeletonBlock style={styles.button} /></View>
    </View>
  </View>
);

export const TourSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.list}>{Array.from({ length: count }, (_, index) => <TourSkeleton key={index} />)}</View>
);

export const TourListSkeleton: React.FC = () => <TourSkeletonList count={3} />;

export const TourDetailSkeleton: React.FC = () => (
  <View style={styles.detail}>
    <SkeletonBlock style={styles.detailImage} />
    <View style={styles.detailContent}><SkeletonBlock style={styles.small} /><SkeletonBlock style={styles.detailTitle} /><SkeletonBlock style={styles.description} /><SkeletonBlock style={styles.descriptionShort} /></View>
  </View>
);

const makeStyles = (COLORS: ReturnType<typeof useColors>) => StyleSheet.create({
  block: { backgroundColor: COLORS.borderDark, borderRadius: 7 },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: COLORS.border },
  image: { width: '100%', height: 190, borderRadius: 0 },
  content: { padding: 16 },
  small: { width: '38%', height: 11, marginBottom: 14 },
  title: { width: '78%', height: 22, marginBottom: 14 },
  description: { width: '100%', height: 12, marginBottom: 9 },
  descriptionShort: { width: '65%', height: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
  price: { width: '28%', height: 18 },
  button: { width: 86, height: 34, borderRadius: 18 },
  detail: { flex: 1, backgroundColor: COLORS.bg },
  detailImage: { width: '100%', height: 300, borderRadius: 0 },
  detailContent: { padding: 22 },
  detailTitle: { width: '85%', height: 32, marginBottom: 20 },
});

const styles = makeStyles(COLORS);
