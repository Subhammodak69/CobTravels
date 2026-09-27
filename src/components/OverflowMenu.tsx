import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { AppColors } from '../theme/theme';

export interface OverflowAction {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

export const OverflowButton: React.FC<{ colors: AppColors; onPress: () => void }> = ({ colors, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="More actions"
    hitSlop={8}
    onPress={onPress}
    style={({ pressed }) => [styles.overflowButton, pressed && styles.pressed]}
  >
    <Feather name="more-vertical" size={20} color={colors.textSecondary} />
  </Pressable>
);

interface OverflowMenuProps {
  colors: AppColors;
  visible: boolean;
  title: string;
  actions: OverflowAction[];
  onClose: () => void;
}

export const OverflowMenu: React.FC<OverflowMenuProps> = ({ colors, visible, title, actions, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={event => event.stopPropagation()}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        {actions.map(action => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [styles.action, { borderTopColor: colors.border }, pressed && { backgroundColor: colors.surface }]}
            onPress={() => { onClose(); action.onPress(); }}
          >
            <Feather name={action.icon} size={18} color={action.destructive ? colors.danger : colors.primary} />
            <Text style={[styles.actionText, { color: action.destructive ? colors.danger : colors.text }]}>{action.label}</Text>
            <Feather name="chevron-right" size={17} color={colors.textMuted} />
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overflowButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.58)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 18, paddingTop: 9, paddingBottom: 28 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#667085', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: '900', marginRight: 12 },
  action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 8 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '800', marginLeft: 13 },
});
