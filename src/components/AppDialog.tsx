import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Modal, Pressable, StyleSheet, Text, View} from 'react-native';

type DialogVariant = 'info' | 'success' | 'warning' | 'error';
export interface DialogOptions {title: string; message: string; variant?: DialogVariant; confirmText?: string; cancelText?: string;}
interface DialogContextValue {showDialog: (options: DialogOptions) => Promise<boolean>;}
const DialogContext = createContext<DialogContextValue | null>(null);

export const AppDialogProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const [dialog, setDialog] = useState<(DialogOptions & {resolve: (value: boolean) => void}) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  useEffect(() => {
    if (!dialog) return;
    opacity.setValue(0); scale.setValue(0.86);
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, tension: 85, friction: 8, useNativeDriver: true}),
    ]).start();
  }, [dialog, opacity, scale]);
  const showDialog = useCallback((options: DialogOptions) => new Promise<boolean>(resolve => setDialog({...options, resolve})), []);
  const close = (result: boolean) => { const current = dialog; if (!current) return; Animated.timing(opacity, {toValue: 0, duration: 140, useNativeDriver: true}).start(() => {current.resolve(result); setDialog(null);}); };
  const accent = dialog ? ({info: '#2563EB', success: '#16A34A', warning: '#D97706', error: '#DC2626'}[dialog.variant || 'info']) : '#2563EB';
  return <DialogContext.Provider value={{showDialog}}>{children}<Modal visible={Boolean(dialog)} transparent animationType="none" onRequestClose={() => close(false)}>
    <View style={styles.backdrop}><Animated.View style={[styles.card, {opacity, transform: [{scale}]}]}>
      <View style={[styles.icon, {backgroundColor: `${accent}18`}, {borderColor: `${accent}35`}]}><Text style={[styles.iconText, {color: accent}]}>{dialog?.variant === 'success' ? '✓' : dialog?.variant === 'warning' ? '!' : dialog?.variant === 'error' ? '×' : 'i'}</Text></View>
      <Text style={styles.title}>{dialog?.title}</Text><Text style={styles.message}>{dialog?.message}</Text>
      <View style={styles.actions}>{dialog?.cancelText && <Pressable style={styles.cancel} onPress={() => close(false)}><Text style={styles.cancelText}>{dialog.cancelText}</Text></Pressable>}<Pressable style={[styles.confirm, {backgroundColor: accent}]} onPress={() => close(true)}><Text style={styles.confirmText}>{dialog?.confirmText || 'OK'}</Text></Pressable></View>
    </Animated.View></View>
  </Modal></DialogContext.Provider>;
};

export function useAppDialog() { const value = useContext(DialogContext); if (!value) throw new Error('useAppDialog must be used inside AppDialogProvider'); return value; }

const styles = StyleSheet.create({backdrop: {flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 24}, card: {width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: {width: 0, height: 12}, elevation: 12}, icon: {width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14}, iconText: {fontSize: 28, fontWeight: '900'}, title: {color: '#172033', fontSize: 20, fontWeight: '900', textAlign: 'center'}, message: {color: '#64748B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8}, actions: {width: '100%', flexDirection: 'row', gap: 10, marginTop: 22}, cancel: {flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center'}, cancelText: {color: '#64748B', fontWeight: '800'}, confirm: {flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'}, confirmText: {color: '#fff', fontWeight: '900'}});
