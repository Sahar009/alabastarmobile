import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Clock, X, ChevronDown, Search, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Provider } from '../services/providerService';
import { apiService } from '../services/api';

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
  const [addressHistory, setAddressHistory] = useState<string[]>([]);
  const [remoteAddressSuggestions, setRemoteAddressSuggestions] = useState<string[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ label: string; source: 'remote' | 'history' }>>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const ADDRESS_HISTORY_KEY = 'bookingAddressHistory';

  useEffect(() => {
    const loadAddressHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(ADDRESS_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setAddressHistory(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load address history:', error);
      }
    };

    loadAddressHistory();
  }, []);

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
    const out: Array<{ label: string; value: string }> = [];
    for (let h = 9; h <= 18; h++) {
      for (let m of [0, 30]) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const label = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        out.push({ label, value });
      }
    }
    return out;
  }, []);

  const disabled = !provider || !date || !time || !address || submitting;

  useEffect(() => {
    const controller = new AbortController();
    const query = address.trim();

    if (!query) {
      setRemoteAddressSuggestions([]);
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ng&q=${encodeURIComponent(
          query,
        )}&limit=6`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped = data
            .map((item) => item.display_name as string)
            .filter((label) => typeof label === 'string' && label.length > 0);
          setRemoteAddressSuggestions(mapped);
        } else {
          setRemoteAddressSuggestions([]);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Address suggestion fetch failed:', error);
        }
        setRemoteAddressSuggestions([]);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address]);

  const updateAddressSuggestions = (query: string, remoteList: string[] = remoteAddressSuggestions) => {
    const suggestions: Array<{ label: string; source: 'remote' | 'history' }> = [];
    const seen = new Set<string>();
    const normalizedQuery = query.trim().toLowerCase();

    remoteList.forEach((label) => {
      const key = label.toLowerCase();
      if (!seen.has(key) && (!normalizedQuery || key.includes(normalizedQuery))) {
        suggestions.push({ label, source: 'remote' });
        seen.add(key);
      }
    });

    addressHistory.forEach((label) => {
      const key = label.toLowerCase();
      if (!seen.has(key) && (!normalizedQuery || key.includes(normalizedQuery))) {
        suggestions.push({ label, source: 'history' });
        seen.add(key);
      }
    });

    setAddressSuggestions(suggestions.slice(0, 8));
    setShowAddressSuggestions(suggestions.length > 0);
  };

  useEffect(() => {
    updateAddressSuggestions(address, remoteAddressSuggestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteAddressSuggestions]);

  useEffect(() => {
    updateAddressSuggestions(address, remoteAddressSuggestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressHistory]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    updateAddressSuggestions(value);
  };

  const handleAddressFocus = () => {
    updateAddressSuggestions(address);
  };

  const handleAddressBlur = () => {
    setTimeout(() => setShowAddressSuggestions(false), 150);
  };

  const handleAddressSuggestionSelect = (value: { label: string }) => {
    setAddress(value.label);
    setShowAddressSuggestions(false);
  };

  const saveAddressToHistory = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setAddressHistory(prev => {
      const existingIdx = prev.findIndex(item => item.toLowerCase() === trimmed.toLowerCase());
      const updated = existingIdx === -1
        ? [trimmed, ...prev]
        : [trimmed, ...prev.filter((_, idx) => idx !== existingIdx)];
      const limited = updated.slice(0, 10);
      AsyncStorage.setItem(ADDRESS_HISTORY_KEY, JSON.stringify(limited)).catch(err =>
        console.error('Failed to save address history:', err)
      );
      return limited;
    });
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      if (!provider) {
        throw new Error('Provider information is missing. Please try again.');
      }

      const scheduledDate = new Date(`${date}T${time}:00`);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid date or time selected. Please choose a valid slot.');
      }

      const payload = {
        providerId: provider.id,
        serviceId: provider.serviceId,
        scheduledAt: scheduledDate.toISOString(),
        locationAddress: address,
        locationCity: provider.locationCity || 'Lagos',
        locationState: provider.locationState || 'Lagos',
        notes: details.trim() || undefined,
      };

      // Use fetch directly since createBooking might not exist
      const token = await apiService.loadToken();
      const response = await fetch(`${apiService.baseURL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create booking. Please try again.');
      }

      const bookingData = data.data;
      const bookingId =
        bookingData?.id ||
        bookingData?.booking?.id ||
        bookingData?.data?.id ||
        `bk_${Math.random().toString(36).slice(2, 9)}`;

      saveAddressToHistory(address);
      onBooked(bookingId);

      // Reset form
      setDate('');
      setTime('');
      setAddress('');
      setDetails('');
    } catch (error: any) {
      console.error('Booking submission failed:', error);
      Alert.alert('Booking Failed', error?.message || 'Unable to place booking at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Book {provider?.businessName || provider?.user?.fullName || 'Provider'}</Text>
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
              <Text style={styles.dropdownText}>
                {time ? timeSlots.find((slot) => slot.value === time)?.label || time : 'Choose a time'}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showTimeOptions && (
              <View style={styles.dropdownCard}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setTime(slot.value);
                      setShowTimeOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{slot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Address and details */}
            <View style={styles.addressContainer}>
              <View style={styles.addressInputWrapper}>
                <Search size={18} color="#64748b" />
                <TextInput
                  value={address}
                  onChangeText={handleAddressChange}
                  placeholder="Service address"
                  placeholderTextColor="#9ca3af"
                  style={styles.addressInput}
                  onFocus={handleAddressFocus}
                  onBlur={handleAddressBlur}
                  returnKeyType="done"
                />
              </View>
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <View style={styles.addressSuggestionsCard}>
                  {addressSuggestions.map((item) => (
                    <TouchableOpacity
                      key={`${item.source}-${item.label}`}
                      style={styles.addressSuggestionItem}
                      onPress={() => handleAddressSuggestionSelect(item)}
                    >
                      <View style={styles.addressSuggestionIcon}>
                        {item.source === 'remote' ? (
                          <MapPin size={16} color="#ec4899" />
                        ) : (
                          <Search size={16} color="#94a3b8" />
                        )}
                      </View>
                      <Text style={styles.addressSuggestionText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Brief description (optional)"
              placeholderTextColor="#9ca3af"
              style={[styles.inputArea, styles.detailsInput]}
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
  addressContainer: { position: 'relative' },
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  addressInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  addressSuggestionsCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  addressSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  addressSuggestionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressSuggestionText: { flex: 1, fontSize: 14, color: '#0f172a' },
  detailsInput: { height: 90, textAlignVertical: 'top' },
  bookBtn: { backgroundColor: '#ec4899', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  bookBtnDisabled: { opacity: 0.6 },
  bookText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default BookingModal;
