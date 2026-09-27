import React from 'react';
import {ScrollView, StyleSheet, Text, View, Pressable} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {AppColors, useColors} from '../theme/theme';

interface Props { enquiry: any; onEdit?: () => void; onBack?: () => void; }
const valueOf = (enquiry: any, ...keys: string[]) => keys.map(key => enquiry?.[key]).find(value => value !== undefined && value !== null && value !== '') || 'Not provided';
const formatDate = (value: any) => { if (!value) return 'Not provided'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}); };

export const EnquiryDetailsScreen: React.FC<Props> = ({enquiry, onEdit, onBack}) => {
  const colors = useColors();
  const styles = makeStyles(colors);
  const status = String(enquiry?.status || 'PENDING').toUpperCase();
  const title = valueOf(enquiry, 'tourTitle', 'subject', 'destination_name', 'destination');
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.screenHeader}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.backButton}><Feather name="arrow-left" size={20} color={colors.text} /></Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>TRAVEL REQUEST</Text>
        <Text style={styles.title}>Enquiry details</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.reference} numberOfLines={1}>Reference: {valueOf(enquiry, 'id')}</Text>
      </View>
      <Text style={[styles.status, status === 'CONFIRMED' ? styles.statusConfirmed : styles.statusPending]}>{status}</Text>
    </View>
    <Section title="Contact information" styles={styles}>
      <Detail icon="user" label="Full name" value={valueOf(enquiry, 'fullName', 'enquirer_name', 'name')} styles={styles} colors={colors} />
      <Detail icon="phone" label="Mobile" value={valueOf(enquiry, 'mobile', 'enquirer_phone', 'phone')} styles={styles} colors={colors} />
      <Detail icon="mail" label="Email" value={valueOf(enquiry, 'email', 'enquirer_email')} styles={styles} colors={colors} />
    </Section>
    <Section title="Travel request" styles={styles}>
      <Detail icon="map-pin" label="Destination" value={valueOf(enquiry, 'destination', 'destination_name')} styles={styles} colors={colors} />
      <Detail icon="calendar" label="Travel date" value={formatDate(valueOf(enquiry, 'travelDate', 'travel_date'))} styles={styles} colors={colors} />
      <Detail icon="users" label="Travellers" value={`${valueOf(enquiry, 'adults', 'adult_count')} adults · ${valueOf(enquiry, 'children', 'child_count')} children · ${valueOf(enquiry, 'senior_count')} seniors`} styles={styles} colors={colors} />
      <Detail icon="home" label="Rooms" value={valueOf(enquiry, 'room_count', 'no_room')} styles={styles} colors={colors} />
      <Detail icon="briefcase" label="Package / variant" value={`${valueOf(enquiry, 'tourTitle', 'subject', 'destination')} · ${valueOf(enquiry, 'variantName', 'variant_name')}`} styles={styles} colors={colors} />
    </Section>
    <Section title="Message & updates" styles={styles}>
      <Text style={styles.message}>{valueOf(enquiry, 'message', 'special_requirements')}</Text>
      <View style={styles.metaBlock}><Text style={styles.metaLabel}>Submitted</Text><Text style={styles.metaValue}>{formatDate(valueOf(enquiry, 'createdAt', 'created_at'))}</Text></View>
      {enquiry?.updated_at ? <View style={styles.metaBlock}><Text style={styles.metaLabel}>Last updated</Text><Text style={styles.metaValue}>{formatDate(enquiry.updated_at)}</Text></View> : null}
    </Section>
    {onEdit ? <Pressable style={styles.editButton} onPress={onEdit}><Feather name="edit-2" size={17} color={colors.textLight} /><Text style={styles.editText}>Edit enquiry</Text></Pressable> : null}
  </ScrollView>;
};

const Section: React.FC<{title: string; styles: any; children: React.ReactNode}> = ({title, styles, children}) => <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>;
const Detail: React.FC<{icon: string; label: string; value: string; styles: any; colors: AppColors}> = ({icon, label, value, styles, colors}) => <View style={styles.detail}><View style={styles.detailIcon}><Feather name={icon} size={15} color={colors.primary} /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg}, content: {padding: 16, paddingBottom: 36}, screenHeader: {flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 16, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border}, backButton: {width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12}, headerCopy: {flex: 1, minWidth: 0}, eyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1, color: colors.primary}, title: {fontSize: 23, fontWeight: '900', color: colors.text, marginTop: 3}, subtitle: {fontSize: 12, color: colors.textSecondary, marginTop: 4}, status: {fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, marginLeft: 8}, statusPending: {color: colors.goldDark, backgroundColor: colors.goldLight}, statusConfirmed: {color: colors.success, backgroundColor: colors.successLight}, reference: {fontSize: 10, color: colors.textMuted, marginTop: 7}, section: {marginBottom: 17}, sectionTitle: {fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}, card: {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 14}, detail: {flexDirection: 'row', alignItems: 'center', minHeight: 62, borderBottomWidth: 1, borderBottomColor: colors.border}, detailIcon: {width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center', marginRight: 11}, detailCopy: {flex: 1}, detailLabel: {fontSize: 10, color: colors.textMuted, fontWeight: '800', textTransform: 'uppercase'}, detailValue: {fontSize: 13, color: colors.text, fontWeight: '700', marginTop: 4}, message: {fontSize: 13, lineHeight: 20, color: colors.text, paddingVertical: 14}, metaBlock: {flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 11}, metaLabel: {fontSize: 11, color: colors.textMuted}, metaValue: {fontSize: 11, color: colors.textSecondary, fontWeight: '700'}, editButton: {height: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}, editText: {fontSize: 13, fontWeight: '900', color: colors.textLight},
});
