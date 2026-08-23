import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/theme';
import { openWhatsAppChat } from '../api/tourApi';
import { useAppDialog } from './AppDialog';

interface CustomTourModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess?: (enquiry: any) => void;
}

export const CustomTourModal: React.FC<CustomTourModalProps> = ({
  visible,
  onClose,
  onSubmitSuccess,
}) => {
  const {showDialog} = useAppDialog();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('7 Days');
  const [travellers, setTravellers] = useState('2 Adults');
  const [budget, setBudget] = useState('₹30,000 - ₹50,000 / person');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !destination.trim()) {
      await showDialog({title: 'Required fields', message: 'Please enter your Name, Phone Number, and Destination.', variant: 'warning'});
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      setIsSubmitting(false);
      const enq = {
        fullName: name,
        mobile: phone,
        destination,
        duration,
        travellers,
        budget,
        message: `Custom Tour Request for ${destination}. ${specialNote}`,
        createdAt: new Date().toISOString(),
      };
      if (onSubmitSuccess) onSubmitSuccess(enq);
      const sendWhatsApp = await showDialog({title: 'Custom plan requested! 🌟', message: `Thank you ${name}! Our holiday specialist will design a personalized itinerary for ${destination} and call you on ${phone}.`, variant: 'success', confirmText: 'Send on WhatsApp', cancelText: 'Done'});
      if (sendWhatsApp) openWhatsAppChat(`Hello Coochbehar Travel, I would like a Custom Tour Package!\n- Destination: ${destination}\n- Duration: ${duration}\n- Travellers: ${travellers}\n- Budget: ${budget}\n- Name: ${name} (${phone})\n- Notes: ${specialNote || 'None'}`);
      onClose();
    }, 600);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerTitle}>Craft Your Custom Tour</Text>
              <Text style={styles.headerSubtitle}>
                Tell us your dream holiday, we handle the rest
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>WHERE DO YOU WANT TO GO? *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Switzerland, Ladakh, Bali, Vietnam..."
              placeholderTextColor={COLORS.textMuted}
              value={destination}
              onChangeText={setDestination}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>DURATION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7 Days"
                  placeholderTextColor={COLORS.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>TRAVELLERS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2 Adults, 1 Child"
                  placeholderTextColor={COLORS.textMuted}
                  value={travellers}
                  onChangeText={setTravellers}
                />
              </View>
            </View>

            <Text style={styles.label}>BUDGET PREFERENCE</Text>
            <View style={styles.budgetRow}>
              {['Standard (Budget)', 'Deluxe (Comfort)', 'Luxury 5-Star'].map(b => (
                <Pressable
                  key={b}
                  onPress={() => setBudget(b)}
                  style={[styles.budgetChip, budget === b && styles.budgetChipActive]}
                >
                  <Text style={[styles.budgetChipText, budget === b && styles.budgetChipTextActive]}>
                    {b}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>YOUR FULL NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sen"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>MOBILE NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>SPECIAL PREFERENCES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Candlelight dinner, pure veg food, flight inclusive, private cab..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              value={specialNote}
              onChangeText={setSpecialNote}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.disabled]}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Submitting...' : 'Request Custom Itinerary  →'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  formScroll: {
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  budgetChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  budgetChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySubtle,
  },
  budgetChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  budgetChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
