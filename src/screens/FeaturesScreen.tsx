import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface FeaturesScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

interface Feature {
  id: string;
  image: any;
  title: string;
  description: string;
}

const FeaturesScreen: React.FC<FeaturesScreenProps> = ({ onNext, onSkip }) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const features: Feature[] = [
    {
      id: '1',
      image: require('../../assets/verify.png'),
      title: 'Verified Professional Providers',
      description: 'All our service providers are thoroughly vetted, licensed, and background-checked to ensure you receive the highest quality service from trusted professionals in your area.',
    },
    {
      id: '2',
      image: require('../../assets/book.png'),
      title: 'Instant Booking & Real-time Tracking',
      description: 'Book services instantly with our streamlined platform and track your provider\'s arrival in real-time. Get updates every step of the way for complete peace of mind.',
    },
    {
      id: '3',
      image: require('../../assets/success.png'),
      title: 'Secure Payment & Quality Guarantee',
      description: 'We have protocols and guidelines in place to constantly improve customer satisfaction and optimise payment security. Our dedicated customer service team is ready to offer assistance whenever the need arises.',
    },
    {
      id: '4',
      image: require('../../assets/accept.png'),
      title: 'Complete Solutions for Every Need',
      description: 'From daily consumables to professional services, Alabastar connects you with reliable businesses and verified providers offering desired products and services whenever and wherever needed.',
    },
  ];

  useEffect(() => {
    // Auto-advance slider every 4 seconds
    const interval = setInterval(() => {
      const nextIndex = currentIndex < features.length - 1 ? currentIndex + 1 : 0;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, features.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setCurrentIndex(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: () => {
        // Fade animation on scroll
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }
  );

  const renderItem = ({ item, index }: { item: Feature; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.slideContainer,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <ScrollView 
          style={styles.slideScrollView}
          contentContainerStyle={styles.slideContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Image
              source={item.image}
              style={styles.featureImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {features.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Our Outstanding Features</Text>
        <Text style={styles.subtitle}>
          Experience the future of service booking
        </Text>
      </View>

      {/* Slider */}
      <Animated.View style={[styles.sliderContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={features}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </Animated.View>

      {/* Pagination dots */}
      {renderPagination()}

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 32,
    zIndex: 1,
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
  sliderContainer: {
    flex: 1,
    marginTop: 20,
  },
  slideContainer: {
    width: width,
    paddingHorizontal: 24,
  },
  slideScrollView: {
    flex: 1,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingVertical: 20,
    minHeight: height * 0.65,
  },
  imageContainer: {
    width: 240,
    height: 240,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  featureImage: {
    width: '85%',
    height: '85%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
    flexShrink: 1,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  featureDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ec4899',
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 1,
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
