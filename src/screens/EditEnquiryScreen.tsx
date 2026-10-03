import React, {useState} from 'react';
import {ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {updateEnquiry} from '../api/tourApi';
import {AppColors, useColors} from '../theme/theme';
import {CustomDateField} from '../components/CustomDatePicker';

interface Props { enquiry: any; onSaved: () => void; }

export const EditEnquiryScreen: React.FC<Props> = ({enquiry, onSaved}) => {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [form, setForm] = useState({
    name: enquiry?.enquirer_name || enquiry?.fullName || enquiry?.name || '',
    phone: enquiry?.enquirer_phone || enquiry?.mobile || enquiry?.phone || '',
    email: enquiry?.enquirer_email || enquiry?.email || '',
    package_id: enquiry?.package_id || enquiry?.packageId || '',
    variant_id: enquiry?.variant_id || enquiry?.variantId || '',
    destination_id: enquiry?.destination_id || enquiry?.destinationId || '',
    travel_date: enquiry?.travel_date || enquiry?.travelDate || '',
    travel_duration_day: String(enquiry?.travel_duration_day ?? enquiry?.travelDurationDay ?? 0),
    travel_duration_night: String(enquiry?.travel_duration_night ?? enquiry?.travelDurationNight ?? 0),
    adult_count: String(enquiry?.adult_count ?? enquiry?.adults ?? 1),
    child_count: String(enquiry?.child_count ?? enquiry?.children ?? 0),
    senior_count: String(enquiry?.senior_count ?? 0),
    hotel_id: enquiry?.hotel_id || enquiry?.hotelId || '',
    vehicle_id: enquiry?.vehicle_id || enquiry?.vehicleId || '',
    room_count: String(enquiry?.room_count ?? enquiry?.no_room ?? 0),
    vehicle_count: String(enquiry?.vehicle_count ?? enquiry?.vehicleCount ?? 0),
    budget_min: String(enquiry?.budget_min ?? enquiry?.budgetMin ?? 0),
    budget_max: String(enquiry?.budget_max ?? enquiry?.budgetMax ?? 0),
    meal_plan: enquiry?.meal_plan || enquiry?.mealPlan || 'ANY',
    message: enquiry?.message || '',
    special_requirements: enquiry?.special_requirements || enquiry?.specialRequirements || '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof form, value: string) => setForm(current => ({...current, [key]: value}));
  const save = async () => {
    if (!enquiry?.id || !form.name.trim() || !form.phone.trim()) {
      Alert.alert('Required fields', 'Name and phone number are required.');
      return;
    }
    setSaving(true);
    try {
      await updateEnquiry(enquiry.id, {
        ...form,
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
        package_id: form.package_id.trim(), variant_id: form.variant_id.trim(),
        destination_id: form.destination_id.trim(), hotel_id: form.hotel_id.trim(),
        vehicle_id: form.vehicle_id.trim(), meal_plan: form.meal_plan.trim() || 'ANY',
        travel_duration_day: Number(form.travel_duration_day) || 0,
        travel_duration_night: Number(form.travel_duration_night) || 0,
        adult_count: Number(form.adult_count) || 0, child_count: Number(form.child_count) || 0,
        senior_count: Number(form.senior_count) || 0, room_count: Number(form.room_count) || 0,
        vehicle_count: Number(form.vehicle_count) || 0,
        budget_min: Number(form.budget_min) || 0, budget_max: Number(form.budget_max) || 0,
      });
      onSaved();
    } catch (error) {
      Alert.alert('Could not update enquiry', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  const fields = [
    ['name', 'Full name'], ['phone', 'Phone'], ['email', 'Email'],
    ['package_id', 'Package ID'], ['variant_id', 'Variant ID'], ['destination_id', 'Destination ID'],
    ['travel_duration_day', 'Travel duration (days)'], ['travel_duration_night', 'Travel duration (nights)'],
    ['adult_count', 'Adults'], ['child_count', 'Children'], ['senior_count', 'Seniors'],
    ['hotel_id', 'Hotel ID'], ['vehicle_id', 'Vehicle ID'], ['room_count', 'Rooms'],
    ['vehicle_count', 'Vehicles'], ['budget_min', 'Minimum budget'], ['budget_max', 'Maximum budget'],
    ['meal_plan', 'Meal plan'],
  ] as const;
  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.heading}><View style={styles.icon}><Feather name="edit-3" size={21} color={colors.primary} /></View><View style={styles.headingCopy}><Text style={styles.eyebrow}>UPDATE REQUEST</Text><Text style={styles.title}>Edit enquiry</Text><Text style={styles.subtitle}>{enquiry?.tourTitle || enquiry?.destination || 'Travel enquiry'}</Text></View></View>
      {fields.map(([key, label]) => <View style={styles.field} key={key}><Text style={styles.label}>{label}</Text><TextInput value={form[key]} onChangeText={value => setField(key, value)} style={styles.input} placeholder={label} placeholderTextColor={colors.textMuted} keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : key.includes('count') || key.includes('duration') || key.includes('budget') ? 'numeric' : 'default'} autoCapitalize={key === 'email' || key.endsWith('_id') ? 'none' : 'words'} /></View>)}
      <View style={styles.field}><Text style={styles.label}>Travel date</Text><CustomDateField value={form.travel_date} onChange={value => setField('travel_date', value)} placeholder="Select travel date" title="Select travel date" /></View>
      <View style={styles.field}><Text style={styles.label}>Message</Text><TextInput value={form.message} onChangeText={value => setField('message', value)} style={[styles.input, styles.multiline]} multiline placeholder="Tell us about your requirements" placeholderTextColor={colors.textMuted} /></View>
      <View style={styles.field}><Text style={styles.label}>Special requirements</Text><TextInput value={form.special_requirements} onChangeText={value => setField('special_requirements', value)} style={[styles.input, styles.multiline]} multiline placeholder="Any special requirements" placeholderTextColor={colors.textMuted} /></View>
      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color={colors.textLight} /> : <><Text style={styles.saveText}>Save enquiry</Text><Feather name="check" size={17} color={colors.textLight} /></>}</Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg}, content: {padding: 16, paddingBottom: 40},
  heading: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15, marginBottom: 20}, icon: {width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12}, headingCopy: {flex: 1}, eyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1, color: colors.primary}, title: {fontSize: 23, fontWeight: '900', color: colors.text, marginTop: 3}, subtitle: {fontSize: 12, color: colors.textSecondary, marginTop: 3}, field: {marginBottom: 13}, label: {fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 6}, input: {height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 12, fontSize: 13}, multiline: {height: 100, paddingTop: 12, textAlignVertical: 'top'}, saveButton: {height: 50, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 7}, saveText: {fontSize: 14, fontWeight: '900', color: colors.textLight},
});
