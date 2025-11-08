import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  XCircle,
  PhoneCall,
  MessageCircle,
  ChevronRight,
  RefreshCcw,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface ProviderBookingsScreenProps {
  userData: any;
  onNavigate?: (screen: string) => void;
}

interface BookingTimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

interface ProviderBooking {
  id: string;
  status: string;
  serviceTitle?: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  inProgressAt?: string;
  completedAt?: string;
  notes?: string;
  locationCity?: string;
  locationState?: string;
  totalAmount?: number | string;
  currency?: string;
  customer?: {
    id?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  timeline?: BookingTimelineEntry[];
  statusHistory?: BookingTimelineEntry[];
  [key: string]: any;
}

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  requested: '#f59e0b',
  pending: '#f59e0b',
  accepted: '#2563eb',
  in_progress: '#0ea5e9',
  completed: '#10b981',
  cancelled: '#ef4444',
  declined: '#ef4444',
  rejected: '#ef4444',
};

const ProviderBookingsScreen: React.FC<ProviderBookingsScreenProps> = ({
  onNavigate,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ProviderBooking | null>(null);
  const [actionInFlight, setActionInFlight] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      // Ensure token is loaded before making request
      await apiService.loadToken();

      const queryParams: {
        page: number;
        limit: number;
        status?: string;
        userType: 'customer' | 'provider';
      } = {
        page: 1,
        limit: 50,
        userType: 'provider',
      };

      if (filter !== 'all') {
        // Map filter values to backend statuses
        const statusMap: Record<string, string> = {
          'pending': 'pending',
          'confirmed': 'confirmed',
          'completed': 'completed',
          'cancelled': 'cancelled',
        };
        queryParams.status = statusMap[filter] || filter;
      }

      const response = await apiService.getMyBookings(queryParams);

      console.log('🔍 Provider Bookings API Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        // Backend returns: { success: true, data: { bookings: [...], pagination: {...} } }
        // Frontend accesses: data.bookings directly from response.json()
        // Mobile apiService.request returns: { success: true, data: { bookings: [...] } }
        let extractedBookings: any[] = [];
        
        if (Array.isArray(response.data)) {
          extractedBookings = response.data;
        } else if (response.data?.bookings && Array.isArray(response.data.bookings)) {
          extractedBookings = response.data.bookings;
        } else if ((response as any).bookings && Array.isArray((response as any).bookings)) {
          extractedBookings = (response as any).bookings;
        }
        
        console.log('📦 Extracted bookings:', extractedBookings.length);
        setBookings(extractedBookings);
      } else {
        Alert.alert('Bookings', response.message || 'Unable to load bookings');
      }
    } catch (error: any) {
      console.error('Provider bookings fetch error:', error);
      Alert.alert('Error', error?.message || 'Unable to retrieve bookings right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Load token on mount
  useEffect(() => {
    const initializeToken = async () => {
      await apiService.loadToken();
      fetchBookings();
    };
    initializeToken();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => {
      const status = (b.status || '').toLowerCase();
      return ['pending', 'requested'].includes(status);
    }).length;
    const confirmed = bookings.filter(b => {
      const status = (b.status || '').toLowerCase();
      return ['confirmed', 'accepted'].includes(status);
    }).length;
    const completed = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
    const cancelled = bookings.filter(b => {
      const status = (b.status || '').toLowerCase();
      return ['cancelled', 'declined', 'rejected'].includes(status);
    }).length;
    
    const totalEarnings = bookings.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'completed') {
        const amount = typeof b.totalAmount === 'number' ? b.totalAmount : parseFloat(b.totalAmount || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }
      return sum;
    }, 0);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      totalEarnings,
    };
  }, [bookings]);

  const formatDateTime = (value?: string) => {
    if (!value) return 'Not scheduled';
    try {
      const date = new Date(value);
      return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return value;
    }
  };

  const statusLabel = useCallback((status: string) => {
    const normalized = status?.toLowerCase() || '';
    switch (normalized) {
      case 'requested':
      case 'pending':
        return 'Awaiting Response';
      case 'accepted':
        return 'Accepted';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'declined':
        return 'Declined';
      case 'rejected':
        return 'Rejected';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  }, []);

  const buildTimeline = useCallback((booking?: ProviderBooking | null): BookingTimelineEntry[] => {
    if (!booking) return [];

    if (Array.isArray(booking.timeline) && booking.timeline.length) {
      return booking.timeline.map(item => ({ ...item, status: item.status || item.note || 'update' }));
    }

    if (Array.isArray(booking.statusHistory) && booking.statusHistory.length) {
      return booking.statusHistory;
    }

    const entries: BookingTimelineEntry[] = [];

    if (booking.createdAt) {
      entries.push({ status: 'requested', timestamp: booking.createdAt, note: 'Booking requested' });
    }

    if (booking.acceptedAt) {
      entries.push({ status: 'accepted', timestamp: booking.acceptedAt, note: 'Booking accepted' });
    }

    if (booking.startedAt || booking.inProgressAt) {
      entries.push({ status: 'in_progress', timestamp: (booking.startedAt || booking.inProgressAt) as string, note: 'Work in progress' });
    }

    if (booking.completedAt) {
      entries.push({ status: 'completed', timestamp: booking.completedAt, note: 'Booking completed' });
    }

    if (!entries.length && booking.updatedAt) {
      const status = booking.status || 'unknown';
      entries.push({ status: status, timestamp: booking.updatedAt, note: `Status set to ${statusLabel(status)}` });
    }

    if (!entries.length) {
      const status = booking.status || 'unknown';
      entries.push({ status: status, timestamp: booking.createdAt || new Date().toISOString(), note: statusLabel(status) });
    }

    return entries;
  }, [statusLabel]);

  const performStatusUpdate = async (
    bookingId: string,
    status: string,
    successMessage: string,
    fallbackStatus?: string,
  ) => {
    try {
      setActionInFlight(true);
      
      // Ensure token is loaded before making request
      await apiService.loadToken();
      
      const response = await apiService.updateBookingStatus(bookingId, status);

      if (response.success) {
        Alert.alert('Success', successMessage);
        fetchBookings();
        return true;
      }

      if (fallbackStatus) {
        const fallbackResponse = await apiService.updateBookingStatus(bookingId, fallbackStatus);
        if (fallbackResponse.success) {
          Alert.alert('Success', successMessage);
          fetchBookings();
          return true;
        }
      }

      Alert.alert('Update failed', response.message || 'Unable to update booking right now.');
      return false;
    } catch (error: any) {
      console.error('Status update error:', error);
      if (fallbackStatus) {
        try {
          const fallbackResponse = await apiService.updateBookingStatus(bookingId, fallbackStatus);
          if (fallbackResponse.success) {
            Alert.alert('Success', successMessage);
            fetchBookings();
            return true;
          }
        } catch (fallbackError: any) {
          console.error('Fallback status update error:', fallbackError);
        }
      }
      Alert.alert('Error', error?.message || 'Unable to update booking.');
      return false;
    } finally {
      setActionInFlight(false);
    }
  };

  const handleAccept = (booking: ProviderBooking) => {
    Alert.alert(
      'Accept Booking',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Accept',
          style: 'default',
          onPress: () => performStatusUpdate(booking.id, 'confirmed', 'Booking accepted successfully', 'accepted'),
        },
      ],
    );
  };

  const handleReject = (booking: ProviderBooking) => {
    Alert.alert(
      'Decline Booking',
      'Declining will notify the customer that you are unavailable. Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Decline',
          style: 'destructive',
          onPress: () => performStatusUpdate(booking.id, 'cancelled', 'Booking declined successfully', 'declined'),
        },
      ],
    );
  };

  const handleCancel = (booking: ProviderBooking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this accepted booking? The customer will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => performStatusUpdate(booking.id, 'cancelled', 'Booking cancelled successfully'),
        },
      ],
    );
  };

  const handleComplete = (booking: ProviderBooking) => {
    performStatusUpdate(booking.id, 'completed', 'Booking marked as completed');
  };

  const handleTimeline = (booking: ProviderBooking) => {
    setSelectedBooking(booking);
    setTimelineVisible(true);
  };

  const dialCustomer = (phone?: string) => {
    if (!phone) {
      Alert.alert('Call Customer', 'No phone number available for this customer yet.');
      return;
    }

    let sanitized = phone.replace(/[\s()-]/g, '');
    if (!sanitized.startsWith('+')) {
      sanitized = `+${sanitized}`;
    }

    const telUrl = `tel:${sanitized}`;
    Linking.openURL(telUrl).catch(error => {
      console.error('Dial error:', error);
      Alert.alert('Call Failed', 'Unable to open the dialer at the moment.');
    });
  };

  const renderActionButtons = (booking: ProviderBooking) => {
    const currentStatus = (booking.status || '').toLowerCase();

    if (actionInFlight) {
      return (
        <View style={styles.actionLoader}>
          <ActivityIndicator size="small" color="#ec4899" />
        </View>
      );
    }

    switch (currentStatus) {
      case 'requested':
      case 'pending':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(booking)}>
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(booking)}>
              <XCircle size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );

      case 'accepted':
      case 'confirmed':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]} 
              onPress={() => handleComplete(booking)}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]} 
              onPress={() => handleCancel(booking)}
            >
              <XCircle size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'in_progress':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => handleComplete(booking)}>
              <ShieldCheck size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Mark Completed</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const renderBookingCard = (booking: ProviderBooking) => {
    const statusColor = STATUS_COLORS[(booking.status || '').toLowerCase()] || '#6366f1';
    const customerName = booking.customer?.fullName || 'Customer';
    const scheduled = formatDateTime(booking.scheduledAt);

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.bookingTitle}>{booking.serviceTitle || 'Service Booking'}</Text>
            <Text style={styles.bookingSubtitle}>#{booking.id?.slice(-6) || '---'}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}> 
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel(booking.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingMetaRow}>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.metaText}>{scheduled}</Text>
          </View>
          {(booking.locationCity || booking.locationState) && (
            <View style={styles.metaItem}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.metaText} numberOfLines={1}>
                {[booking.locationCity, booking.locationState].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <UserRound size={24} color="#ec4899" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customerName}</Text>
            {booking.customer?.phone ? (
              <Text style={styles.customerContact}>{booking.customer.phone}</Text>
            ) : null}
            {booking.customer?.email ? (
              <Text style={styles.customerContact} numberOfLines={1}>{booking.customer.email}</Text>
            ) : null}
          </View>
          <View style={styles.contactButtons}>
            {booking.customer?.phone ? (
              <TouchableOpacity
                style={[styles.contactButton, styles.callButton]}
                onPress={() => dialCustomer(booking.customer?.phone)}
              >
                <PhoneCall size={16} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
            {booking.customer?.id ? (
              <TouchableOpacity
                style={[styles.contactButton, styles.messageButton]}
                onPress={() => {
                  onNavigate?.('messages');
                  Alert.alert('Messaging', 'Opening conversation with customer…');
                }}
              >
                <MessageCircle size={16} color="#2563eb" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.sectionLabel}>Customer Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.timelineButton} onPress={() => handleTimeline(booking)}>
            <RefreshCcw size={16} color="#ec4899" />
            <Text style={styles.timelineButtonText}>View Timeline</Text>
            <ChevronRight size={14} color="#ec4899" />
          </TouchableOpacity>
        </View>

        {renderActionButtons(booking)}
      </View>
    );
  };

  const timelineEntries = useMemo(() => buildTimeline(selectedBooking), [selectedBooking, buildTimeline]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Calendar size={24} color="#ffffff" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Provider Bookings</Text>
            <Text style={styles.headerSubtitle}>{stats.total} total assignments</Text>
          </View>
          <TouchableOpacity 
            onPress={onRefresh} 
            disabled={refreshing} 
            style={styles.refreshButton}
          >
            <RefreshCcw size={20} color="#ec4899" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={styles.statsRowContent}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, styles.statValuePrimary]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.statValueAmber]}>{stats.pending}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPink]}>
            <Text style={styles.statLabel}>Confirmed</Text>
            <Text style={[styles.statValue, styles.statValuePink]}>{stats.confirmed}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>{stats.completed}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardEmerald]}>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={[styles.statValue, styles.statValueEmerald]}>₦{stats.totalEarnings.toLocaleString()}</Text>
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.filterChipText, filter === item.value && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>Loading bookings…</Text>
            </View>
          ) : bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <TriangleAlert size={48} color="#cbd5f5" />
              <Text style={styles.emptyStateTitle}>No bookings in this state</Text>
              <Text style={styles.emptyStateSubtitle}>
                When customers request your services, their bookings will show up here for you to manage.
              </Text>
            </View>
          ) : (
            bookings.map(renderBookingCard)
          )}
        </ScrollView>

        <Modal visible={timelineVisible} animationType="slide" transparent onRequestClose={() => setTimelineVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.timelineModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Booking Timeline</Text>
                <TouchableOpacity onPress={() => setTimelineVisible(false)} style={styles.closeButton}>
                  <XCircle size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.timelineList} showsVerticalScrollIndicator={false}>
                {timelineEntries.length === 0 ? (
                  <View style={styles.emptyTimeline}>
                    <TriangleAlert size={28} color="#cbd5f5" />
                    <Text style={styles.emptyTimelineText}>No timeline events recorded yet.</Text>
                  </View>
                ) : (
                  timelineEntries.map((entry, index) => {
                    const color = STATUS_COLORS[entry.status?.toLowerCase?.() || ''] || '#6366f1';
                    return (
                      <View key={`${entry.status}-${index}`} style={styles.timelineItem}>
                        <View style={styles.timelineIndicator}>
                          <View style={[styles.timelineDot, { borderColor: color }]} />
                          {index !== timelineEntries.length - 1 && <View style={[styles.timelineLine, { backgroundColor: `${color}33` }]} />}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineStatus, { color }]}>{statusLabel(entry.status)}</Text>
                          <Text style={styles.timelineTimestamp}>{formatDateTime(entry.timestamp)}</Text>
                          {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setTimelineVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  statsRow: {
    maxHeight: 110,
    marginBottom: 16,
  },
  statsRowContent: {
    paddingHorizontal: 4,
  },
  statCard: {
    width: 130,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardPrimary: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  statCardAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  statCardPink: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fce7f3',
  },
  statCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  statCardEmerald: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  statValuePrimary: {
    color: '#fef3c7',
  },
  statValueAmber: {
    color: '#f59e0b',
  },
  statValuePink: {
    color: '#ec4899',
  },
  statValueGreen: {
    color: '#10b981',
  },
  statValueEmerald: {
    color: '#059669',
    fontSize: 18,
  },
  filterRow: {
    marginVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 6,
    maxWidth: 180,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  customerContact: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  callButton: {
    backgroundColor: '#ec4899',
  },
  messageButton: {
    backgroundColor: '#eff6ff',
  },
  notesContainer: {
    backgroundColor: '#fff7fb',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#db2777',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  timelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timelineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec4899',
    marginHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    marginRight: 0,
  },
  progressButton: {
    backgroundColor: '#2563eb',
  },
  completeButton: {
    backgroundColor: '#8b5cf6',
  },
  actionLoader: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  timelineModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 6,
  },
  timelineList: {
    maxHeight: 320,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyTimelineText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    backgroundColor: '#ffffff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    marginLeft: 16,
    paddingBottom: 4,
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineTimestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  timelineNote: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProviderBookingsScreen;

