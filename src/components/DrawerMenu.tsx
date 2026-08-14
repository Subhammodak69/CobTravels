import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { NavScreen } from '../types';
import { openWhatsAppChat } from '../api/tourApi';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: NavScreen) => void;
  onFilterTours?: (type: 'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED') => void;
  onOpenCustomTour?: () => void;
  userPhone?: string;
  isLoggedIn?: boolean;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  visible,
  onClose,
  onNavigate,
  onFilterTours,
  onOpenCustomTour,
  userPhone,
  isLoggedIn = false,
}) => {
  const handleNav = (screen: NavScreen) => {
    onClose();
    onNavigate(screen);
  };

  const handleFilter = (type: 'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED') => {
    onClose();
    if (onFilterTours) {
      onFilterTours(type);
    }
    onNavigate('tours');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.drawerContent}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.logoRow}>
              <Text style={styles.crown}>👑</Text>
              <Text style={styles.drawerTitle}>COOCHBEHAR TRAVEL</Text>
            </View>
            <Text style={styles.drawerSubtitle}>ESTD. 1994 · TRUSTED TRAVEL PARTNER</Text>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* User Status Card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{isLoggedIn ? '👤' : '✨'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isLoggedIn ? `Traveler (${userPhone || 'Member'})` : 'Guest Traveler'}
              </Text>
              <Text style={styles.userStatus}>
                {isLoggedIn ? 'Verified Account' : 'Browse without login'}
              </Text>
            </View>
            {!isLoggedIn && (
              <Pressable
                onPress={() => handleNav('auth')}
                style={styles.signInBtn}
              >
                <Text style={styles.signInBtnText}>Sign In</Text>
              </Pressable>
            )}
          </View>

          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>EXPLORE DESTINATIONS</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleFilter('ALL')}
            >
              <Text style={styles.menuIcon}>🗺️</Text>
              <Text style={styles.menuLabel}>All Tour Packages</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleFilter('DOMESTIC')}
            >
              <Text style={styles.menuIcon}>🏔️</Text>
              <Text style={styles.menuLabel}>Domestic India Tours</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleFilter('INTERNATIONAL')}
            >
              <Text style={styles.menuIcon}>✈️</Text>
              <Text style={styles.menuLabel}>International Journeys</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleFilter('FEATURED')}
            >
              <Text style={styles.menuIcon}>🌟</Text>
              <Text style={styles.menuLabel}>Featured & Popular</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>SERVICES & TOOLS</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onClose();
                if (onOpenCustomTour) onOpenCustomTour();
              }}
            >
              <Text style={styles.menuIcon}>🎨</Text>
              <Text style={styles.menuLabel}>Custom Tour Request</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleNav('enquiry')}
            >
              <Text style={styles.menuIcon}>📝</Text>
              <Text style={styles.menuLabel}>Book / Send Enquiry</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleNav('notifications')}
            >
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuLabel}>Notifications & Offers</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleNav('profile')}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuLabel}>My Account & History</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>INSTANT SUPPORT</Text>

            <Pressable
              style={[styles.menuItem, styles.whatsappItem]}
              onPress={() => {
                onClose();
                openWhatsAppChat(
                  'Hello Coochbehar Travel, I would like to inquire about your holiday tour packages!'
                );
              }}
            >
              <Text style={styles.menuIcon}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.whatsappLabel}>WhatsApp Helpline</Text>
                <Text style={styles.whatsappSub}>Instant response 24x7</Text>
              </View>
              <Text style={styles.menuArrow}>↗</Text>
            </Pressable>
          </ScrollView>

          {/* Footer Info */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerText}>
              Coochbehar Travel App · v2.4.0
            </Text>
            <Text style={styles.footerSubText}>
              Cooch Behar, West Bengal · India
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawerContent: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    height: '100%',
    display: 'flex',
  },
  drawerHeader: {
    backgroundColor: COLORS.primaryDark,
    padding: 20,
    paddingTop: 30,
    position: 'relative',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crown: {
    fontSize: 20,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.2,
  },
  drawerSubtitle: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  userStatus: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  signInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 16,
    width: 28,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.goldDark,
  },
  whatsappItem: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 4,
  },
  whatsappLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.whatsappDark,
  },
  whatsappSub: {
    fontSize: 10,
    color: '#065F46',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footerSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
