import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Clock, X, ChevronDown } from 'lucide-react-native';
import type { Provider } from '../services/providerService';

interface BookingModalProps {
  visible: boolean;
  provider: Provider | null;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ visible, provider, onClose, onBooked }) => {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  // Next 7 days
  const next7Days = useMemo(() => {
    const arr: { value: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const value = `${yyyy}-${mm}-${dd}`;
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      arr.push({ value, label });
    }
    return arr;
  }, []);

  // Time slots 09:00 - 18:00, every 30 minutes
  const timeSlots = useMemo(() => {
    const out: string[] = [];
    for (let h = 9; h <= 18; h++) {
      for (let m of [0, 30]) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        out.push(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
      }
    }
    return out;
  }, []);

  const disabled = !date || !time || !address || submitting;

  const submit = async () => {
    try {
      setSubmitting(true);
      setTimeout(() => {
        onBooked('bk_' + Math.random().toString(36).slice(2, 9));
        setSubmitting(false);
      }, 600);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Book {provider?.businessName || provider?.user.fullName || 'Provider'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.close}>
              <X size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Date dropdown */}
            <Text style={styles.label}>Select Date</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDateOptions(!showDateOptions)} activeOpacity={0.8}>
              <CalendarDays size={18} color="#64748b" />
              <Text style={styles.dropdownText}>{date ? next7Days.find(d => d.value === date)?.label : 'Choose a date'}</Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showDateOptions && (
              <View style={styles.dropdownCard}>
                {next7Days.map(d => (
                  <TouchableOpacity key={d.value} style={styles.dropdownItem} onPress={() => { setDate(d.value); setShowDateOptions(false); }}>
                    <Text style={styles.dropdownItemText}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Time dropdown */}
            <Text style={styles.label}>Select Time</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimeOptions(!showTimeOptions)} activeOpacity={0.8}>
              <Clock size={18} color="#64748b" />
              <Text style={styles.dropdownText}>{time || 'Choose a time'}</Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showTimeOptions && (
              <View style={styles.dropdownCard}>
                {timeSlots.map(t => (
                  <TouchableOpacity key={t} style={styles.dropdownItem} onPress={() => { setTime(t); setShowTimeOptions(false); }}>
                    <Text style={styles.dropdownItemText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Address and details */}
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Service address"
              placeholderTextColor="#9ca3af"
              style={styles.inputArea}
            />
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Brief description (optional)"
              placeholderTextColor="#9ca3af"
              style={[styles.inputArea, { height: 90 }]}
              multiline
            />

            <TouchableOpacity disabled={disabled} onPress={submit} style={[styles.bookBtn, disabled && styles.bookBtnDisabled]}>
              <Text style={styles.bookText}>{submitting ? 'Booking...' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  close: { padding: 6 },
  content: { padding: 16, gap: 12 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  dropdown: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14 },
  dropdownText: { flex: 1, fontSize: 15, color: '#0f172a' },
  dropdownCard: { marginTop: 6, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 15, color: '#0f172a' },
  inputArea: { fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  bookBtn: { backgroundColor: '#ec4899', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  bookBtnDisabled: { opacity: 0.6 },
  bookText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default BookingModal;


