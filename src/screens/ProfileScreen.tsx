import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { EnquiryData, TourPackageSummary, NavScreen } from '../types';
import { openWhatsAppChat } from '../api/tourApi';

interface ProfileScreenProps {
  isLoggedIn: boolean;
  userPhone: string;
  enquiries: EnquiryData[];
  savedTours: string[];
  allTours: TourPackageSummary[];
  onNavigate: (screen: NavScreen) => void;
  onSelectTour: (tour: TourPackageSummary) => void;
  onLogout: () => void;
  onOpenCustomTour: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  isLoggedIn,
  userPhone,
  enquiries,
  savedTours,
  allTours,
  onNavigate,
  onSelectTour,
  onLogout,
  onOpenCustomTour,
}) => {
  const wishlistedItems = allTours.filter(t => savedTours.includes(t.slug));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{isLoggedIn ? '👤' : '✨'}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.userName}>
            {isLoggedIn ? `+91 ${userPhone}` : 'Guest Traveler'}
          </Text>
          <Text style={styles.userRole}>
            {isLoggedIn ? 'Registered Member' : 'Viewing without login'}
          </Text>
        </View>

        {!isLoggedIn ? (
          <Pressable
            style={styles.loginBtn}
            onPress={() => onNavigate('auth')}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </Pressable>
        )}
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{enquiries.length}</Text>
          <Text style={styles.statLabel}>Enquiries</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{savedTours.length}</Text>
          <Text style={styles.statLabel}>Saved Tours</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>30+ Yrs</Text>
          <Text style={styles.statLabel}>Trust</Text>
        </View>
      </View>

      {/* Submitted Enquiries */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Tour Enquiries</Text>
          <Text style={styles.sectionBadge}>{enquiries.length}</Text>
        </View>

        {enquiries.length > 0 ? (
          enquiries.map((enq, index) => (
            <View key={enq.id || index} style={styles.enquiryItem}>
              <View style={styles.enquiryTop}>
                <Text style={styles.enquiryTourTitle} numberOfLines={1}>
                  {enq.tourTitle || enq.destination || 'Custom Tour'}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{enq.status || 'PENDING'}</Text>
                </View>
              </View>

              <Text style={styles.enquiryDetails}>
                📅 Date: {enq.travelDate} · 👥 {enq.adults || 2} Adults
              </Text>

              {enq.id && (
                <Text style={styles.enquiryRef}>Ref ID: {enq.id}</Text>
              )}

              <Pressable
                style={styles.chatManagerBtn}
                onPress={() =>
                  openWhatsAppChat(
                    `Hello Coochbehar Travel, checking status for my enquiry ${enq.id || ''} for ${enq.tourTitle || 'Holiday'}.`
                  )
                }
              >
                <Text style={styles.chatManagerBtnText}>💬 Check Status on WhatsApp</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No enquiries submitted yet.</Text>
            <Pressable
              style={styles.actionLinkBtn}
              onPress={() => onNavigate('enquiry')}
            >
              <Text style={styles.actionLinkText}>Submit an Enquiry →</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Saved / Wishlisted Tours */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved Tours</Text>
          <Text style={styles.sectionBadge}>{wishlistedItems.length}</Text>
        </View>

        {wishlistedItems.length > 0 ? (
          wishlistedItems.map(item => (
            <Pressable
              key={item.id}
              style={styles.savedTourItem}
              onPress={() => onSelectTour(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.savedTourTitle}>{item.title}</Text>
                <Text style={styles.savedTourSub}>
                  {item.duration} · From ₹{Number(item.starting_price).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.viewArrow}>›</Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>You haven't saved any tours yet.</Text>
            <Pressable
              style={styles.actionLinkBtn}
              onPress={() => onNavigate('tours')}
            >
              <Text style={styles.actionLinkText}>Browse Tours →</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Quick Services */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Services & Support</Text>

        <Pressable
          style={styles.menuRow}
          onPress={onOpenCustomTour}
        >
          <Text style={styles.menuIcon}>🎨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Request Custom Tour Itinerary</Text>
            <Text style={styles.menuSub}>Tailored for families & corporate groups</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.menuRow}
          onPress={() =>
            openWhatsAppChat(
              'Hello Coochbehar Travel, I need help with booking holiday packages!'
            )
          }
        >
          <Text style={styles.menuIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Official WhatsApp Helpline</Text>
            <Text style={styles.menuSub}>Connect with our travel team 24x7</Text>
          </View>
          <Text style={styles.menuArrow}>↗</Text>
        </Pressable>

        <Pressable
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              'Brochures',
              'You can download individual day-by-day itineraries from each tour details page!'
            )
          }
        >
          <Text style={styles.menuIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Tour PDF Brochures</Text>
            <Text style={styles.menuSub}>Detailed route and inclusions</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
      </View>

      {/* About Coochbehar Travel */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutHeader}>
          <Image
            source={require('../assets/logo.jpg')}
            style={styles.aboutLogo}
            resizeMode="contain"
          />
          <Text style={styles.aboutTitle}>COOCHBEHAR TRAVELS</Text>
        </View>
        <Text style={styles.aboutTagline}>EXPLORE THE WORLD WITH US</Text>
        <Text style={styles.aboutText}>
          Founded in 1994, Coochbehar Travels has guided thousands of happy families and travelers across India, Kashmir, Himachal, Kerala, Thailand, Japan, and Europe with premium stays and dedicated tour managers.
        </Text>
        <View style={styles.contactDivider} />
        <Text style={styles.contactItem}>📍 Head Office: Cooch Behar, West Bengal, India</Text>
        <Text style={styles.contactItem}>🌐 Website: coochbehar-travels.onrender.com</Text>
        <Text style={styles.contactItem}>📞 Helpline: +91 98320 00000</Text>
        <Text style={styles.versionText}>Version 2.4.0 (Build 2026)</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  enquiryItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  enquiryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  enquiryTourTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.goldDark,
  },
  enquiryDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  enquiryRef: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  chatManagerBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  chatManagerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  savedTourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  savedTourTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  savedTourSub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  viewArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  emptyCard: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  actionLinkBtn: {
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 18,
    width: 32,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  aboutCard: {
    backgroundColor: COLORS.primaryDark,
    padding: 18,
    borderRadius: 12,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  aboutLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  aboutTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  aboutTagline: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  aboutText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  contactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 10,
  },
  contactItem: {
    color: '#E2E8F0',
    fontSize: 11,
    marginBottom: 4,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
});
