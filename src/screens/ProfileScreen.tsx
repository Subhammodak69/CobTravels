import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/theme';
import { AuthUser, fetchUserStats, UserStats, deleteAccount, requestOtp } from '../api/tourApi';
import { NavScreen } from '../types';
import { useAppDialog } from '../components/AppDialog';
import { showApiError } from '../utils/toast';

interface Props { isLoggedIn: boolean; userPhone: string; user: AuthUser | null; enquiries: any[]; onNavigate: (screen: NavScreen) => void; onLogout: (all?: boolean) => void; }

type IconSet = 'feather' | 'mci';

const RowIcon = ({ set, name, size, color }: { set: IconSet; name: string; size: number; color: string }) =>
  set === 'mci'
    ? <MaterialCommunityIcons name={name} size={size} color={color} />
    : <Feather name={name} size={size} color={color} />;

export const ProfileScreen: React.FC<Props> = ({ isLoggedIn, userPhone, user, enquiries, onNavigate, onLogout }) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const { showDialog } = useAppDialog();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Delete account flow state
  const [deleteOtpModalVisible, setDeleteOtpModalVisible] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await fetchUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [isLoggedIn]);

  const identifier = user?.mobile || userPhone;

  const handleDeleteAccountPress = async () => {
    const confirmed = await showDialog({
      title: 'Delete account permanently?',
      message: 'This will permanently erase your profile, trips, documents and enquiries. This cannot be undone.',
      variant: 'warning',
      confirmText: 'Continue',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setSendingOtp(true);
    try {
      // requestOtp(identifier, purpose) - purpose only supports 'LOGIN' | 'SIGNUP' on this backend
      await requestOtp(identifier, 'LOGIN');
      setDeleteOtp('');
      setDeleteOtpModalVisible(true);
    } catch (error) {
      showApiError(error, 'Could not send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleCancelDeleteOtp = () => {
    setDeleteOtpModalVisible(false);
    setDeleteOtp('');
  };

  const confirmDeleteAccount = async () => {
    if (!deleteOtp.trim()) return;
    setDeletingAccount(true);
    try {
      await deleteAccount({ identifier, otp: deleteOtp.trim() });
      setDeleteOtpModalVisible(false);
      setDeleteOtp('');
      await showDialog({
        title: 'Account deleted',
        message: 'Your account and all associated data have been permanently removed.',
        variant: 'success',
      });
      onLogout(true); // force full sign-out after deletion
    } catch (error) {
      showApiError(error, 'We could not verify that code. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.empty}>
        <Feather name="user" size={44} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
        <Text style={styles.emptyTitle}>Guest Traveler</Text>
        <Text style={styles.emptyText}>Sign in to manage your profile, sessions and travel details.</Text>
        <Pressable style={styles.primaryButton} onPress={() => onNavigate('auth')}>
          <Text style={styles.primaryText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = user?.name || user?.mobile || `+91 ${userPhone}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
          <Text style={styles.sub} numberOfLines={1} ellipsizeMode="tail">
            {user?.email || user?.mobile || 'Registered member'}
          </Text>
        </View>
      </View>

      {statsLoading ? (
        <View style={styles.statsLoading}><ActivityIndicator color={COLORS.primary} /></View>
      ) : stats ? (
        <View style={styles.statsGrid}>
          <StatCard iconSet="mci" iconName="airplane" label="Journeys" value={stats.journeys_taken} styles={styles} color={COLORS.primary} />
          <StatCard iconSet="mci" iconName="earth" label="Countries" value={stats.countries_visited} styles={styles} color={COLORS.primary} />
          <StatCard iconSet="feather" iconName="calendar" label="Travel days" value={stats.total_travel_days} styles={styles} color={COLORS.primary} />
          <StatCard iconSet="feather" iconName="star" label="Member since" value={new Date(stats.member_since || '').getFullYear() || '2024'} styles={styles} color={COLORS.primary} />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Account</Text>
      <ProfileRow styles={styles} iconSet="feather" iconName="user" title="Profile details" subtitle="View your personal and emergency contact details" onPress={() => onNavigate('profile_details')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="edit-2" title="Edit profile" subtitle="Update your name, contact and address" onPress={() => onNavigate('edit_profile')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="bell" title="Notification settings" subtitle="Manage push, email & SMS preferences" onPress={() => onNavigate('notification_settings')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="smartphone" title="Active sessions" subtitle="Manage devices signed in to your account" onPress={() => onNavigate('sessions')} />
      <ProfileRow styles={styles} iconSet="mci" iconName="airplane-takeoff" title="My trips" subtitle="View your upcoming and completed trips" onPress={() => onNavigate('my_trips')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="message-square" title="My enquiries" subtitle={`${enquiries.length} travel enquiries submitted`} onPress={() => onNavigate('my_enquiries')} />
      <ProfileRow styles={styles} iconSet="mci" iconName="currency-inr" title="Bills & invoices" subtitle="View your booking bills and invoices" onPress={() => onNavigate('bills_invoices')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="file-text" title="My documents" subtitle="Upload and manage incoming and outgoing files" onPress={() => onNavigate('documents')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="heart" title="My wishlist" subtitle="Your saved travel packages" onPress={() => onNavigate('wishlist')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="gift" title="Refer & earn" subtitle="Share your travel network" onPress={() => onNavigate('referrals')} />

      <Text style={styles.sectionTitle}>Session</Text>
      <ProfileRow
        styles={styles}
        iconSet="feather"
        iconName="log-out"
        title="Log out"
        subtitle="Sign out from this device"
        danger
        onPress={async () => {
          const confirmed = await showDialog({ title: 'Log out?', message: 'You will be signed out from this device.', variant: 'warning', confirmText: 'Log out', cancelText: 'Cancel' });
          if (confirmed) onLogout();
        }}
      />
      <ProfileRow
        styles={styles}
        iconSet="feather"
        iconName="power"
        title="Log out everywhere"
        subtitle="Sign out from all active devices"
        danger
        onPress={async () => {
          const confirmed = await showDialog({ title: 'Log out everywhere?', message: 'All active devices will be signed out of your account.', variant: 'warning', confirmText: 'Log out all', cancelText: 'Cancel' });
          if (confirmed) onLogout(true);
        }}
      />

      <Text style={styles.sectionTitle}>Danger zone</Text>
      <ProfileRow
        styles={styles}
        iconSet="feather"
        iconName="trash-2"
        title={sendingOtp ? 'Sending code…' : 'Delete account'}
        subtitle="Permanently erase your account and data"
        danger
        onPress={sendingOtp ? () => {} : handleDeleteAccountPress}
      />

      {deleteOtpModalVisible && (
        <View style={styles.otpBox}>
          <Text style={styles.otpLabel}>ENTER VERIFICATION CODE</Text>
          <Text style={styles.otpHint}>We sent a code to {identifier}. Enter it below to permanently delete your account.</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            keyboardType="number-pad"
            value={deleteOtp}
            onChangeText={setDeleteOtp}
            placeholder="6-digit code"
            placeholderTextColor={COLORS.textMuted}
            maxLength={6}
            editable={!deletingAccount}
          />
          <View style={styles.otpActions}>
            <Pressable style={styles.otpCancelBtn} onPress={handleCancelDeleteOtp} disabled={deletingAccount}>
              <Text style={styles.otpCancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.otpConfirmBtn, (!deleteOtp.trim() || deletingAccount) && styles.buttonDisabled]}
              onPress={confirmDeleteAccount}
              disabled={!deleteOtp.trim() || deletingAccount}
            >
              {deletingAccount ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpConfirmBtnText}>Confirm delete</Text>}
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

type Styles = ReturnType<typeof makeStyles>;

const ProfileRow = ({
  iconSet, iconName, title, subtitle, onPress, danger = false, styles,
}: { iconSet: IconSet; iconName: string; title: string; subtitle: string; onPress: () => void; danger?: boolean; styles: Styles }) => {
  const iconColor = danger ? styles.dangerText.color as string : styles.rowIconText.color as string;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <RowIcon set={iconSet} name={iconName} size={19} color={iconColor} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={styles.arrow.color as string} />
    </Pressable>
  );
};

const StatCard = ({
  iconSet, iconName, label, value, styles, color,
}: { iconSet: IconSet; iconName: string; label: string; value: string | number; styles: Styles; color: string }) => (
  <View style={styles.statCard}>
    <RowIcon set={iconSet} name={iconName} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
  </View>
);

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 16, paddingBottom: 35 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 14,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: COLORS.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    name: { fontSize: 18, fontWeight: '900', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: COLORS.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 7,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 13,
      padding: 13,
      marginBottom: 9,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowIconText: { color: COLORS.primary },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
    rowSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
    arrow: { color: COLORS.textMuted },
    dangerIcon: { backgroundColor: COLORS.dangerLight },
    dangerText: { color: COLORS.danger },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: COLORS.bg },
    emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 8, marginBottom: 20 },
    primaryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 13, borderRadius: 10 },
    primaryText: { color: '#fff', fontWeight: '800' },
    statsLoading: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: COLORS.card,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 6 },
    statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

    // Delete-account OTP box
    otpBox: {
      backgroundColor: COLORS.card,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: COLORS.danger,
      padding: 14,
      marginBottom: 12,
    },
    otpLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: COLORS.textMuted,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    otpHint: {
      fontSize: 12,
      color: COLORS.textSecondary,
      marginBottom: 12,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      color: COLORS.text,
      backgroundColor: COLORS.surface,
      fontSize: 14,
    },
    otpInput: {
      marginBottom: 12,
      letterSpacing: 2,
    },
    otpActions: {
      flexDirection: 'row',
      gap: 10,
    },
    otpCancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpCancelBtnText: {
      color: COLORS.text,
      fontWeight: '800',
      fontSize: 13,
    },
    otpConfirmBtn: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      backgroundColor: COLORS.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpConfirmBtnText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });