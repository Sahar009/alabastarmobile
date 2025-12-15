import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
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
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { apiService, API_BASE_URL } from '../services/api';
import { providerOnboardingService } from '../services/providerOnboardingService';

interface ProviderProfileManagementScreenProps {
  userData: any;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
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

interface CategoryOption {
  value: string;
  label: string;
  description?: string;
}

const MAX_PORTFOLIO = 8;

// Skeleton Loader Component
const ProfileSkeletonLoader: React.FC = () => {
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
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Business Information Skeleton */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineSubtitle, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonButtonSmall, { opacity }]} />
        </View>

        <View style={styles.skeletonInputGroup}>
          <Animated.View style={[styles.skeletonLabel, { opacity }]} />
          <Animated.View style={[styles.skeletonInput, { opacity }]} />
        </View>

        <View style={styles.inlineRow}>
          <View style={[styles.skeletonInputGroup, styles.halfWidth]}>
            <Animated.View style={[styles.skeletonLabel, { opacity }]} />
            <Animated.View style={[styles.skeletonInput, { opacity }]} />
          </View>
          <View style={[styles.skeletonInputGroup, styles.halfWidth]}>
            <Animated.View style={[styles.skeletonLabel, { opacity }]} />
            <Animated.View style={[styles.skeletonInput, { opacity }]} />
          </View>
        </View>

        <View style={styles.skeletonInputGroup}>
          <Animated.View style={[styles.skeletonLabel, { opacity }]} />
          <Animated.View style={[styles.skeletonInput, styles.skeletonTextArea, { opacity }]} />
        </View>
      </View>

      {/* Services Skeleton */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineSubtitle, { opacity }]} />
          </View>
        </View>

        <Animated.View style={[styles.skeletonSelectInput, { opacity }]} />

        <View style={styles.skeletonInputGroup}>
          <Animated.View style={[styles.skeletonLabel, { opacity }]} />
          <View style={styles.skeletonSubcategoryRow}>
            <Animated.View style={[styles.skeletonInput, styles.skeletonSubcategoryInput, { opacity }]} />
            <Animated.View style={[styles.skeletonButtonSmall, { opacity }]} />
          </View>
          <View style={styles.skeletonChipsContainer}>
            <Animated.View style={[styles.skeletonChip, { opacity }]} />
            <Animated.View style={[styles.skeletonChip, { opacity }]} />
            <Animated.View style={[styles.skeletonChip, { opacity }]} />
          </View>
        </View>
      </View>

      {/* Portfolio Skeleton */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineSubtitle, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        </View>

        <View style={styles.portfolioGrid}>
          {[1, 2, 3, 4].map((item) => (
            <Animated.View key={item} style={[styles.skeletonPortfolioItem, { opacity }]} />
          ))}
        </View>
      </View>

      {/* Verification Skeleton */}
      <View style={styles.sectionCard}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonLineTitle, styles.skeletonLineWithMargin, { opacity }]} />
        <View style={styles.statusRow}>
          <Animated.View style={[styles.skeletonBadge, { opacity }]} />
          <View style={styles.skeletonContentFlex}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineDetail1, { opacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonLineDetail2, { opacity }]} />
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const ProviderProfileManagementScreen: React.FC<ProviderProfileManagementScreenProps> = ({ userData, onBack, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [_selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<string>('');

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
        
        // Extract brand images from ProviderDocuments array
        let brandImageUrls: string[] = [];
        if (provider.ProviderDocuments && Array.isArray(provider.ProviderDocuments)) {
          brandImageUrls = provider.ProviderDocuments
            .filter((doc: any) => doc.type === 'brand_image' && doc.url)
            .map((doc: any) => doc.url);
        }
        
        // Handle portfolio from different possible structures
        let portfolioUrls: string[] = [];
        
        // Check direct portfolio array
          if (Array.isArray(provider.portfolio)) {
          portfolioUrls = provider.portfolio.map((img: any) => 
            typeof img === 'string' ? img : (img.url || img)
          );
        }
        // Check portfolio.images structure
        else if (provider.portfolio?.images && Array.isArray(provider.portfolio.images)) {
          portfolioUrls = provider.portfolio.images.map((img: any) => img.url || img);
        }
        // Check brandImages array
        else if (Array.isArray(provider.brandImages)) {
          portfolioUrls = provider.brandImages.map((img: any) => img.url || img);
        }
        
        // Combine brand images from ProviderDocuments with portfolio images
        // Use brand images if available, otherwise fall back to portfolio
        const allPortfolioImages = brandImageUrls.length > 0 
          ? brandImageUrls 
          : portfolioUrls;
        
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
          portfolio: allPortfolioImages,
        };
        
        console.log('[ProviderProfileManagementScreen] ✅ Loaded profile:', {
          brandImagesFromDocs: brandImageUrls.length,
          portfolioUrls: portfolioUrls.length,
          finalPortfolio: allPortfolioImages.length,
        });
        
        setProfile(normalized);
        setOriginalProfile(normalized);
        setVerificationStatus(provider.verificationStatus || provider.status || 'pending');
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

  const handleAddPortfolioImage = async () => {
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

        try {
          setPortfolioLoading(true);
          const upload = await providerOnboardingService.uploadFile(asset.uri, asset.fileName || `portfolio_${Date.now()}.jpg`, asset.type || 'image/jpeg');
          if (upload.success && upload.data?.url) {
            const url = upload.data.url;
            const updatedPortfolio = [...profile.portfolio, url].slice(0, MAX_PORTFOLIO);
            const updated = { ...profile, portfolio: updatedPortfolio };
            setProfile(updated);
            if (!editing) {
              setEditing(true);
            }
          } else {
            Alert.alert('Upload Failed', upload.message || 'Unable to upload portfolio image.');
          }
        } catch (error: any) {
          console.error('Portfolio upload error', error);
          Alert.alert('Upload Error', error?.message || 'Unable to upload image.');
        } finally {
          setPortfolioLoading(false);
        }
      },
    );
  };

  const handleRemovePortfolioImage = (index: number) => {
    const updated = profile.portfolio.filter((_, idx) => idx !== index);
    setProfile({ ...profile, portfolio: updated });
    if (!editing) {
      setEditing(true);
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

  const loadSubcategories = useCallback(async (category: string) => {
    if (!category) return;
    
    try {
      setLoadingSubcategories(true);
      console.log('[ProviderProfileManagementScreen] 🚀 Loading subcategories for category:', category);
      
      const response = await apiService.getPopularSubcategories(category, 30);
      
      if (response.success && response.data?.subcategories) {
        console.log('[ProviderProfileManagementScreen] ✅ Loaded subcategories:', response.data.subcategories.length);
        setAvailableSubcategories(response.data.subcategories);
              } else {
        console.warn('[ProviderProfileManagementScreen] ⚠️ No subcategories found');
        setAvailableSubcategories([]);
              }
            } catch (error: any) {
      console.error('[ProviderProfileManagementScreen] ❌ Error loading subcategories:', error);
      setAvailableSubcategories([]);
            } finally {
      setLoadingSubcategories(false);
    }
  }, []);

  const handleCategorySelect = useCallback(async (categoryValue: string) => {
    // Update category
    setProfile(prev => ({ ...prev, category: categoryValue }));
    
    // Load and show subcategories
    setSelectedCategoryForSubcat(categoryValue);
    await loadSubcategories(categoryValue);
    setShowSubcategoryModal(true);
  }, [loadSubcategories]);

  const handleSubcategoryToggle = (subcategory: string) => {
    const normalized = subcategory.toLowerCase().trim();
    if (profile.subcategories.includes(normalized)) {
      // Remove if already selected
      setProfile({ ...profile, subcategories: profile.subcategories.filter((item) => item !== normalized) });
      } else {
      // Add if not selected
      setProfile({ ...profile, subcategories: [...profile.subcategories, normalized] });
    }
    if (!editing) {
      setEditing(true);
    }
  };

  const handleCloseSubcategoryModal = () => {
    setShowSubcategoryModal(false);
    setAvailableSubcategories([]);
    setSelectedCategoryForSubcat('');
  };

  const selectedCategoryLabel = useMemo(() => {
    return categories.find((cat) => cat.value === profile.category)?.label || 'Select a category';
  }, [categories, profile.category]);

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

      {loading && !refreshing ? (
        <ProfileSkeletonLoader />
      ) : (
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
              Alert.alert(
                'Select Category',
                'Choose the primary category that best describes your business.',
                [
                  ...categories.map((category) => ({
                    text: category.label,
                    onPress: () => handleCategorySelect(category.value),
                  })),
                  { text: 'Cancel', style: 'cancel' as const },
                ],
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
              <Text style={styles.sectionHint}>{profile.portfolio.length}/{MAX_PORTFOLIO}</Text>
          </View>

          <View style={styles.portfolioGrid}>
            {profile.portfolio.map((url, index) => (
              <View key={`${url}-${index}`} style={styles.portfolioItem}>
                <Image source={{ uri: url }} style={styles.portfolioImage} />
                {editing && (
              <TouchableOpacity
                    style={styles.portfolioRemove}
                    onPress={() => handleRemovePortfolioImage(index)}
                  >
                    <Trash2 size={16} color="#fff" />
              </TouchableOpacity>
                )}
              </View>
            ))}
            {editing && profile.portfolio.length < MAX_PORTFOLIO && (
              <TouchableOpacity
                style={styles.portfolioAdd}
                onPress={handleAddPortfolioImage}
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
      )}

      {/* Subcategory Selection Modal */}
      <Modal
        visible={showSubcategoryModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSubcategoryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subcategories</Text>
              <TouchableOpacity onPress={handleCloseSubcategoryModal} style={styles.modalCloseButton}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose the services you offer. You can add custom ones later.
            </Text>

            {loadingSubcategories ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#ec4899" />
                <Text style={styles.modalLoadingText}>Loading subcategories...</Text>
              </View>
            ) : availableSubcategories.length > 0 ? (
              <FlatList
                data={availableSubcategories}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => {
                  const isSelected = profile.subcategories.includes(item.toLowerCase().trim());
                    return (
                          <TouchableOpacity
                      style={[
                        styles.subcategoryItem,
                        isSelected && styles.subcategoryItemSelected,
                      ]}
                      onPress={() => handleSubcategoryToggle(item)}
                    >
                      <Text
                        style={[
                          styles.subcategoryItemText,
                          isSelected && styles.subcategoryItemTextSelected,
                        ]}
                      >
                        {item.replace(/_/g, ' ')}
                      </Text>
                      {isSelected && <CheckCircle size={20} color="#ec4899" />}
                          </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.modalListContent}
                showsVerticalScrollIndicator={true}
              />
            ) : (
              <View style={styles.modalEmptyContainer}>
                <Text style={styles.modalEmptyText}>
                  No popular subcategories found for this category.
                </Text>
                <Text style={styles.modalEmptySubtext}>
                  You can add custom subcategories using the input field below.
                </Text>
                </View>
              )}

                <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={handleCloseSubcategoryModal}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
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
  // Skeleton Loader Styles
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineTitle: {
    width: '70%',
    height: 22,
    marginBottom: 6,
  },
  skeletonLineSubtitle: {
    width: '50%',
    height: 14,
    marginBottom: 0,
  },
  skeletonLineDetail1: {
    width: '85%',
    height: 14,
  },
  skeletonLineDetail2: {
    width: '70%',
    height: 14,
    marginBottom: 0,
  },
  skeletonButtonSmall: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    width: 80,
    height: 36,
  },
  skeletonBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    width: 120,
    height: 28,
  },
  skeletonInputGroup: {
    marginBottom: 16,
  },
  skeletonLabel: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    width: '40%',
    height: 14,
    marginBottom: 8,
  },
  skeletonInput: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    height: 48,
    width: '100%',
  },
  skeletonTextArea: {
    height: 110,
  },
  skeletonSelectInput: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    height: 48,
    width: '100%',
    marginBottom: 16,
  },
  skeletonSubcategoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skeletonSubcategoryInput: {
    flex: 1,
  },
  skeletonChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    width: 100,
    height: 32,
  },
  skeletonPortfolioItem: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    width: '30%',
    aspectRatio: 1,
  },
  skeletonLineWithMargin: {
    marginBottom: 16,
  },
  skeletonContentFlex: {
    flex: 1,
  },
  bottomSpacer: {
    height: 60,
  },
  // Modal Styles
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
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subcategoryItemSelected: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
  },
  subcategoryItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  subcategoryItemTextSelected: {
    color: '#ec4899',
    fontWeight: '600',
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  modalEmptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalDoneButton: {
    backgroundColor: '#ec4899',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProviderProfileManagementScreen;
