import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { useAppDialog } from './AppDialog';
import { BASE_API, getVisitorId, getAccessToken } from '../api/tourApi';
import { TourPackageSummary } from '../types';

interface EnquiryModalProps {
  visible: boolean;
  onClose: () => void;
  tour?: TourPackageSummary | null;
  packageId?: string;
  variantId?: string;
}

async function submitFixedEnquiry(payload: {
  channel: string;
  package_id?: string;
  variant_id?: string;
  subject: string;
  message: string;
  name: string;
  mobile: string;
  visitor_id?: string;
  customer_id?: string;
}): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_API}/api/v1/enquiries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`);
  return body;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  visible,
  onClose,
  tour,
  packageId,
  variantId,
}) => {
  const { showDialog } = useAppDialog();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill subject from tour info
  useEffect(() => {
    if (tour && visible) {
      setSubject(`Enquiry about ${tour.title}`);
    } else if (visible) {
      setSubject('');
    }
  }, [tour, visible]);

  const resetForm = () => {
    setName('');
    setMobile('');
    setSubject('');
    setMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      await showDialog({ title: 'Name Required', message: 'Please enter your full name.', variant: 'warning' });
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      await showDialog({ title: 'Mobile Required', message: 'Please enter a valid 10-digit mobile number.', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const visitor_id = await getVisitorId();
      await submitFixedEnquiry({
        channel: 'WEBSITE',
        package_id: packageId || tour?.id || '',
        variant_id: variantId || '',
        subject: subject.trim() || `Tour Enquiry`,
        message: message.trim(),
        name: name.trim(),
        mobile: mobile.trim(),
        visitor_id,
      });
      await showDialog({
        title: 'Enquiry Sent! 🎉',
        message: `Thank you, ${name}! Our travel expert will contact you shortly on ${mobile}.`,
        variant: 'success',
        confirmText: 'Great, Thanks!',
      });
      handleClose();
    } catch (error: any) {
      await showDialog({
        title: 'Could not send enquiry',
        message: error?.message || 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>✉️</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Send Enquiry</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {tour ? tour.title : 'Get in touch with our team'}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Tour info chip */}
          {tour && (
            <View style={styles.tourChip}>
              <Text style={styles.tourChipLabel}>📍 {tour.destination}</Text>
              {tour.starting_price ? (
                <Text style={styles.tourChipPrice}>
                  from ₹{Number(tour.starting_price).toLocaleString('en-IN')}
                </Text>
              ) : null}
            </View>
          )}

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <Text style={styles.label}>YOUR NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sen"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Mobile */}
            <Text style={styles.label}>MOBILE NUMBER *</Text>
            <View style={styles.inputRow}>
              <View style={styles.dialCodeBox}>
                <Text style={styles.dialCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.mobileInput]}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
                maxLength={10}
                returnKeyType="next"
              />
            </View>

            {/* Subject */}
            <Text style={styles.label}>SUBJECT</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Enquiry about Kashmir tour"
              placeholderTextColor={COLORS.textMuted}
              value={subject}
              onChangeText={setSubject}
              returnKeyType="next"
            />

            {/* Message */}
            <Text style={styles.label}>MESSAGE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us your travel dates, group size, or any specific requirements..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            {/* Trust note */}
            <View style={styles.trustNote}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustText}>
                Your details are private and secure. We'll respond within 24 hours.
              </Text>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
                pressed && !isSubmitting && styles.submitBtnPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Send Enquiry</Text>
                  <Text style={styles.submitBtnArrow}>→</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    maxWidth: 220,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tourChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.primarySubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(13,59,54,0.12)',
  },
  tourChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  tourChipPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  formContent: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dialCodeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  mobileInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  trustIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  trustText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  submitBtnArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
