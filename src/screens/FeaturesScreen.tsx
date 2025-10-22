import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Star, CheckCircle, DollarSign } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface FeaturesScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

const FeaturesScreen: React.FC<FeaturesScreenProps> = ({ onNext, onSkip }) => {
  const features = [
    {
      icon: CheckCircle,
      title: 'Verified Professional Providers',
      description: 'All our service providers are thoroughly vetted, licensed, and background-checked to ensure you receive the highest quality service from trusted professionals in your area.',
    },
    {
      icon: Zap,
      title: 'Instant Booking & Real-time Tracking',
      description: 'Book services instantly with our streamlined platform and track your provider\'s arrival in real-time. Get updates every step of the way for complete peace of mind.',
    },
    {
      icon: DollarSign,
      title: 'Secure Payment & Quality Guarantee',
      description: 'We have protocols and guidelines in place to constantly improve customer satisfaction and optimise payment security. Our dedicated customer service team is ready to offer assistance whenever the need arises.',
    },
    {
      icon: Star,
      title: 'Complete Solutions for Every Need',
      description: 'From daily consumables to professional services, Alabastar connects you with reliable businesses and verified providers offering desired products and services whenever and wherever needed.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover Our Outstanding Features</Text>
          <Text style={styles.subtitle}>
            Experience the future of service booking
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <feature.icon size={32} color="#ec4899" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
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
    backgroundColor: '#fdf2f8', // Light pink background
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 180,
    height: 180,
    backgroundColor: '#f97316', // Orange-500
    top: -90,
    left: -90,
  },
  circle2: {
    width: 120,
    height: 120,
    backgroundColor: '#ec4899', // Pink-500
    bottom: 200,
    right: -60,
  },
  circle3: {
    width: 80,
    height: 80,
    backgroundColor: '#f97316', // Orange-500
    top: height * 0.4,
    left: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ec4899', // Pink-500
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 50,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ec4899', // Pink-500 accent
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdf2f8', // Light pink background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#ec4899', // Pink-500 border
  },
  iconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#ec4899', // Pink-500
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#ec4899',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeaturesScreen;
