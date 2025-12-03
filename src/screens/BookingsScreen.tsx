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
  Star,
} from 'lucide-react-native';
import { apiService } from '../services/api';
import RatingScreen from './RatingScreen';

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  providerProfile?: {
    businessName: string;
    User?: {
      id: string;
      fullName: string;
      phone: string;
      email: string;
    };
  };
  locationCity?: string;
  locationState?: string;
  notes?: string;
  createdAt: string;
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

interface BookingsScreenProps {
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
      <View style={styles.skeletonFooter}>
        <Animated.View style={[styles.skeletonButton, { opacity }]} />
      </View>
    </View>
  );
};

const BookingsScreen: React.FC<BookingsScreenProps> = ({
  userData: _userData,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: 1,
        limit: 50,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await apiService.getMyBookings(params);

      if (response.success) {
        const bookingsList = Array.isArray(response.data) 
          ? response.data 
          : response.data?.bookings || [];
        setBookings(bookingsList);
      } else {
        console.error('Failed to fetch bookings:', response.message);
        // Don't show alert on every error, just log it
      }
    } catch (error: any) {
      console.error('Fetch bookings error:', error);
      // Only show alert if it's a critical error, not network issues
      if (error.message && !error.message.includes('Network')) {
        // Silent fail for network errors, user can retry with pull-to-refresh
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      case 'confirmed':
        return '#3b82f6';
      case 'requested':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
      case 'confirmed':
        return <CheckCircle size={16} color="#3b82f6" />;
      case 'requested':
        return <AlertCircle size={16} color="#f59e0b" />;
      default:
        return <AlertCircle size={16} color="#6b7280" />;
    }
  };

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const renderBookingItem = (booking: Booking) => {
    const providerName = booking.providerProfile?.businessName || 'Unknown Provider';
    const providerUser = booking.providerProfile?.User;
    
    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => handleBookingPress(booking)}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.providerName}>{providerName}</Text>
            <View style={styles.statusRow}>
              {getStatusIcon(booking.status)}
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.detailText}>{formatDate(booking.scheduledAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.detailText}>{formatTime(booking.scheduledAt)}</Text>
          </View>
          {(booking.locationCity || booking.locationState) && (
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {[booking.locationCity, booking.locationState].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {onNavigate && providerUser && (
          <View style={styles.bookingFooter}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => {
                onNavigate('messages', {
                  recipientId: providerUser.id,
                  bookingId: booking.id,
                });
              }}
            >
              <MessageCircle size={18} color="#ffffff" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <RefreshCw size={20} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'requested', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                filter === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      {loading && bookings.length === 0 ? (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
        >
          {[1, 2, 3, 4].map((item) => (
            <SkeletonLoader key={item} />
          ))}
        </ScrollView>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all'
              ? "You don't have any bookings yet"
              : `No ${filter} bookings found`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ec4899']}
            />
          }
        >
          {bookings.map(renderBookingItem)}
        </ScrollView>
      )}

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
                    <XCircle size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Provider</Text>
                    <Text style={styles.modalValue}>
                      {selectedBooking.providerProfile?.businessName || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View style={styles.statusRow}>
                      {getStatusIcon(selectedBooking.status)}
                      <Text
                        style={[
                          styles.modalValue,
                          { color: getStatusColor(selectedBooking.status) },
                        ]}
                      >
                        {selectedBooking.status.charAt(0).toUpperCase() +
                          selectedBooking.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Date & Time</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedBooking.scheduledAt)} at{' '}
                      {formatTime(selectedBooking.scheduledAt)}
                    </Text>
                  </View>

                  {(selectedBooking.locationCity || selectedBooking.locationState) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Location</Text>
                      <Text style={styles.modalValue}>
                        {[selectedBooking.locationCity, selectedBooking.locationState]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </View>
                  )}

                  {selectedBooking.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Notes</Text>
                      <Text style={styles.modalValue}>{selectedBooking.notes}</Text>
                    </View>
                  )}

                  {/* Rate Service Button for Completed Bookings */}
                  {selectedBooking.status === 'completed' && (
                    <View style={styles.modalSection}>
                      {selectedBooking.review ? (
                        <View style={styles.reviewedButton}>
                          <CheckCircle size={20} color="#10b981" />
                          <Text style={styles.reviewedText}>Reviewed</Text>
                          {selectedBooking.review.rating > 0 && (
                            <View style={styles.ratingDisplay}>
                              <Star size={16} color="#fbbf24" fill="#fbbf24" />
                              <Text style={styles.ratingText}>{selectedBooking.review.rating}</Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.rateButton}
                          onPress={() => {
                            setShowDetailsModal(false);
                            setRatingBooking(selectedBooking);
                            setShowRatingScreen(true);
                          }}
                        >
                          <Star size={20} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.rateButtonText}>Rate Service</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {selectedBooking.providerProfile?.User && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setShowDetailsModal(false);
                          if (onNavigate) {
                            onNavigate('messages', {
                              recipientId: selectedBooking.providerProfile?.User?.id,
                              bookingId: selectedBooking.id,
                            });
                          }
                        }}
                      >
                        <MessageCircle size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Message</Text>
                      </TouchableOpacity>

                      {selectedBooking.providerProfile?.User?.phone && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonSecondary]}
                          onPress={() => {
                            // Handle phone call
                          }}
                        >
                          <Phone size={20} color="#ec4899" />
                          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
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

      {/* Rating Screen Modal */}
      <Modal
        visible={showRatingScreen}
        animationType="slide"
        onRequestClose={() => {
          setShowRatingScreen(false);
          setRatingBooking(null);
        }}
      >
        {ratingBooking && (
          <RatingScreen
            booking={ratingBooking}
            onClose={() => {
              setShowRatingScreen(false);
              setRatingBooking(null);
            }}
            onSuccess={() => {
              // Refresh bookings after successful rating
              fetchBookings();
            }}
          />
        )}
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
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
  bookingInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bookingDetails: {
    gap: 12,
    marginBottom: 16,
    paddingLeft: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtext: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skeletonContent: {
    flex: 1,
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
  skeletonFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  skeletonButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    alignSelf: 'flex-end',
    width: 100,
    height: 36,
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
    gap: 10,
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ec4899',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  actionButtonTextSecondary: {
    color: '#ec4899',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  reviewedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  reviewedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    letterSpacing: 0.2,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
});

export default BookingsScreen;
