import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface Booking {
  id: string;
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  customer?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  locationCity?: string;
  locationState?: string;
  locationAddress?: string;
  notes?: string;
  createdAt: string;
  serviceTitle?: string;
  totalAmount?: number;
}

interface ProviderBookingsScreenProps {
  userData: any;
  onNavigate?: (screen: string, params?: any) => void;
}

// Skeleton Loader Component
const SkeletonLoader: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonContent}>
          <Animated.View style={[styles.skeletonLine, styles.skeletonLineTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonLine, styles.skeletonLineSubtitle, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonCircle, { opacity }]} />
      </View>
      <View style={styles.skeletonDetails}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonLineDetail1, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.skeletonLineDetail2, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.skeletonLineDetail3, { opacity }]} />
      </View>
    </View>
  );
};

const ProviderBookingsScreen: React.FC<ProviderBookingsScreenProps> = ({
  userData,
  onNavigate,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('[ProviderBookingsScreen] 🚀 Starting to fetch provider bookings...');
      console.log('[ProviderBookingsScreen] Active filter:', activeFilter);
      console.log('[ProviderBookingsScreen] User data:', userData ? 'Present' : 'Missing');
      
      const params: any = {
        userType: 'provider',
        page: 1,
        limit: 50,
      };

      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

      console.log('[ProviderBookingsScreen] 📡 Calling API with params:', JSON.stringify(params, null, 2));
      
      const response = await apiService.getMyBookings(params);
      
      console.log('[ProviderBookingsScreen] ✅ API Response received:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        dataType: response.data ? typeof response.data : 'undefined',
        isArray: Array.isArray(response.data),
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
        fullResponse: JSON.stringify(response, null, 2),
      });

      if (response.success && response.data) {
        // Handle different response structures
        let bookingsList: any[] = [];
        
        if (Array.isArray(response.data)) {
          bookingsList = response.data;
          console.log('[ProviderBookingsScreen] 📦 Data is array, count:', bookingsList.length);
        } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
          bookingsList = response.data.bookings;
          console.log('[ProviderBookingsScreen] 📦 Data has bookings array, count:', bookingsList.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bookingsList = response.data.data;
          console.log('[ProviderBookingsScreen] 📦 Data has nested data array, count:', bookingsList.length);
        } else {
          console.warn('[ProviderBookingsScreen] ⚠️ Unexpected data structure:', response.data);
        }

        console.log('[ProviderBookingsScreen] 📋 Raw bookings list:', JSON.stringify(bookingsList.slice(0, 2), null, 2));

        // Map API response to component Booking interface
        const mappedBookings: Booking[] = bookingsList.map((booking: any) => {
          console.log('[ProviderBookingsScreen] 🔄 Mapping booking:', booking.id, {
            status: booking.status,
            hasCustomer: !!booking.customer,
            hasService: !!booking.service,
          });

          return {
            id: booking.id || String(booking.id),
            status: (booking.status || 'requested') as Booking['status'],
            scheduledAt: booking.scheduledAt || booking.scheduled_at || new Date().toISOString(),
            customer: booking.customer ? {
              id: booking.customer.id || booking.customerId,
              fullName: booking.customer.fullName || booking.customer.name || 'Customer',
              phone: booking.customer.phone,
              email: booking.customer.email,
              avatarUrl: booking.customer.avatarUrl || booking.customer.avatar,
            } : undefined,
            locationCity: booking.locationCity || booking.location_city,
            locationState: booking.locationState || booking.location_state,
            locationAddress: booking.locationAddress || booking.location_address,
            notes: booking.notes,
            createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
            serviceTitle: booking.service?.title || booking.service?.name || booking.serviceId,
            totalAmount: booking.totalAmount || booking.total_amount,
          };
        });

        console.log('[ProviderBookingsScreen] ✅ Mapped bookings count:', mappedBookings.length);
        console.log('[ProviderBookingsScreen] 📋 First mapped booking:', mappedBookings[0] ? JSON.stringify(mappedBookings[0], null, 2) : 'None');
        
        setBookings(mappedBookings);
      } else {
        console.warn('[ProviderBookingsScreen] ⚠️ API response not successful:', response.message);
        setBookings([]);
      }
    } catch (error: any) {
      console.error('[ProviderBookingsScreen] ❌ Error fetching provider bookings:', error);
      console.error('[ProviderBookingsScreen] ❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('[ProviderBookingsScreen] 🏁 Finished fetching bookings, loading:', false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      setProcessing(bookingId);
      
      // TODO: Implement API calls for booking actions
      // await apiService.updateBookingStatus(bookingId, action);
      
      Alert.alert(
        'Success',
        `Booking ${action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed'} successfully`
      );
      
      await fetchBookings();
      setShowDetailsModal(false);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      Alert.alert('Error', `Failed to ${action} booking. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#64748b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeFilter === 'all') return true;
    return booking.status === activeFilter;
  });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'requested', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={20}
            color="#ec4899"
            style={refreshing ? styles.refreshingIcon : null}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
            colors={['#ec4899']}
          />
        }
      >
        {loading ? (
          <>
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? "You don't have any bookings yet."
                : `You don't have any ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()} bookings.`}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            const statusColor = getStatusColor(booking.status);

            return (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  setSelectedBooking(booking);
                  setShowDetailsModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingHeaderLeft}>
                    <View style={styles.bookingAvatar}>
                      {booking.customer?.avatarUrl ? (
                        <View style={styles.avatarImagePlaceholder} />
                      ) : (
                        <User size={24} color="#ec4899" />
                      )}
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingCustomerName} numberOfLines={1}>
                        {booking.customer?.fullName || 'Customer'}
                      </Text>
                      <Text style={styles.bookingService} numberOfLines={1}>
                        {booking.serviceTitle || 'Service'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}40` },
                    ]}
                  >
                    <StatusIcon size={14} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Calendar size={16} color="#64748b" />
                    <Text style={styles.bookingDetailText}>
                      {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                    </Text>
                  </View>
                  {booking.locationCity && (
                    <View style={styles.bookingDetailRow}>
                      <MapPin size={16} color="#64748b" />
                      <Text style={styles.bookingDetailText} numberOfLines={1}>
                        {booking.locationCity}
                        {booking.locationState ? `, ${booking.locationState}` : ''}
                      </Text>
                    </View>
                  )}
                  {booking.notes && (
                    <View style={styles.bookingNotes}>
                      <Text style={styles.bookingNotesText} numberOfLines={2}>
                        {booking.notes}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingDate}>
                    Booked {formatDate(booking.createdAt)}
                  </Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBooking && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Booking Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetailsModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Customer Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Customer</Text>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerAvatar}>
                        {selectedBooking.customer?.avatarUrl ? (
                          <View style={styles.avatarImagePlaceholder} />
                        ) : (
                          <User size={32} color="#ec4899" />
                        )}
                      </View>
                      <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>
                          {selectedBooking.customer?.fullName || 'Customer'}
                        </Text>
                        {selectedBooking.customer?.phone && (
                          <Text style={styles.customerPhone}>
                            {selectedBooking.customer.phone}
                          </Text>
                        )}
                        {selectedBooking.customer?.email && (
                          <Text style={styles.customerEmail}>
                            {selectedBooking.customer.email}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Service Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Service</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.serviceTitle || 'Service'}
                    </Text>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Date & Time</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedBooking.scheduledAt)} at {formatTime(selectedBooking.scheduledAt)}
                    </Text>
                  </View>

                  {/* Location */}
                  {(selectedBooking.locationCity || selectedBooking.locationAddress) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Location</Text>
                      <Text style={styles.modalValue}>
                        {selectedBooking.locationAddress ||
                          `${selectedBooking.locationCity || ''}${selectedBooking.locationState ? `, ${selectedBooking.locationState}` : ''}`}
                      </Text>
                    </View>
                  )}

                  {/* Notes */}
                  {selectedBooking.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Notes</Text>
                      <Text style={styles.modalValue}>{selectedBooking.notes}</Text>
                    </View>
                  )}

                  {/* Status */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        styles.statusBadgeModal,
                        {
                          backgroundColor: `${getStatusColor(selectedBooking.status)}15`,
                          borderColor: `${getStatusColor(selectedBooking.status)}40`,
                        },
                      ]}
                    >
                      {React.createElement(getStatusIcon(selectedBooking.status), {
                        size: 16,
                        color: getStatusColor(selectedBooking.status),
                      })}
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(selectedBooking.status) },
                        ]}
                      >
                        {getStatusLabel(selectedBooking.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {selectedBooking.status === 'requested' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleBookingAction(selectedBooking.id, 'confirm')}
                        disabled={processing === selectedBooking.id}
                      >
                        <CheckCircle size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Confirm Booking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleBookingAction(selectedBooking.id, 'cancel')}
                        disabled={processing === selectedBooking.id}
                      >
                        <XCircle size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedBooking.status === 'confirmed' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleBookingAction(selectedBooking.id, 'complete')}
                        disabled={processing === selectedBooking.id}
                      >
                        <CheckCircle size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Mark as Complete</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Contact Actions */}
                  {selectedBooking.customer && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.messageButton]}
                        onPress={() => {
                          setShowDetailsModal(false);
                          if (onNavigate && selectedBooking.customer?.id) {
                            onNavigate('messages', {
                              recipientId: selectedBooking.customer.id,
                              bookingId: selectedBooking.id,
                            });
                          }
                        }}
                      >
                        <MessageCircle size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Message Customer</Text>
                      </TouchableOpacity>

                      {selectedBooking.customer?.phone && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.phoneButton]}
                          onPress={() => {
                            // Handle phone call
                            Alert.alert('Call Customer', `Call ${selectedBooking.customer?.fullName}?`);
                          }}
                        >
                          <Phone size={20} color="#ec4899" />
                          <Text style={[styles.actionButtonText, styles.phoneButtonText]}>
                            Call
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  refreshingIcon: {
    transform: [{ rotate: '180deg' }],
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    maxHeight: 64,
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ec4899',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  bookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingCustomerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBadgeModal: {
    alignSelf: 'flex-start',
  },
  bookingDetails: {
    marginBottom: 16,
    gap: 10,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  bookingNotes: {
    marginTop: 4,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingNotesText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bookingDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonLine: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineTitle: {
    width: '60%',
    height: 20,
  },
  skeletonLineSubtitle: {
    width: '40%',
    height: 16,
    marginBottom: 0,
  },
  skeletonLineDetail1: {
    width: '70%',
    height: 16,
  },
  skeletonLineDetail2: {
    width: '55%',
    height: 16,
  },
  skeletonLineDetail3: {
    width: '65%',
    height: 16,
    marginBottom: 0,
  },
  skeletonCircle: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    width: 24,
    height: 24,
  },
  skeletonDetails: {
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  modalBody: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '500',
    lineHeight: 24,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: '#94a3b8',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  messageButton: {
    backgroundColor: '#ec4899',
  },
  phoneButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ec4899',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneButtonText: {
    color: '#ec4899',
  },
});

export default ProviderBookingsScreen;
