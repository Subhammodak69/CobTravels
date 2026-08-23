import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { TourPackageDetail, SeasonVariant, NavScreen } from '../types';
import { fetchTourDetail, fetchTourVariant, openWhatsAppChat } from '../api/tourApi';
import { TourDetailSkeleton } from '../components/Skeleton';
import { MediaViewer, MediaSelection } from '../components/MediaViewer';
import { showApiError } from '../utils/toast';

interface TourDetailScreenProps {
  slug: string;
  onBack: () => void;
  onNavigate: (screen: NavScreen) => void;
  onStartEnquiry: (details: {
    tourSlug: string;
    tourTitle: string;
    variantName: string;
    travelDate: string;
  }) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export const TourDetailScreen: React.FC<TourDetailScreenProps> = ({
  slug,
  onBack,
  onNavigate,
  onStartEnquiry,
  isSaved = false,
  onToggleSave,
}) => {
  const [tour, setTour] = useState<TourPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    '0': true,
    '1': true,
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaSelection | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTourDetail(slug);
      setTour(data);
      if (data.seasons && data.seasons.length > 0) {
        const defaultIdx = data.seasons.findIndex(s => s.is_default);
        const activeIdx = defaultIdx >= 0 ? defaultIdx : 0;
        setSelectedSeasonIndex(activeIdx);
        if (data.seasons[activeIdx].dates?.length > 0) setSelectedDate(data.seasons[activeIdx].dates[0].date);
      }
    } catch (error) { showApiError(error, 'Could not load tour details.'); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const activeSeason: SeasonVariant | undefined =
    tour?.seasons?.[selectedSeasonIndex] || tour?.seasons?.[0];

  const handleSeasonChange = async (index: number) => {
    setSelectedSeasonIndex(index);
    const selected = tour?.seasons?.[index];
    if (!selected || !tour) return;
    if (index > 0 && selected.key) {
      try {
        const result = await fetchTourVariant(tour.slug, selected.key);
        setTour(current => current ? {...current, seasons: [current.seasons[0], result.variant, ...current.seasons.slice(2)]} : current);
      } catch (error) {
        showApiError(error, 'Could not load this package option.');
      }
    }
    if (selected.dates?.length) {
      setSelectedDate(selected.dates[0].date);
    }
  };

  const toggleDay = (index: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAllDays = () => {
    if (!activeSeason?.itinerary) return;
    const allExpanded: Record<string, boolean> = {};
    activeSeason.itinerary.forEach((_, idx) => {
      allExpanded[String(idx)] = true;
    });
    setExpandedDays(allExpanded);
  };

  const handleShare = async () => {
    if (!tour) return;
    try {
      await Share.share({
        title: tour.title,
        message: `Check out ${tour.title} with Coochbehar Travels starting from ₹${activeSeason?.price?.toLocaleString('en-IN') || tour.seasons[0]?.price}!\nDetails: https://coochbehar-travels.onrender.com/api/v1/tour-packages/${tour.slug}`,
      });
    } catch {
      // share canceled
    }
  };

  const handleWhatsAppInquiry = () => {
    if (!tour || !activeSeason) return;
    const msg = `Hello Coochbehar Travel, I am interested in:\n- Tour: ${tour.title} (${tour.tour_code})\n- Season / Package: ${activeSeason.name}\n- Preferred Date: ${selectedDate || 'Upcoming departure'}\n- Duration: ${activeSeason.duration}\n- Quoted Price: ₹${activeSeason.price?.toLocaleString('en-IN')}\n\nPlease share booking details and seat availability!`;
    openWhatsAppChat(msg);
  };

  const handleEnquirePress = () => {
    if (!tour || !activeSeason) return;
    onStartEnquiry({
      tourSlug: tour.slug,
      tourTitle: tour.title,
      variantName: activeSeason.name,
      travelDate: selectedDate || (activeSeason.dates?.[0]?.date ?? ''),
    });
    onNavigate('enquiry');
  };

  if (loading) {
    return <TourDetailSkeleton />;
  }

  if (!tour || !activeSeason) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load tour details.</Text>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go Back to Tours</Text>
        </Pressable>
      </View>
    );
  }

  const isDomestic = tour.type === 'DOMESTIC';
  const priceFormatted = activeSeason.price
    ? `₹${Number(activeSeason.price).toLocaleString('en-IN')}`
    : 'Call for Price';

  return (
    <View style={styles.container}>
      <MediaViewer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDetail} colors={[COLORS.primary]} />}>
        {/* Top Hero Image & Actions */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: activeSeason.cover_image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />

          {/* Floating Actions */}
          <View style={styles.topActions}>
            <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>

            <View style={styles.topRightBtns}>
              <Pressable onPress={handleShare} style={styles.circleBtn} hitSlop={10}>
                <Text style={styles.shareIcon}>📤</Text>
              </Pressable>

              {onToggleSave && (
                <Pressable onPress={onToggleSave} style={styles.circleBtn} hitSlop={10}>
                  <Text style={styles.favIcon}>{isSaved ? '❤️' : '🤍'}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Badges in Hero */}
          <View style={styles.heroBottomContent}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  isDomestic ? styles.domesticBadge : styles.intlBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isDomestic ? styles.domesticBadgeText : styles.intlBadgeText,
                  ]}
                >
                  {tour.type}
                </Text>
              </View>

              {activeSeason.badge && (
                <View style={styles.seasonBadge}>
                  <Text style={styles.seasonBadgeText}>★ {activeSeason.badge}</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>{tour.title}</Text>
            <Text style={styles.heroLocation}>📍 {tour.destination} · {tour.tour_code}</Text>
          </View>
        </View>

        {/* Pricing & Duration Bar */}
        <View style={styles.priceDurationBar}>
          <View>
            <Text style={styles.priceBarLabel}>Starting from</Text>
            <Text style={styles.priceBarValue}>
              {priceFormatted}
              <Text style={styles.priceBarUnit}> / person</Text>
            </Text>
          </View>

          <View style={styles.durationPill}>
            <Text style={styles.durationPillText}>⏱ {activeSeason.duration}</Text>
            {activeSeason.seats ? (
              <Text style={styles.seatsText}>🟢 {activeSeason.seats} Seats Left</Text>
            ) : null}
          </View>
        </View>

        {/* Tour Overview / Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overviewText}>{tour.description}</Text>
        </View>

        {/* Season & Variant Switcher */}
        {tour.seasons && tour.seasons.length > 1 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Choose Season / Variant</Text>
            <Text style={styles.sectionSubtitle}>
              Select a package variation to see route, dates, and pricing
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonChipsRow}>
              {tour.seasons.map((season, idx) => {
                const isSelected = selectedSeasonIndex === idx;
                return (
                  <Pressable
                    key={season.id || season.key}
                    onPress={() => handleSeasonChange(idx)}
                    style={[
                      styles.seasonChip,
                      isSelected && styles.seasonChipActive,
                    ]}
                  >
                    <Text style={[styles.seasonChipTitle, isSelected && styles.seasonChipTitleActive]}>
                      {season.name}
                    </Text>
                    <Text style={[styles.seasonChipPrice, isSelected && styles.seasonChipPriceActive]}>
                      ₹{Number(season.price).toLocaleString('en-IN')} · {season.duration}
                    </Text>
                    {season.badge && (
                      <View style={styles.chipMiniBadge}>
                        <Text style={styles.chipMiniBadgeText}>{season.badge}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Route Stops / Timeline */}
        {activeSeason.route && activeSeason.route.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tour Route & Night Stays</Text>
            <View style={styles.routeContainer}>
              {activeSeason.route.map((stop, index) => (
                <View key={stop.id || index} style={styles.routeStep}>
                  <View style={styles.routeStepLeft}>
                    <View style={styles.routeBullet}>
                      <Text style={styles.routeBulletNum}>{index + 1}</Text>
                    </View>
                    {index < activeSeason.route.length - 1 && <View style={styles.routeLine} />}
                  </View>
                  <View style={styles.routeStepRight}>
                    <Text style={styles.routePlace}>{stop.place}{(stop as any).nights ? ' · ' + (stop as any).nights + 'N' : ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Highlights */}
        {activeSeason.highlights && activeSeason.highlights.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tour Highlights</Text>
            <View style={styles.highlightsGrid}>
              {activeSeason.highlights.map((h, i) => (
                <View key={h.id || i} style={styles.highlightItem}>
                  <Text style={styles.highlightStar}>✦</Text>
                  <Text style={styles.highlightText}>{h.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeSeason.gallery && activeSeason.gallery.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Journey Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {activeSeason.gallery.map((media, index) => media.url ? (
                media.type === 'video' ? (
                  <Pressable key={media.id || index} style={styles.galleryVideo} onPress={() => setSelectedMedia({uri: media.url as string, type: 'video', title: media.alt || 'Tour video'})}>
                    <Text style={styles.galleryVideoIcon}>▶</Text>
                    <Text style={styles.galleryVideoText}>Watch video</Text>
                  </Pressable>
                ) : (
                  <Pressable key={media.id || index} onPress={() => setSelectedMedia({uri: media.url as string, type: 'image', title: media.alt || 'Tour gallery image'})}>
                    <Image source={{uri: media.url}} style={styles.galleryImage} accessibilityLabel={media.alt || 'Tour gallery image'} />
                  </Pressable>
                )
              ) : null)}
            </ScrollView>
          </View>
        )}

        {/* Upcoming Departure Dates */}
        {activeSeason.dates && activeSeason.dates.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Upcoming Departures</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to select your preferred departure date:
            </Text>

            <View style={styles.datesGrid}>
              {activeSeason.dates.map((d, i) => {
                const isSelected = selectedDate === d.date;
                return (
                  <Pressable
                    key={d.id || i}
                    onPress={() => setSelectedDate(d.date)}
                    style={[
                      styles.dateChip,
                      isSelected && styles.dateChipSelected,
                    ]}
                  >
                    <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                      📅 {d.date}
                    </Text>
                    {isSelected && <Text style={styles.selectedCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Day by Day Itinerary */}
        {activeSeason.itinerary && activeSeason.itinerary.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.itineraryHeaderRow}>
              <Text style={styles.sectionTitle}>Day-by-Day Itinerary</Text>
              <Pressable onPress={expandAllDays}>
                <Text style={styles.expandAllText}>Expand All</Text>
              </Pressable>
            </View>

            {activeSeason.itinerary.map((dayItem, idx) => {
              const isExpanded = !!expandedDays[String(idx)];
              return (
                <View key={dayItem.id || idx} style={styles.itineraryCard}>
                  <Pressable
                    onPress={() => toggleDay(String(idx))}
                    style={styles.itineraryCardHeader}
                  >
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>DAY {idx + 1}</Text>
                    </View>
                    <Text style={styles.itineraryDayTitle} numberOfLines={1}>
                      {dayItem.title || 'Day ' + dayItem.day}
                    </Text>
                    <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.itineraryCardBody}>
                      <Text style={styles.itineraryDesc}>{dayItem.description}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Inclusions and Exclusions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What's Included & Excluded</Text>

          <Text style={styles.subSectionTitle}>✅ Inclusions</Text>
          {activeSeason.inclusions?.map((inc, i) => (
            <View key={i} style={styles.checkItem}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.includeText}>{inc}</Text>
            </View>
          ))}

          <Text style={[styles.subSectionTitle, styles.exclusionsTitle]}>❌ Exclusions</Text>
          {activeSeason.exclusions?.map((exc, i) => (
            <View key={i} style={styles.checkItem}>
              <Text style={styles.redCross}>✕</Text>
              <Text style={styles.excludeText}>{exc}</Text>
            </View>
          ))}
        </View>

        {/* Reviews Section */}
        <View style={styles.sectionCard}>
          <View style={styles.reviewSummaryHeader}>
            <View>
              <Text style={styles.sectionTitle}>Traveller Reviews</Text>
              <Text style={styles.reviewScore}>⭐ 4.9 <Text style={styles.reviewCount}>({tour.reviews?.length || 3} verified ratings)</Text></Text>
            </View>
          </View>

          {tour.reviews?.map(rev => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewTopRow}>
                <View style={styles.reviewerIdentity}>
                  {rev.reviewer_pic ? <Image source={{uri: rev.reviewer_pic}} style={styles.reviewerPic} /> : null}
                  <Text style={styles.reviewerName}>{rev.name || rev.reviewer_by}</Text>
                </View>
                <Text style={styles.reviewStars}>{'★'.repeat(rev.rating)}</Text>
              </View>
              <Text style={styles.reviewBody}>“{rev.review}”</Text>
              {rev.review_gallery && rev.review_gallery.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewGalleryRow}>
                  {rev.review_gallery.map((media, index) => media.url && media.type !== 'video' ? (
                    <Pressable key={media.id || index} onPress={() => setSelectedMedia({uri: media.url as string, type: 'image', title: media.alt || 'Review photo'})}>
                      <Image source={{uri: media.url}} style={styles.reviewGalleryImage} />
                    </Pressable>
                  ) : media.url ? (
                    <Pressable key={media.id || index} onPress={() => setSelectedMedia({uri: media.url as string, type: 'video', title: media.alt || 'Review video'})} style={styles.reviewVideoLink}>
                      <Text style={styles.reviewVideoText}>▶ Video</Text>
                    </Pressable>
                  ) : null)}
                </ScrollView>
              )}
              {rev.is_verified && (
                <Text style={styles.verifiedPill}>✓ Verified Guest</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Bottom Booking Bar matching design */}
      <View style={styles.fixedBottomBar}>
        <Pressable
          style={styles.whatsappActionBtn}
          onPress={handleWhatsAppInquiry}
        >
          <Text style={styles.whatsappActionIcon}>💬</Text>
          <Text style={styles.whatsappActionText}>WhatsApp</Text>
        </Pressable>

        <Pressable
          style={styles.enquireActionBtn}
          onPress={handleEnquirePress}
        >
          <Text style={styles.enquireActionText}>Enquire Now  →</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  exclusionsTitle: {
    marginTop: 16,
  },
  bottomSpacer: {
    height: 100,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroWrapper: {
    height: 340,
    position: 'relative',
    backgroundColor: COLORS.primaryDark,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  topActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  shareIcon: {
    fontSize: 16,
  },
  favIcon: {
    fontSize: 16,
  },
  heroBottomContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  domesticBadge: {
    backgroundColor: '#0284C7',
  },
  domesticBadgeText: {
    color: '#FFFFFF',
  },
  intlBadge: {
    backgroundColor: '#7C3AED',
  },
  intlBadgeText: {
    color: '#FFFFFF',
  },
  seasonBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  seasonBadgeText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  heroLocation: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 4,
    fontWeight: '600',
  },
  priceDurationBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  priceBarLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceBarValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceBarUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  durationPill: {
    alignItems: 'flex-end',
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seatsText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  seasonChipsRow: {
    gap: 10,
    paddingTop: 4,
  },
  seasonChip: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    minWidth: 160,
  },
  seasonChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySubtle,
  },
  seasonChipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  seasonChipTitleActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  seasonChipPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  seasonChipPriceActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  chipMiniBadge: {
    marginTop: 6,
    backgroundColor: COLORS.goldLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipMiniBadgeText: {
    fontSize: 9,
    color: COLORS.goldDark,
    fontWeight: '800',
  },
  routeContainer: {
    marginTop: 8,
  },
  routeStep: {
    flexDirection: 'row',
    minHeight: 38,
  },
  routeStepLeft: {
    alignItems: 'center',
    width: 28,
  },
  routeBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeBulletNum: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  routeStepRight: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  routePlace: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  highlightsGrid: {
    gap: 8,
    marginTop: 4,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  highlightStar: {
    color: COLORS.gold,
    fontSize: 14,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryRow: {
    gap: 10,
    paddingTop: 10,
  },
  galleryImage: {
    width: 230,
    height: 150,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  galleryVideo: {
    width: 230,
    height: 150,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryVideoIcon: {
    color: COLORS.gold,
    fontSize: 28,
  },
  galleryVideoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 6,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dateChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  itineraryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itineraryCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  itineraryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  dayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  itineraryDayTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  expandChevron: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  itineraryCardBody: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itineraryDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  greenCheck: {
    color: COLORS.success,
    fontWeight: '900',
    fontSize: 13,
  },
  redCross: {
    color: COLORS.danger,
    fontWeight: '900',
    fontSize: 13,
  },
  includeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  excludeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  reviewSummaryHeader: {
    marginBottom: 12,
  },
  reviewScore: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.goldDark,
    marginTop: 2,
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 12,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerPic: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewStars: {
    color: COLORS.gold,
    fontSize: 12,
  },
  reviewBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reviewGalleryRow: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  reviewGalleryImage: {
    width: 100,
    height: 72,
    borderRadius: 7,
  },
  reviewVideoLink: {
    width: 100,
    height: 72,
    borderRadius: 7,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewVideoText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  verifiedPill: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 4,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  whatsappActionBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 8,
  },
  whatsappActionIcon: {
    fontSize: 18,
  },
  whatsappActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  enquireActionBtn: {
    flex: 1.4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  enquireActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
