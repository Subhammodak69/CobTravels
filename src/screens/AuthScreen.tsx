import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { NavScreen } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (phone: string) => void;
  onSkip: () => void;
  onNavigate: (screen: NavScreen) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onSkip,
  onNavigate,
}) => {
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timer]);

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setTimer(30);
      Alert.alert('OTP Sent! 📲', `A 4-digit verification code has been sent to +91 ${mobile}.\n(Demo OTP: 1234)`);
    }, 700);
  };

  const handleVerifyOtp = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      Alert.alert('Incomplete OTP', 'Please enter all 4 digits of the OTP.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(mobile);
      Alert.alert('Welcome to Coochbehar Travels! 🌟', 'You are now signed in. You can track your enquiries and save your favourite tours.');
      onNavigate('home');
    }, 600);
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  };

  return (
    <View style={styles.container}>
      {/* Header bar with Skip */}
      <View style={styles.topBar}>
        <Pressable onPress={onSkip} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Continue as Guest ›</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* User Icon Circle */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>👤</Text>
        </View>

        <Text style={styles.title}>Login / Register</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number to access customized itineraries, tour bookings, and instant WhatsApp updates.
        </Text>

        {/* Form Card matching diagram */}
        <View style={styles.formCard}>
          <Text style={styles.label}>ENTER MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryBox}>
              <Text style={styles.countryText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="XXXXXXXXXX"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
              editable={!otpSent}
            />
          </View>

          {!otpSent ? (
            <Pressable
              style={[styles.actionBtn, loading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>SEND OTP  →</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.otpSection}>
              <Text style={styles.label}>ENTER 4-DIGIT OTP</Text>
              <View style={styles.otpInputsRow}>
                {[0, 1, 2, 3].map(i => (
                  <TextInput
                    key={i}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[i]}
                    onChangeText={t => handleOtpChange(t, i)}
                    textAlign="center"
                  />
                ))}
              </View>

              <View style={styles.timerRow}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                ) : (
                  <Pressable onPress={handleSendOtp}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setOtpSent(false)}>
                  <Text style={styles.editPhoneLink}>Change Number</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.actionBtn, loading && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>VERIFY & LOGIN  →</Text>
                )}
              </Pressable>
            </View>
          )}

          <Text style={styles.autoRegisterText}>
            ✓ New user will be registered automatically
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Member Privileges</Text>
          <Text style={styles.benefitItem}>• Instant enquiry tracking and status alerts</Text>
          <Text style={styles.benefitItem}>• Save favourite tour packages and seasonal deals</Text>
          <Text style={styles.benefitItem}>• Download complete PDF day-by-day brochures</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 4,
  },
  skipText: {
    color: COLORS.goldDark,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(13, 59, 54, 0.15)',
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 320,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  countryBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  otpSection: {
    marginTop: 4,
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  otpBox: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  editPhoneLink: {
    fontSize: 12,
    color: COLORS.goldDark,
    fontWeight: '700',
  },
  autoRegisterText: {
    fontSize: 11,
    color: COLORS.success,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 14,
  },
  benefitsCard: {
    width: '100%',
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
});
