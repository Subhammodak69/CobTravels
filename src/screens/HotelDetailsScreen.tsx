import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HotelRecord, ResourceImage } from '../api/types';
import { MediaSelection, MediaViewer } from '../components/MediaViewer';
import { useTheme } from '../theme/theme';

interface HotelDetailsScreenProps {
  hotel: HotelRecord;
  destinationName: string;
  onBack: () => void;
}

function getHotelMedia(hotel: HotelRecord): MediaSelection[] {
  const hotelRecord = hotel as HotelRecord & { images?: ResourceImage[]; gallery?: ResourceImage[]; image_url?: string };
  const source = Array.isArray(hotel.image)
    ? hotel.image
    : hotelRecord.images || hotelRecord.gallery || (hotelRecord.image_url ? [{ url: hotelRecord.image_url }] : []);

  return source.reduce<MediaSelection[]>((media, item: ResourceImage | string) => {
      const uri = typeof item === 'string' ? item : item.url || '';
      const type = typeof item === 'string' ? 'image' : item.type === 'video' ? 'video' : 'image';
      if (uri) media.push({ uri, type, title: hotel.name });
      return media;
    }, []);
}

export const HotelDetailsScreen: React.FC<HotelDetailsScreenProps> = ({ hotel, destinationName, onBack }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const gallery = useMemo(() => getHotelMedia(hotel), [hotel]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  return (
    <View style={styles.screen}>
      {selectedImageIndex !== null && (
        <MediaViewer
          mediaList={gallery}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to hotels" style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>{hotel.name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{destinationName || 'Hotel details'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{hotel.category || 'HOTEL'}</Text>
          <Text style={styles.title}>{hotel.name}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Hotel information</Text>
          {!!destinationName && <InfoRow icon="location-outline" label="Destination" value={destinationName} colors={colors} styles={styles} />}
          {!!hotel.address && <InfoRow icon="navigate-outline" label="Address" value={hotel.address} colors={colors} styles={styles} />}
          {!!hotel.contact && <InfoRow icon="call-outline" label="Contact" value={hotel.contact} colors={colors} styles={styles} />}
          {!!hotel.description && <Text style={styles.description}>{hotel.description}</Text>}
        </View>

        <View style={styles.gallerySection}>
          <View style={styles.galleryHeading}>
            <View>
              <Text style={styles.eyebrow}>EXPLORE THE PROPERTY</Text>
              <Text style={styles.sectionTitle}>Photo gallery</Text>
            </View>
            <Text style={styles.imageCount}>{gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}</Text>
          </View>
          {gallery.length ? (
            <View style={styles.galleryGrid}>
              {gallery.map((item, index) => (
                <Pressable
                  key={`${item.uri}-${index}`}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Open photo ${index + 1} of ${gallery.length}`}
                  style={styles.galleryItem}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image source={{ uri: item.uri }} style={styles.galleryImage} resizeMode="cover" />
                  {item.type === 'video' && <View style={styles.videoBadge}><Ionicons name="play" size={14} color="#FFFFFF" /></View>}
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyGallery}>
              <Ionicons name="images-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No photos available for this hotel.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value, colors, styles }: { icon: string; label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; styles: ReturnType<typeof makeStyles> }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={17} color={colors.primary} />
    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, justifyContent: 'center', marginLeft: 6 },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: { paddingBottom: 28 },
  heading: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 4 },
  infoSection: { paddingHorizontal: 18, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 2 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 15 },
  gallerySection: { paddingHorizontal: 16, paddingTop: 22 },
  galleryHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  imageCount: { color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingBottom: 12 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  galleryItem: { width: '48.5%', aspectRatio: 1.25, overflow: 'hidden', borderRadius: 10, backgroundColor: colors.primarySubtle },
  galleryImage: { width: '100%', height: '100%' },
  videoBadge: { position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.65)' },
  emptyGallery: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 10 },
  emptyText: { color: colors.textMuted, fontSize: 12 },
});
