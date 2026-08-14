import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import { NavScreen } from '../types';

interface BottomNavProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  enquiryCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  enquiryCount = 0,
}) => {
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
        const iconColor = isActive ? COLORS.primary : COLORS.textMuted;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onNavigate(tab.key)}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
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
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primarySubtle,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: COLORS.textMuted,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
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
