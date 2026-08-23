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
      {!!text2 && <Text style={styles.message} numberOfLines={2}>{text2}</Text>}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  error: props => <ErrorToast text1={props.text1} text2={props.text2} />,
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  icon: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, marginLeft: 10},
  title: {color: '#172033', fontSize: 14, fontWeight: '800'},
  message: {color: '#64748B', fontSize: 12, lineHeight: 17, marginTop: 2},
});
