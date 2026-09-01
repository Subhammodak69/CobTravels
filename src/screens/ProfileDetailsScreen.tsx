import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {AuthUser} from '../api/tourApi';
import {AppColors, useColors} from '../theme/theme';
import {NavScreen} from '../types';

export const ProfileDetailsScreen: React.FC<{user:AuthUser|null;onNavigate:(screen:NavScreen)=>void}> = ({user}) => {
  const COLORS = useColors();
  const styles = makeStyles(COLORS);
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}><View style={styles.card}><Text style={styles.title}>Profile details</Text>{[['Name',user?.name],['Mobile',user?.mobile],['Email',user?.email],['Address',user?.address],['Emergency contact',user?.emergency_contact_name],['Emergency mobile',user?.emergency_contact_mobile],['Customer code',user?.customer_code],['Account source',user?.source]].map(([label,value]) => <View style={styles.item} key={String(label)}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{String(value || 'Not provided')}</Text></View>)}</View></ScrollView>;
};
const makeStyles = (COLORS: AppColors) => StyleSheet.create({container:{flex:1,backgroundColor:COLORS.bg},content:{padding:16},card:{backgroundColor:COLORS.card,borderRadius:15,borderWidth:1,borderColor:COLORS.border,padding:18},title:{fontSize:21,fontWeight:'900',color:COLORS.text,marginBottom:10},item:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.border},label:{fontSize:10,fontWeight:'800',color:COLORS.textMuted,textTransform:'uppercase'},value:{fontSize:14,fontWeight:'600',color:COLORS.text,marginTop:4}});
