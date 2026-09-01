import React, { useState, useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/theme';
import { EnquiryData } from '../types';
import { fetchTrips, fetchInvoices, Trip, Invoice } from '../api/tourApi';

type IconSet = 'feather' | 'mci';

const RowIcon = ({ set, name, size, color }: { set: IconSet; name: string; size: number; color: string }) =>
  set === 'mci'
    ? <MaterialCommunityIcons name={name} size={size} color={color} />
    : <Feather name={name} size={size} color={color} />;

const EmptyPage = ({ iconSet, iconName, title, message }: { iconSet: IconSet; iconName: string; title: string; message: string }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.center}>
    <View style={styles.icon}>
      <RowIcon set={iconSet} name={iconName} size={30} color={COLORS.primary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </ScrollView>
);

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

// Small helper for an icon + label + value meta row (used by trips & invoices)
const MetaRow = ({ iconSet, iconName, label, value }: { iconSet: IconSet; iconName: string; label: string; value: string }) => (
  <View style={styles.metaRow}>
    <RowIcon set={iconSet} name={iconName} size={13} color={COLORS.textSecondary} />
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

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
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} />
      ) : trips.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="airplane" size={28} color={COLORS.primary} />
          </View>
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
            <MetaRow iconSet="feather" iconName="calendar" label="Travel date:" value={formatDate(trip.travel_date)} />
            <MetaRow iconSet="feather" iconName="users" label="Travellers:" value={`${trip.pax_no || 1} person${Number(trip.pax_no) !== 1 ? 's' : ''}`} />
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
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} />
      ) : invoices.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="currency-inr" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No invoices yet</Text>
          <Text style={styles.message}>Your booking bills and invoices will appear here once a booking is confirmed.</Text>
        </View>
      ) : (
        invoices.map((invoice, index) => (
          <View style={styles.invoiceCard} key={invoice.id || String(index)}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceCode}>{invoice.invoice_code || 'INV-' + String(index + 1)}</Text>
              <View style={styles.invoiceAmountRow}>
                <MaterialCommunityIcons name="currency-inr" size={15} color={COLORS.primary} />
                <Text style={styles.invoiceAmount}>{invoice.amount || 0}</Text>
              </View>
            </View>
            <Text style={styles.invoiceDestination}>{invoice.destination || 'Travel booking'}</Text>
            <View style={styles.invoiceMeta}>
              <MetaRow iconSet="feather" iconName="calendar" label="Booking date:" value={formatDate(invoice.booking_date)} />
              <MetaRow iconSet="mci" iconName="airplane" label="Travel date:" value={formatDate(invoice.travel_date)} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export const MyEnquiriesScreen: React.FC<{ enquiries: EnquiryData[]; loading?: boolean; onRefresh?: () => void }> = ({ enquiries, loading = false, onRefresh }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
    <Text style={styles.pageTitle}>My enquiries</Text>
    {loading && enquiries.length === 0 ? (
      <ActivityIndicator color={COLORS.primary} />
    ) : enquiries.length === 0 ? (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIconWrap}>
          <Feather name="clipboard" size={26} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No enquiries yet</Text>
        <Text style={styles.message}>Your tour enquiries and their latest status will appear here.</Text>
      </View>
    ) : (
      enquiries.map((item, index) => (
        <View style={styles.enquiry} key={item.id || String(index)}>
          <View style={styles.row}>
            <Text style={styles.enquiryTitle}>{item.tourTitle || item.destination || 'Custom tour'}</Text>
            <Text style={styles.status}>{item.status || 'NEW'}</Text>
          </View>
          <View style={styles.enquiryMetaRow}>
            <Feather name="calendar" size={12} color={COLORS.textSecondary} />
            <Text style={styles.meta}>Travel date: {item.travelDate || 'Not selected'}</Text>
          </View>
          <View style={styles.enquiryMetaRow}>
            <Feather name="phone" size={12} color={COLORS.textSecondary} />
            <Text style={styles.meta}>Mobile: {item.mobile || 'Not provided'}</Text>
          </View>
          {item.message ? <Text style={styles.meta} numberOfLines={2}>{item.message}</Text> : null}
          {item.id && <Text style={styles.ref}>Reference: {item.id}</Text>}
        </View>
      ))
    )}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 30 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primarySubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 23, fontWeight: '900', color: COLORS.text },
  pageTitle: { fontSize: 23, fontWeight: '900', color: COLORS.text, marginBottom: 16 },
  message: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  emptyBox: { backgroundColor: COLORS.card, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, padding: 22, alignItems: 'center', marginTop: 20 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primarySubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 },

  tripCard: { backgroundColor: COLORS.card, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, padding: 15, marginBottom: 12 },
  tripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  tripCode: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tripDestination: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },

  // shared icon + label + value row (trips & invoices)
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  metaValue: { fontSize: 12, fontWeight: '800', color: COLORS.text, marginLeft: -2 },

  invoiceCard: { backgroundColor: COLORS.card, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, padding: 15, marginBottom: 12 },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  invoiceCode: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  invoiceAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  invoiceAmount: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  invoiceDestination: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  invoiceMeta: { flexDirection: 'column' },

  status: { fontSize: 10, fontWeight: '800', color: COLORS.goldDark, backgroundColor: COLORS.goldLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusConfirmed: { backgroundColor: '#d1fae5', color: '#047857' },
  statusNew: { backgroundColor: COLORS.goldLight, color: COLORS.goldDark },

  enquiry: { backgroundColor: COLORS.card, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, padding: 15, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  enquiryTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.text },
  enquiryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  ref: { fontSize: 10, color: COLORS.textMuted, marginTop: 8 },
});