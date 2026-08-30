import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View, Alert } from 'react-native';
import { COLORS } from '../theme/theme';
import { fetchNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '../api/tourApi';
import { showApiError } from '../utils/toast';

interface Props {
  isLoggedIn: boolean;
}

export const NotificationSettingsScreen: React.FC<Props> = ({ isLoggedIn }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    push_notifications: true,
    newsletter: true,
    sms_alerts: false,
    email_updates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        const data = await fetchNotificationPreferences();
        setPrefs(data);
      } catch (error) {
        showApiError('Failed to load notification preferences');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isLoggedIn]);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const oldPrefs = { ...prefs };
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);

    try {
      setSaving(true);
      await updateNotificationPreferences(newPrefs);
    } catch (error) {
      setPrefs(oldPrefs);
      showApiError('Failed to update notification preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptyText}>You must sign in to manage notification preferences.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Notification Preferences</Text>
      <Text style={styles.subtitle}>Choose how we contact you with travel updates</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>

        <NotificationRow
          icon="🔔"
          title="Push notifications"
          subtitle="Trip reminders & booking updates"
          value={prefs.push_notifications}
          onToggle={() => handleToggle('push_notifications')}
          disabled={saving}
        />

        <NotificationRow
          icon="📧"
          title="Email updates"
          subtitle="Special offers & travel stories"
          value={prefs.email_updates}
          onToggle={() => handleToggle('email_updates')}
          disabled={saving}
        />

        <NotificationRow
          icon="📰"
          title="Travel newsletter"
          subtitle="Curated stories & exclusive deals"
          value={prefs.newsletter}
          onToggle={() => handleToggle('newsletter')}
          disabled={saving}
        />

        <NotificationRow
          icon="📱"
          title="SMS alerts"
          subtitle="Booking confirmations via SMS"
          value={prefs.sms_alerts}
          onToggle={() => handleToggle('sms_alerts')}
          disabled={saving}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Keep at least one notification method enabled to stay updated about your bookings and special travel deals.
        </Text>
      </View>
    </ScrollView>
  );
};

const NotificationRow: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}> = ({ icon, title, subtitle, value, onToggle, disabled }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: COLORS.border, true: COLORS.primarySubtle }}
      thumbColor={value ? COLORS.primary : COLORS.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  infoBox: {
    backgroundColor: COLORS.primarySubtle,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 14,
    marginTop: 10,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
