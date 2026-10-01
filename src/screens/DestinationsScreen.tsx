import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DestinationRecord } from '../api/types';
import { useTheme } from '../theme/theme';

interface DestinationsScreenProps {
  destinations: DestinationRecord[];
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onSelectDestination: (destination: DestinationRecord) => void;
}

export const DestinationsScreen: React.FC<DestinationsScreenProps> = ({
  destinations,
  loading,
  onRefresh,
  onBack,
  onSelectDestination,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Destinations</Text>
          <Text style={styles.headerSubtitle}>Explore places and stays</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        data={destinations}
        numColumns={2}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListHeaderComponent={(
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>FIND YOUR NEXT ESCAPE</Text>
            <Text style={styles.title}>Explore places</Text>
            <Text style={styles.subtitle}>Browse destinations, curated packages and stays.</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Ionicons name={loading ? 'earth-outline' : 'map-outline'} size={34} color={colors.textMuted} />
            <Text style={styles.emptyText}>{loading ? 'Loading destinations...' : 'No destinations available right now.'}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onSelectDestination(item)}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]} />}
            <View style={styles.imageShade} />
            <View style={styles.cardCopy}>
              <Text style={styles.country} numberOfLines={1}>{item.country || (item.is_domestic ? 'INDIA' : 'INTERNATIONAL')}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.exploreRow}><Text style={styles.explore}>Explore</Text><Ionicons name="arrow-forward" size={14} color="#FFFFFF" /></View>
            </View>
          </Pressable>
        )}
      />
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
  listContent: { padding: 16, paddingBottom: 28 },
  row: { gap: 12, marginBottom: 12 },
  heading: { marginBottom: 20 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 5 },
  card: { flex: 1, height: 170, overflow: 'hidden', borderRadius: 12, backgroundColor: colors.primaryDark },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  imageFallback: { backgroundColor: colors.primaryDark },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5, 18, 30, 0.38)' },
  cardCopy: { position: 'absolute', left: 11, right: 11, bottom: 11 },
  country: { color: 'rgba(255,255,255,0.82)', fontSize: 9, fontWeight: '800' },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 3 },
  exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  explore: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 180 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});