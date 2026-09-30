import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type {ToastConfig} from 'react-native-toast-message';

const ErrorToast = ({text1, text2}: {text1?: string; text2?: string}) => (
  <View style={styles.container}>
    <View style={styles.icon}>
      <Ionicons name="alert-circle" size={21} color="#DC2626" />
    </View>
    <View style={styles.copy}>
      <Text style={styles.title} numberOfLines={1}>{text1 || 'Something went wrong'}</Text>
      {!!text2 && <Text style={styles.message} numberOfLines={1}>{text2}</Text>}
    </View>
  </View>
);

const SuccessToast = ({text1, text2}: {text1?: string; text2?: string}) => (
  <View style={[styles.container, styles.successContainer]}>
    <View style={styles.successIcon}>
      <Ionicons name="checkmark-circle" size={21} color="#16A34A" />
    </View>
    <View style={styles.copy}>
      <Text style={styles.title} numberOfLines={1}>{text1 || 'Success'}</Text>
      {!!text2 && <Text style={styles.message} numberOfLines={1}>{text2}</Text>}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  error: props => <ErrorToast text1={props.text1} text2={props.text2} />,
  success: props => <SuccessToast text1={props.text1} text2={props.text2} />,
};

const styles = StyleSheet.create({
  container: {
    width: '88%',
    maxWidth: 360,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  successContainer: {borderLeftColor: '#16A34A'},
  icon: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center'},
  successIcon: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, marginLeft: 8},
  title: {color: '#172033', fontSize: 12.5, lineHeight: 16, fontWeight: '800'},
  message: {color: '#64748B', fontSize: 10.5, lineHeight: 14, marginTop: 1},
});
