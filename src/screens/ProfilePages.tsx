import React, { useState, useEffect } from 'react';
import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable} from 'react-native';
import {COLORS} from '../theme/theme';
import {EnquiryData} from '../types';
import { fetchTrips, fetchInvoices, Trip, Invoice } from '../api/tourApi';

const EmptyPage = ({icon, title, message}:{icon:string;title:string;message:string}) => <ScrollView style={styles.container} contentContainerStyle={styles.center}><View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text></ScrollView>;

// Format date helper
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Date to be confirmed';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Date to be confirmed';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Date to be confirmed';
  }
};

export const MyTripsScreen = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await fetchTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <Text style={styles.pageTitle}>My trips</Text>
      {loading && trips.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{marginTop: 20}} />
      ) : trips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✈</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.message}>Your confirmed and upcoming trips will appear here once a booking is confirmed.</Text>
        </View>
      ) : (
        trips.map((trip, index) => (
          <View style={styles.tripCard} key={trip.id || String(index)}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripCode}>{trip.enquiry_code || 'TRIP-' + String(index + 1)}</Text>
              <Text style={[styles.status, trip.status === 'CONFIRMED' ? styles.statusConfirmed : styles.statusNew]}>
                {trip.status || 'NEW'}
              </Text>
            </View>
            <Text style={styles.tripDestination}>{trip.destination || trip.subject || 'Your journey'}</Text>
            <View style={styles.tripMeta}>
              <Text style={styles.metaLabel}>📅 Travel date:</Text>
              <Text style={styles.metaValue}>{formatDate(trip.travel_date)}</Text>
            </View>
            <View style={styles.tripMeta}>
              <Text style={styles.metaLabel}>👥 Travellers:</Text>
              <Text style={styles.metaValue}>{trip.pax_no || 1} person{Number(trip.pax_no) !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export const BillsInvoicesScreen = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <Text style={styles.pageTitle}>Bills & invoices</Text>
      {loading && invoices.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{marginTop: 20}} />
      ) : invoices.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>₹</Text>
          <Text style={styles.emptyTitle}>No invoices yet</Text>
          <Text style={styles.message}>Your booking bills and invoices will appear here once a booking is confirmed.</Text>
        </View>
      ) : (
        invoices.map((invoice, index) => (
          <View style={styles.invoiceCard} key={invoice.id || String(index)}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceCode}>{invoice.invoice_code || 'INV-' + String(index + 1)}</Text>
              <Text style={styles.invoiceAmount}>{invoice.currency || '₹'} {invoice.amount || 0}</Text>
            </View>
            <Text style={styles.invoiceDestination}>{invoice.destination || 'Travel booking'}</Text>
            <View style={styles.invoiceMeta}>
              <Text style={styles.metaLabel}>📅 Booking date:</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.booking_date)}</Text>
            </View>
            <View style={styles.invoiceMeta}>
              <Text style={styles.metaLabel}>✈ Travel date:</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.travel_date)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export const MyEnquiriesScreen: React.FC<{enquiries: EnquiryData[]; loading?: boolean; onRefresh?: () => void}> = ({enquiries, loading = false, onRefresh}) => <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[COLORS.primary]} />}><Text style={styles.pageTitle}>My enquiries</Text>{loading && enquiries.length === 0 ? <ActivityIndicator color={COLORS.primary} /> : enquiries.length === 0 ? <View style={styles.emptyBox}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyTitle}>No enquiries yet</Text><Text style={styles.message}>Your tour enquiries and their latest status will appear here.</Text></View> : enquiries.map((item,index) => <View style={styles.enquiry} key={item.id || String(index)}><View style={styles.row}><Text style={styles.enquiryTitle}>{item.tourTitle || item.destination || 'Custom tour'}</Text><Text style={styles.status}>{item.status || 'NEW'}</Text></View><Text style={styles.meta}>Travel date: {item.travelDate || 'Not selected'}</Text><Text style={styles.meta}>Mobile: {item.mobile || 'Not provided'}</Text>{item.message ? <Text style={styles.meta} numberOfLines={2}>{item.message}</Text> : null}{item.id && <Text style={styles.ref}>Reference: {item.id}</Text>}</View>)}</ScrollView>;

const styles=StyleSheet.create({container:{flex:1,backgroundColor:COLORS.bg},content:{padding:16,paddingBottom:30},center:{alignItems:'center',justifyContent:'center',padding:30},icon:{width:72,height:72,borderRadius:36,backgroundColor:COLORS.primarySubtle,alignItems:'center',justifyContent:'center',marginBottom:16},iconText:{fontSize:32,color:COLORS.primary},emptyIcon:{fontSize:32,color:COLORS.primary},title:{fontSize:23,fontWeight:'900',color:COLORS.text},pageTitle:{fontSize:23,fontWeight:'900',color:COLORS.text,marginBottom:16},message:{fontSize:13,lineHeight:20,color:COLORS.textSecondary,textAlign:'center',marginTop:8},emptyBox:{backgroundColor:COLORS.card,borderRadius:15,borderWidth:1,borderColor:COLORS.border,padding:22,alignItems:'center',marginTop:20},emptyTitle:{fontSize:16,fontWeight:'800',color:COLORS.text,marginTop:8},tripCard:{backgroundColor:COLORS.card,borderRadius:13,borderWidth:1,borderColor:COLORS.border,padding:15,marginBottom:12},tripHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},tripCode:{fontSize:11,fontWeight:'800',color:COLORS.textMuted,textTransform:'uppercase',letterSpacing:0.5},tripDestination:{fontSize:16,fontWeight:'800',color:COLORS.text,marginBottom:10},tripMeta:{flexDirection:'row',alignItems:'center',marginTop:8},metaLabel:{fontSize:12,color:COLORS.textSecondary,fontWeight:'600',marginRight:6},metaValue:{fontSize:12,fontWeight:'800',color:COLORS.text},invoiceCard:{backgroundColor:COLORS.card,borderRadius:13,borderWidth:1,borderColor:COLORS.border,padding:15,marginBottom:12},invoiceHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},invoiceCode:{fontSize:11,fontWeight:'800',color:COLORS.textMuted,textTransform:'uppercase',letterSpacing:0.5},invoiceAmount:{fontSize:16,fontWeight:'900',color:COLORS.primary},invoiceDestination:{fontSize:14,fontWeight:'800',color:COLORS.text,marginBottom:10},status:{fontSize:10,fontWeight:'800',color:COLORS.goldDark,backgroundColor:COLORS.goldLight,paddingHorizontal:8,paddingVertical:4,borderRadius:6},statusConfirmed:{backgroundColor:'#d1fae5',color:'#047857'},statusNew:{backgroundColor:COLORS.goldLight,color:COLORS.goldDark},enquiry:{backgroundColor:COLORS.card,borderRadius:13,borderWidth:1,borderColor:COLORS.border,padding:15,marginBottom:10},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},enquiryTitle:{flex:1,fontSize:14,fontWeight:'800',color:COLORS.text},meta:{fontSize:12,color:COLORS.textSecondary,marginTop:7},ref:{fontSize:10,color:COLORS.textMuted,marginTop:8}});
