import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'COOCHBEHAR TRAVEL',
  showBack = false,
  onBack,
  onOpenMenu,
  onOpenNotifications,
  unreadCount = 0,
  rightAction,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showBack ? (
          <Pressable
            hitSlop={12}
            onPress={onBack}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            hitSlop={12}
            onPress={onOpenMenu}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <View style={styles.titleSection}>
        <View style={styles.brandRow}>
          <Image
            source={require('../assets/logo.jpg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandText} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.subBrand}>EXPLORE THE WORLD WITH US</Text>
      </View>

      <View style={styles.rightSection}>
        {rightAction ? (
          rightAction
        ) : onOpenNotifications ? (
          <Pressable
            hitSlop={12}
            onPress={onOpenNotifications}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  subBrand: {
    color: COLORS.gold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 1,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
