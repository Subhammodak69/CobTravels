import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/theme';
import {
  AuthUser,
  fetchUserStats,
  UserStats,
  deleteAccount,
  requestOtp,
  fetchTrips,
  fetchDocuments,
  fetchReferrals,
  fetchInvoices,
} from '../api/tourApi';
import { NavScreen } from '../types';
import { useAppDialog } from '../components/AppDialog';
import { showApiError } from '../utils/toast';
import { ProfileStatsSkeleton } from '../components/Skeleton';

interface Props {
  isLoggedIn: boolean;
  userPhone: string;
  user: AuthUser | null;
  enquiries: any[];
  savedTours?: string[];
  onNavigate: (screen: NavScreen) => void;
  onLogout: (all?: boolean) => void;
}

type IconSet = 'feather' | 'mci';

const RowIcon = ({ set, name, size, color }: { set: IconSet; name: string; size: number; color: string }) =>
  set === 'mci'
    ? <MaterialCommunityIcons name={name} size={size} color={color} />
    : <Feather name={name} size={size} color={color} />;

export const ProfileScreen: React.FC<Props> = ({
  isLoggedIn,
  userPhone,
  user,
  enquiries,
  savedTours = [],
  onNavigate,
  onLogout,
}) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const { showDialog } = useAppDialog();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Dynamic counts for badge indicators
  const [tripsCount, setTripsCount] = useState<number | null>(null);
  const [docsCount, setDocsCount] = useState<number | null>(null);
  const [referralsCount, setReferralsCount] = useState<number | null>(null);
  const [invoicesCount, setInvoicesCount] = useState<number | null>(null);

  // Delete account flow state
  const [deleteOtpModalVisible, setDeleteOtpModalVisible] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const loadData = async () => {
      try {
        setStatsLoading(true);
        const [statsData, tripsData, docsData, refData, invData] = await Promise.allSettled([
          fetchUserStats(),
          fetchTrips(),
          fetchDocuments(),
          fetchReferrals(),
          fetchInvoices(),
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (tripsData.status === 'fulfilled') setTripsCount(tripsData.value.length);
        if (docsData.status === 'fulfilled') {
          const list = (docsData.value as any)?.data;
          setDocsCount(Array.isArray(list) ? list.length : 0);
        }
        if (refData.status === 'fulfilled') {
          const list = (refData.value as any)?.data;
          setReferralsCount(Array.isArray(list) ? list.length : 0);
        }
        if (invData.status === 'fulfilled') {
          setInvoicesCount(Array.isArray(invData.value) ? invData.value.length : 0);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadData();
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
      await requestOtp(identifier, 'DELETE_ACCOUNT');
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
        <ProfileStatsSkeleton />
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
      <ProfileRow styles={styles} iconSet="mci" iconName="airplane-takeoff" title="My trips" subtitle="View your upcoming and completed trips" badge={tripsCount} onPress={() => onNavigate('my_trips')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="message-square" title="My enquiries" subtitle={`${enquiries.length} travel enquiries submitted`} badge={enquiries.length} onPress={() => onNavigate('my_enquiries')} />
      <ProfileRow styles={styles} iconSet="mci" iconName="currency-inr" title="Bills & invoices" subtitle="View your booking bills and invoices" badge={invoicesCount} onPress={() => onNavigate('bills_invoices')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="file-text" title="My documents" subtitle="Upload and manage incoming and outgoing files" badge={docsCount} onPress={() => onNavigate('documents')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="heart" title="My wishlist" subtitle="Your saved travel packages" badge={savedTours.length} onPress={() => onNavigate('wishlist')} />
      <ProfileRow styles={styles} iconSet="feather" iconName="gift" title="Refer & earn" subtitle="Share your travel network" badge={referralsCount} onPress={() => onNavigate('referrals')} />

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
        title="Log out other devices"
        subtitle="Sign out from all other active sessions"
        danger
        onPress={async () => {
          const confirmed = await showDialog({
            title: 'Log out other devices?',
            message: 'All other active devices will be signed out. You will remain logged in on this device.',
            variant: 'warning',
            confirmText: 'Log out others',
            cancelText: 'Cancel',
          });
          if (!confirmed) return;
          try {
            const { logoutAllSessions } = require('../api/tourApi');
            await logoutAllSessions();
            await showDialog({
              title: 'Sessions Ended',
              message: 'All other active devices have been signed out.',
              variant: 'success',
            });
          } catch (error) {
            showApiError(error, 'Could not log out other devices.');
          }
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

      <Modal
        visible={deleteOtpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDeleteOtp}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCancelDeleteOtp} />
          <View style={styles.otpModalCard}>
            <View style={styles.otpHeader}>
              <View style={styles.otpDangerIcon}>
                <Feather name="alert-triangle" size={22} color={COLORS.danger} />
              </View>
              <Text style={styles.otpModalTitle}>Verify Account Deletion</Text>
              <Text style={styles.otpModalSubtitle}>
                We sent a 6-digit verification code to <Text style={{fontWeight: '700', color: COLORS.text}}>{identifier}</Text>. Enter it below to permanently delete your account.
              </Text>
            </View>

            <TextInput
              style={[styles.input, styles.otpInput]}
              keyboardType="number-pad"
              value={deleteOtp}
              onChangeText={setDeleteOtp}
              placeholder="••••••"
              placeholderTextColor={COLORS.textMuted}
              maxLength={6}
              editable={!deletingAccount}
              autoFocus
              textAlign="center"
            />

            <View style={styles.otpActions}>
              <Pressable
                style={styles.otpCancelBtn}
                onPress={handleCancelDeleteOtp}
                disabled={deletingAccount}
              >
                <Text style={styles.otpCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.otpConfirmBtn, (!deleteOtp.trim() || deletingAccount) && styles.buttonDisabled]}
                onPress={confirmDeleteAccount}
                disabled={!deleteOtp.trim() || deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.otpConfirmBtnText}>Confirm Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

type Styles = ReturnType<typeof makeStyles>;

const ProfileRow = ({
  iconSet, iconName, title, subtitle, onPress, danger = false, styles, badge,
}: { iconSet: IconSet; iconName: string; title: string; subtitle: string; onPress: () => void; danger?: boolean; styles: Styles; badge?: number | null }) => {
  const iconColor = danger ? styles.dangerText.color as string : styles.rowIconText.color as string;
  const hasBadge = badge !== undefined && badge !== null && badge > 0;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <RowIcon set={iconSet} name={iconName} size={19} color={iconColor} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      {hasBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
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
    badge: {
      backgroundColor: '#FF7A00',
      padding: 2,
      borderRadius: 12,
      marginRight: 8,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      margin:0,
      fontSize: 10,
      fontWeight: '900',
      color: '#FFFFFF',
    },
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

    // Delete-account OTP modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    otpModalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: COLORS.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 22,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    otpHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    otpDangerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: COLORS.dangerLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    otpModalTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    otpModalSubtitle: {
      fontSize: 12,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
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
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 6,
      height: 52,
      marginBottom: 16,
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
      backgroundColor: COLORS.surface,
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