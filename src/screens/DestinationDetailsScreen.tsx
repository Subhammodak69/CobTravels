import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DestinationRecord, HotelRecord } from '../api/types';
import { fetchHotels, fetchTourPackages } from '../api/tourApi';
import { TourPackageSummary } from '../types';
import { TourCard } from '../components/TourCard';
import { useTheme } from '../theme/theme';

interface DestinationDetailsScreenProps {
  destination: DestinationRecord;
  onBack: () => void;
  onSelectTour: (tour: TourPackageSummary) => void;
  onSelectHotel: (hotel: HotelRecord) => void;
  savedTours: string[];
  onToggleSave: (slug: string) => void;
}

function getHotelImage(hotel: HotelRecord): string {
  const image = hotel.image?.find(item => item.url)?.url;
  return image || (hotel as any).image_url || (hotel as any).images?.[0]?.url || '';
}

export const DestinationDetailsScreen: React.FC<DestinationDetailsScreenProps> = ({
  destination,
  onBack,
  onSelectTour,
  onSelectHotel,
  savedTours,
  onToggleSave,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [packages, setPackages] = useState<TourPackageSummary[]>([]);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'packages' | 'hotels'>('packages');
  const loadRelated = useCallback(async () => {
    setLoading(true);
    setError('');
    const [packageResult, hotelResult] = await Promise.allSettled([
      fetchTourPackages(1, 100, 'created_at', 'desc', { destination: destination.name }),
      fetchHotels(1, 100, destination.id),
    ]);
    setPackages(packageResult.status === 'fulfilled' ? packageResult.value : []);
    setHotels(hotelResult.status === 'fulfilled' && Array.isArray(hotelResult.value.data) ? hotelResult.value.data : []);
    if (packageResult.status === 'rejected' || hotelResult.status === 'rejected') {
      setError('Some travel options could not be loaded. Pull down to try again.');
    }
    setLoading(false);
  }, [destination.id, destination.name]);

  useEffect(() => { loadRelated(); }, [loadRelated]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to destinations" style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>{destination.name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{destination.country || 'Destination details'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRelated} colors={[colors.primary]} />}
      >
      <View style={styles.hero}>
        {destination.image_url ? <Image source={{ uri: destination.image_url }} style={styles.heroImage} /> : null}
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <Text style={styles.country}>{destination.country || (destination.is_domestic ? 'INDIA' : 'INTERNATIONAL')}</Text>
          <Text style={styles.title}>{destination.name}</Text>
          {!!destination.description && <Text style={styles.description} numberOfLines={3}>{destination.description}</Text>}
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'packages' }}
          style={[styles.tab, activeTab === 'packages' && styles.activeTab]}
          onPress={() => setActiveTab('packages')}
        >
          <Ionicons name="briefcase-outline" size={16} color={activeTab === 'packages' ? colors.primary : colors.textMuted} />
          <Text numberOfLines={1} style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>Tour Packages</Text>
          <Text style={[styles.tabCount, activeTab === 'packages' && styles.activeTabText]}>{loading ? '...' : packages.length}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'hotels' }}
          style={[styles.tab, styles.secondTab, activeTab === 'hotels' && styles.activeTab]}
          onPress={() => setActiveTab('hotels')}
        >
          <Ionicons name="bed-outline" size={17} color={activeTab === 'hotels' ? colors.primary : colors.textMuted} />
          <Text numberOfLines={1} style={[styles.tabText, activeTab === 'hotels' && styles.activeTabText]}>Hotels</Text>
          <Text style={[styles.tabCount, activeTab === 'hotels' && styles.activeTabText]}>{loading ? '...' : hotels.length}</Text>
        </Pressable>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {activeTab === 'packages' && <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.eyebrow}>CURATED ITINERARIES</Text><Text style={styles.sectionTitle}>Packages</Text></View>
          <Text style={styles.count}>{loading ? 'Loading' : String(packages.length)}</Text>
        </View>
        {packages.length ? packages.map((tour, index) => (
          <TourCard
            key={`${tour.id || tour.slug}-${index}`}
            tour={tour}
            onPress={() => onSelectTour(tour)}
            isSaved={savedTours.includes(tour.slug)}
            onToggleSave={() => onToggleSave(tour.slug)}
          />
        )) : <Text style={styles.empty}>{loading ? 'Loading packages...' : 'No packages are listed for this destination yet.'}</Text>}
      </View>}

      {activeTab === 'hotels' && <View style={[styles.section, styles.hotelSection]}>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.eyebrow}>STAYS NEARBY</Text><Text style={styles.sectionTitle}>Hotels</Text></View>
          <Text style={styles.count}>{loading ? 'Loading' : String(hotels.length)}</Text>
        </View>
        {hotels.length ? hotels.map(hotel => (
          <Pressable key={hotel.id} accessibilityRole="button" style={styles.hotelCard} onPress={() => onSelectHotel(hotel)}>
            {getHotelImage(hotel) ? <Image source={{ uri: getHotelImage(hotel) }} style={styles.hotelImage} /> : <View style={[styles.hotelImage, styles.hotelFallback]}><Ionicons name="bed-outline" size={24} color={colors.primary} /></View>}
            <View style={styles.hotelCopy}>
              <Text style={styles.hotelCategory}>{hotel.category || 'HOTEL'}</Text>
              <Text style={styles.hotelName} numberOfLines={2}>{hotel.name}</Text>
              {!!hotel.address && <Text style={styles.hotelAddress} numberOfLines={2}>{hotel.address}</Text>}
              {!!hotel.description && <Text style={styles.hotelDescription} numberOfLines={2}>{hotel.description}</Text>}
            </View>
          </Pressable>
        )) : <Text style={styles.empty}>{loading ? 'Loading hotels...' : 'No hotels are listed for this destination yet.'}</Text>}
      </View>}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, justifyContent: 'center', marginLeft: 6 },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  headerSpacer: { width: 40 },
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 285, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: colors.primaryDark },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 17, 30, 0.58)' },
  heroCopy: { paddingHorizontal: 18, paddingBottom: 22 },
  country: { color: 'rgba(255,255,255,0.82)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 4 },
  description: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 18, marginTop: 6 },
  section: { padding: 16, paddingBottom: 6 },
  tabs: { position: 'relative', width: '100%', height: 54, zIndex: 2, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 3 },
  tab: { position: 'absolute', top: 0, left: 0, width: '50%', height: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 6 },
  secondTab: { left: '50%' },
  activeTab: { borderBottomColor: colors.primary, backgroundColor: colors.primarySubtle },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  activeTabText: { color: colors.primary, fontWeight: '900' },
  tabCount: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  hotelSection: { backgroundColor: colors.card, paddingBottom: 22, borderTopWidth: 1, borderTopColor: colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 13 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 3 },
  count: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: 13, paddingVertical: 14 },
  error: { color: colors.danger || '#B42318', fontSize: 12, paddingHorizontal: 16, paddingTop: 12 },
  hotelCard: { minHeight: 116, flexDirection: 'row', overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card },
  hotelImage: { width: 112, minHeight: 116, backgroundColor: colors.primarySubtle },
  hotelFallback: { alignItems: 'center', justifyContent: 'center' },
  hotelCopy: { flex: 1, padding: 12 },
  hotelCategory: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  hotelName: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 3 },
  hotelAddress: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  hotelDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});