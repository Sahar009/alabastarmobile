import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, ArrowLeft } from 'lucide-react-native';
import Geolocation from '@react-native-community/geolocation';

const { height, width } = Dimensions.get('window');

interface LocationData {
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  streetNumber?: string;
  streetName?: string;
  postalCode?: string;
  country?: string;
  district?: string;
  locality?: string;
}

interface LocationSelectionScreenProps {
  onLocationSelect: (location: string | LocationData) => void;
  onBack: () => void;
  selectedCategory: string;
}

const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({ 
  onLocationSelect, 
  onBack, 
  selectedCategory 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<Array<{ label: string; city?: string; state?: string; lat?: number; lon?: number }>>([]);
  const [_isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // All Lagos locations - Comprehensive list
  const lagosAreas = [
    // Island Areas
    'Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Lekki Phase 2', 'Lekki Phase 3',
    'Ajah', 'Lagos Island', 'Lagos Mainland', 'Banana Island', 'Chevron',
    'Osapa London', 'Chisco', 'Osapa', 'Osapa Lekki', 'Abraham Adesanya',
    'Jakande', 'Sangotedo', 'Awoyaya', 'Abijo', 'Lakowe', 'Elegushi',
    'Marina', 'Onikan', 'Tarkwa Bay', 'CMS', 'Broad Street',
    'Obalende', 'Ikeja City Mall', 'Ikeja GRA', 'Allen Avenue', 'Adeniyi Jones',
    
    // Mainland Central
    'Ikeja', 'Oregun', 'Alausa', 'Maryland', 'Ilupeju', 'Palmgrove',
    'Gbagada', 'Gbagada Phase 1', 'Gbagada Phase 2', 'Anthony', 'Mushin',
    'Yaba', 'Surulere', 'Oshodi', 'Isolo', 'Bariga', 'Magodo',
    'Magodo Phase 1', 'Magodo Phase 2', 'Omole', 'Ogba', 'Agege',
    'Ifako-Ijaiye', 'Ketu', 'Alapere', 'Ijaiye', 'Abule Egba',
    'Anthony Village', 'Ojodu', 'Berger', 'Papa Ajao', 'Ojuelegba',
    'Lawanson', 'Idi-Araba', 'Ladipo', 'Oshodi-Isolo', 'Ejigbo',
    'Ikotun', 'Ajao Estate', 'Ajao', 'Mafoluku', 'Okota',
    'Ilasamaja', 'Shasha', 'Akowonjo', 'Egbeda', 'Ipaja',
    'Shangisha', 'Ikosi', 'Ketu-Ojota', 'Oworonshoki', 'Kosofe',
    
    // Ikorodu and surrounding areas
    'Ikorodu', 'Ikorodu West', 'Ikorodu Central', 'Ikorodu East',
    'Agric', 'Agbowa', 'Aiyetoro', 'Bayeku', 'Ebute', 'Ejinrin',
    'Epe', 'Igbogbo', 'Igbokoda', 'Ijebu-Ode Road', 'Imota',
    'Ipakodo', 'Isiwu', 'Ita-Oluwo', 'Itoikin', 'Kosofe',
    'Ladega', 'Lakowe', 'Majidun', 'Maya', 'Odogunyan',
    'Ofada', 'Oke-Eletu', 'Oko-Agbon', 'Oreta', 'Owode',
    'Owutu', 'Palmgroove', 'Sagamu Road', 'Tos Benson',
    'Ibeshe', 'Odongunyan', 'Agura', 'Adamo', 'Ajegunle Ikorodu',
    'Odogunyan', 'Parafa', 'Igbogbo-Baiyeku', 'Ijede', 'Isiwu',
    
    // Lagos East
    'Ikotun', 'Idimu', 'Igando', 'Ikotun-Egbe', 'Isheri',
    'Ijegun', 'Lakowe', 'Sangotedo', 'Awoyaya', 'Abijo',
    'Ibeju-Lekki', 'Eti-Osa', 'Elegushi', 'Jakande',
    'Abraham Adesanya', 'Ajah', 'Badore', 'Ikota', 'Victoria Garden City',
    'Lekki', 'Osapa', 'Chevron Drive', 'Admiralty Way',
    
    // Lagos West
    'Amuwo-Odofin', 'Festac Town', 'Satellite Town', 'Okokomaiko',
    'Agboju', 'Trade Fair', 'Ijanikin', 'Badagry', 'Ojo',
    'Alaba International', 'Alaba Rago', 'Maza-Maza', 'Iba',
    'Agbara', 'Atan', 'Apa', 'Iworo', 'Ajido',
    'Akodo', 'Akpakpa', 'Aradagun', 'Araromi', 'Asero',
    'Badagry', 'Dosumu', 'Egan', 'Ekure', 'Ewu',
    'Gberefu', 'Ginti', 'Ibiye', 'Ibode', 'Idale',
    'Ijanikin', 'Ikoga', 'Ikoga-Zebbe', 'Ilado', 'Imeke',
    'Kankon', 'Kemta', 'Kpankpa', 'Kwa Afolabi', 'Maforo',
    'Mahinmi', 'Mowo', 'Oke-Agbede', 'Oko-Afo', 'Okokomaiko',
    'Oluti', 'Oru', 'Ovomoyan', 'Owode', 'Popo-Oja',
    'Posukoh', 'Seme', 'Sunren', 'Toga', 'Topo',
    'Topolawa', 'Vespa', 'Whla', 'Yeketome', 'Yovoyan',
    
    // Lagos North
    'Alimosho', 'Egbeda', 'Idimu', 'Ipaja', 'Ayobo', 'Command',
    'Alagbado', 'Iju', 'Ijoko', 'Akute', 'Akowonjo', 'Egbe',
    'Ijaiye', 'Abule Egba', 'Meiran', 'Abesan', 'Adeniyi Jones',
    'Agege Motor Road', 'Agidingbi', 'Aguda', 'Ajegunle', 'Akute',
    'Alagbado', 'Alasia', 'Baruwa', 'Ifako', 'Ijaiye-Ojokoro',
    'Isheri', 'Ladipo', 'Moshalashi', 'New Oko Oba', 'Obawole',
    'Old Oko Oba', 'Onipetesi', 'Oregun', 'Orile-Agege', 'Sanya',
    'Tolu', 'Wesley', 'Abule Taylor', 'Alausa', 'Ikeja Airport',
    
    // Apapa and Port Areas
    'Apapa', 'Apapa GRA', 'Ijora', 'Iganmu', 'Coker-Aguda',
    'Itire', 'KiriKiri', 'Mile 2', 'Orile', 'Olodi-Apapa',
    'Alaba', 'Alaba International', 'Alaba Rago',
    
    // Island Extensions
    'Tarkwa Bay', 'CMS', 'Broad Street', 'Marina', 'Onikan',
    'Lagos Island', 'Idumota', 'Oshodi', 'Obalende', 'Ebute Metta',
    'Yaba', 'Surulere', 'Ijesha', 'Itire', 'Lawanson',
    'Ojuelegba', 'Shitta', 'Stadium', 'Toyin', 'Aguda',
    'Coker', 'Igbobi', 'Oshodi-Isolo', 'Ajao', 'Isolo',
    'Mafoluku', 'Oke-Afa', 'Okota', 'Ikotun', 'Ejigbo',
    'Shasha', 'Idimu', 'Ikotun-Egbe', 'Igando', 'Ijegun',
    
    // Other Major Areas
    'Palmgroove', 'Somolu', 'Bariga', 'Akoka', 'Fadeyi',
    'Ilupeju', 'Palmgrove', 'Ilupeju Bypass', 'Anthony', 'Ikeja',
    'Oregun', 'Alausa', 'Adeniyi Jones', 'Obafemi Awolowo Way',
    'Kudirat Abiola Way', 'Opebi', 'Allen', 'Ajao', 'Mafoluku',
    'Ajao Estate', 'Airport Road', 'Ikeja Airport', 'Oshodi',
    'Oshodi-Isolo', 'Isolo', 'Okota', 'Ejigbo', 'Ikotun',
    'Ikotun-Egbe', 'Igando', 'Ijegun', 'Shasha', 'Akowonjo',
    'Egbeda', 'Idimu', 'Ipaja', 'Ayobo', 'Command',
    'Alagbado', 'Iju', 'Ijoko', 'Akute', 'Meiran',
    'Abesan', 'Agbado', 'Ijaiye', 'Abule Egba', 'Bariga',
    'Somolu', 'Kosofe', 'Ifako', 'Ijaiye-Ojokoro', 'Ojodu',
    'Berger', 'Mile 12', 'Ketu', 'Alapere', 'Iju-Ishaga',
    'Ogudu', 'Ojota', 'Magodo Phase 1', 'Magodo Phase 2',
    'Shangisha', 'Ikosi', 'Ketu-Ojota', 'Oworonshoki', 'Kosofe',
    'Anthony Village', 'Gbagada', 'Anthony', 'Mushin', 'Yaba',
    'Surulere', 'Ijesha', 'Itire', 'Lawanson', 'Ojuelegba',
    'Shitta', 'Stadium', 'Toyin', 'Aguda', 'Coker',
    'Igbobi', 'Idi-Araba', 'Ladipo', 'Papa Ajao',
    
    // Additional Ikorodu areas
    'Ebute', 'Ebute Ikorodu', 'Ibeshe', 'Igbogbo', 'Igbogbo-Baiyeku',
    'Ijede', 'Isiwu', 'Majidun', 'Odogunyan', 'Oreta',
    'Owutu', 'Parafa', 'Tos Benson', 'Bayeku', 'Adamo',
    'Agura', 'Ajegunle Ikorodu', 'Ejinrin', 'Imota', 'Ipakodo',
    'Ita-Oluwo', 'Ladega', 'Maya', 'Odo-Nla', 'Oke-Eletu',
    'Oko-Agbon', 'Owode Ikorodu'
  ].filter((value, index, self) => self.indexOf(value) === index).sort(); // Remove duplicates and sort alphabetically

  const filteredLocations = lagosAreas
    .filter(area => area.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 20); // Show up to 20 results

  // Debounced remote suggestions using OpenStreetMap Nominatim (no API key)
  useEffect(() => {
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (!q) {
      setRemoteSuggestions([]);
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ng&q=${encodeURIComponent(q)}&limit=8`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        const data: any[] = await res.json();
        const mapped = data.map((item) => {
          const address = item.address || {};
          const city = address.city || address.town || address.village || address.suburb || address.state_district || '';
          const state = address.state || '';
          return {
            label: item.display_name as string,
            city,
            state,
            lat: item.lat ? parseFloat(item.lat) : undefined,
            lon: item.lon ? parseFloat(item.lon) : undefined,
          };
        });
        setRemoteSuggestions(mapped);
      } catch {
        // Network issues; keep local fallback
        setRemoteSuggestions([]);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Alabastar needs access to your location to find nearby services',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS permissions are handled by Info.plist
  };

  const detectLocation = async () => {
    setIsDetecting(true);
    
    // Request permission first
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to find services near you',
        [{ text: 'OK' }]
      );
      setIsDetecting(false);
      setDetectedLocation('Lagos');
      // Set default location data
      setLocationData({
        address: 'Lagos, Nigeria',
        city: 'Lagos',
        state: 'Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        streetNumber: '',
        streetName: '',
        postalCode: '',
        country: 'Nigeria',
        district: '',
        locality: ''
      });
      return;
    }
    
    // Use @react-native-community/geolocation
    Geolocation.getCurrentPosition(
      async (position: any) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use free reverse geocoding API - same as frontend
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          // Build comprehensive address like frontend
          const addressParts = [];
          if (data.streetNumber) addressParts.push(data.streetNumber);
          if (data.streetName) addressParts.push(data.streetName);
          if (data.locality) addressParts.push(data.locality);
          if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
          if (data.countryName) addressParts.push(data.countryName);
          
          const fullAddress = addressParts.join(', ') || 
            `${data.locality || data.city || 'Unknown'}, ${data.principalSubdivision || data.state || 'Unknown'}, ${data.countryName || 'Nigeria'}`;
          
          // Create comprehensive location data
          const locData: LocationData = {
            address: fullAddress,
            city: data.locality || data.city || 'Unknown City',
            state: data.principalSubdivision || data.state || 'Unknown State',
            latitude,
            longitude,
            streetNumber: data.streetNumber || '',
            streetName: data.streetName || '',
            postalCode: data.postcode || '',
            country: data.countryName || 'Nigeria',
            district: data.locality || data.district || '',
            locality: data.locality || data.city || ''
          };
          
          setLocationData(locData);
          
          // Set detected location for display
          const city = data.locality || data.city || data.principalSubdivision;
          if (city?.toLowerCase().includes('lagos')) {
            const district = data.locality || data.district || 'Lagos';
            setDetectedLocation(district);
          } else {
            setDetectedLocation('Lagos');
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Fallback location data
          setLocationData({
            address: 'Current Location',
            city: 'Lagos',
            state: 'Lagos',
            latitude: 6.5244,
            longitude: 3.3792,
            streetNumber: '',
            streetName: '',
            postalCode: '',
            country: 'Nigeria',
            district: '',
            locality: ''
          });
          setDetectedLocation('Lagos');
        } finally {
          setIsDetecting(false);
        }
      },
      (error: any) => {
        console.error('Geolocation error:', error);
        // Set default Lagos location
        setLocationData({
          address: 'Lagos, Nigeria',
          city: 'Lagos',
          state: 'Lagos',
          latitude: 6.5244,
          longitude: 3.3792,
          streetNumber: '',
          streetName: '',
          postalCode: '',
          country: 'Nigeria',
          district: '',
          locality: ''
        });
        setDetectedLocation('Lagos');
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };


  // Kept for parity with previous flow; will be used when auto-detect UI returns
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleConfirmDetected = () => {
    if (locationData) {
      const locationString = locationData.district || locationData.locality || locationData.city || detectedLocation || 'Lagos';
      onLocationSelect(locationString);
    } else if (detectedLocation) {
      onLocationSelect(detectedLocation);
    }
  };

  const handleSearchSelect = (location: string) => {
    // When user manually selects from the list, pass as string
    onLocationSelect(location);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    const categoryNames: { [key: string]: string } = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      cleaning: 'Cleaning',
      moving: 'Moving',
      ac_repair: 'AC Repair',
      carpentry: 'Carpentry',
      painting: 'Painting',
      pest_control: 'Pest Control',
      laundry: 'Laundry',
      tiling: 'Tiling',
      cctv: 'CCTV',
      gardening: 'Gardening',
      appliance_repair: 'Appliance Repair',
      locksmith: 'Locksmith',
      carpet_cleaning: 'Carpet Cleaning',
      cooking: 'Cooking',
    };
    return categoryNames[categoryId] || 'Service';
  };

  // Renders location text with the typed part highlighted
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <Text style={styles.suggestionText}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <Text style={styles.suggestionText}>{text}</Text>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <Text style={styles.suggestionText}>
        {before}
        <Text style={styles.matchHighlight}>{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Location</Text>
          <Text style={styles.headerSubtitle}>
            {getCategoryDisplayName(selectedCategory)} services/Businesses in Lagos
          </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Auto-detect Section */}
    

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchSectionTitle}>
            {searchQuery ? 'Search Results' : 'Popular Areas in Lagos'}
          </Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search areas in Lagos..."
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); setShowSuggestions(!!t); }}
                onFocus={() => setShowSuggestions(!!searchQuery)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {showSuggestions && (remoteSuggestions.length > 0 || filteredLocations.length > 0) && (
              <View style={styles.suggestionsCard}>
                {(remoteSuggestions.length > 0 ? remoteSuggestions.map(s => s.label) : filteredLocations).map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={styles.suggestionItem}
                    onPress={() => handleSearchSelect(location)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      <MapPin size={16} color="#ec4899" />
                    </View>
                    <Text style={styles.suggestionText}>
                      {highlightMatch(location, searchQuery)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Search Results */}
          {!showSuggestions && filteredLocations.length > 0 ? (
            <View style={styles.locationsList}>
              {filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={styles.locationCard}
                  onPress={() => handleSearchSelect(location)}
                  activeOpacity={0.7}
                >
                  <MapPin size={20} color="#64748b" />
                  <Text style={styles.locationName}>{location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : !showSuggestions && searchQuery ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No areas found</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fdf2f8',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#ec4899',
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#f97316',
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#ec4899',
    top: height * 0.3,
    right: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  // New styles for auto-detect
  autoDetectSection: {
    marginBottom: 24,
  },
  detectingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  detectingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  detectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  detectedLocationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detectedLocationInfo: {
    flex: 1,
  },
  detectedLabel: {
    fontSize: 13,
    color: '#ec4899',
    fontWeight: '600',
    marginBottom: 4,
  },
  detectedLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  detectedSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  useLocationButton: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  useLocationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 12,
  },
  detectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ec4899',
  },
  searchSection: {
    flex: 1,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  locationsList: {
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationName: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearText: {
    color: '#ec4899',
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionsCard: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 6,
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: '#0f172a',
  },
  matchHighlight: {
    color: '#ec4899',
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  popularCardContent: {
    flex: 1,
  },
  popularCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 8,
  },
  popularCardNameSelected: {
    color: '#ec4899',
  },
  popularCardState: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  popularCardStateSelected: {
    color: '#ec4899',
  },
  popularCardPopulation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  popularCardPopulationSelected: {
    color: '#ec4899',
  },
});

export default LocationSelectionScreen;

