import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {COLORS} from '../theme/theme';
import {NavScreen} from '../types';
import {OtpRequestData, requestOtp, verifyOtp} from '../api/tourApi';
import {showApiError} from '../utils/toast';

type AuthMode = 'LOGIN' | 'SIGNUP';
interface Props {onLoginSuccess: (identifier: string) => void; onSkip: () => void; onNavigate: (screen: NavScreen) => void;}

export const AuthScreen: React.FC<Props> = ({onLoginSuccess, onSkip}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!otpSent || expiresIn <= 0) return;
    const timer = setInterval(() => setExpiresIn(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [otpSent, expiresIn]);

  const changeMode = (nextMode: AuthMode) => { setMode(nextMode); setOtpSent(false); setOtp(''); setExpiresIn(0); };
  const sendOtp = async () => {
    const value = identifier.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const looksLikeMobile = value.replace(/\D/g, '').length >= 10;
    if (!looksLikeEmail && !looksLikeMobile) { Alert.alert('Invalid identifier', 'Enter a valid mobile number or email address.'); return; }
    if (mode === 'SIGNUP' && name.trim().length < 2) { Alert.alert('Name required', 'Enter your full name.'); return; }
    setLoading(true);
    try {
      const response = await requestOtp(value, mode);
      const otpData = response.data as OtpRequestData | undefined;
      setOtpSent(true); setOtp(''); setExpiresIn(otpData?.expires_in_sec ?? 300);
      Alert.alert('OTP sent', response.message || 'Check your phone or email for the verification code.');
    } catch (error) { showApiError(error, 'We could not send the OTP.'); } finally { setLoading(false); }
  };
  const verify = async () => {
    if (otp.trim().length < 4) { Alert.alert('Incomplete OTP', 'Enter the verification code you received.'); return; }
    setLoading(true);
    try { await verifyOtp(identifier.trim(), otp.trim(), mode === 'SIGNUP' ? name.trim() : '', mode); onLoginSuccess(identifier.trim()); }
    catch (error) { showApiError(error, 'The OTP could not be verified.'); } finally { setLoading(false); }
  };

  return <View style={styles.container}>
    <View style={styles.topBar}><Pressable onPress={onSkip}><Text style={styles.link}>← Back</Text></Pressable><Pressable onPress={onSkip}><Text style={styles.gold}>Continue as Guest ›</Text></Pressable></View>
    <View style={styles.content}>
      <Text style={styles.icon}>👤</Text>
      <Text style={styles.title}>{mode === 'LOGIN' ? 'Welcome back' : 'Create your account'}</Text>
      <Text style={styles.subtitle}>{mode === 'LOGIN' ? 'Sign in to track enquiries and access your travel profile.' : 'Sign up with your mobile number or email to manage your travel plans.'}</Text>
      <View style={styles.tabs}>{(['LOGIN', 'SIGNUP'] as AuthMode[]).map(value => <Pressable key={value} style={[styles.tab, mode === value && styles.activeTab]} onPress={() => changeMode(value)}><Text style={[styles.tabText, mode === value && styles.activeTabText]}>{value === 'LOGIN' ? 'Log in' : 'Sign up'}</Text></Pressable>)}</View>
      <View style={styles.card}>
        {mode === 'SIGNUP' && !otpSent && <><Text style={styles.label}>FULL NAME</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" /></>}
        <Text style={styles.label}>MOBILE NUMBER OR EMAIL</Text>
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" editable={!otpSent} />
        {otpSent && <><Text style={styles.label}>VERIFICATION CODE</Text><TextInput style={styles.input} value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter OTP" keyboardType="number-pad" maxLength={6} autoFocus /><View style={styles.timerRow}><Text style={styles.timerText}>{expiresIn > 0 ? `Code expires in ${expiresIn}s` : 'Code expired'}</Text><Pressable onPress={() => {setOtpSent(false); setOtp('');}}><Text style={styles.link}>Change identifier</Text></Pressable></View></>}
        <Pressable style={styles.button} onPress={otpSent ? verify : sendOtp} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{otpSent ? (mode === 'SIGNUP' ? 'VERIFY & CREATE ACCOUNT →' : 'VERIFY & LOG IN →') : 'SEND OTP →'}</Text>}</Pressable>
      </View>
      <View style={styles.switchRow}><Text style={styles.switchText}>{mode === 'SIGNUP' ? 'Already have an account? ' : 'New here? '}</Text><Pressable onPress={() => changeMode(mode === 'SIGNUP' ? 'LOGIN' : 'SIGNUP')}><Text style={styles.switchLink}>{mode === 'SIGNUP' ? 'Log in' : 'Create an account'}</Text></Pressable></View>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.bg}, topBar: {flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border}, content: {padding: 20, alignItems: 'center'}, icon: {fontSize: 38, marginTop: 20}, title: {fontSize: 24, fontWeight: '900', color: COLORS.text, marginTop: 12}, subtitle: {textAlign: 'center', color: COLORS.textSecondary, marginVertical: 12}, tabs: {flexDirection: 'row', width: '100%', backgroundColor: COLORS.surface, borderRadius: 10, padding: 4, marginBottom: 12}, tab: {flex: 1, padding: 11, alignItems: 'center', borderRadius: 8}, activeTab: {backgroundColor: '#fff'}, tabText: {fontWeight: '700', color: COLORS.textSecondary}, activeTabText: {color: COLORS.primary}, card: {width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border}, label: {fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 8, marginTop: 8}, input: {height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, color: COLORS.text}, button: {backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16}, buttonText: {color: '#fff', fontWeight: '800'}, timerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}, timerText: {color: COLORS.textSecondary, fontSize: 12}, link: {color: COLORS.primary, fontWeight: '700'}, gold: {color: COLORS.goldDark, fontWeight: '700'}, switchRow: {flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20}, switchText: {color: COLORS.textSecondary, fontSize: 13}, switchLink: {color: COLORS.primary, fontWeight: '800', textDecorationLine: 'underline'},
});
