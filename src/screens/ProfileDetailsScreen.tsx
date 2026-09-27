import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { AuthUser } from '../api/tourApi';
import { useTheme } from '../theme/theme';
import { NavScreen } from '../types';

interface Props {
  user: AuthUser | null;
  onNavigate: (screen: NavScreen) => void;
  onRefresh?: () => Promise<void> | void;
}

const formatDate = (value?: string) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DetailRow = ({
  icon,
  label,
  value,
  styles,
  colors,
}: {
  icon: string;
  label: string;
  value?: string | null;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Feather name={icon} size={16} color={colors.primary} />
    </View>
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, !value && styles.mutedValue]}>
        {value || 'Not provided'}
      </Text>
    </View>
  </View>
);

export const ProfileDetailsScreen: React.FC<Props> = ({ user, onRefresh }) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = async () => { setRefreshing(true); try { await onRefresh?.(); } finally { setRefreshing(false); } };
  const displayName = user?.name || 'Traveller';
  const accountStatus = user?.is_active === false ? 'Inactive' : 'Active';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user?.profile_pic ? (
            <Image
              source={{ uri: user.profile_pic }}
              style={styles.avatarImage}
              resizeMode="cover"
              accessibilityLabel="Profile picture"
            />
          ) : (
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.identifier}>{user?.email || user?.mobile || 'Customer account'}</Text>
        <View style={[styles.statusPill, user?.is_active === false && styles.inactivePill]}>
          <View style={[styles.statusDot, user?.is_active === false && styles.inactiveDot]} />
          <Text style={[styles.statusText, user?.is_active === false && styles.inactiveText]}>
            {accountStatus} account
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Contact information</Text>
      <View style={styles.sectionCard}>
        <DetailRow icon="user" label="Full name" value={user?.name} styles={styles} colors={COLORS} />
        <DetailRow icon="phone" label="Mobile number" value={user?.mobile} styles={styles} colors={COLORS} />
        <DetailRow icon="mail" label="Email address" value={user?.email} styles={styles} colors={COLORS} />
        <DetailRow icon="map-pin" label="Address" value={user?.address} styles={styles} colors={COLORS} />
      </View>

      <Text style={styles.sectionTitle}>Emergency contact</Text>
      <View style={styles.sectionCard}>
        <DetailRow
          icon="user-plus"
          label="Contact name"
          value={user?.emergency_contact_name}
          styles={styles}
          colors={COLORS}
        />
        <DetailRow
          icon="phone-call"
          label="Contact number"
          value={user?.emergency_contact_mobile}
          styles={styles}
          colors={COLORS}
        />
      </View>

      <Text style={styles.sectionTitle}>Account information</Text>
      <View style={styles.sectionCard}>
        <DetailRow icon="hash" label="Customer code" value={user?.customer_code} styles={styles} colors={COLORS} />
        <DetailRow icon="globe" label="Account source" value={user?.source} styles={styles} colors={COLORS} />
        <DetailRow icon="calendar" label="Member since" value={formatDate(user?.created_at)} styles={styles} colors={COLORS} />
        <DetailRow icon="refresh-cw" label="Last updated" value={formatDate(user?.updated_at)} styles={styles} colors={COLORS} />
      </View>
    </ScrollView>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 36 },
    profileCard: {
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderColor: COLORS.border,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 24,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: COLORS.primarySubtle,
      borderColor: isDark ? COLORS.primaryLight : COLORS.primary,
      borderRadius: 52,
      borderWidth: 3,
      height: 104,
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
      width: 104,
    },
    avatarImage: { height: '100%', width: '100%' },
    avatarInitial: { color: COLORS.primary, fontSize: 40, fontWeight: '900' },
    name: { color: COLORS.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    identifier: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },
    statusPill: {
      alignItems: 'center',
      backgroundColor: COLORS.successLight,
      borderRadius: 20,
      flexDirection: 'row',
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    inactivePill: { backgroundColor: COLORS.dangerLight },
    statusDot: { backgroundColor: COLORS.success, borderRadius: 4, height: 8, marginRight: 6, width: 8 },
    inactiveDot: { backgroundColor: COLORS.danger },
    statusText: { color: COLORS.success, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    inactiveText: { color: COLORS.danger },
    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900', marginBottom: 9, marginLeft: 2 },
    sectionCard: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.border,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
      paddingHorizontal: 14,
    },
    detailRow: {
      alignItems: 'center',
      borderBottomColor: COLORS.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: 68,
      paddingVertical: 10,
    },
    detailIcon: {
      alignItems: 'center',
      backgroundColor: COLORS.primarySubtle,
      borderRadius: 10,
      height: 34,
      justifyContent: 'center',
      marginRight: 12,
      width: 34,
    },
    detailCopy: { flex: 1 },
    detailLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
    detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
    mutedValue: { color: COLORS.textMuted, fontWeight: '500' },
  });
