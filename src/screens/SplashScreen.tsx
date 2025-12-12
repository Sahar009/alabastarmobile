import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SplashScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
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
    width: 200,
    height: 200,
    backgroundColor: '#ec4899', // Pink-500
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#f97316', // Orange-500
    bottom: 100,
    left: -75,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    maxWidth: 300,
    aspectRatio: 4096 / 1560, // Maintain logo aspect ratio
  },
  logo: {
    width: '100%',
    height: '100%',
    maxWidth: 250,
    maxHeight: 95,
  },
  loadingContainer: {
    marginTop: 20,
  },
});

export default SplashScreen;
