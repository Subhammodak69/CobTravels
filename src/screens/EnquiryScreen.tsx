import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { TourPackageSummary, EnquiryData, NavScreen } from '../types';
import { submitEnquiryApi, openWhatsAppChat } from '../api/tourApi';

interface EnquiryScreenProps {
  tours: TourPackageSummary[];
  prefilledTour?: {
    tourSlug?: string;
    tourTitle?: string;
    variantName?: string;
    travelDate?: string;
  } | null;
  onNavigate: (screen: NavScreen) => void;
  onEnquirySubmitted?: (enquiry: EnquiryData) => void;
}

export const EnquiryScreen: React.FC<EnquiryScreenProps> = ({
  tours,
  prefilledTour,
  onNavigate,
  onEnquirySubmitted,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    prefilledTour?.tourSlug || (tours.length > 0 ? tours[0].slug : '')
  );
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [travelDate, setTravelDate] = useState(prefilledTour?.travelDate || '');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    enquiryId: string;
    message: string;
  }>({
    visible: false,
    enquiryId: '',
    message: '',
  });

  useEffect(() => {
    if (prefilledTour?.tourSlug) {
      setSelectedSlug(prefilledTour.tourSlug);
    }
    if (prefilledTour?.travelDate) {
      setTravelDate(prefilledTour.travelDate);
    }
  }, [prefilledTour]);

  const selectedTour = tours.find(t => t.slug === selectedSlug) || tours[0];

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your Full Name.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const enquiryPayload: EnquiryData = {
      tourSlug: selectedTour?.slug,
      tourTitle: selectedTour?.title,
      variantName: prefilledTour?.variantName,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      travelDate: travelDate.trim(),
      adults,
      children,
      message: message.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await submitEnquiryApi(enquiryPayload);
      if (onEnquirySubmitted) {
        onEnquirySubmitted({ ...enquiryPayload, id: res.enquiryId });
      }
      setSuccessModal({
        visible: true,
        enquiryId: res.enquiryId,
        message: res.message,
      });
    } catch (error: any) {
      Alert.alert('Online enquiry unavailable', error.message || 'Please contact us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = `Hello Coochbehar Travel,\nI would like to enquire about:\n- Tour: ${selectedTour?.title || 'Tour Package'}\n- Preferred Date: ${travelDate}\n- Travellers: ${adults} Adults, ${children} Children\n- Name: ${fullName || 'Traveller'}\n- Phone: ${mobile || 'Not provided'}\n- Notes: ${message || 'Standard inquiry'}`;
    openWhatsAppChat(text);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Intro Banner */}
        <View style={styles.topBanner}>
          <Text style={styles.bannerEyebrow}>FAST & EASY BOOKING ENQUIRY</Text>
          <Text style={styles.bannerTitle}>Plan Your Trip with Experts</Text>
          <Text style={styles.bannerDesc}>
            Fill in the details below. Our holiday consultant will verify seat availability and contact you within 2 hours.
          </Text>
        </View>

        {/* Selected Tour Card / Selector */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>SELECTED TOUR PACKAGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tourPickerScroll}>
            {tours.map(t => {
              const isSelected = t.slug === selectedSlug;
              return (
                <Pressable
                  key={t.slug}
                  onPress={() => setSelectedSlug(t.slug)}
                  style={[
                    styles.tourChip,
                    isSelected && styles.tourChipActive,
                  ]}
                >
                  <Text style={[styles.tourChipText, isSelected && styles.tourChipTextActive]}>
                    {t.title}
                  </Text>
                  <Text style={[styles.tourChipPrice, isSelected && styles.tourChipPriceActive]}>
                    From ₹{Number(t.starting_price).toLocaleString('en-IN')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedTour && (
            <View style={styles.selectedTourSummary}>
              <Text style={styles.summaryTitle}>📌 {selectedTour.title} ({selectedTour.duration})</Text>
              <Text style={styles.summarySub}>📍 Destination: {selectedTour.destination} · Code: {selectedTour.tour_code}</Text>
            </View>
          )}
        </View>

        {/* Enquiry Form */}
        <View style={styles.card}>
          <Text style={styles.formSectionTitle}>Traveller Details</Text>

          {/* Full Name */}
          <Text style={styles.fieldLabel}>FULL NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Mobile Number */}
          <Text style={styles.fieldLabel}>MOBILE NUMBER (FOR CALL & WHATSAPP) *</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          {/* Email Address */}
          <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Travel Date */}
          <Text style={styles.fieldLabel}>TRAVEL DATE / PREFERRED MONTH *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 23 Mar 2026 or April 2026"
            placeholderTextColor={COLORS.textMuted}
            value={travelDate}
            onChangeText={setTravelDate}
          />

          {/* Number of Guests */}
          <View style={styles.guestCountersRow}>
            {/* Adults */}
            <View style={styles.guestCounterCol}>
              <Text style={styles.fieldLabel}>NO. OF ADULTS (12+ YRS)</Text>
              <View style={styles.counterBox}>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setAdults(Math.max(1, adults - 1))}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </Pressable>
                <Text style={styles.counterValue}>{adults}</Text>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setAdults(adults + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Children */}
            <View style={styles.guestCounterCol}>
              <Text style={styles.fieldLabel}>CHILDREN (0-11 YRS)</Text>
              <View style={styles.counterBox}>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setChildren(Math.max(0, children - 1))}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </Pressable>
                <Text style={styles.counterValue}>{children}</Text>
                <Pressable
                  style={styles.counterBtn}
                  onPress={() => setChildren(children + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Requirements */}
          <Text style={styles.fieldLabel}>MESSAGE / REQUIREMENTS (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Need hotel upgrade, vegetarian meal preferences, train/flight booking help..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            value={message}
            onChangeText={setMessage}
          />

          {/* Consent Checkbox */}
          <Pressable
            style={styles.consentRow}
            onPress={() => setWhatsappConsent(!whatsappConsent)}
          >
            <View style={[styles.checkbox, whatsappConsent && styles.checkboxActive]}>
              {whatsappConsent && <Text style={styles.checkTick}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              Receive itinerary PDF & updates via WhatsApp and SMS
            </Text>
          </Pressable>

          {/* Submit CTA */}
          <Pressable
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>SUBMIT ENQUIRY  →</Text>
            )}
          </Pressable>

          {/* WhatsApp Direct Option */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR CONNECT INSTANTLY</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable style={styles.whatsappDirectBtn} onPress={handleWhatsAppDirect}>
            <Text style={styles.whatsappIcon}>💬</Text>
            <Text style={styles.whatsappDirectText}>Enquire Directly on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Submission Success Modal */}
      <Modal
        visible={successModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal({ visible: false, enquiryId: '', message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Enquiry Received!</Text>
            <Text style={styles.successRef}>Ref ID: {successModal.enquiryId}</Text>
            <Text style={styles.successDesc}>{successModal.message}</Text>

            <Pressable
              style={styles.successWhatsAppBtn}
              onPress={() => {
                setSuccessModal({ visible: false, enquiryId: '', message: '' });
                handleWhatsAppDirect();
              }}
            >
              <Text style={styles.successWhatsAppText}>💬 Chat with Tour Manager on WhatsApp</Text>
            </Pressable>

            <Pressable
              style={styles.successDoneBtn}
              onPress={() => {
                setSuccessModal({ visible: false, enquiryId: '', message: '' });
                onNavigate('home');
              }}
            >
              <Text style={styles.successDoneText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 16,
  },
  topBanner: {
    backgroundColor: COLORS.primaryDark,
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
  },
  bannerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  tourPickerScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tourChipActive: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: COLORS.primary,
  },
  tourChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  tourChipTextActive: {
    color: COLORS.primary,
  },
  tourChipPrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tourChipPriceActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  selectedTourSummary: {
    backgroundColor: COLORS.primarySubtle,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 59, 54, 0.15)',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  summarySub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  countryCodeBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  guestCountersRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  guestCounterCol: {
    flex: 1,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 4,
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  counterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkTick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  consentText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  whatsappDirectBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  whatsappIcon: {
    fontSize: 16,
  },
  whatsappDirectText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successCheck: {
    fontSize: 28,
    color: COLORS.success,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },
  successRef: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  successWhatsAppBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  successWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  successDoneBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  successDoneText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
