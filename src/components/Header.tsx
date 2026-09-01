import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, useColors, useTheme } from '../theme/theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenMenu?: () => void;
  menuOpen?: boolean;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'COOCHBEHAR TRAVEL',
  showBack = false,
  onBack,
  onOpenMenu,
  menuOpen = false,
  onOpenNotifications,
  unreadCount = 0,
  rightAction,
}) => {
  const COLORS = useColors();
  const { isDark } = useTheme();
  const styles = makeStyles(COLORS, isDark);
  const iconColor = isDark ? '#FFFFFF' : COLORS.text;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showBack ? (
          <Pressable
            hitSlop={12}
            onPress={onBack}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={22} color={iconColor} />
          </Pressable>
        ) : (
          <Pressable
            hitSlop={12}
            onPress={onOpenMenu}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name={menuOpen ? "close" : "menu"} size={menuOpen ? 22 : 24} color={iconColor} />
          </Pressable>
        )}
      </View>

      <View style={styles.titleSection}>
        <View style={styles.brandRow}>
          <Image
            source={isDark ? require('../assets/logo_dark.jpg') :  require('../assets/logo.jpg')}
            style={styles.headerLogo}
            resizeMode="cover"
          />
        </View>
        <View>
          <Text style={styles.brandText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subBrand}>EXPLORE THE UNEXPLORED</Text>
        </View>
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
            <Ionicons name="notifications-outline" size={22} color={iconColor} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
    </View>
  );
};

const makeStyles = (COLORS: ReturnType<typeof useColors>, isDark: boolean) => StyleSheet.create({
  headerSpacer: {
    width: 38,
  },
  headerContainer: {
    backgroundColor: isDark ? COLORS.primaryDark : '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : COLORS.border,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginRight: 10,
    borderWidth:1,
    borderColor:COLORS.border,
  },
  brandText: {
    color: isDark ? '#FFFFFF' : COLORS.text,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  subBrand: {
    color: COLORS.gold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'start',
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
