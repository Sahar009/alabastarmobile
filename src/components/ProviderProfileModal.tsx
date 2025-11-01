import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Star,
  MapPin,
  Clock,
  Shield,
  Award,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
} from 'lucide-react-native';
import type { Provider as ProviderType } from '../services/providerService';

const { width, height } = Dimensions.get('window');

interface ProviderProfileModalProps {
  provider: ProviderType | null;
  isVisible: boolean;
  onClose: () => void;
  onBook: (provider: ProviderType) => void;
}

type TabType = 'overview' | 'portfolio' | 'reviews';

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  service?: string;
}

const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({
  provider,
  isVisible,
  onClose,
  onBook,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && provider) {
      fetchProviderDetails();
    }
  }, [isVisible, provider]);

  const fetchProviderDetails = async () => {
    if (!provider) return;

    setLoading(true);
    try {
      // Get portfolio images from both brandImages and portfolio arrays (max 8)
      let images: string[] = [];
      
      // First try brandImages
      if (provider.brandImages && provider.brandImages.length > 0) {
        images = provider.brandImages.map((img: any) => img.url || img);
      }
      
      // If no brandImages or need more, check portfolio array
      if (images.length < 8 && provider.portfolio && Array.isArray(provider.portfolio)) {
        const portfolioUrls = provider.portfolio.filter((url: any) => typeof url === 'string');
        images = [...images, ...portfolioUrls];
      }
      
      // Limit to 8 images
      setPortfolioImages(images.slice(0, 8));

      // Mock reviews for now - can be replaced with API call
      setReviews([
        {
          id: '1',
          userName: 'Sarah Johnson',
          rating: 5,
          comment: 'Excellent work! Very professional and completed the job ahead of schedule. Highly recommended.',
          date: '2 days ago',
          service: 'Service',
        },
        {
          id: '2',
          userName: 'Michael Brown',
          rating: 4,
          comment: 'Good service, arrived on time and fixed the issue. Would use again.',
          date: '1 week ago',
        },
        {
          id: '3',
          userName: 'Emily Davis',
          rating: 5,
          comment: 'Outstanding work! Very clean and professional. The quality exceeded my expectations.',
          date: '2 weeks ago',
        },
      ]);
    } catch (error) {
      console.error('Error fetching provider details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < portfolioImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  if (!provider) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                {provider.brandImages && provider.brandImages.length > 0 ? (
                  <Image
                    source={{ uri: provider.brandImages[0].url || provider.brandImages[0] }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Building2 size={32} color="#ec4899" />
                  </View>
                )}
                {provider.verificationStatus === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={12} color="#ffffff" fill="#ffffff" />
                  </View>
                )}
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.businessName}>{provider.businessName}</Text>
                <Text style={styles.ownerName}>by {provider.user.fullName}</Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingText}>
                    {provider.ratingAverage.toFixed(1)} ({provider.ratingCount} reviews)
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
              onPress={() => setActiveTab('portfolio')}
            >
              <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
                Portfolio ({portfolioImages.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ec4899" />
              </View>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <View style={styles.overviewContainer}>
                    {/* Bio */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>About</Text>
                      <Text style={styles.bioText}>
                        {provider.bio || 'No bio available for this provider.'}
                      </Text>
                    </View>

                    {/* Location & Availability */}
                    <View style={styles.section}>
                      <View style={styles.infoRow}>
                        <MapPin size={18} color="#64748b" />
                        <Text style={styles.infoText}>
                          {provider.locationCity}, {provider.locationState}
                        </Text>
                      </View>
                      {provider.isAvailable && (
                        <View style={styles.infoRow}>
                          <Clock size={18} color="#10b981" />
                          <Text style={styles.infoText}>Available • {provider.estimatedArrival}</Text>
                        </View>
                      )}
                      {provider.yearsOfExperience > 0 && (
                        <View style={styles.infoRow}>
                          <Award size={18} color="#ec4899" />
                          <Text style={styles.infoText}>
                            {provider.yearsOfExperience} years of experience
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Subcategories / Services */}
                    {Array.isArray(provider.subcategories) && provider.subcategories.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Services Offered</Text>
                        <View style={styles.subcategoriesContainer}>
                          {provider.subcategories.map((subcategory, index) => (
                            <View key={index} style={styles.subcategoryChip}>
                              <Text style={styles.subcategoryText}>
                                {subcategory.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {activeTab === 'portfolio' && (
                  <View style={styles.portfolioContainer}>
                    {portfolioImages.length > 0 ? (
                      <>
                        <View style={styles.imageSliderContainer}>
                          <Image
                            source={{ uri: portfolioImages[currentImageIndex] }}
                            style={styles.sliderImage}
                            resizeMode="cover"
                          />
                          {portfolioImages.length > 1 && (
                            <>
                              {currentImageIndex > 0 && (
                                <TouchableOpacity
                                  style={[styles.sliderButton, styles.sliderButtonLeft]}
                                  onPress={handlePrevImage}
                                >
                                  <ChevronLeft size={24} color="#ffffff" />
                                </TouchableOpacity>
                              )}
                              {currentImageIndex < portfolioImages.length - 1 && (
                                <TouchableOpacity
                                  style={[styles.sliderButton, styles.sliderButtonRight]}
                                  onPress={handleNextImage}
                                >
                                  <ChevronRight size={24} color="#ffffff" />
                                </TouchableOpacity>
                              )}
                            </>
                          )}
                          <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                              {currentImageIndex + 1} / {portfolioImages.length}
                            </Text>
                          </View>
                        </View>
                        <FlatList
                          data={portfolioImages}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({ item, index }) => (
                            <TouchableOpacity
                              onPress={() => setCurrentImageIndex(index)}
                              style={[
                                styles.thumbnail,
                                index === currentImageIndex && styles.thumbnailActive,
                              ]}
                            >
                              <Image source={{ uri: item }} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                          )}
                          contentContainerStyle={styles.thumbnailList}
                        />
                      </>
                    ) : (
                      <View style={styles.emptyPortfolio}>
                        <Text style={styles.emptyText}>No portfolio images available</Text>
                      </View>
                    )}
                  </View>
                )}

                {activeTab === 'reviews' && (
                  <View style={styles.reviewsContainer}>
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.reviewAvatar}>
                              <User size={20} color="#ec4899" />
                            </View>
                            <View style={styles.reviewInfo}>
                              <Text style={styles.reviewUserName}>{review.userName}</Text>
                              <View style={styles.reviewMeta}>
                                {renderStars(review.rating)}
                                <Text style={styles.reviewDate}>{review.date}</Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.reviewComment}>{review.comment}</Text>
                          {review.service && (
                            <Text style={styles.reviewService}>Service: {review.service}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyReviews}>
                        <Text style={styles.emptyText}>No reviews available</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => {
                onBook(provider);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    height: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#ec4899',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ec4899',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  overviewContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    marginLeft: 8,
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  subcategoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subcategoryText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  portfolioContainer: {
    padding: 20,
  },
  imageSliderContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonLeft: {
    left: 12,
  },
  sliderButtonRight: {
    right: 12,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailList: {
    paddingHorizontal: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#ec4899',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emptyPortfolio: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  reviewsContainer: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewComment: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewService: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  emptyReviews: {
    padding: 40,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  bookButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProviderProfileModal;
