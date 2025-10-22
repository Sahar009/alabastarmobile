import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, ArrowLeft, Check } from 'lucide-react-native';

const { height, width } = Dimensions.get('window');

interface LocationSelectionScreenProps {
  onLocationSelect: (location: string) => void;
  onBack: () => void;
  selectedCategory: string;
}

const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({ 
  onLocationSelect, 
  onBack, 
  selectedCategory 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const locations = [
    { id: 'lagos', name: 'Lagos', state: 'Lagos State', population: '15.4M' },
    { id: 'abuja', name: 'Abuja', state: 'FCT', population: '3.6M' },
    { id: 'kano', name: 'Kano', state: 'Kano State', population: '4.3M' },
    { id: 'ibadan', name: 'Ibadan', state: 'Oyo State', population: '3.6M' },
    { id: 'port-harcourt', name: 'Port Harcourt', state: 'Rivers State', population: '1.9M' },
    { id: 'benin', name: 'Benin City', state: 'Edo State', population: '1.5M' },
    { id: 'kaduna', name: 'Kaduna', state: 'Kaduna State', population: '1.6M' },
    { id: 'maiduguri', name: 'Maiduguri', state: 'Borno State', population: '1.1M' },
    { id: 'zaria', name: 'Zaria', state: 'Kaduna State', population: '1.0M' },
    { id: 'aba', name: 'Aba', state: 'Abia State', population: '1.0M' },
    { id: 'jos', name: 'Jos', state: 'Plateau State', population: '0.9M' },
    { id: 'ilorin', name: 'Ilorin', state: 'Kwara State', population: '0.9M' },
  ];

  const popularLocations = locations.slice(0, 6);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationPress = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      const location = locations.find(loc => loc.id === selectedLocation);
      onLocationSelect(location?.name || selectedLocation);
    }
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
          <Text style={styles.headerTitle}>Select Location</Text>
          <Text style={styles.headerSubtitle}>
            Find {getCategoryDisplayName(selectedCategory)} providers near you
          </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Popular Locations */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Cities</Text>
            <View style={styles.popularGrid}>
              {popularLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.popularCard,
                    selectedLocation === location.id && styles.popularCardSelected
                  ]}
                  onPress={() => handleLocationPress(location.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.popularCardContent}>
                    <View style={styles.popularCardHeader}>
                      <MapPin size={16} color={selectedLocation === location.id ? "#ec4899" : "#64748b"} />
                      <Text style={[
                        styles.popularCardName,
                        selectedLocation === location.id && styles.popularCardNameSelected
                      ]}>
                        {location.name}
                      </Text>
                    </View>
                    <Text style={[
                      styles.popularCardState,
                      selectedLocation === location.id && styles.popularCardStateSelected
                    ]}>
                      {location.state}
                    </Text>
                    <Text style={[
                      styles.popularCardPopulation,
                      selectedLocation === location.id && styles.popularCardPopulationSelected
                    ]}>
                      {location.population} people
                    </Text>
                  </View>
                  {selectedLocation === location.id && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* All Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'All Cities'}
          </Text>
          <View style={styles.locationsList}>
            {filteredLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationCard,
                  selectedLocation === location.id && styles.locationCardSelected
                ]}
                onPress={() => handleLocationPress(location.id)}
                activeOpacity={0.8}
              >
                <View style={styles.locationCardContent}>
                  <View style={styles.locationCardHeader}>
                    <MapPin size={20} color={selectedLocation === location.id ? "#ec4899" : "#64748b"} />
                    <View style={styles.locationInfo}>
                      <Text style={[
                        styles.locationName,
                        selectedLocation === location.id && styles.locationNameSelected
                      ]}>
                        {location.name}
                      </Text>
                      <Text style={[
                        styles.locationState,
                        selectedLocation === location.id && styles.locationStateSelected
                      ]}>
                        {location.state}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.locationPopulation,
                    selectedLocation === location.id && styles.locationPopulationSelected
                  ]}>
                    {location.population}
                  </Text>
                </View>
                {selectedLocation === location.id && (
                  <View style={styles.checkIcon}>
                    <Check size={20} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confirm Button */}
        {selectedLocation && (
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirmLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>
              Continue with {locations.find(loc => loc.id === selectedLocation)?.name}
            </Text>
          </TouchableOpacity>
        )}
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
  searchContainer: {
    marginBottom: 30,
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
  locationsList: {
    gap: 12,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  locationNameSelected: {
    color: '#ec4899',
  },
  locationState: {
    fontSize: 14,
    color: '#64748b',
  },
  locationStateSelected: {
    color: '#ec4899',
  },
  locationPopulation: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  locationPopulationSelected: {
    color: '#ec4899',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  confirmButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default LocationSelectionScreen;
