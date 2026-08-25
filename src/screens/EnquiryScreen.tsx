import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { useAppDialog } from '../components/AppDialog';
import { BASE_API, getVisitorId, getAccessToken } from '../api/tourApi';
import enums from '../utils/enums.json';
import { NavScreen } from '../types';

interface EnquiryScreenProps {
  onNavigate?: (screen: NavScreen) => void;
  onEnquirySubmitted?: (enquiry: any) => void;
  user?: import('../api/tourApi').AuthUser | null;
}

async function submitCustomEnquiry(payload: Record<string, any>): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_API}/api/v1/enquiries/custom`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`);
  return body;
}

type ChipOption = { label: string; value: string };

function ChipSelector({
  options,
  value,
  onChange,
  styles,
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  styles: any;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.chip, value === opt.value && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Build chip options from enums
const vehicleOptions: ChipOption[] = Object.entries(enums.VehicleType).map(([, v]) => ({
  label: v as string,
  value: v as string,
}));
const mealOptions: ChipOption[] = Object.entries(enums.MealPlan).map(([, v]) => ({
  label: v as string,
  value: v as string,
}));
const enquiryTypeOptions: ChipOption[] = Object.entries(enums.EnquiryType)
  .filter(([, v]) => {
    const val = String(v).toUpperCase().replace(/[\s_-]+/g, '');
    return val !== 'FIXEDTOUR';
  })
  .map(([, v]) => ({
    label: (v as string).replace(/_/g, ' '),
    value: v as string,
  }));

export const EnquiryScreen: React.FC<EnquiryScreenProps> = ({
  onNavigate,
  onEnquirySubmitted,
  user: initialUser,
}) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const { showDialog } = useAppDialog();
  const [name, setName] = useState(initialUser?.name || '');
  const [mobile, setMobile] = useState(initialUser?.mobile || '');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelDuration, setTravelDuration] = useState('');
  const [paxNo, setPaxNo] = useState('4');
  const [noRoom, setNoRoom] = useState('2');
  const [vehicleType, setVehicleType] = useState('ANY');
  const [mealPlan, setMealPlan] = useState('ANY');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [enquiryType, setEnquiryType] = useState('CUSTOM_TOUR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-sync logged in user info if available
  React.useEffect(() => {
    if (initialUser) {
      if (initialUser.name) setName(initialUser.name);
      if (initialUser.mobile) setMobile(initialUser.mobile);
    }
  }, [initialUser]);

  const resetForm = () => {
    setName(initialUser?.name || '');
    setMobile(initialUser?.mobile || '');
    setDestination('');
    setTravelDate('');
    setTravelDuration('');
    setPaxNo('4');
    setNoRoom('2');
    setVehicleType('ANY');
    setMealPlan('ANY');
    setSpecialRequirements('');
    setEnquiryType('CUSTOM_TOUR');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !mobile.trim() || !destination.trim()) {
      await showDialog({
        title: 'Required Fields Missing',
        message: 'Please fill in your Name, Mobile Number, and Destination.',
        variant: 'warning',
      });
      return;
    }
    if (mobile.trim().length < 10) {
      await showDialog({
        title: 'Invalid Mobile Number',
        message: 'Please enter a valid 10-digit mobile number.',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const visitor_id = await getVisitorId();
      const payload: Record<string, any> = {
        name: name.trim(),
        mobile: mobile.trim(),
        destination: destination.trim(),
        travel_date: travelDate.trim(),
        travel_duration: travelDuration.trim(),
        pax_no: Number(paxNo) || 4,
        no_room: Number(noRoom) || 2,
        vehicle_type: vehicleType || 'ANY',
        meal_plan: mealPlan || 'ANY',
        special_requirements: specialRequirements.trim() || undefined,
        enquiry_type: enquiryType,
        channel: 'APP',
        visitor_id,
        customer_id: initialUser?.id || undefined,
      };

      const result = await submitCustomEnquiry(payload);
      if (onEnquirySubmitted) onEnquirySubmitted(result);

      await showDialog({
        title: 'Enquiry Received! 🌟',
        message: `Thank you ${name}! Our holiday specialist will design a personalized itinerary for ${destination} and contact you on ${mobile} within 24 hours.`,
        variant: 'success',
        confirmText: 'Great!',
      });
      resetForm();
    } catch (error: any) {
      await showDialog({
        title: 'Submission Failed',
        message: error?.message || 'We could not submit your enquiry. Please check your connection and try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header summary card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🎨</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>Custom Package Enquiry</Text>
            <Text style={styles.pageSubtitle}>
              Tailor-make your holiday with hotels, cabs, meals & custom itinerary
            </Text>
          </View>
        </View>

        {/* Enquiry Type Selector */}
        <Text style={styles.label}>ENQUIRY TYPE</Text>
        <ChipSelector
          options={enquiryTypeOptions}
          value={enquiryType}
          onChange={setEnquiryType}
          styles={styles}
        />

        {/* Full Name */}
        <Text style={styles.label}>YOUR FULL NAME *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rahul Sen"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Mobile Number */}
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
          />
        </View>

        {/* Destination */}
        <Text style={styles.label}>WHERE DO YOU WANT TO GO? *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Switzerland, Ladakh, Bali, Vietnam..."
          placeholderTextColor={COLORS.textMuted}
          value={destination}
          onChangeText={setDestination}
        />

        {/* Travel Date & Duration */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>TRAVEL DATE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dec 2025 / DD-MM-YYYY"
              placeholderTextColor={COLORS.textMuted}
              value={travelDate}
              onChangeText={setTravelDate}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>DURATION</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 7 Days"
              placeholderTextColor={COLORS.textMuted}
              value={travelDuration}
              onChangeText={setTravelDuration}
            />
          </View>
        </View>

        {/* Pax & Room count */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>NO. OF TRAVELLERS (PAX)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={paxNo}
              onChangeText={setPaxNo}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>NO. OF ROOMS</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={noRoom}
              onChangeText={setNoRoom}
            />
          </View>
        </View>

        {/* Preferred Vehicle */}
        <Text style={styles.label}>VEHICLE TYPE</Text>
        <ChipSelector
          options={[{ label: 'Any / Not Sure', value: 'ANY' }, ...vehicleOptions]}
          value={vehicleType}
          onChange={setVehicleType}
          styles={styles}
        />

        {/* Meal Plan */}
        <Text style={styles.label}>MEAL PLAN</Text>
        <ChipSelector
          options={[{ label: 'Any Plan', value: 'ANY' }, ...mealOptions]}
          value={mealPlan}
          onChange={setMealPlan}
          styles={styles}
        />

        {/* Special Requirements */}
        <Text style={styles.label}>SPECIAL REQUIREMENTS (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Honeymoon setup, pure veg meals, senior citizen friendly, airport transfers..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={specialRequirements}
          onChangeText={setSpecialRequirements}
        />

        {/* Trust Note */}
        <View style={styles.trustNote}>
          <Text style={styles.trustIcon}>✨</Text>
          <Text style={styles.trustText}>
            Our experienced travel experts will reach out to you within 24 hours with a tailored itinerary and transparent quotation.
          </Text>
        </View>

        {/* Submit button */}
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
              <Text style={styles.submitBtnText}>Submit Custom Enquiry</Text>
              <Text style={styles.submitBtnArrow}>→</Text>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    headerIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: isDark ? '#0F3B32' : '#DCFCE7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    headerIcon: {
      fontSize: 24,
    },
    headerTextContainer: {
      flex: 1,
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: COLORS.text,
    },
    pageSubtitle: {
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: COLORS.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      backgroundColor: isDark ? COLORS.card : '#FFFFFF',
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
      backgroundColor: isDark ? COLORS.card : COLORS.surface,
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
      minHeight: 90,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    col: {
      flex: 1,
    },
    chipRow: {
      gap: 8,
      paddingVertical: 4,
      paddingRight: 4,
    },
    chip: {
      borderWidth: 1,
      borderColor: isDark ? COLORS.border : '#CBD5E1',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? COLORS.surface : '#F8FAFC',
    },
    chipActive: {
      borderColor: isDark ? COLORS.primary : COLORS.primary,
      backgroundColor: isDark ? COLORS.primary : COLORS.primary,
    },
    chipText: {
      fontSize: 12,
      color: isDark ? COLORS.textSecondary : '#334155',
      fontWeight: '600',
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    trustNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 18,
      marginBottom: 4,
      backgroundColor: COLORS.goldLight,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
    },
    trustIcon: {
      fontSize: 14,
      marginTop: 1,
    },
    trustText: {
      fontSize: 11,
      color: COLORS.goldDark,
      lineHeight: 16,
      flex: 1,
      fontWeight: '600',
    },
    submitBtn: {
      backgroundColor: isDark ? COLORS.gold : COLORS.primary,
      borderRadius: 12,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
      elevation: 3,
      shadowColor: isDark ? COLORS.gold : COLORS.primary,
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
      color: isDark ? COLORS.primaryDark : '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    submitBtnArrow: {
      color: isDark ? COLORS.primaryDark : '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    bottomSpacer: {
      height: 30,
    },
  });
