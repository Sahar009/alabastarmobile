import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
  Platform,
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
  Filter,
  Star,
  MessageCircle,
  Phone,
  Trash2,
  MessageSquare,
} from 'lucide-react-native';
import { apiService } from '../services/api';
import RatingScreen from './RatingScreen';

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  providerProfile?: {
    businessName: string;
    category: string;
    subcategories?: string[];
    portfolio?: string[];
    User?: {
      fullName: string;
      phone: string;
      email: string;
    };
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
  locationCity?: string;
  locationState?: string;
  totalAmount: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

interface BookingsScreenProps {
  userData: any;
  onNavigate?: (screen: string) => void;
}

const BookingsScreen: React.FC<BookingsScreenProps> = ({
  userData,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
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
        Alert.alert('Error', 'Failed to fetch bookings');
      }
    } catch (error: any) {
      console.error('Fetch bookings error:', error);
      Alert.alert('Error', error.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
      case 'requested':
      case 'accepted':
        return <AlertCircle size={16} color="#f59e0b" />;
      case 'in_progress':
        return <Clock size={16} color="#2563EB" />;
      default:
        return <Clock size={16} color="#64748b" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      case 'requested':
      case 'accepted':
        return '#f59e0b';
      case 'in_progress':
        return '#2563EB';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleRateProvider = (booking: Booking) => {
    setBookingToRate(booking);
    setShowRatingScreen(true);
  };

  const handleRatingSuccess = () => {
    fetchBookings();
  };

  const handleUpdateStatus = (booking: Booking) => {
    // Show options to update status
    Alert.alert(
      'Update Booking Status',
      'Select new status:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as In Progress', 
          onPress: () => updateBookingStatus(booking.id, 'in_progress') 
        },
        { 
          text: 'Mark as Completed', 
          onPress: () => updateBookingStatus(booking.id, 'completed') 
        },
        { 
          text: 'Cancel Booking', 
          style: 'destructive',
          onPress: () => updateBookingStatus(booking.id, 'cancelled') 
        },
      ]
    );
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiService.updateBookingStatus(bookingId, newStatus);
      
      if (response.success) {
        Alert.alert('Success', 'Booking status updated successfully');
        fetchBookings();
      } else {
        Alert.alert('Error', 'Failed to update booking status');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      Alert.alert('Error', error.message || 'Failed to update booking status');
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.cancelBooking(booking.id, 'Cancelled by customer');
              
              if (response.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                fetchBookings();
              } else {
                Alert.alert('Error', 'Failed to cancel booking');
              }
            } catch (error: any) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleCallProvider = (phone: string) => {
    // Clean and format phone number
    let cleanPhone = phone.replace(/[^\d+]/g, ''); // Remove all non-digit and non-plus characters
    
    // Ensure + is at the start
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }
    
    const telUrl = `tel:${cleanPhone}`;
    
    Linking.openURL(telUrl)
      .catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  const handleWhatsAppProvider = (phone: string) => {
    // Clean phone number - remove all non-digit characters and ensure proper format
    let cleanPhone = phone.replace(/[^\d]/g, ''); // Remove all non-digits
    
    // Create WhatsApp URL - try app first, then fallback to web
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    const webWhatsAppUrl = `https://wa.me/${cleanPhone}`;
    
    // Try to open WhatsApp app first
    Linking.openURL(whatsappUrl)
      .catch(() => {
        // If WhatsApp app fails, try web version
        Linking.openURL(webWhatsAppUrl)
          .catch((err) => {
            console.error('Error opening WhatsApp:', err);
            Alert.alert('Error', 'Unable to open WhatsApp. Please make sure WhatsApp is installed.');
          });
      });
  };

  const handleSendMessage = (providerUserId: string) => {
    // Navigate to messaging screen with provider ID
    // For now, show an alert to indicate message feature
    Alert.alert(
      'Send Message',
      'This will open the messaging screen. Would you like to send a message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Messages',
          onPress: async () => {
            try {
              // Navigate to messages or send a quick message
              // For now, we'll just show that the feature is available
              Alert.alert('Success', 'Messaging feature will open here');
            } catch (error: any) {
              console.error('Message error:', error);
              Alert.alert('Error', error.message || 'Unable to send message');
            }
          },
        },
      ]
    );
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['requested', 'accepted', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Calendar size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>{stats.total} total bookings</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Filter size={16} color="#64748b" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'requested' && styles.filterButtonActive]}
              onPress={() => setFilter('requested')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'requested' && styles.filterTextActive]}>
                Requested
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'accepted' && styles.filterButtonActive]}
              onPress={() => setFilter('accepted')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'accepted' && styles.filterTextActive]}>
                Accepted
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'in_progress' && styles.filterButtonActive]}
              onPress={() => setFilter('in_progress')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>
                In Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
              onPress={() => setFilter('completed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
              onPress={() => setFilter('cancelled')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
                Cancelled
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
          />
        }
      >
        {loading && bookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No bookings</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? 'You have no bookings yet' : `No ${filter} bookings`}
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => handleViewDetails(booking)}
              activeOpacity={0.7}
            >
              <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.providerName} numberOfLines={1}>
                    {booking.providerProfile?.businessName || 'Unknown Provider'}
                  </Text>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.scheduledAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {getStatusLabel(booking.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {booking.locationCity && (
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#64748b" />
                    <Text style={styles.detailText}>{booking.locationCity}</Text>
                  </View>
                )}
              </View>

              {booking.status === 'completed' && (
                <>
                  {booking.review ? (
                    <View style={styles.ratedBadge}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={styles.ratedText}>Rated</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.rateButton}
                      onPress={() => handleRateProvider(booking)}
                      activeOpacity={0.7}
                    >
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.rateText}>Rate Provider</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {['requested', 'accepted', 'in_progress'].includes(booking.status) && (
                <TouchableOpacity
                  style={styles.updateStatusButton}
                  onPress={() => handleUpdateStatus(booking)}
                  activeOpacity={0.7}
                >
                  <Clock size={14} color="#ffffff" />
                  <Text style={styles.updateStatusText}>Update Status</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Details Modal */}
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

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Provider</Text>
                    <Text style={styles.modalSectionText}>
                      {selectedBooking.providerProfile?.businessName || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Date & Time</Text>
                    <Text style={styles.modalSectionText}>
                      {new Date(selectedBooking.scheduledAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Location</Text>
                    <Text style={styles.modalSectionText}>
                      {selectedBooking.locationCity && selectedBooking.locationState
                        ? `${selectedBooking.locationCity}, ${selectedBooking.locationState}`
                        : 'Not specified'}
                    </Text>
                  </View>

                  {selectedBooking.providerProfile?.User?.phone && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCallProvider(selectedBooking.providerProfile!.User!.phone)}
                        activeOpacity={0.7}
                      >
                        <Phone size={18} color="#ffffff" />
                        <Text style={styles.contactButtonText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsAppProvider(selectedBooking.providerProfile!.User!.phone)}
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={18} color="#ffffff" />
                        <Text style={styles.contactButtonText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {selectedBooking.providerProfile?.User?.id && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => handleSendMessage(selectedBooking.providerProfile!.User!.id)}
                        activeOpacity={0.7}
                      >
                        <MessageCircle size={18} color="#ffffff" />
                        <Text style={styles.contactButtonText}>Send Message</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rating Screen */}
      {bookingToRate && (
        <RatingScreen
          isVisible={showRatingScreen}
          booking={bookingToRate}
          onClose={() => {
            setShowRatingScreen(false);
            setBookingToRate(null);
          }}
          onSuccess={handleRatingSuccess}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButtons: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#ec4899',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  updateStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  ratedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 16,
    color: '#0f172a',
  },
  modalAmountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ec4899',
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#25D366',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default BookingsScreen;
