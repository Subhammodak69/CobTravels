import React, { useState, useEffect } from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator} from 'react-native';
import {COLORS} from '../theme/theme';
import {AuthUser, fetchUserStats, UserStats} from '../api/tourApi';
import {NavScreen} from '../types';
import {useAppDialog} from '../components/AppDialog';

interface Props {isLoggedIn:boolean; userPhone:string; user:AuthUser|null; enquiries: any[]; onNavigate:(screen:NavScreen)=>void; onLogout:(all?:boolean)=>void;}

export const ProfileScreen: React.FC<Props> = ({isLoggedIn, userPhone, user, enquiries, onNavigate, onLogout}) => {
  const {showDialog} = useAppDialog();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await fetchUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <View style={styles.empty}><Text style={styles.emptyTitle}>Guest Traveler</Text><Text style={styles.emptyText}>Sign in to manage your profile, sessions and travel details.</Text><Pressable style={styles.primaryButton} onPress={() => onNavigate('auth')}><Text style={styles.primaryText}>Sign In</Text></Pressable></View>;
  const displayName = user?.name || user?.mobile || `+91 ${userPhone}`;
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View><View style={styles.headerCopy}><Text style={styles.name}>{displayName}</Text><Text style={styles.sub}>{user?.email || user?.mobile || 'Registered member'}</Text></View></View>
    {statsLoading ? (
      <View style={styles.statsLoading}><ActivityIndicator color={COLORS.primary} /></View>
    ) : stats ? (
      <View style={styles.statsGrid}>
        <StatCard icon="✈" label="Journeys" value={stats.journeys_taken} />
        <StatCard icon="🌍" label="Countries" value={stats.countries_visited} />
        <StatCard icon="📅" label="Travel days" value={stats.total_travel_days} />
        <StatCard icon="⭐" label="Member since" value={new Date(stats.member_since || '').getFullYear() || '2024'} />
      </View>
    ) : null}
    <Text style={styles.sectionTitle}>Account</Text>
    <ProfileRow icon="👤" title="Profile details" subtitle="View your personal and emergency contact details" onPress={() => onNavigate('profile_details')} />
    <ProfileRow icon="✎" title="Edit profile" subtitle="Update your name, contact and address" onPress={() => onNavigate('edit_profile')} />
    <ProfileRow icon="🔔" title="Notification settings" subtitle="Manage push, email & SMS preferences" onPress={() => onNavigate('notification_settings')} />
    <ProfileRow icon="▣" title="Active sessions" subtitle="Manage devices signed in to your account" onPress={() => onNavigate('sessions')} />
    <ProfileRow icon="✈" title="My trips" subtitle="View your upcoming and completed trips" onPress={() => onNavigate('my_trips')} />
    <ProfileRow icon="☷" title="My enquiries" subtitle={`${enquiries.length} travel enquiries submitted`} onPress={() => onNavigate('my_enquiries')} />
    <ProfileRow icon="₹" title="Bills & invoices" subtitle="View your booking bills and invoices" onPress={() => onNavigate('bills_invoices')} />
    <ProfileRow icon="▤" title="My documents" subtitle="Upload and manage incoming and outgoing files" onPress={() => onNavigate('documents')} />
    <ProfileRow icon="♥" title="My wishlist" subtitle="Your saved travel packages" onPress={() => onNavigate('wishlist')} />
    <ProfileRow icon="↗" title="Refer & earn" subtitle="Share your travel network" onPress={() => onNavigate('referrals')} />
    <Text style={styles.sectionTitle}>Session</Text>
    <ProfileRow icon="↪" title="Log out" subtitle="Sign out from this device" danger onPress={async () => {const confirmed = await showDialog({title: 'Log out?', message: 'You will be signed out from this device.', variant: 'warning', confirmText: 'Log out', cancelText: 'Cancel'}); if (confirmed) onLogout();}} />
    <ProfileRow icon="×" title="Log out everywhere" subtitle="Sign out from all active devices" danger onPress={async () => {const confirmed = await showDialog({title: 'Log out everywhere?', message: 'All active devices will be signed out of your account.', variant: 'warning', confirmText: 'Log out all', cancelText: 'Cancel'}); if (confirmed) onLogout(true);}} />
  </ScrollView>;
};

const ProfileRow = ({icon,title,subtitle,onPress,danger=false}:{icon:string;title:string;subtitle:string;onPress:()=>void;danger?:boolean}) => <Pressable style={styles.row} onPress={onPress}><View style={[styles.rowIcon, danger && styles.dangerIcon]}><Text style={[styles.rowIconText, danger && styles.dangerText]}>{icon}</Text></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;

const StatCard = ({icon, label, value}:{icon:string;label:string;value:string|number}) => <View style={styles.statCard}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;

const styles = StyleSheet.create({container:{flex:1,backgroundColor:COLORS.bg},content:{padding:16,paddingBottom:35},header:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:16,padding:18,borderWidth:1,borderColor:COLORS.border,marginBottom:14},avatar:{width:58,height:58,borderRadius:29,backgroundColor:COLORS.primarySubtle,alignItems:'center',justifyContent:'center',marginRight:13},avatarText:{fontSize:26},headerCopy:{flex:1},name:{fontSize:18,fontWeight:'900',color:COLORS.text},sub:{fontSize:12,color:COLORS.textSecondary,marginTop:4},brandCard:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.primaryDark,borderRadius:14,padding:15,marginBottom:22},logo:{width:42,height:42,borderRadius:21,backgroundColor:'#fff',marginRight:11},brand:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:1},brandSub:{color:COLORS.gold,fontSize:11,marginTop:3},sectionTitle:{fontSize:12,fontWeight:'900',color:COLORS.textMuted,textTransform:'uppercase',letterSpacing:1,marginBottom:8,marginTop:7},row:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderWidth:1,borderColor:COLORS.border,borderRadius:13,padding:13,marginBottom:9},rowIcon:{width:40,height:40,borderRadius:12,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center',marginRight:12},rowIconText:{fontSize:19,color:COLORS.primary},rowCopy:{flex:1},rowTitle:{fontSize:14,fontWeight:'800',color:COLORS.text},rowSubtitle:{fontSize:11,color:COLORS.textSecondary,marginTop:3},arrow:{fontSize:24,color:COLORS.textMuted,marginLeft:8},dangerIcon:{backgroundColor:COLORS.dangerLight},dangerText:{color:COLORS.danger},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:30,backgroundColor:COLORS.bg},emptyTitle:{fontSize:22,fontWeight:'900',color:COLORS.text},emptyText:{textAlign:'center',color:COLORS.textSecondary,marginTop:8,marginBottom:20},primaryButton:{backgroundColor:COLORS.primary,paddingHorizontal:30,paddingVertical:13,borderRadius:10},primaryText:{color:'#fff',fontWeight:'800'},statsLoading:{paddingVertical:20,alignItems:'center',justifyContent:'center'},statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:18},statCard:{flex:1,minWidth:'45%',backgroundColor:'#fff',borderRadius:13,borderWidth:1,borderColor:COLORS.border,padding:14,alignItems:'center',justifyContent:'center'},statIcon:{fontSize:24,marginBottom:6},statValue:{fontSize:18,fontWeight:'900',color:COLORS.primary},statLabel:{fontSize:10,fontWeight:'600',color:COLORS.textSecondary,marginTop:4,textAlign:'center'}});
