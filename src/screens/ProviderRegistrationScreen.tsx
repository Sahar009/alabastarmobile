import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Key,
  Mail,
  MapPin,
  Phone,
  Tag,
  Upload,
  User,
  FileText,
  Camera,
  Award,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import { apiService, API_BASE_URL } from '../services/api';
import { providerOnboardingService } from '../services/providerOnboardingService';
import LocationSelectionScreen from './LocationSelectionScreen';

interface ProviderRegistrationScreenProps {
  onCancel: () => void;
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface CategoryOption {
  value: string;
  label: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  benefits?: string[];
}

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  remoteUrl?: string;
}

const ProviderRegistrationScreen: React.FC<ProviderRegistrationScreenProps> = ({ onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [isUploadingBrandImages, setIsUploadingBrandImages] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    alternativePhone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    category: '',
    subcategories: [] as string[],
    bio: '',
    locationCity: '',
    locationState: '',
    latitude: '',
    longitude: '',
    subscriptionPlanId: '',
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [referralCodeInfo, setReferralCodeInfo] = useState<any>(null);
  const [validatingReferralCode, setValidatingReferralCode] = useState(false);

  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [brandImages, setBrandImages] = useState<UploadedFile[]>([]);

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [registrationFee, setRegistrationFee] = useState<number>(0);

  const subcategoryOptions = useMemo(() => ({
    plumbing: ['Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Toilet Repair', 'Faucet Installation'],
    electrical: ['Wiring', 'Outlet Installation', 'Light Fixtures', 'Circuit Breaker', 'Generator'],
    cleaning: ['House Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Window Cleaning', 'Carpet Cleaning'],
    moving: ['Local Moving', 'Long Distance', 'Packing', 'Furniture Assembly', 'Storage'],
    ac_repair: ['AC Installation', 'AC Repair', 'AC Maintenance', 'Duct Cleaning', 'Refrigerant'],
    carpentry: ['Furniture Repair', 'Cabinet Making', 'Door Installation', 'Window Installation', 'Deck Building'],
    painting: ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Staining', 'Touch-ups'],
    pest_control: ['Ant Control', 'Cockroach Control', 'Termite Control', 'Rodent Control', 'Flea Control'],
    laundry: ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Stain Removal', 'Alterations'],
    tiling: ['Floor Tiling', 'Wall Tiling', 'Bathroom Tiling', 'Kitchen Tiling', 'Mosaic Work'],
    cctv: ['CCTV Installation', 'CCTV Repair', 'Security Systems', 'Access Control', 'Monitoring'],
    gardening: ['Lawn Care', 'Tree Trimming', 'Landscaping', 'Garden Design', 'Plant Care'],
    appliance_repair: ['Refrigerator', 'Washing Machine', 'Dryer', 'Dishwasher', 'Microwave'],
    locksmith: ['Lock Installation', 'Lock Repair', 'Key Duplication', 'Safe Opening', 'Access Control'],
    carpet_cleaning: ['Steam Cleaning', 'Dry Cleaning', 'Stain Removal', 'Odor Treatment', 'Protection'],
  }), []);

  const getSuggestions = () => {
    const options = subcategoryOptions[formData.category] || [];
    if (!subcategoryInput.trim()) {
      return options.filter(opt => !formData.subcategories.includes(opt)).slice(0, 6);
    }
    const filtered = options.filter(opt =>
      opt.toLowerCase().includes(subcategoryInput.toLowerCase()) &&
      !formData.subcategories.includes(opt)
    );
    if (!filtered.includes(subcategoryInput.trim())) {
      return [subcategoryInput.trim(), ...filtered].slice(0, 6);
    }
    return filtered.slice(0, 6);
  };

  const handleInputChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addSubcategory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || formData.subcategories.includes(trimmed)) return;
    setFormData(prev => ({ ...prev, subcategories: [...prev.subcategories, trimmed] }));
    setSubcategoryInput('');
    setShowSuggestions(false);
  };

  const removeSubcategory = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter(item => item !== value),
    }));
  };

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`${API_BASE_URL}/categories/categories?limit=100`);
      const data = await response.json();
      if (data.success && data.data?.categories) {
        const mapped: CategoryOption[] = data.data.categories.map((category: any) => ({
          value: category.slug || category.name?.toLowerCase().replace(/\s+/g, '_'),
          label: category.name,
        }));
        setCategories(mapped);
      } else {
        throw new Error('Unable to fetch categories');
      }
    } catch (error) {
      setCategories([
        { value: 'plumbing', label: 'Plumbing' },
        { value: 'electrical', label: 'Electrical' },
        { value: 'cleaning', label: 'Cleaning' },
        { value: 'moving', label: 'Moving' },
        { value: 'ac_repair', label: 'AC Repair' },
        { value: 'carpentry', label: 'Carpentry' },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans/plans`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubscriptionPlans(data.data);
        if (data.data.length > 0) {
          const plan = data.data[0];
          setSelectedPlan(plan);
          setFormData(prev => ({ ...prev, subscriptionPlanId: plan.id }));
          setRegistrationFee(plan.price);
        }
      }
    } catch (error) {
      console.error('Error loading subscription plans', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSubscriptionPlans();
  }, [fetchCategories, fetchSubscriptionPlans]);

  useEffect(() => {
    if (selectedPlan) {
      setRegistrationFee(selectedPlan.price);
    }
  }, [selectedPlan]);

  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.trim().length < 4) {
      setReferralCodeValid(null);
      setReferralCodeInfo(null);
      return;
    }
    setValidatingReferralCode(true);
    try {
      const result = await providerOnboardingService.validateReferralCode(code.trim());
      setReferralCodeValid(true);
      setReferralCodeInfo(result.data);
    } catch (error) {
      setReferralCodeValid(false);
      setReferralCodeInfo(null);
    } finally {
      setValidatingReferralCode(false);
    }
  }, []);

  const handleLocationSelection = (location: string | any) => {
    let city = formData.locationCity;
    let state = formData.locationState;
    let latitude = formData.latitude;
    let longitude = formData.longitude;

    if (typeof location === 'string') {
      city = location;
    } else if (location) {
      city = location.city || location.locality || location.district || city;
      state = location.state || location.region || location.province || state;
      if (location.latitude !== undefined) {
        latitude = String(location.latitude);
      }
      if (location.longitude !== undefined) {
        longitude = String(location.longitude);
      }
      if (!city && typeof location.address === 'string') {
        city = location.address.split(',')[0]?.trim() || city;
      }
    }

    setFormData(prev => ({
      ...prev,
      locationCity: city || prev.locationCity,
      locationState: state || prev.locationState,
      latitude,
      longitude,
    }));

    setLocationModalVisible(false);
  };

  const uploadSelectedAssets = async (assets: ImagePicker.Asset[], isBrandImage: boolean) => {
    const validAssets = assets
      .filter(asset => asset.uri)
      .map(asset => ({
        uri: asset.uri!,
        name: asset.fileName || `upload-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      }));

    if (validAssets.length === 0) return;

    const setUploading = isBrandImage ? setIsUploadingBrandImages : setIsUploadingDocuments;
    setUploading(true);
    try {
      const token = await apiService.loadToken();
      if (!token) {
        Alert.alert('Hold on', 'Please complete the first step to create your provider account before uploading files.');
        return;
      }

      const form = new FormData();
      validAssets.forEach(asset => {
        form.append(isBrandImage ? 'brandImages' : 'documents', {
          uri: asset.uri,
          name: asset.name,
          type: asset.type,
        } as any);
      });

      const uploadFn = isBrandImage
        ? providerOnboardingService.uploadBrandImages
        : providerOnboardingService.uploadDocuments;
      const response = await uploadFn(form, token);
      const uploaded = response.files || [];

      const mapped: UploadedFile[] = validAssets.map((asset, idx) => ({
        uri: asset.uri,
        name: uploaded[idx]?.originalName || uploaded[idx]?.filename || asset.name,
        type: asset.type,
        remoteUrl: uploaded[idx]?.url,
      }));

      if (isBrandImage) {
        setBrandImages(prev => [...prev, ...mapped]);
      } else {
        setDocuments(prev => [...prev, ...mapped]);
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Unable to upload files right now. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImages = async (isBrandImage: boolean) => {
    const pickerResult = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
      includeBase64: false,
    });

    if (pickerResult.didCancel || !pickerResult.assets) return;
    await uploadSelectedAssets(pickerResult.assets, isBrandImage);
  };

  const removeFile = (index: number, isBrandImage: boolean) => {
    if (isBrandImage) {
      setBrandImages(prev => prev.filter((_, idx) => idx !== index));
    } else {
      setDocuments(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const validateStep = (step: Step) => {
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.businessName.trim() || !formData.email.trim() || !formData.password.trim()) {
        Alert.alert('Missing Information', 'Please complete all required personal details.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return false;
      }
    }

    if (step === 2) {
      if (!formData.category) {
        Alert.alert('Select Category', 'Please choose a service category.');
        return false;
      }
      const hasLocation = formData.locationCity || (formData.latitude && formData.longitude);
      if (!hasLocation) {
        Alert.alert('Set Location', 'Please choose your service location.');
        return false;
      }
    }

    if (step === 3) {
      if (documents.length === 0 || brandImages.length === 0) {
        Alert.alert('Uploads Required', 'Please upload both identification documents and brand images.');
        return false;
      }
      if (documents.some(doc => !doc.remoteUrl) || brandImages.some(img => !img.remoteUrl)) {
        Alert.alert('Upload Incomplete', 'Please wait for uploads to complete before proceeding.');
        return false;
      }
    }

    if (step === 4 && !selectedPlan) {
      Alert.alert('Select Plan', 'Choose a subscription plan before continuing.');
      return false;
    }

    return true;
  };

  const saveStep = async (step: Step) => {
    setIsSaving(true);
    try {
      if (step === 1) {
        const result = await providerOnboardingService.registerStep1({
          fullName: formData.fullName,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          alternativePhone: formData.alternativePhone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          referralCode: formData.referralCode,
        });

        if (result.data?.token) {
          await apiService.setToken(result.data.token);
        }
        if (result.data?.user) {
          await apiService.setUser(result.data.user);
        }
        return true;
      }

      const payload: Record<string, any> = {};
      if (step === 2) {
        payload.step2 = {
          category: formData.category,
          subcategories: formData.subcategories,
          bio: formData.bio,
          locationCity: formData.locationCity,
          locationState: formData.locationState,
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
      } else if (step === 3) {
        payload.step3 = {
          documents: documents.map(doc => ({ url: doc.remoteUrl, name: doc.name })),
          brandImages: brandImages.map(img => ({ url: img.remoteUrl, name: img.name })),
        };
      } else if (step === 4) {
        payload.step4 = {
          subscriptionPlanId: formData.subscriptionPlanId,
        };
      }

      await providerOnboardingService.saveProgress(step, payload);
      return true;
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Unable to save your progress. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const saved = await saveStep(currentStep);
    if (!saved) {
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(prev => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onCancel();
      return;
    }
    setCurrentStep(prev => Math.max(1, (prev - 1) as Step));
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Select Plan', 'Choose a subscription plan before proceeding to payment.');
      return;
    }

    // Validate required fields before payment
    if (!formData.fullName || !formData.email || !formData.businessName || !formData.category) {
      Alert.alert(
        'Missing Information',
        'Please complete all required fields:\n• Full Name\n• Email\n• Business Name\n• Category\n\nGo back to previous steps to fill missing information.'
      );
      return;
    }

    setIsInitializingPayment(true);
    try {
      const result = await providerOnboardingService.initializePayment(formData.subscriptionPlanId, {
        fullName: formData.fullName,
        email: formData.email,
        businessName: formData.businessName,
        category: formData.category,
      });
      const paymentInfo = result.data || result;

      if (paymentInfo?.reference) {
        try {
          await providerOnboardingService.saveProgress(5, {
            step5: { paymentReference: paymentInfo.reference },
          });
        } catch (error) {
          console.warn('Unable to store payment reference yet:', error);
        }
      }

      if (paymentInfo?.authorization_url) {
        const url = paymentInfo.authorization_url;
        await Linking.openURL(url).catch(() => {
          Alert.alert('Payment Link', 'Unable to open Paystack automatically. Copy and open this link in your browser:\n' + url);
        });

        Alert.alert(
          'Complete Payment',
          'After completing payment, tap "I have completed payment" to finish your registration.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'I have completed payment',
              onPress: onComplete,
            },
          ],
        );
      } else {
        Alert.alert('Payment', 'Payment initialized. Check your email for the checkout link.');
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'Unable to start payment. Please try again.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map(step => {
        const isCompleted = currentStep > step;
        const isActive = currentStep === step;
        return (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepCircle, isCompleted && styles.stepCircleCompleted, isActive && styles.stepCircleActive]}>
              {isCompleted ? <CheckCircle2 size={18} color="#ffffff" /> : <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{step}</Text>}
            </View>
            {step < 5 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
          </View>
        );
      })}
    </View>
  );

  const renderProgressLabel = () => {
    const labels: Record<Step, string> = {
      1: 'Personal Information',
      2: 'Service Details',
      3: 'Documents & Verification',
      4: 'Subscription Plan',
      5: 'Payment',
    };
    return (
      <View style={styles.progressLabelContainer}>
        <Text style={styles.progressLabelText}>Step {currentStep} of 5: {labels[currentStep]}</Text>
      </View>
    );
  };

  const renderStepOne = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself and your business.</Text>
      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <User size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={value => handleInputChange('fullName', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Business Name *</Text>
          <View style={styles.inputWrapper}>
            <Award size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your business name"
              value={formData.businessName}
              onChangeText={value => handleInputChange('businessName', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Phone size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="08123456789"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={value => handleInputChange('phone', value)}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Alternative Phone</Text>
          <View style={styles.inputWrapper}>
            <Phone size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Optional"
              keyboardType="phone-pad"
              value={formData.alternativePhone}
              onChangeText={value => handleInputChange('alternativePhone', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password *</Text>
          <View style={styles.inputWrapper}>
            <Key size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Create a password"
              secureTextEntry
              autoCapitalize="none"
              value={formData.password}
              onChangeText={value => handleInputChange('password', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password *</Text>
          <View style={styles.inputWrapper}>
            <Key size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
              value={formData.confirmPassword}
              onChangeText={value => handleInputChange('confirmPassword', value)}
            />
          </View>
        </View>

        <View style={styles.inputGroupFull}>
          <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Gift size={18} color="#ec4899" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter referral code if you have one"
              value={formData.referralCode}
              onChangeText={value => {
                handleInputChange('referralCode', value);
                validateReferralCode(value);
              }}
            />
            {validatingReferralCode && <ActivityIndicator size="small" color="#ec4899" />}
          </View>
          {referralCodeValid && referralCodeInfo && (
            <View style={styles.referralInfo}>
              <CheckCircle2 size={16} color="#10b981" />
              <Text style={styles.referralInfoText}>Referred by {referralCodeInfo.businessName}</Text>
            </View>
          )}
          {referralCodeValid === false && (
            <Text style={styles.referralInvalid}>Referral code is not valid.</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Service Details</Text>
      <Text style={styles.stepSubtitle}>Tell customers about the services you provide and where you operate.</Text>

      <View style={styles.inputGroupFull}>
        <Text style={styles.inputLabel}>Service Category *</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => {
            if (categories.length === 0) {
              Alert.alert('Categories', 'No categories available at the moment.');
              return;
            }
            Alert.alert(
              'Select Category',
              'Choose the category that best describes your services.',
              categories.map(option => ({
                text: option.label,
                onPress: () => handleInputChange('category', option.value),
              })).concat([{ text: 'Cancel', style: 'cancel' }]),
            );
          }}
        >
          <Text style={styles.selectorButtonText}>
            {formData.category ? categories.find(option => option.value === formData.category)?.label : 'Tap to choose a category'}
          </Text>
        </TouchableOpacity>
        {loadingCategories && <ActivityIndicator style={styles.inlineSpinner} size="small" color="#ec4899" />}
      </View>

      {formData.category ? (
        <View style={styles.inputGroupFull}>
          <Text style={styles.inputLabel}>Subcategories</Text>
          <View style={styles.subcategoryRow}>
            <TextInput
              style={styles.subcategoryInput}
              value={subcategoryInput}
              onChangeText={text => {
                setSubcategoryInput(text);
                setShowSuggestions(true);
              }}
              placeholder="Add a subcategory"
            />
            <TouchableOpacity style={styles.addChipButton} onPress={() => addSubcategory(subcategoryInput)}>
              <Text style={styles.addChipButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {showSuggestions && getSuggestions().length > 0 && (
            <View style={styles.suggestionsBox}>
              {getSuggestions().map(suggestion => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionItem}
                  onPress={() => addSubcategory(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.chipContainer}>
            {formData.subcategories.map(value => (
              <View key={value} style={styles.chip}>
                <Text style={styles.chipText}>{value}</Text>
                <TouchableOpacity onPress={() => removeSubcategory(value)}>
                  <X size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.inputGroupFull}>
        <Text style={styles.inputLabel}>Service Bio</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <FileText size={18} color="#ec4899" style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tell customers about your experience, specialties, and what makes you unique."
            multiline
            value={formData.bio}
            onChangeText={value => handleInputChange('bio', value)}
          />
        </View>
      </View>

      <View style={styles.inputGroupFull}>
        <Text style={styles.inputLabel}>Service Location *</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setLocationModalVisible(true)}>
          <Text style={styles.selectorButtonText}>
            {formData.locationCity && formData.locationState
              ? `${formData.locationCity}, ${formData.locationState}`
              : 'Tap to set your service location'}
          </Text>
        </TouchableOpacity>
        <View style={styles.inlineInputsRow}>
          <View style={[styles.inputWrapper, styles.inlineInput]}>
            <TextInput
              style={styles.textInput}
              placeholder="City"
              value={formData.locationCity}
              onChangeText={value => handleInputChange('locationCity', value)}
            />
          </View>
          <View style={[styles.inputWrapper, styles.inlineInput]}>
            <TextInput
              style={styles.textInput}
              placeholder="State"
              value={formData.locationState}
              onChangeText={value => handleInputChange('locationState', value)}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderStepThree = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Documents & Verification</Text>
      <Text style={styles.stepSubtitle}>Upload valid identification and brand images to help us verify your business.</Text>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Identification Documents *</Text>
        <Text style={styles.uploadHint}>Accepted documents: NIN, Driver's License, or International Passport.</Text>
        <TouchableOpacity
          style={[styles.uploadButton, isUploadingDocuments && styles.uploadButtonDisabled]}
          onPress={() => pickImages(false)}
          disabled={isUploadingDocuments}
        >
          <Upload size={18} color="#ec4899" />
          <Text style={styles.uploadButtonText}>
            {isUploadingDocuments ? 'Uploading...' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
        <View style={styles.fileList}>
          {documents.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.fileItem}>
              <FileText size={18} color="#ec4899" />
              <Text style={styles.fileName}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeFile(index, false)}>
                <X size={16} color="#ec4899" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Brand Images *</Text>
        <Text style={styles.uploadHint}>Upload at least two photos of your work, tools, or business space.</Text>
        <TouchableOpacity
          style={[styles.uploadButton, isUploadingBrandImages && styles.uploadButtonDisabled]}
          onPress={() => pickImages(true)}
          disabled={isUploadingBrandImages}
        >
          <Camera size={18} color="#ec4899" />
          <Text style={styles.uploadButtonText}>
            {isUploadingBrandImages ? 'Uploading...' : 'Upload Brand Image'}
          </Text>
        </TouchableOpacity>
        <View style={styles.brandGrid}>
          {brandImages.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.brandItem}>
              <Image source={{ uri: file.uri }} style={styles.brandPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeBadge} onPress={() => removeFile(index, true)}>
                <X size={12} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStepFour = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Subscription Plan</Text>
      <Text style={styles.stepSubtitle}>Choose an Alabastar plan that matches your business goals.</Text>

      {subscriptionPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#ec4899" />
          <Text style={styles.emptyStateText}>Loading plans...</Text>
        </View>
      ) : (
        subscriptionPlans.map(plan => {
          const isSelected = selectedPlan?.id === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => {
                setSelectedPlan(plan);
                handleInputChange('subscriptionPlanId', plan.id);
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {isSelected && <CheckCircle2 size={18} color="#22c55e" />}
              </View>
              <Text style={styles.planPrice}>
                ₦{new Intl.NumberFormat('en-NG').format(plan.price)} / {plan.interval}
              </Text>
              {plan.benefits && plan.benefits.length > 0 && (
                <View style={styles.planBenefits}>
                  {plan.benefits.map((benefit, idx) => (
                    <Text key={`${plan.id}-benefit-${idx}`} style={styles.planBenefitText}>• {benefit}</Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderStepFive = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Review & Payment</Text>
      <Text style={styles.stepSubtitle}>Confirm your selections and proceed to secure payment.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Subscription Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Selected Plan</Text>
          <Text style={styles.summaryValue}>{selectedPlan?.name || 'Not selected'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Billing Interval</Text>
          <Text style={styles.summaryValue}>{selectedPlan?.interval || '-'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount Payable</Text>
          <Text style={styles.summaryValue}>₦{new Intl.NumberFormat('en-NG').format(registrationFee)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isInitializingPayment && styles.primaryButtonDisabled]}
        onPress={handlePayment}
        disabled={isInitializingPayment}
      >
        <Text style={styles.primaryButtonText}>
          {isInitializingPayment ? 'Initializing payment…' : 'Proceed to Payment'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      case 4:
        return renderStepFour();
      case 5:
      default:
        return renderStepFive();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={18} color="#0f172a" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepIndicator()}
          {renderProgressLabel()}
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footerBar}>
          <TouchableOpacity
            style={[styles.secondaryButton, currentStep === 1 && styles.secondaryButtonDisabled]}
            onPress={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={16} color={currentStep === 1 ? '#94a3b8' : '#ec4899'} />
            <Text style={[styles.secondaryButtonText, currentStep === 1 && styles.secondaryButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          {currentStep < 5 ? (
            <TouchableOpacity
              style={[styles.primaryButton, (isSaving || (currentStep === 3 && isUploadingBrandImages) || (currentStep === 3 && isUploadingDocuments)) && styles.primaryButtonDisabled]}
              onPress={handleNext}
              disabled={isSaving || (currentStep === 3 && (isUploadingBrandImages || isUploadingDocuments))}
            >
              <Text style={styles.primaryButtonText}>{isSaving ? 'Saving…' : 'Next'}</Text>
              {!isSaving && <ArrowRight size={18} color="#ffffff" />}
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={locationModalVisible} animationType="slide">
        <LocationSelectionScreen
          onLocationSelect={handleLocationSelection}
          onBack={() => setLocationModalVisible(false)}
          selectedCategory={formData.category || ''}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  stepCircleActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  stepCircleCompleted: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ec4899',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 28,
    height: 2,
    marginHorizontal: 6,
    backgroundColor: '#fbcfe8',
  },
  stepLineActive: {
    backgroundColor: '#ec4899',
  },
  progressLabelContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGrid: {
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupFull: {
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 10,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorButtonText: {
    fontSize: 15,
    color: '#0f172a',
  },
  inlineSpinner: {
    marginTop: 8,
  },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subcategoryInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addChipButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addChipButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  suggestionsBox: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#0f172a',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  chipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inlineInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  inlineInput: {
    flex: 1,
  },
  uploadSection: {
    marginTop: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  uploadHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontWeight: '600',
    color: '#ec4899',
  },
  fileList: {
    marginTop: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  fileName: {
    flex: 1,
    marginHorizontal: 12,
    color: '#0f172a',
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  brandItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  brandPreview: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    marginTop: 8,
    color: '#64748b',
  },
  planCard: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  planCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
  },
  planBenefits: {
    gap: 4,
  },
  planBenefitText: {
    fontSize: 13,
    color: '#475569',
  },
  summaryCard: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#64748b',
  },
  summaryValue: {
    fontWeight: '600',
    color: '#0f172a',
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f9a8d4',
    backgroundColor: '#fff7fb',
  },
  secondaryButtonDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  secondaryButtonText: {
    fontWeight: '600',
    color: '#ec4899',
  },
  secondaryButtonTextDisabled: {
    color: '#94a3b8',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    flex: 1,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  referralInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
  },
  referralInfoText: {
    color: '#0f172a',
    fontSize: 13,
  },
  referralInvalid: {
    marginTop: 6,
    fontSize: 13,
    color: '#ef4444',
  },
});

export default ProviderRegistrationScreen;
