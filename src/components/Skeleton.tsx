import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors, useColors } from '../theme/theme';

// ── Animated shimmer block ──────────────────────────────────────────────────────
export const SkeletonBlock: React.FC<{ style?: any; color?: string }> = ({ style, color }) => {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: color || colors.borderDark, borderRadius: 7 }, style, { opacity }]} />;
};

// ── Tour skeletons (existing) ───────────────────────────────────────────────────
export const TourSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: C.border }}>
      <SkeletonBlock style={{ width: '100%', height: 190, borderRadius: 0 }} />
      <View style={{ padding: 16 }}>
        <SkeletonBlock style={{ width: '38%', height: 11, marginBottom: 14 }} />
        <SkeletonBlock style={{ width: '78%', height: 22, marginBottom: 14 }} />
        <SkeletonBlock style={{ width: '100%', height: 12, marginBottom: 9 }} />
        <SkeletonBlock style={{ width: '65%', height: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
          <SkeletonBlock style={{ width: '28%', height: 18 }} />
          <SkeletonBlock style={{ width: 86, height: 34, borderRadius: 18 }} />
        </View>
      </View>
    </View>
  );
};

export const TourSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ padding: 16 }}>{Array.from({ length: count }, (_, index) => <TourSkeleton key={index} />)}</View>
);

export const TourListSkeleton: React.FC = () => <TourSkeletonList count={3} />;

export const TourDetailSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SkeletonBlock style={{ width: '100%', height: 300, borderRadius: 0 }} />
      <View style={{ padding: 22 }}>
        <SkeletonBlock style={{ width: '38%', height: 11, marginBottom: 14 }} />
        <SkeletonBlock style={{ width: '85%', height: 32, marginBottom: 20 }} />
        <SkeletonBlock style={{ width: '100%', height: 12, marginBottom: 9 }} />
        <SkeletonBlock style={{ width: '65%', height: 12 }} />
      </View>
    </View>
  );
};

// ── Profile stats skeleton (2×2 grid cards) ─────────────────────────────────────
export const ProfileStatsSkeleton: React.FC = () => {
  const C = useColors();
  const card = { flexBasis: '47%' as any, flexGrow: 1, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
      {[0, 1, 2, 3].map(i => (
        <View style={card} key={i}>
          <SkeletonBlock style={{ width: 24, height: 24, borderRadius: 12 }} />
          <SkeletonBlock style={{ width: '50%', height: 18, marginTop: 6 }} />
          <SkeletonBlock style={{ width: '70%', height: 10, marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

// ── Session row skeleton ────────────────────────────────────────────────────────
const SessionRowSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <SkeletonBlock style={{ width: 38, height: 38, borderRadius: 19 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBlock style={{ width: '70%', height: 13, marginBottom: 6 }} />
        <SkeletonBlock style={{ width: '45%', height: 10 }} />
      </View>
      <SkeletonBlock style={{ width: 42, height: 28, borderRadius: 7 }} />
    </View>
  );
};

export const SessionsSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View>
      {[0, 1, 2].map(i => <SessionRowSkeleton key={i} />)}
    </View>
  );
};

// ── Trip card skeleton ──────────────────────────────────────────────────────────
const TripCardSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonBlock style={{ width: '30%', height: 11 }} />
        <SkeletonBlock style={{ width: 50, height: 20, borderRadius: 6 }} />
      </View>
      <SkeletonBlock style={{ width: '75%', height: 16, marginBottom: 10 }} />
      <SkeletonBlock style={{ width: '60%', height: 12, marginTop: 8 }} />
      <SkeletonBlock style={{ width: '50%', height: 12, marginTop: 8 }} />
    </View>
  );
};

export const TripListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>{Array.from({ length: count }, (_, i) => <TripCardSkeleton key={i} />)}</View>
);

// ── Invoice card skeleton ───────────────────────────────────────────────────────
const InvoiceCardSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonBlock style={{ width: '28%', height: 11 }} />
        <SkeletonBlock style={{ width: '20%', height: 16 }} />
      </View>
      <SkeletonBlock style={{ width: '65%', height: 14, marginBottom: 10 }} />
      <SkeletonBlock style={{ width: '55%', height: 12, marginTop: 8 }} />
      <SkeletonBlock style={{ width: '50%', height: 12, marginTop: 8 }} />
    </View>
  );
};

export const InvoiceListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>{Array.from({ length: count }, (_, i) => <InvoiceCardSkeleton key={i} />)}</View>
);

// ── Enquiry card skeleton ───────────────────────────────────────────────────────
const EnquiryCardSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <SkeletonBlock style={{ flex: 1, height: 14 }} />
        <SkeletonBlock style={{ width: 48, height: 20, borderRadius: 6 }} />
      </View>
      <SkeletonBlock style={{ width: '60%', height: 12, marginTop: 7 }} />
      <SkeletonBlock style={{ width: '50%', height: 12, marginTop: 7 }} />
    </View>
  );
};

export const EnquiryListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>{Array.from({ length: count }, (_, i) => <EnquiryCardSkeleton key={i} />)}</View>
);

// ── Document card skeleton ──────────────────────────────────────────────────────
const DocumentCardSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, marginBottom: 9 }}>
      <SkeletonBlock style={{ width: 40, height: 40, borderRadius: 10, marginRight: 11 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBlock style={{ width: '70%', height: 14, marginBottom: 6 }} />
        <SkeletonBlock style={{ width: '45%', height: 10, marginBottom: 5 }} />
        <SkeletonBlock style={{ width: '30%', height: 10 }} />
      </View>
      <SkeletonBlock style={{ width: 21, height: 21, borderRadius: 10, marginLeft: 10 }} />
    </View>
  );
};

export const DocumentListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>{Array.from({ length: count }, (_, i) => <DocumentCardSkeleton key={i} />)}</View>
);

// ── Notification settings row skeleton ──────────────────────────────────────────
const NotifSettingRowSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, padding: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <SkeletonBlock style={{ width: 20, height: 20, borderRadius: 10, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonBlock style={{ width: '60%', height: 14, marginBottom: 4 }} />
          <SkeletonBlock style={{ width: '80%', height: 11 }} />
        </View>
      </View>
      <SkeletonBlock style={{ width: 48, height: 28, borderRadius: 14 }} />
    </View>
  );
};

export const NotifSettingsSkeleton: React.FC = () => (
  <View>
    <SkeletonBlock style={{ width: '55%', height: 12, marginBottom: 12 }} />
    {[0, 1, 2, 3].map(i => <NotifSettingRowSkeleton key={i} />)}
  </View>
);

// ── Referral activity row skeleton ──────────────────────────────────────────────
const ReferralRowSkeleton: React.FC = () => {
  const C = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 13, marginBottom: 8 }}>
      <SkeletonBlock style={{ width: 10, height: 10, borderRadius: 5, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBlock style={{ width: '55%', height: 13, marginBottom: 5 }} />
        <SkeletonBlock style={{ width: '40%', height: 10 }} />
      </View>
      <SkeletonBlock style={{ width: 30, height: 12 }} />
    </View>
  );
};

export const ReferralListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>{Array.from({ length: count }, (_, i) => <ReferralRowSkeleton key={i} />)}</View>
);
