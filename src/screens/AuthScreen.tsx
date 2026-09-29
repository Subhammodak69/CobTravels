import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Easing,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { OtpRequestData, getStoredReferralCode, googleAuth, requestOtp, verifyOtp } from '../api/tourApi';
import { showApiError } from '../utils/toast';
import { useAppDialog } from '../components/AppDialog';

type AuthMode = 'LOGIN' | 'SIGNUP';
const GOOGLE_CLIENT_ID_WEB = '61755144915-pj9o538ffi7dldtemnrlhj36pvenb3n9.apps.googleusercontent.com';

interface Props {
  onLoginSuccess: (identifier: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const { showDialog } = useAppDialog();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const bubbleOne = useRef(new Animated.Value(0)).current;
  const bubbleTwo = useRef(new Animated.Value(0)).current;
  const bubbleThree = useRef(new Animated.Value(0)).current;
  const bubbleFour = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    const animateBubble = (value: Animated.Value, duration: number, delay: number) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return loop;
    };

    const animations = [
      animateBubble(bubbleOne, 6200, 0),
      animateBubble(bubbleTwo, 7100, 700),
      animateBubble(bubbleThree, 5600, 1100),
      animateBubble(bubbleFour, 7600, 400),
    ];

    return () => animations.forEach(animation => animation.stop());
  }, [bubbleFour, bubbleOne, bubbleThree, bubbleTwo]);

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
      const response = await requestOtp(value, mode);
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
    <View style={styles.container}>
      {/* Soft multicolored bubbles animate behind the working form. */}
      <View pointerEvents="none" style={styles.bubbleBackdrop}>
        <Animated.View
          style={[
            styles.bubble,
            styles.bubbleOne,
            {
              transform: [
                { translateY: bubbleOne.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
                { translateX: bubbleOne.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
                { scale: bubbleOne.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bubble,
            styles.bubbleTwo,
            {
              transform: [
                { translateY: bubbleTwo.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
                { translateX: bubbleTwo.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                { scale: bubbleTwo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bubble,
            styles.bubbleThree,
            {
              transform: [
                { translateY: bubbleThree.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                { translateX: bubbleThree.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bubble,
            styles.bubbleFour,
            {
              transform: [
                { translateY: bubbleFour.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
                { translateX: bubbleFour.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                { scale: bubbleFour.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              ],
            },
          ]}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Branding Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/gantabya-logo.jpg')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>GANTABYA</Text>
          <Text style={styles.title}>
            {mode === 'LOGIN'
              ? 'Log in to stay on top of your journeys.'
              : 'Create your account and simplify travel.'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'LOGIN'
              ? 'Manage bookings, tour enquiries, and travel plans from one place.'
              : 'Join Gantabya to plan trips, save favourites, and get personalized offers.'}
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

      </ScrollView>
    </View>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? COLORS.primaryDark : '#EAFBFB',
    },
    bubbleBackdrop: {
      ...StyleSheet.absoluteFill,
      overflow: 'hidden',
    },
    bubble: {
      position: 'absolute',
      borderRadius: 999,
    },
    bubbleOne: {
      width: 250,
      height: 250,
      top: -110,
      left: -72,
      backgroundColor: isDark ? 'rgba(39, 126, 255, 0.2)' : 'rgba(43, 191, 211, 0.38)',
    },
    bubbleTwo: {
      width: 210,
      height: 210,
      top: 74,
      right: -92,
      backgroundColor: isDark ? 'rgba(198, 91, 255, 0.18)' : 'rgba(255, 153, 190, 0.32)',
    },
    bubbleThree: {
      width: 150,
      height: 150,
      top: 320,
      left: -64,
      backgroundColor: isDark ? 'rgba(255, 190, 56, 0.15)' : 'rgba(255, 204, 92, 0.34)',
    },
    bubbleFour: {
      width: 260,
      height: 260,
      bottom: -142,
      right: -100,
      backgroundColor: isDark ? 'rgba(64, 188, 255, 0.16)' : 'rgba(139, 149, 255, 0.28)',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 40,
      alignItems: 'center',
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 18,
      maxWidth: 350,
    },
    logoCircle: {
      width: 118,
      height: 118,
      borderRadius: 0,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0,
      marginBottom: 6,
      overflow: 'visible',
    },
    brandLogo: {
      width: 118,
      height: 118,
      borderRadius: 59,
    },
    brandTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: isDark ? COLORS.gold : '#0E8D98',
      letterSpacing: 2,
      marginBottom: 7,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: isDark ? '#FFFFFF' : COLORS.text,
      letterSpacing: -0.4,
      lineHeight: 30,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? 'rgba(255, 255, 255, 0.72)' : COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 7,
      maxWidth: 320,
    },
    tabContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.72)',
      borderRadius: 16,
      padding: 5,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#D5F0F1',
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 11,
      alignItems: 'center',
      borderRadius: 12,
    },
    activeTabBtn: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#C4EAEC',
      elevation: isDark ? 0 : 2,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    tabBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? 'rgba(255, 255, 255, 0.55)' : COLORS.textMuted,
    },
    activeTabBtnText: {
      color: isDark ? '#FFFFFF' : '#0E9DA5',
      fontWeight: '900',
    },
    card: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#D9F0F1',
      elevation: isDark ? 6 : 3,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? 'rgba(255, 255, 255, 0.85)' : COLORS.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 7,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#DCEFF0',
      borderRadius: 13,
      paddingHorizontal: 14,
      color: isDark ? '#FFFFFF' : COLORS.text,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.22)' : '#F7FCFC',
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
      backgroundColor: isDark ? COLORS.gold : '#16BEC5',
      borderRadius: 13,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      elevation: 3,
      shadowColor: isDark ? COLORS.gold : '#16BEC5',
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
      letterSpacing: 0.2,
    },
    googleBtn: {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#D7E8E9',
      borderRadius: 13,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FAFEFE',
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
      marginTop: 18,
      flexWrap: 'wrap',
    },
    footerText: {
      fontSize: 13,
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : COLORS.textSecondary,
    },
    footerLinkText: {
      fontSize: 13,
      color: isDark ? COLORS.gold : '#0E9DA5',
      fontWeight: '800',
      textDecorationLine: 'underline',
    },
  });
