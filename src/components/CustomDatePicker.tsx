import React, {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useColors} from '../theme/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (value: number) => String(value).padStart(2, '0');

export const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const parseDate = (value?: string) => {
  const normalized = toDateInputValue(value);
  if (normalized) {
    const [year, month, day] = normalized.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const formatDisplayDate = (value?: string) => {
  const normalized = toDateInputValue(value);
  if (!normalized) return '';
  const date = parseDate(normalized);
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
};

export interface CustomDatePickerProps {
  visible: boolean;
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  title?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  value,
  onChange,
  onClose,
  title = 'Choose date',
}) => {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [monthDate, setMonthDate] = useState(() => parseDate(value));
  const selectedValue = toDateInputValue(value);

  useEffect(() => {
    if (visible) setMonthDate(parseDate(value));
  }, [visible, value]);

  const days = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const cells: Array<number | null> = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthDate]);

  const selectDay = (day: number) => {
    const nextValue = `${monthDate.getFullYear()}-${pad(monthDate.getMonth() + 1)}-${pad(day)}`;
    onChange(nextValue);
    onClose();
  };

  const changeMonth = (offset: number) => {
    setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>DATE</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.monthHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.arrowButton} hitSlop={8}>
              <Text style={styles.arrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.arrowButton} hitSlop={8}>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
          </View>
          <View style={styles.grid}>
            {days.map((day, index) => {
              const dayValue = day ? `${monthDate.getFullYear()}-${pad(monthDate.getMonth() + 1)}-${pad(day)}` : '';
              const selected = Boolean(day && dayValue === selectedValue);
              return (
                <Pressable
                  key={`${dayValue || 'empty'}-${index}`}
                  disabled={!day}
                  onPress={() => day && selectDay(day)}
                  style={[styles.day, selected && styles.selectedDay]}
                >
                  <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day || ''}</Text>
                </Pressable>
              );
            })}
          </View>

          {selectedValue ? (
            <Pressable onPress={() => { onChange(''); onClose(); }} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear date</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export interface CustomDateFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

export const CustomDateField: React.FC<CustomDateFieldProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  title = 'Choose date',
}) => {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        style={styles.field}
        onPress={() => {
          Keyboard.dismiss();
          setVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {formatDisplayDate(value) || placeholder}
        </Text>
        <Text style={styles.calendarIcon}>▣</Text>
      </Pressable>
      <CustomDatePicker
        visible={visible}
        value={value}
        title={title}
        onChange={onChange}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 12, 18, 0.58)', padding: 16},
  card: {backgroundColor: colors.card, borderRadius: 22, padding: 18, paddingBottom: Platform.OS === 'ios' ? 24 : 18},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  eyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1, color: colors.primary},
  title: {fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 3},
  closeButton: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface},
  closeText: {fontSize: 24, lineHeight: 26, color: colors.textSecondary},
  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 12},
  monthTitle: {fontSize: 16, fontWeight: '900', color: colors.text},
  arrowButton: {width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
  arrow: {fontSize: 28, lineHeight: 30, color: colors.primary},
  weekRow: {flexDirection: 'row', marginBottom: 6},
  weekday: {width: '14.2857%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.textMuted},
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  day: {width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  selectedDay: {backgroundColor: colors.primary},
  dayText: {fontSize: 14, color: colors.text, fontWeight: '700'},
  selectedDayText: {color: colors.textLight, fontWeight: '900'},
  clearButton: {alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 6},
  clearText: {fontSize: 12, color: colors.danger, fontWeight: '800'},
  field: {height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fieldText: {fontSize: 13, color: colors.text, flex: 1},
  placeholder: {color: colors.textMuted},
  calendarIcon: {fontSize: 16, color: colors.primary, marginLeft: 8},
});

