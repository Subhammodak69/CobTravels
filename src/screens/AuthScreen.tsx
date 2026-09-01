import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { NavScreen } from '../types';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { OtpRequestData, getStoredReferralCode, googleAuth, requestOtp, verifyOtp } from '../api/tourApi';
import { showApiError } from '../utils/toast';
import { useAppDialog } from '../components/AppDialog';

type AuthMode = 'LOGIN' | 'SIGNUP';
const GOOGLE_CLIENT_ID_WEB = '61755144915-pj9o538ffi7dldtemnrlhj36pvenb3n9.apps.googleusercontent.com';

interface Props {
  onLoginSuccess: (identifier: string) => void;
  onSkip: () => void;
  onNavigate: (screen: NavScreen) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess, onSkip }) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const { showDialog } = useAppDialog();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_CLIENT_ID_WEB });
    getStoredReferralCode().then(code => setHasReferral(Boolean(code))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!otpSent || expiresIn <= 0) return;
    const timer = setInterval(() => setExpiresIn(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [otpSent, expiresIn]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setOtpSent(false);
    setOtp('');
    setExpiresIn(0);
  };

  const sendOtp = async () => {
    const value = identifier.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const looksLikeMobile = value.replace(/\D/g, '').length >= 10;
    if (!looksLikeEmail && !looksLikeMobile) {
      await showDialog({
        title: 'Invalid Identifier',
        message: 'Please enter a valid 10-digit mobile number or email address.',
        variant: 'warning',
      });
      return;
    }
    if (mode === 'SIGNUP' && name.trim().length < 2) {
      await showDialog({
        title: 'Name Required',
        message: 'Please enter your full name to create an account.',
        variant: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await requestOtp(value, mode, (await getStoredReferralCode()) || undefined);
      const otpData = response.data as OtpRequestData | undefined;
      setOtpSent(true);
      setOtp('');
      setExpiresIn(otpData?.expires_in_sec ?? 300);
      await showDialog({
        title: 'Verification Code Sent! 📩',
        message: response.message || `We have sent a verification code to ${value}.`,
        variant: 'success',
      });
    } catch (error) {
      showApiError(error, 'We could not send the OTP. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (otp.trim().length < 4) {
      await showDialog({
        title: 'Incomplete Code',
        message: 'Please enter the verification code you received.',
        variant: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(identifier.trim(), otp.trim(), mode === 'SIGNUP' ? name.trim() : '', mode, (await getStoredReferralCode()) || undefined);
      onLoginSuccess(identifier.trim());
    } catch (error) {
      showApiError(error, 'The verification code could not be verified. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Sign out from cached Google session to always prompt account picker
      try { await GoogleSignin.signOut(); } catch {}
      
      const response = await GoogleSignin.signIn();
      if (!response) {
        setGoogleLoading(false);
        return;
      }
      
      // Support both new and legacy response shapes from @react-native-google-signin
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens?.idToken || (response as any)?.data?.idToken || (response as any)?.idToken;
      
      if (!idToken) {
        throw new Error('Google did not return an ID token. Please try again.');
      }
      
      await googleAuth(idToken, (await getStoredReferralCode()) || undefined);
      const userObj = (response as any)?.data?.user || (response as any)?.user;
      onLoginSuccess(userObj?.email || userObj?.name || 'google_user');
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User actively cancelled the Google picker dialog - stay on AuthScreen
        return;
      }
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
        // Sign-in operation is already in progress
        return;
      }
      const message = isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
        ? 'Google Play Services is unavailable. Please update it and try again.'
        : error?.message || 'Google sign-in failed. Please try again.';
      showApiError(error, message);
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Branding Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/logo.jpg')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>COOCHBEHAR TRAVELS</Text>
          <Text style={styles.title}>
            {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'LOGIN'
              ? 'Sign in to track your tour enquiries, booking status, and travel itineraries.'
              : 'Join with your phone or email to customize trips and get personalized offers.'}
          </Text>
        </View>

        {/* Tab switchers: Sign In / Sign Up */}
        <View style={styles.tabContainer}>
          {(['LOGIN', 'SIGNUP'] as AuthMode[]).map(tabKey => {
            const isActive = mode === tabKey;
            return (
              <Pressable
                key={tabKey}
                style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                onPress={() => changeMode(tabKey)}
              >
                <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>
                  {tabKey === 'LOGIN' ? 'Sign In' : 'Sign Up'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {hasReferral && (
            <View style={styles.referralNotice} accessibilityRole="text">
              <Text style={styles.referralNoticeTitle}>Invite applied</Text>
              <Text style={styles.referralNoticeText}>Your invite will be linked to this account.</Text>
            </View>
          )}
          {mode === 'SIGNUP' && !otpSent && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rahul Sen"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {mode === 'SIGNUP' ? 'MOBILE OR EMAIL *' : 'MOBILE NUMBER OR EMAIL *'}
            </Text>
            <TextInput
              style={[styles.input, otpSent && styles.inputDisabled]}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="e.g. 9876543210 or name@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!otpSent}
              returnKeyType={otpSent ? 'next' : 'done'}
            />
          </View>

          {otpSent && (
            <View style={styles.otpSection}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.label}>ENTER VERIFICATION CODE</Text>
                <Pressable
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.changeLinkText}>Change Number</Text>
                </Pressable>
              </View>

              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={val => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={styles.timerRow}>
                <Text style={styles.timerText}>
                  {expiresIn > 0
                    ? `Expires in ${Math.floor(expiresIn / 60)}:${(expiresIn % 60)
                        .toString()
                        .padStart(2, '0')}`
                    : 'Code expired'}
                </Text>
                {expiresIn <= 0 ? (
                  <Pressable onPress={sendOtp} disabled={loading}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}

          {/* Submit CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              loading && styles.submitBtnDisabled,
              pressed && !loading && styles.submitBtnPressed,
            ]}
            onPress={otpSent ? verify : sendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {otpSent
                  ? mode === 'SIGNUP'
                    ? 'Verify & Create Account →'
                    : 'Verify & Sign In →'
                  : 'Send Verification Code →'}
              </Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mode === 'LOGIN' ? 'Sign in' : 'Sign up'} with Google`}
            style={({ pressed }) => [styles.googleBtn, (loading || googleLoading) && styles.submitBtnDisabled, pressed && styles.submitBtnPressed]}
            onPress={signInWithGoogle}
            disabled={loading || googleLoading}
          >
            {googleLoading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.googleBtnText}>Continue with Google</Text>}
          </Pressable>
        </View>

        {/* Footer switch prompt */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {mode === 'SIGNUP' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          </Text>
          <Pressable onPress={() => changeMode(mode === 'SIGNUP' ? 'LOGIN' : 'SIGNUP')} hitSlop={8}>
            <Text style={styles.footerLinkText}>
              {mode === 'SIGNUP' ? 'Sign In' : 'Create an Account'}
            </Text>
          </Pressable>
        </View>

        {/* Bottom Actions: Continue as Guest and Back button placed below the form */}
        <View style={styles.bottomActions}>
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.guestActionBtn,
              pressed && styles.guestActionBtnPressed,
            ]}
            hitSlop={6}
          >
            <Text style={styles.guestActionIcon}>👋</Text>
            <Text style={styles.guestActionText}>Continue as Guest</Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.backActionBtn,
              pressed && styles.backActionBtnPressed,
            ]}
            hitSlop={6}
          >
            <Text style={styles.backActionText}>← Go Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? COLORS.primaryDark : '#FFFFFF',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 36,
      paddingBottom: 48,
      alignItems: 'center',
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? COLORS.gold : COLORS.primary,
      marginBottom: 12,
      elevation: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      overflow: 'hidden',
    },
    brandLogo: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    brandTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: isDark ? COLORS.gold : COLORS.goldDark,
      letterSpacing: 1.8,
      marginBottom: 4,
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: isDark ? '#FFFFFF' : COLORS.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? 'rgba(255, 255, 255, 0.72)' : COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 6,
      maxWidth: 320,
    },
    tabContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : COLORS.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : COLORS.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    activeTabBtn: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : COLORS.border,
      elevation: isDark ? 0 : 2,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    tabBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? 'rgba(255, 255, 255, 0.55)' : COLORS.textMuted,
    },
    activeTabBtnText: {
      color: isDark ? '#FFFFFF' : COLORS.primary,
      fontWeight: '900',
    },
    card: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
      elevation: isDark ? 6 : 3,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? 'rgba(255, 255, 255, 0.85)' : COLORS.textSecondary,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      color: isDark ? '#FFFFFF' : COLORS.text,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.22)' : COLORS.surface,
      fontSize: 14,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    otpSection: {
      marginTop: 4,
      marginBottom: 14,
    },
    otpHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    changeLinkText: {
      fontSize: 12,
      color: isDark ? COLORS.gold : COLORS.primary,
      fontWeight: '700',
    },
    otpInput: {
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: 8,
      textAlign: 'center',
      height: 54,
      color: isDark ? '#FFFFFF' : COLORS.text,
    },
    timerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    timerText: {
      fontSize: 12,
      color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary,
      fontWeight: '600',
    },
    resendText: {
      fontSize: 12,
      color: isDark ? COLORS.gold : COLORS.primary,
      fontWeight: '800',
    },
    submitBtn: {
      backgroundColor: isDark ? COLORS.gold : COLORS.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      elevation: 3,
      shadowColor: isDark ? COLORS.gold : COLORS.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    submitBtnText: {
      color: isDark ? COLORS.primaryDark : '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.3,
    },
    googleBtn: {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : COLORS.borderDark,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
    },
    googleBtnText: {
      color: isDark ? '#FFFFFF' : COLORS.text,
      fontSize: 14,
      fontWeight: '800',
    },
    referralNotice: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : COLORS.goldLight,
      borderRadius: 10,
      padding: 11,
      marginBottom: 12,
    },
    referralNoticeTitle: {
      color: isDark ? COLORS.gold : COLORS.goldDark,
      fontSize: 12,
      fontWeight: '900',
    },
    referralNoticeText: {
      color: isDark ? 'rgba(255, 255, 255, 0.72)' : COLORS.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      flexWrap: 'wrap',
    },
    footerText: {
      fontSize: 13,
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : COLORS.textSecondary,
    },
    footerLinkText: {
      fontSize: 13,
      color: isDark ? COLORS.gold : COLORS.primary,
      fontWeight: '800',
      textDecorationLine: 'underline',
    },
    bottomActions: {
      width: '100%',
      alignItems: 'center',
      marginTop: 28,
      gap: 12,
    },
    guestActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : COLORS.surface,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
    },
    guestActionBtnPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    guestActionIcon: {
      fontSize: 15,
      marginRight: 8,
    },
    guestActionText: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? COLORS.gold : COLORS.primary,
    },
    backActionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    backActionBtnPressed: {
      opacity: 0.65,
    },
    backActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? 'rgba(255, 255, 255, 0.55)' : COLORS.textMuted,
    },
  });
