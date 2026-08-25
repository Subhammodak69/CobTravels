import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { COLORS, useColors } from '../theme/theme';
import { TourPackageSummary, NavScreen } from '../types';
import { TourCard } from '../components/TourCard';
import { TourListSkeleton } from '../components/Skeleton';

interface TourListScreenProps {
  tours: TourPackageSummary[];
  loading: boolean;
  onRefresh: () => void;
  onSelectTour: (tour: TourPackageSummary) => void;
  onNavigate: (screen: NavScreen) => void;
  initialFilter?: 'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED';
  savedTours: string[];
  onToggleSave: (slug: string) => void;
  onEnquireTour?: (tour: TourPackageSummary) => void;
}

export const TourListScreen: React.FC<TourListScreenProps> = ({
  tours,
  loading,
  onRefresh,
  onSelectTour,
  onNavigate,
  initialFilter = 'ALL',
  savedTours,
  onToggleSave,
  onEnquireTour,
}) => {
  const COLORS = useColors();
  const styles = makeStyles(COLORS);
  const [filterType, setFilterType] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'duration'>('recommended');
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical');

  const filteredTours = useMemo(() => {
    let result = [...tours];

    // Filter by type
    if (filterType === 'DOMESTIC') {
      result = result.filter(t => t.type === 'DOMESTIC');
    } else if (filterType === 'INTERNATIONAL') {
      result = result.filter(t => t.type === 'INTERNATIONAL');
    } else if (filterType === 'FEATURED') {
      result = result.filter(t => t.is_featured);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.tour_code.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.starting_price - b.starting_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.starting_price - a.starting_price);
    } else if (sortBy === 'duration') {
      result.sort((a, b) => b.duration_days - a.duration_days);
    }

    return result;
  }, [tours, filterType, searchQuery, sortBy]);

  return (
    <View style={styles.container}>
      {/* Search and Filter Top Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination, tour code, style..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['ALL', 'DOMESTIC', 'INTERNATIONAL', 'FEATURED'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setFilterType(tab)}
              style={[
                styles.filterPill,
                filterType === tab && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterType === tab && styles.filterPillTextActive,
                ]}
              >
                {tab === 'ALL'
                  ? 'All Tours'
                  : tab === 'DOMESTIC'
                  ? '🇮🇳 Domestic'
                  : tab === 'INTERNATIONAL'
                  ? '✈️ International'
                  : '🌟 Featured'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sub Info & View Toggle Bar */}
        <View style={styles.infoBar}>
          <Text style={styles.countText}>
            Showing <Text style={styles.countHighlight}>{filteredTours.length}</Text> packages
          </Text>

          <View style={styles.sortToggleRow}>
            {/* Sort chips */}
            <Pressable
              style={[styles.sortChip, sortBy === 'price_asc' && styles.sortChipActive]}
              onPress={() => setSortBy(sortBy === 'price_asc' ? 'recommended' : 'price_asc')}
            >
              <Text style={[styles.sortChipText, sortBy === 'price_asc' && styles.sortChipTextActive]}>
                Price ↑
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sortChip, sortBy === 'price_desc' && styles.sortChipActive]}
              onPress={() => setSortBy(sortBy === 'price_desc' ? 'recommended' : 'price_desc')}
            >
              <Text style={[styles.sortChipText, sortBy === 'price_desc' && styles.sortChipTextActive]}>
                Price ↓
              </Text>
            </Pressable>

            {/* Layout Mode Button */}
            <Pressable
              onPress={() => setLayoutMode(layoutMode === 'vertical' ? 'horizontal' : 'vertical')}
              style={styles.layoutToggleBtn}
            >
              <Text style={styles.layoutToggleIcon}>
                {layoutMode === 'vertical' ? '☰' : '☷'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tour List Content */}
      <FlatList
        data={loading && tours.length === 0 ? [] : filteredTours}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <TourCard
            tour={item}
            layout={layoutMode}
            onPress={() => onSelectTour(item)}
            onEnquire={onEnquireTour ? () => onEnquireTour(item) : () => { onSelectTour(item); onNavigate('enquiry'); }}
            isSaved={savedTours.includes(item.slug)}
            onToggleSave={() => onToggleSave(item.slug)}
          />
        )}
        ListEmptyComponent={loading ? <TourListSkeleton /> : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Matching Tours Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms or filter selection.
            </Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                setFilterType('ALL');
                setSearchQuery('');
                setSortBy('recommended');
              }}
            >
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchHeader: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  countText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  countHighlight: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  sortChipActive: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  layoutToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  layoutToggleIcon: {
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 260,
  },
  resetBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
