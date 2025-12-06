import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  image: any; // Can be require() or { uri: string }
  title: string;
  subtitle: string;
  description: string;
  gradientColors: string[];
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    image: require('../../assets/logo.png'), // Replace with actual onboarding images
    title: 'Welcome to Alabastar',
    subtitle: 'Connect with Trusted Professionals',
    description: 'Discover verified service providers, merchants, and artisans all in one place. Quality services at your fingertips.',
    gradientColors: ['#ec4899', '#f43f5e', '#ef4444'],
  },
  {
    id: 2,
    image: require('../../assets/logo.png'), // Replace with actual onboarding images
    title: 'Instant Booking',
    subtitle: 'Book Services in Seconds',
    description: 'Schedule appointments instantly with our streamlined booking system. Track your provider\'s arrival in real-time.',
    gradientColors: ['#3b82f6', '#6366f1', '#8b5cf6'],
  },
  {
    id: 3,
    image: require('../../assets/logo.png'), // Replace with actual onboarding images
    title: 'Secure Payments',
    subtitle: 'Safe & Protected Transactions',
    description: 'Enjoy secure payments with our built-in payment system. Quality guaranteed with our customer satisfaction protocols.',
    gradientColors: ['#10b981', '#14b8a6', '#06b6d4'],
  },
  {
    id: 4,
    image: require('../../assets/logo.png'), // Replace with actual onboarding images
    title: 'Verified Providers',
    subtitle: 'Trusted & Professional',
    description: 'All our service providers are thoroughly vetted, licensed, and background-checked for your peace of mind.',
    gradientColors: ['#f59e0b', '#f97316', '#ea580c'],
  },
];

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate content on slide change
    Animated.parallel([
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Ensure currentIndex is always valid
  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, onboardingSlides.length - 1));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = width;
    const index = Math.max(0, Math.min(
      Math.round(event.nativeEvent.contentOffset.x / slideSize),
      onboardingSlides.length - 1
    ));
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (safeCurrentIndex < onboardingSlides.length - 1) {
      const nextIndex = safeCurrentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  const goToPrevious = () => {
    if (safeCurrentIndex > 0) {
      const prevIndex = safeCurrentIndex - 1;
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
      setCurrentIndex(prevIndex);
    }
  };

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, onboardingSlides.length - 1));
    scrollViewRef.current?.scrollTo({
      x: safeIndex * width,
      animated: true,
    });
    setCurrentIndex(safeIndex);
  };

  const currentSlide = onboardingSlides[safeCurrentIndex] || onboardingSlides[0];

  const gradientStyle = {
    backgroundColor: currentSlide?.gradientColors?.[0] || '#ec4899',
  };

  const overlayColor1 = currentSlide?.gradientColors?.[1] || '#f43f5e';
  const overlayColor2 = currentSlide?.gradientColors?.[2] || '#ef4444';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.gradient, gradientStyle]}>
        {/* Gradient overlay layers for depth */}
        <View style={[styles.gradientOverlay, { backgroundColor: overlayColor1 + '40' }]} />
        <View style={[styles.gradientOverlay2, { backgroundColor: overlayColor2 + '30' }]} />
        {/* Skip Button */}
        {safeCurrentIndex < onboardingSlides.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onComplete}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Image Slider */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {onboardingSlides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <Animated.View
                style={[
                  styles.imageContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Image
                  source={slide.image}
                  style={styles.image}
                  resizeMode="contain"
                />
                {/* Decorative overlay circles */}
                <View style={[styles.decorativeCircle, styles.circle1]} />
                <View style={[styles.decorativeCircle, styles.circle2]} />
                <View style={[styles.decorativeCircle, styles.circle3]} />
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Content Section */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: scaleAnim.interpolate({
                inputRange: [0.95, 1],
                outputRange: [20, 0],
              }) }],
            },
          ]}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentSlide?.title || ''}</Text>
            <Text style={styles.subtitle}>{currentSlide?.subtitle || ''}</Text>
            <Text style={styles.description}>{currentSlide?.description || ''}</Text>
          </View>

          {/* Dot Indicators */}
          <View style={styles.dotsContainer}>
            {onboardingSlides.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === safeCurrentIndex && styles.dotActive,
                ]}
                onPress={() => goToSlide(index)}
                activeOpacity={0.7}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {safeCurrentIndex > 0 && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={goToPrevious}
                activeOpacity={0.8}
              >
                <ChevronLeft size={24} color="#ffffff" />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[
                styles.nextButton,
                safeCurrentIndex === onboardingSlides.length - 1 && styles.nextButtonActive,
              ]}
              onPress={goToNext}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  safeCurrentIndex === onboardingSlides.length - 1 && styles.nextButtonTextActive,
                ]}
              >
                {safeCurrentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <ChevronRight
                size={24}
                color={safeCurrentIndex === onboardingSlides.length - 1 ? '#ec4899' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '60%',
    borderBottomLeftRadius: 300,
    opacity: 0.6,
  },
  gradientOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
    borderTopRightRadius: 300,
    opacity: 0.5,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.3, // Use width-based height for better aspect ratio
    maxWidth: 280,
    maxHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  circle1: {
    width: width * 0.6,
    height: width * 0.6,
    top: -20,
    right: -40,
  },
  circle2: {
    width: width * 0.4,
    height: width * 0.4,
    bottom: -20,
    left: -30,
  },
  circle3: {
    width: width * 0.3,
    height: width * 0.3,
    top: '30%',
    left: -20,
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  spacer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonActive: {
    backgroundColor: '#ffffff',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButtonTextActive: {
    color: '#ec4899',
  },
});

export default OnboardingNavigator;
