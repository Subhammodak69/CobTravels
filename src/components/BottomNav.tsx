import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/theme';
import { NavScreen } from '../types';

interface BottomNavProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  enquiryCount?: number;
  onEnquiryTab?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  enquiryCount = 0,
  onEnquiryTab,
}) => {
  const { colors: COLORS, isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const tabs: {
    key: NavScreen;
    label: string;
    iconActive: string;
    iconInactive: string;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      key: 'tours',
      label: 'Tours',
      iconActive: 'compass',
      iconInactive: 'compass-outline',
    },
    {
      key: 'enquiry',
      label: 'Enquiry',
      iconActive: 'chatbox-ellipses',
      iconInactive: 'chatbox-ellipses-outline',
    },
    {
      key: 'profile',
      label: 'Profile',
      iconActive: 'person',
      iconInactive: 'person-outline',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive =
          currentScreen === tab.key ||
          (tab.key === 'tours' && currentScreen === 'tour_detail');

        const iconName = isActive ? tab.iconActive : tab.iconInactive;
        const iconColor = isActive
          ? (isDark ? '#FFFFFF' : COLORS.primary)
          : (isDark ? 'rgba(255, 255, 255, 0.55)' : COLORS.textMuted);

        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (tab.key === 'enquiry' && onEnquiryTab) {
                onEnquiryTab();
              } else {
                onNavigate(tab.key);
              }
            }}
            style={styles.tabItem}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Ionicons name={iconName} size={22} color={iconColor} />
              {tab.key === 'enquiry' && enquiryCount > 0 && (
                <View style={styles.enquiryBadge}>
                  <Text style={styles.enquiryBadgeText}>{enquiryCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#072421' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : COLORS.border,
      paddingVertical: 6,
      paddingHorizontal: 8,
      elevation: 10,
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: -2 },
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    iconWrapper: {
      width: 44,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    activeIconWrapper: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.primarySubtle,
    },
    tabLabel: {
      fontSize: 11,
      marginTop: 2,
      fontWeight: '600',
    },
    tabLabelActive: {
      color: isDark ? '#FFFFFF' : COLORS.primary,
      fontWeight: '800',
    },
    tabLabelInactive: {
      color: isDark ? 'rgba(255, 255, 255, 0.55)' : COLORS.textMuted,
    },
    activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#FFFFFF' : COLORS.primary,
      marginTop: 2,
    },
    enquiryBadge: {
      position: 'absolute',
      top: -2,
      right: 2,
      backgroundColor: COLORS.gold,
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    enquiryBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },
  });
