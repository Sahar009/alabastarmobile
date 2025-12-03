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
import { apiService } from '../services/api';

const { height } = Dimensions.get('window');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, provider]);

  const fetchProviderDetails = async () => {
    if (!provider) return;

    setLoading(true);
    try {
      console.log('[ProviderProfileModal] Fetching provider details for:', provider.id);
      
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

      // Fetch real reviews from API
      try {
        // Use apiService.baseURL which already includes /api
        const baseUrl = apiService.baseURL;
        
        // Try provider profile endpoint first (includes reviews)
        const profileUrl = `${baseUrl}/providers/profile/${provider.id}`;
        console.log('[ProviderProfileModal] Fetching provider profile with reviews from:', profileUrl);
        
        let apiReviews: any[] = [];
        
        const token = await apiService.loadToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const profileResponse = await fetch(profileUrl, { headers });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          console.log('[ProviderProfileModal] Provider profile API response:', {
            success: profileData.success,
            hasData: !!profileData.data,
            hasReviews: !!profileData.data?.reviews,
            reviewCount: profileData.data?.reviews?.length || 0,
          });
          
          if (profileData.success && profileData.data) {
            if (Array.isArray(profileData.data.reviews)) {
              apiReviews = profileData.data.reviews;
              console.log('[ProviderProfileModal] ✅ Got reviews from provider profile endpoint:', apiReviews.length);
            }
          }
        } else {
          console.warn('[ProviderProfileModal] ⚠️ Profile API request failed:', {
            status: profileResponse.status,
            statusText: profileResponse.statusText,
          });
        }
        
        // Fallback to reviews endpoint if profile endpoint doesn't have reviews
        if (apiReviews.length === 0) {
          const reviewsUrl = `${baseUrl}/reviews/provider/${provider.id}`;
          console.log('[ProviderProfileModal] Falling back to reviews endpoint:', reviewsUrl);
          
          const reviewsResponse = await fetch(reviewsUrl, { headers });
          
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            
            if (reviewsData.success && reviewsData.data?.reviews && Array.isArray(reviewsData.data.reviews)) {
              apiReviews = reviewsData.data.reviews;
              console.log('[ProviderProfileModal] ✅ Got reviews from reviews endpoint');
            }
          } else {
            console.warn('[ProviderProfileModal] ⚠️ Reviews API request failed:', {
              status: reviewsResponse.status,
              statusText: reviewsResponse.statusText,
            });
          }
        }
        
        if (apiReviews.length > 0) {
          // Transform API reviews to component format
          const transformedReviews: Review[] = apiReviews.map((review: any) => {
            const reviewDate = review.createdAt 
              ? new Date(review.createdAt)
              : new Date();
            
            const now = new Date();
            const diffInMs = now.getTime() - reviewDate.getTime();
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            const diffInWeeks = Math.floor(diffInDays / 7);
            const diffInMonths = Math.floor(diffInDays / 30);
            
            let dateStr = '';
            if (diffInDays === 0) {
              dateStr = 'Today';
            } else if (diffInDays === 1) {
              dateStr = '1 day ago';
            } else if (diffInDays < 7) {
              dateStr = `${diffInDays} days ago`;
            } else if (diffInWeeks === 1) {
              dateStr = '1 week ago';
            } else if (diffInWeeks < 4) {
              dateStr = `${diffInWeeks} weeks ago`;
            } else if (diffInMonths === 1) {
              dateStr = '1 month ago';
            } else if (diffInMonths < 12) {
              dateStr = `${diffInMonths} months ago`;
            } else {
              dateStr = reviewDate.toLocaleDateString();
            }
            
            return {
              id: review.id || `review-${Math.random()}`,
              userName: review.User?.fullName || review.user?.fullName || 'Anonymous',
              userAvatar: review.User?.avatarUrl || review.user?.avatarUrl,
              rating: review.rating || 0,
              comment: review.comment || '',
              date: dateStr,
              service: review.booking?.serviceId || undefined,
            };
          });
          
          console.log('[ProviderProfileModal] ✅ Using REAL reviews from API:', transformedReviews.length);
          setReviews(transformedReviews);
        } else {
          console.warn('[ProviderProfileModal] ⚠️ No reviews in API response');
          setReviews([]);
        }
      } catch (error) {
        console.error('[ProviderProfileModal] ❌ Error fetching reviews:', error);
        setReviews([]);
      }
    } catch (error) {
      console.error('[ProviderProfileModal] ❌ Error fetching provider details:', error);
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
                <Text style={styles.ownerName}>by {provider.user?.fullName || 'Provider'}</Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingText}>
                    {(provider.ratingAverage || 0).toFixed(1)} ({provider.ratingCount || 0} reviews)
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
                      {(provider.locationCity || provider.locationState) && (
                        <View style={styles.infoRow}>
                          <MapPin size={18} color="#64748b" />
                          <Text style={styles.infoText}>
                            {[provider.locationCity, provider.locationState].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      )}
                      {provider.isAvailable && (
                        <View style={styles.infoRow}>
                          <Clock size={18} color="#10b981" />
                          <Text style={styles.infoText}>Available{provider.estimatedArrival ? ` • ${provider.estimatedArrival}` : ''}</Text>
                        </View>
                      )}
                      {provider.yearsOfExperience && provider.yearsOfExperience > 0 && (
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
                          {provider.subcategories.map((subcategory: string, index: number) => (
                            <View key={index} style={styles.subcategoryChip}>
                              <Text style={styles.subcategoryText}>
                                {subcategory.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
                          {review.comment && (
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                          )}
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
