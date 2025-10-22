/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  OnboardingNavigator, 
  UserTypeSelectionScreen, 
  AuthNavigator, 
  ProvidersScreen, 
  SplashScreen,
  HomeScreen,
  LocationSelectionScreen
} from './src/screens';

type AppScreen = 'onboarding' | 'user-type-selection' | 'auth' | 'home' | 'location-selection' | 'providers';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [userType, setUserType] = useState<'user' | 'provider' | null>(null);
  const [_isAuthenticated, _setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        setCurrentScreen('onboarding');
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        setIsFirstLaunch(false);
        setCurrentScreen('user-type-selection');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
      setCurrentScreen('user-type-selection');
    }
  };

  const handleOnboardingComplete = () => {
    setIsFirstLaunch(false);
    setCurrentScreen('user-type-selection');
  };

  const handleUserTypeSelected = (type: 'user' | 'provider') => {
    setUserType(type);
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = (authUserData: any) => {
    console.log('Authentication successful!', { userType, authUserData });
    setUserData(authUserData);
    _setIsAuthenticated(true);
    
    if (userType === 'user') {
      setCurrentScreen('home');
    } else {
      // For providers, you might want to show a different screen
      setCurrentScreen('home');
    }
  };

  const handleLogout = () => {
    _setIsAuthenticated(false);
    setUserData(null);
    setUserType(null);
    setCurrentScreen('user-type-selection');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  const handleBackToUserTypeSelection = () => {
    setUserType(null);
    setCurrentScreen('user-type-selection');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  const handleBackToLocationSelection = () => {
    setCurrentScreen('location-selection');
    setSelectedLocation('');
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentScreen('location-selection');
  };

  const handleLocationSelected = (location: string) => {
    setSelectedLocation(location);
    setCurrentScreen('providers');
  };

  if (isFirstLaunch === null) {
    // Show loading screen or splash screen
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
      
      case 'user-type-selection':
        return <UserTypeSelectionScreen onUserTypeSelected={handleUserTypeSelected} />;
      
      case 'auth':
        return (
          <AuthNavigator 
            onAuthSuccess={handleAuthSuccess} 
            onBackToUserTypeSelection={handleBackToUserTypeSelection}
            userType={userType!}
          />
        );
      
      case 'home':
        return (
          <HomeScreen 
            onCategorySelect={handleSelectCategory}
            userData={userData}
            selectedLocation={selectedLocation || 'Lagos'}
          />
        );
      
      case 'location-selection':
        return (
          <LocationSelectionScreen
            onLocationSelect={handleLocationSelected}
            onBack={handleBackToHome}
            selectedCategory={selectedCategory}
          />
        );
      
      case 'providers':
        return (
          <ProvidersScreen 
            userData={userData} 
            onLogout={handleLogout}
            onBack={handleBackToLocationSelection}
            selectedCategory={selectedCategory}
            selectedLocation={selectedLocation}
          />
        );
      
      default:
        return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {renderCurrentScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
