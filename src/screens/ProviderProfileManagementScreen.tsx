import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  AlertButton,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Cog,
  Edit3,
  MapPin,
  Shield,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  Play,
  Video,
  LogOut,
  CreditCard,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Modal } from 'react-native';
import { apiService, API_BASE_URL } from '../services/api';

interface ProviderProfileManagementScreenProps {
  userData: any;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
  onLogout?: () => void;
}

interface ProviderProfile {
  id?: string;
  businessName: string;
  category: string;
  subcategories: string[];
  bio: string;
  locationCity: string;
  locationState: string;
  latitude?: string;
  longitude?: string;
  verificationStatus?: string;
  portfolio: string[];
}

interface BrandImageDocument {
  id: string;
  url: string;
  type: string;
}

interface VideoInfo {
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  videoUploadedAt?: string;
}

interface CategoryOption {
  value: string;
  label: string;
  description?: string;
}

const MAX_PORTFOLIO = 8;

const ProviderProfileManagementScreen: React.FC<ProviderProfileManagementScreenProps> = ({ userData, onBack, onNavigate, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [profile, setProfile] = useState<ProviderProfile>({
    businessName: '',
    category: '',
    subcategories: [],
    bio: '',
    locationCity: '',
    locationState: '',
    portfolio: [],
  });
  const [originalProfile, setOriginalProfile] = useState<ProviderProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [brandImageDocuments, setBrandImageDocuments] = useState<BrandImageDocument[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [featureLimits, setFeatureLimits] = useState<any>(null);
  const skeletonPulse = useRef(new Animated.Value(0)).current;

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const response = await fetch(`${API_BASE_URL}/categories/categories?limit=100&isActive=true`);
      const data = await response.json();
      if (data.success && data.data?.categories) {
        const mapped = data.data.categories.map((category: any) => ({
          value: category.slug || category.name?.toLowerCase()?.replace(/\s+/g, '_'),
          label: category.name,
          description: category.description,
        }));
        setCategories(mapped);
      } else {
        fallbackCategories();
      }
    } catch (error) {
      console.error('Categories fetch error', error);
      fallbackCategories();
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const fallbackCategories = () => {
    setCategories([
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'cleaning', label: 'Cleaning' },
      { value: 'moving', label: 'Moving' },
      { value: 'ac_repair', label: 'AC Repair' },
      { value: 'carpentry', label: 'Carpentry' },
      { value: 'painting', label: 'Painting' },
      { value: 'pest_control', label: 'Pest Control' },
      { value: 'laundry', label: 'Laundry' },
      { value: 'tiling', label: 'Tiling' },
      { value: 'cctv', label: 'CCTV Installation' },
      { value: 'gardening', label: 'Gardening' },
      { value: 'appliance_repair', label: 'Appliance Repair' },
      { value: 'locksmith', label: 'Locksmith' },
    ]);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getProviderProfile();
      if (response.success && response.data) {
        const provider = response.data;
        
        // Extract brand images from ProviderDocuments where type is "brand_image"
        let brandImages: string[] = [];
        const documents: BrandImageDocument[] = [];
        
        if (Array.isArray(provider.ProviderDocuments)) {
          const brandImageDocs = provider.ProviderDocuments.filter(
            (doc: any) => doc.type === 'brand_image' && doc.url
          );
          brandImages = brandImageDocs.map((doc: any) => doc.url);
          documents.push(...brandImageDocs.map((doc: any) => ({
            id: doc.id,
            url: doc.url,
            type: doc.type,
          })));
        }
        
        // Fallback to other sources if ProviderDocuments doesn't have brand images
        if (brandImages.length === 0) {
          if (Array.isArray(provider.portfolio)) {
            brandImages = provider.portfolio;
          } else if (Array.isArray(provider.portfolio?.images)) {
            brandImages = provider.portfolio.images.map((img: any) => img.url || img);
          } else if (Array.isArray(provider.brandImages)) {
            brandImages = provider.brandImages.map((img: any) => img.url || img);
          }
        }
        
        // Set video info from provider data first
        setVideoInfo({
          videoUrl: provider.videoUrl || undefined,
          videoThumbnail: provider.videoThumbnail || undefined,
          videoDuration: provider.videoDuration || undefined,
          videoUploadedAt: provider.videoUploadedAt || undefined,
        });
        
        setBrandImageDocuments(documents);
        
        const normalized: ProviderProfile = {
          id: provider.id,
          businessName: provider.businessName || '',
          category: provider.category || '',
          subcategories: Array.isArray(provider.subcategories) ? provider.subcategories : [],
          bio: provider.bio || provider.description || '',
          locationCity: provider.locationCity || '',
          locationState: provider.locationState || '',
          latitude: provider.latitude || '',
          longitude: provider.longitude || '',
          portfolio: brandImages,
        };
        setProfile(normalized);
        setOriginalProfile(normalized);
        setVerificationStatus(provider.verificationStatus || provider.status || 'pending');
        
        // Fetch feature limits if provider ID is available
        if (provider.id) {
          try {
            const limitsResponse = await apiService.getProviderFeatureLimits(provider.id);
            if (limitsResponse.success && limitsResponse.data) {
              setFeatureLimits(limitsResponse.data);
              console.log('Feature limits loaded:', limitsResponse.data);
              
              // Update video info from feature limits if available (like frontend)
              if (limitsResponse.data.hasVideo && limitsResponse.data.videoDetails) {
                const videoDetails = limitsResponse.data.videoDetails;
                setVideoInfo({
                  videoUrl: videoDetails.url || provider.videoUrl || undefined,
                  videoThumbnail: videoDetails.thumbnail || provider.videoThumbnail || undefined,
                  videoDuration: videoDetails.duration || provider.videoDuration || undefined,
                  videoUploadedAt: provider.videoUploadedAt || undefined,
                });
                console.log('Video info updated from feature limits:', videoDetails);
              }
            }
          } catch (error: any) {
            console.error('Error fetching feature limits:', error);
            // Don't show alert, just log the error
          }
        }
      } else {
        Alert.alert('Profile', response.message || 'Unable to load provider profile.');
      }
    } catch (error: any) {
      console.error('Provider profile load error', error);
      Alert.alert('Error', error?.message || 'Unable to load provider profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [skeletonPulse]);

  useEffect(() => {
    loadCategories();
    loadProfile();
  }, [loadCategories, loadProfile]);

  const resetChanges = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
    setEditing(false);
  };

  const hasChanges = useMemo(() => {
    if (!originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const skeletonOpacity = skeletonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  const renderSkeletonCard = (_: any, index: number) => (
    <View key={index} style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonLineWide, { opacity: skeletonOpacity }]} />
      <Animated.View style={[styles.skeletonLineShort, { opacity: skeletonOpacity }]} />
      <Animated.View style={[styles.skeletonSpacer, { opacity: skeletonOpacity }]} />
      <View style={styles.skeletonRow}>
        <Animated.View style={[styles.skeletonChip, { opacity: skeletonOpacity }]} />
        <Animated.View style={[styles.skeletonChipHalf, { opacity: skeletonOpacity }]} />
      </View>
    </View>
  );

  const selectedCategoryLabel = useMemo(() => {
    return categories.find((cat) => cat.value === profile.category)?.label || 'Select a category';
  }, [categories, profile.category]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBar}>
          <Animated.View style={[styles.skeletonHeaderButton, { opacity: skeletonOpacity }]} />
          <Animated.View style={[styles.skeletonHeaderTitle, { opacity: skeletonOpacity }]} />
          <Animated.View style={[styles.skeletonHeaderButton, { opacity: skeletonOpacity }]} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 4 }).map(renderSkeletonCard)}
          <View style={styles.skeletonPortfolioWrapper}>
            {Array.from({ length: 6 }).map((__, idx) => (
              <Animated.View key={idx} style={[styles.skeletonPortfolioItem, { opacity: skeletonOpacity }]} />
            ))}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!hasChanges) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.updateProviderProfile({
        businessName: profile.businessName,
        category: profile.category,
        subcategories: profile.subcategories,
        bio: profile.bio,
        locationCity: profile.locationCity,
        locationState: profile.locationState,
        latitude: profile.latitude,
        longitude: profile.longitude,
        portfolio: profile.portfolio,
      });
      if (response.success) {
        setOriginalProfile(profile);
        setEditing(false);
        Alert.alert('Profile Updated', 'Your provider profile has been updated successfully.');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not update profile.');
      }
    } catch (error: any) {
      console.error('Update provider profile error', error);
      Alert.alert('Error', error?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteBrandImage = async (documentId: string, imageUrl: string) => {
    if (!profile.id) {
      Alert.alert('Error', 'Provider ID not found');
      return;
    }

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingImageId(documentId);
              const response = await apiService.deleteProviderDocument(profile.id!, documentId);
              
              if (response.success) {
                // Remove from local state
                const updatedDocuments = brandImageDocuments.filter(doc => doc.id !== documentId);
                const updatedPortfolio = profile.portfolio.filter(url => url !== imageUrl);
                
                setBrandImageDocuments(updatedDocuments);
                setProfile({ ...profile, portfolio: updatedPortfolio });
                
                // Reload profile to sync with backend
                await loadProfile();
                
                // Refresh feature limits after deletion
                if (profile.id) {
                  try {
                    const limitsResponse = await apiService.getProviderFeatureLimits(profile.id);
                    if (limitsResponse.success && limitsResponse.data) {
                      setFeatureLimits(limitsResponse.data);
                    }
                  } catch (error) {
                    console.error('Error refreshing feature limits:', error);
                  }
                }
                
                Alert.alert('Success', 'Image deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete image');
              }
            } catch (error: any) {
              console.error('Delete image error', error);
              Alert.alert('Error', error?.message || 'Failed to delete image');
            } finally {
              setDeletingImageId(null);
            }
          },
        },
      ]
    );
  };

  const handleAddBrandImage = async () => {
    // Check feature limits for brand images
    if (featureLimits) {
      if (featureLimits.currentPhotoCount >= featureLimits.features.maxPhotos) {
        Alert.alert(
          'Photo Limit Reached',
          `You have ${featureLimits.currentPhotoCount}/${featureLimits.features.maxPhotos} photos. Upgrade to Premium to add more!`
        );
        return;
      }
    }
    
    if (profile.portfolio.length >= MAX_PORTFOLIO) {
      Alert.alert('Portfolio Limit', `You can only have up to ${MAX_PORTFOLIO} portfolio images.`);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      },
      async (response) => {
        if (response.didCancel) {
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) {
          Alert.alert('Upload Failed', 'Unable to read selected image.');
          return;
        }

        if (!profile.id) {
          Alert.alert('Error', 'Provider profile not found');
          return;
        }

        try {
          setPortfolioLoading(true);
          
          // Ensure token is loaded
          await apiService.loadToken();
          
          const formData = new FormData();
          formData.append('documents', {
            uri: asset.uri,
            name: asset.fileName || `portfolio_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          } as any);
          formData.append('type', 'brand_image');

          console.log('📤 Uploading brand image:', {
            uri: asset.uri,
            name: asset.fileName,
            type: asset.type,
            providerId: profile.id,
          });

          const uploadResponse = await apiService.uploadProviderDocument(profile.id, formData);
          
          console.log('📥 Brand image upload response:', uploadResponse);

          if (uploadResponse.success && uploadResponse.data) {
            const uploadedUrl = uploadResponse.data.url;
            
            // Update local state
            const updatedPortfolio = [...profile.portfolio, uploadedUrl].slice(0, MAX_PORTFOLIO);
            setProfile({ ...profile, portfolio: updatedPortfolio });
            
            // Reload profile to get the new document ID and sync with backend
            await loadProfile();
            
            // Refresh feature limits after upload
            if (profile.id) {
              try {
                const limitsResponse = await apiService.getProviderFeatureLimits(profile.id);
                if (limitsResponse.success && limitsResponse.data) {
                  setFeatureLimits(limitsResponse.data);
                }
              } catch (error) {
                console.error('Error refreshing feature limits:', error);
              }
            }
            
            Alert.alert('Success', 'Brand image uploaded successfully');
          } else {
            console.error('Upload response missing data:', uploadResponse);
            Alert.alert('Upload Failed', uploadResponse.message || 'Unable to upload portfolio image. Please try again.');
          }
        } catch (error: any) {
          console.error('Portfolio upload error:', error);
          Alert.alert('Upload Error', error?.message || 'Unable to upload image. Please check your connection and try again.');
        } finally {
          setPortfolioLoading(false);
        }
      },
    );
  };

  const handleUploadVideo = async () => {
    if (!profile.id) {
      Alert.alert('Error', 'Provider profile not found');
      return;
    }

    // Check if Premium plan (like frontend)
    if (!featureLimits || featureLimits.features.maxVideos === 0) {
      Alert.alert(
        'Premium Feature',
        'Video upload is a Premium feature! Upgrade to Premium to upload videos.'
      );
      return;
    }

    // Check if already has video
    if (featureLimits.hasVideo) {
      Alert.alert('Video Exists', 'You already have a video. Delete the existing one first.');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'video',
        quality: 0.8,
        videoQuality: 'high',
        includeBase64: false,
      },
      async (response) => {
        if (response.didCancel) {
          return;
        } else if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          Alert.alert('Upload Failed', 'Unable to read selected video.');
          return;
        }

        // Check video size (max 50MB)
        if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
          Alert.alert('Error', 'Video file size must be less than 50MB');
          return;
        }

        try {
          setVideoLoading(true);
          
          // Note: Video upload requires the video to be hosted externally first (e.g., Cloudinary)
          // The backend endpoint expects videoUrl, videoThumbnail, and videoDuration in JSON format
          // This is not a direct file upload endpoint
          
          Alert.alert(
            'Video Upload',
            'Video upload requires external hosting. The backend endpoint expects a video URL, not a file upload. Please use the web interface or contact support for video upload assistance.',
            [{ text: 'OK' }]
          );
          
          // TODO: Implement Cloudinary video upload
          // Steps needed:
          // 1. Upload video file to Cloudinary and get videoUrl
          // 2. Generate or upload video thumbnail and get videoThumbnail
          // 3. Get video duration from asset.duration
          // 4. Call apiService.uploadProviderVideo(profile.id, { videoUrl, videoThumbnail, videoDuration })
          // 5. Reload profile
          
        } catch (error: any) {
          console.error('Video upload error', error);
          Alert.alert('Upload Error', error?.message || 'Unable to upload video.');
        } finally {
          setVideoLoading(false);
        }
      },
    );
  };

  const handleDeleteVideo = async () => {
    if (!profile.id) {
      return;
    }
    
    // Check if video exists
    const hasVideo = (featureLimits?.hasVideo && featureLimits?.videoDetails) || videoInfo.videoUrl;
    if (!hasVideo) {
      Alert.alert('No Video', 'No video to delete');
      return;
    }

    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setVideoLoading(true);
              const response = await apiService.deleteProviderVideo(profile.id!);
              
              if (response.success) {
                // Clear video info immediately
                setVideoInfo({});
                
                // Refresh feature limits first to update hasVideo flag
                if (profile.id) {
                  try {
                    const limitsResponse = await apiService.getProviderFeatureLimits(profile.id);
                    if (limitsResponse.success && limitsResponse.data) {
                      setFeatureLimits(limitsResponse.data);
                    }
                  } catch (error) {
                    console.error('Error refreshing feature limits:', error);
                  }
                }
                
                // Then reload profile to sync everything
                await loadProfile();
                
                Alert.alert('Success', 'Video deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete video');
              }
            } catch (error: any) {
              console.error('Delete video error', error);
              Alert.alert('Error', error?.message || 'Failed to delete video');
            } finally {
              setVideoLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatVideoDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show confirmation alert
            Alert.alert(
              'Final Confirmation',
              'This is your last chance to cancel. Your account and all associated data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: deleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const response = await apiService.deleteAccount();

      if (response.success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted. You will be logged out.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Logout user after account deletion
                if (onLogout) {
                  onLogout();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to delete account');
        setDeletingAccount(false);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      Alert.alert('Error', error.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const handleAddSubcategory = () => {
    const value = subcategoryInput.trim().toLowerCase();
    if (!value) return;
    if (profile.subcategories.includes(value)) {
      Alert.alert('Subcategory Exists', 'This subcategory is already selected.');
      return;
    }
    setProfile({ ...profile, subcategories: [...profile.subcategories, value] });
    setSubcategoryInput('');
    if (!editing) {
      setEditing(true);
    }
  };

  const handleRemoveSubcategory = (value: string) => {
    setProfile({ ...profile, subcategories: profile.subcategories.filter((item) => item !== value) });
    if (!editing) {
      setEditing(true);
    }
  };

  const renderVerificationBadge = () => {
    const status = (verificationStatus || '').toLowerCase();
    let color = '#facc15';
    let label = 'Pending Verification';
    if (status === 'verified') {
      color = '#10b981';
      label = 'Verified Provider';
    } else if (status === 'rejected') {
      color = '#ef4444';
      label = 'Verification Rejected';
    }

    return (
      <View style={[styles.verificationBadge, { backgroundColor: `${color}1A` }]}> 
        <Shield size={14} color={color} />
        <Text style={[styles.verificationText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          style={[styles.backButton, !onBack && styles.backButtonDisabled]}
          activeOpacity={onBack ? 0.7 : 1}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Profile</Text>
        <TouchableOpacity
          onPress={() => onNavigate?.('provider-settings')}
          style={[styles.settingsButton, !onNavigate && styles.settingsButtonDisabled]}
          activeOpacity={onNavigate ? 0.7 : 1}
          disabled={!onNavigate}
        >
          <Cog size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Business Information</Text>
              <Text style={styles.sectionSubtitle}>Manage how customers see your business</Text>
              {userData?.user?.fullName ? (
                <Text style={styles.sectionCaption}>Account owner: {userData.user.fullName}</Text>
              ) : null}
            </View>
            {editing ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.iconButton, styles.saveButton, (!hasChanges || saving) && styles.disabledButton]}
                disabled={saving || !hasChanges}
                onPress={handleSave}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle size={18} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.cancelButton]}
                onPress={resetChanges}
                disabled={saving}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Edit3 size={16} color="#ec4899" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sparkle Clean Services"
              placeholderTextColor="#94a3b8"
              value={profile.businessName}
              editable={editing}
              onChangeText={(text) => setProfile({ ...profile, businessName: text })}
            />
          </View>

          <View style={styles.inlineRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#94a3b8"
                value={profile.locationCity}
                editable={editing}
                onChangeText={(text) => setProfile({ ...profile, locationCity: text })}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#94a3b8"
                value={profile.locationState}
                editable={editing}
                onChangeText={(text) => setProfile({ ...profile, locationState: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio / Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell customers about your expertise, experience, and what makes your service unique."
              placeholderTextColor="#94a3b8"
              value={profile.bio}
              editable={editing}
              multiline
              numberOfLines={4}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Services</Text>
              <Text style={styles.sectionSubtitle}>Choose your main category and specialties</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.selectInput}
            disabled={!editing}
            onPress={() => {
              if (!editing) return;
              const buttons: AlertButton[] = categories.map((category) => ({
                text: category.label,
                onPress: () => setProfile({ ...profile, category: category.value }),
              }));
              buttons.push({ text: 'Cancel', style: 'cancel' });
              Alert.alert(
                'Select Category',
                'Choose the primary category that best describes your business.',
                buttons,
              );
            }}
          >
            <MapPin size={18} color="#ec4899" />
            <Text style={styles.selectLabel}>{categoryLoading ? 'Loading categories…' : selectedCategoryLabel}</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subcategories</Text>
            <View style={styles.subcategoryInputRow}>
              <TextInput
                style={[styles.input, styles.subcategoryInput]}
                placeholder="Add a specialty (e.g. deep cleaning)"
                placeholderTextColor="#94a3b8"
                value={subcategoryInput}
                onChangeText={setSubcategoryInput}
                editable={editing}
              />
              <TouchableOpacity
                style={styles.addChipButton}
                disabled={!editing || !subcategoryInput.trim()}
                onPress={handleAddSubcategory}
              >
                <Upload size={16} color="#fff" />
                <Text style={styles.addChipButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipWrap}>
              {profile.subcategories.length === 0 && (
                <Text style={styles.helperText}>Add specific services you offer to improve search visibility.</Text>
              )}
              {profile.subcategories.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipLabel}>{item.replace(/_/g, ' ')}</Text>
                  {editing && (
                    <TouchableOpacity onPress={() => handleRemoveSubcategory(item)}>
                      <X size={14} color="#ec4899" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Portfolio</Text>
              <Text style={styles.sectionSubtitle}>Showcase your recent work</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.sectionHint}>{profile.portfolio.length}/{MAX_PORTFOLIO}</Text>
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={() => setShowImageModal(true)}
              >
                <Edit3 size={14} color="#ec4899" />
                <Text style={styles.editImageButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.portfolioGrid}>
            {profile.portfolio.map((url, index) => (
              <TouchableOpacity
                key={`${url}-${index}`}
                style={styles.portfolioItem}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setShowImageModal(true);
                }}
              >
                <Image source={{ uri: url }} style={styles.portfolioImage} />
              </TouchableOpacity>
            ))}
            {profile.portfolio.length < MAX_PORTFOLIO && (
              <TouchableOpacity
                style={styles.portfolioAdd}
                onPress={handleAddBrandImage}
                disabled={portfolioLoading}
              >
                {portfolioLoading ? (
                  <ActivityIndicator color="#ec4899" />
                ) : (
                  <>
                    <ImageIcon size={24} color="#ec4899" />
                    <Text style={styles.portfolioAddText}>Add Image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Video Section */}
        {featureLimits && featureLimits.features.maxVideos > 0 ? (
          <>
            {(featureLimits.hasVideo && featureLimits.videoDetails) || videoInfo.videoUrl ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionHeading}>Promotional Video</Text>
                    <Text style={styles.sectionSubtitle}>Showcase your business</Text>
                  </View>
                  {editing && (
                    <TouchableOpacity
                      style={styles.deleteVideoButton}
                      onPress={handleDeleteVideo}
                      disabled={videoLoading}
                    >
                      {videoLoading ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Trash2 size={16} color="#ef4444" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.videoContainer}
                  onPress={() => {
                    const videoUrl = featureLimits.videoDetails?.url || videoInfo.videoUrl;
                    if (videoUrl) {
                      // Open video in browser or native video player
                      Alert.alert('Video', 'Would you like to view the video?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'View', onPress: () => {
                          // You can implement Linking.openURL(videoUrl) here
                          console.log('Open video:', videoUrl);
                        }},
                      ]);
                    }
                  }}
                >
                  {(featureLimits.videoDetails?.thumbnail || videoInfo.videoThumbnail) ? (
                    <Image
                      source={{ uri: featureLimits.videoDetails?.thumbnail || videoInfo.videoThumbnail }}
                      style={styles.videoThumbnail}
                    />
                  ) : (
                    <View style={styles.videoThumbnailPlaceholder}>
                      <Video size={40} color="#ec4899" />
                    </View>
                  )}
                  <View style={styles.videoOverlay}>
                    <View style={styles.videoPlayButton}>
                      <Play size={24} color="#fff" fill="#fff" />
                    </View>
                    {(featureLimits.videoDetails?.duration || videoInfo.videoDuration) && (
                      <Text style={styles.videoDuration}>
                        {formatVideoDuration(featureLimits.videoDetails?.duration || videoInfo.videoDuration)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                {(featureLimits.videoDetails?.duration || videoInfo.videoDuration) && (
                  <View style={styles.videoInfoRow}>
                    <Text style={styles.videoInfoText}>
                      Duration: {featureLimits.videoDetails?.duration || videoInfo.videoDuration}s
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionHeading}>Promotional Video</Text>
                    <Text style={styles.sectionSubtitle}>Add a video to showcase your business</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addVideoButton}
                  onPress={handleUploadVideo}
                  disabled={videoLoading}
                >
                  {videoLoading ? (
                    <ActivityIndicator color="#ec4899" />
                  ) : (
                    <>
                      <Video size={20} color="#ec4899" />
                      <Text style={styles.addVideoButtonText}>Upload Video</Text>
                    </>
                  )}
                </TouchableOpacity>
                {featureLimits.features.videoMaxDuration && (
                  <Text style={styles.videoHintText}>
                    Max {featureLimits.features.videoMaxDuration} seconds • MP4, MOV, AVI • Max 50MB
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionHeading}>Promotional Video</Text>
                <Text style={styles.sectionSubtitle}>Premium Feature</Text>
              </View>
            </View>
            <View style={styles.premiumFeatureBox}>
              <Video size={48} color="#ec4899" />
              <Text style={styles.premiumFeatureTitle}>Video Upload is a Premium Feature</Text>
              <Text style={styles.premiumFeatureText}>
                Upgrade to Premium to showcase your business with a promotional video
              </Text>
            </View>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Verification & Status</Text>
          <View style={styles.statusRow}>
            {renderVerificationBadge()}
            <View style={styles.statusInfo}>
              <Award size={20} color="#facc15" />
              <Text style={styles.statusInfoText}>Maintain accurate information to stay verified and appear in search results.</Text>
            </View>
          </View>
        </View>

        {/* Subscription Button */}
        {onNavigate && (
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.subscriptionButton}
              onPress={() => onNavigate('provider-subscription')}
              activeOpacity={0.7}
            >
              <CreditCard size={20} color="#ec4899" />
              <Text style={styles.subscriptionButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Actions */}
        {onLogout && (
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: onLogout },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutButton, styles.deleteAccountButton]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              activeOpacity={0.7}
            >
              {deletingAccount ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Trash2 size={20} color="#ef4444" />
              )}
              <Text style={styles.logoutText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Editing Modal */}
      <Modal
        visible={showImageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Portfolio Images</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowImageModal(false);
                  setSelectedImageIndex(null);
                }}
              >
                <X size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {profile.portfolio.length === 0 ? (
                <View style={styles.emptyState}>
                  <ImageIcon size={48} color="#cbd5e1" />
                  <Text style={styles.emptyStateText}>No images added yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add images to showcase your work</Text>
                </View>
              ) : (
                <View style={styles.modalImageGrid}>
                  {profile.portfolio.map((url, index) => {
                    const document = brandImageDocuments.find(doc => doc.url === url);
                    const isDeleting = deletingImageId === document?.id;
                    
                    return (
                      <View key={`${url}-${index}`} style={styles.modalImageItem}>
                        <Image source={{ uri: url }} style={styles.modalImage} />
                        {document && (
                          <TouchableOpacity
                            style={[styles.modalDeleteButton, isDeleting && styles.modalDeleteButtonDisabled]}
                            onPress={() => handleDeleteBrandImage(document.id, url)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Trash2 size={16} color="#fff" />
                            )}
                          </TouchableOpacity>
                        )}
                        {selectedImageIndex === index && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle size={20} color="#22c55e" fill="#22c55e" />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {profile.portfolio.length < MAX_PORTFOLIO && (
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={async () => {
                    setShowImageModal(false);
                    await handleAddBrandImage();
                  }}
                  disabled={portfolioLoading}
                >
                  {portfolioLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Upload size={18} color="#fff" />
                      <Text style={styles.modalAddButtonText}>Add New Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowImageModal(false);
                  setSelectedImageIndex(null);
                }}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDisabled: {
    opacity: 0.6,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionCaption: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  selectInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
  },
  selectLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  subcategoryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subcategoryInput: {
    flex: 1,
  },
  addChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addChipButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fdf2f8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    padding: 6,
  },
  portfolioAdd: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fbcfe8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  portfolioAddText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  statusInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec4899',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonLineWide: {
    height: 18,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 12,
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    width: '60%',
  },
  skeletonSpacer: {
    height: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonChip: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  skeletonChipHalf: {
    flex: 0.6,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  skeletonPortfolioWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonPortfolioItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  skeletonHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  skeletonHeaderTitle: {
    flex: 1,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editImageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteVideoButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fbcfe8',
    borderStyle: 'dashed',
    backgroundColor: '#fdf2f8',
  },
  addVideoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  videoInfoRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  videoInfoText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  videoHintText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
  premiumFeatureBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumFeatureText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
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
    maxHeight: '90%',
    paddingBottom: 20,
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
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScrollView: {
    maxHeight: 400,
    padding: 20,
  },
  modalImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalImageItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 8,
  },
  modalDeleteButtonDisabled: {
    opacity: 0.6,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  subscriptionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ec4899',
  },
  logoutSection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 12,
  },
  deleteAccountButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ProviderProfileManagementScreen;
