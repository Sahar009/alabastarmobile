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
import { apiService } from './src/services/api';
import pushNotificationService from './src/services/pushNotificationService';
import ErrorBoundary from './src/components/ErrorBoundary';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingNavigator from './src/screens/OnboardingNavigator';
import UserTypeSelectionScreen from './src/screens/UserTypeSelectionScreen';
import AuthNavigator from './src/screens/AuthNavigator';
import ProvidersScreen from './src/screens/ProvidersScreen';
import HomeScreen from './src/screens/HomeScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProviderProfileManagementScreen from './src/screens/ProviderProfileManagementScreen';
import ProviderSettingsScreen from './src/screens/ProviderSettingsScreen';
import ProviderSubscriptionScreen from './src/screens/ProviderSubscriptionScreen';
import ProviderReferralScreen from './src/screens/ProviderReferralScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ProviderBookingsScreen from './src/screens/ProviderBookingsScreen';
import ProviderEarningsScreen from './src/screens/ProviderEarningsScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import BottomNavigation from './src/components/BottomNavigation';

type AppScreen =
  | 'onboarding'
  | 'user-type-selection'
  | 'auth'
  | 'home'
  | 'location-selection'
  | 'providers'
  | 'profile'
  | 'notifications'
  | 'bookings'
  | 'messages'
  | 'earnings'
  | 'provider-settings'
  | 'provider-subscription'
  | 'provider-referrals'
  | 'settings'
  | 'about'
  | 'help-support';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [userType, setUserType] = useState<'user' | 'provider' | null>(null);
  const [_isAuthenticated, _setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
  const [messageBookingId, setMessageBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Add delay to ensure React Native native modules are fully initialized
    const initialize = async () => {
      try {
        // Wait longer for Firebase and native modules to be ready
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        
        // Load saved userType first
        try {
          const savedUserType = await AsyncStorage.getItem('selectedUserType');
          if (savedUserType === 'user' || savedUserType === 'provider') {
            console.log('[App] Loaded saved userType:', savedUserType);
            setUserType(savedUserType as 'user' | 'provider');
          }
        } catch (err) {
          console.error('Error loading saved userType:', err);
        }
        
        // Initialize in parallel with error handling
        await Promise.all([
          checkFirstLaunch().catch(err => {
            console.error('Error checking first launch:', err);
            setIsFirstLaunch(false);
            setCurrentScreen('user-type-selection');
          }),
          checkAuthState().catch(err => {
            console.error('Error checking auth state:', err);
          }),
          loadSavedLocation().catch(err => {
            console.error('Error loading location:', err);
            setSelectedLocation('Lagos');
          }),
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
        // Set safe defaults on error
        setIsFirstLaunch(false);
        setCurrentScreen('user-type-selection');
        setSelectedLocation('Lagos');
      }
    };

    initialize();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('selectedLocation');
      if (savedLocation) {
        setSelectedLocation(savedLocation);
      } else {
        // Default to Lagos if no location saved
        setSelectedLocation('Lagos');
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
      setSelectedLocation('Lagos');
    }
  };

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        setUserData(user);
        _setIsAuthenticated(true);
        
        // Check if user is a provider and route accordingly
        const isProvider = user?.role === 'provider';
        if (isProvider) {
          setActiveTab('bookings');
          setCurrentScreen('bookings');
        } else {
          setCurrentScreen('home');
          setActiveTab('home');
        }
        
        // Load token into apiService for future API calls
        try {
          await apiService.loadToken();
        } catch (error) {
          console.error('Error loading token:', error);
          // Continue even if token loading fails
        }

        // Initialize push notifications after a delay to ensure Firebase is ready
        try {
          // Wait longer for Firebase native modules to be fully ready
          await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
          await pushNotificationService.initialize(token);
        } catch (error) {
          console.error('Error initializing push notifications:', error);
          // Continue even if push notification initialization fails
        }

        // Check for pending notification navigation
        try {
          const pendingNotification = await AsyncStorage.getItem('pendingNotification');
          if (pendingNotification) {
            const notificationData = JSON.parse(pendingNotification);
            handleNotificationNavigation(notificationData);
            await AsyncStorage.removeItem('pendingNotification');
          }
        } catch (error) {
          console.error('Error handling pending notification:', error);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  };

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
    console.log('[App] User type selected:', type);
    // Set both userType and screen together to ensure they're in sync
    setUserType(type);
    // Save userType to AsyncStorage for persistence
    AsyncStorage.setItem('selectedUserType', type).catch(err => {
      console.error('Error saving userType:', err);
    });
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = async (authUserData: any) => {
    console.log('Authentication successful!', { userType, authUserData });
    // Extract user from response data (response.data.user)
    const user = authUserData?.user || authUserData;
    setUserData(user);
    _setIsAuthenticated(true);
    
    // Save user data to AsyncStorage for persistence
    try {
      await apiService.setUser(user);
    } catch (error) {
      console.error('Error saving user data:', error);
    }

    // Initialize push notifications with auth token after a delay to ensure Firebase is ready
    try {
      // Wait longer for Firebase native modules to be fully ready
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      const token = await AsyncStorage.getItem('token');
      await pushNotificationService.initialize(token);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      // Continue even if push notification initialization fails
    }
    
    // Check both userType and the actual role from userData
    const isProvider = userType === 'provider' || user?.role === 'provider';
    
    if (isProvider) {
      // Providers go directly to bookings screen after sign in
      setActiveTab('bookings');
      setCurrentScreen('bookings');
    } else {
      // Regular users go to home screen
      setCurrentScreen('home');
      setActiveTab('home');
    }
  };

  const handleNotificationNavigation = (data: any) => {
    try {
      console.log('[App] Handling notification navigation:', data);
      
      // Handle different notification types
      if (data.type === 'booking' || data.bookingId) {
        // Navigate to bookings screen
        setCurrentScreen('bookings');
        setActiveTab('bookings');
      } else if (data.type === 'message' || data.conversationId) {
        // Navigate to messages screen
        if (data.userId) {
          setMessageRecipientId(data.userId);
        }
        setCurrentScreen('messages');
        setActiveTab('messages');
      } else if (data.actionUrl) {
        // Handle deep links
        // You can parse the URL and navigate accordingly
        console.log('[App] Notification action URL:', data.actionUrl);
      }
    } catch (error) {
      console.error('[App] Error handling notification navigation:', error);
    }
  };

  const handleLogout = async () => {
    // Unregister push notification token
    try {
      await pushNotificationService.unregisterToken();
    } catch (error) {
      console.error('Error unregistering push notification token:', error);
    }

    _setIsAuthenticated(false);
    setUserData(null);
    setUserType(null);
    setCurrentScreen('user-type-selection');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  const handleBackToUserTypeSelection = () => {
    console.log('[App] Back to user type selection - clearing userType');
    setUserType(null);
    // Clear saved userType
    AsyncStorage.removeItem('selectedUserType').catch(err => {
      console.error('Error clearing userType:', err);
    });
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

  const handleSelectCategory = (category: string, search?: string) => {
    if (category === 'search' && search) {
      // If it's a search, go directly to providers with search query
      setSearchQuery(search);
      setSelectedCategory('');
      setCurrentScreen('providers');
    } else {
      // Normal category selection goes through location selection
      setSelectedCategory(category);
      setSearchQuery(''); // Clear search when selecting category
      setCurrentScreen('location-selection');
    }
  };

  const handleLocationSelected = async (location: string | any) => {
    // Handle both string and LocationData types
    let locationString: string = 'Lagos'; // Default value
    
    if (typeof location === 'string') {
      locationString = location;
    } else if (location && location.city) {
      // Use city directly if available
      locationString = location.city;
    } else if (location && location.locality) {
      // Use locality if city not available
      locationString = location.locality;
    } else if (location && location.district) {
      // Use district if locality not available
      locationString = location.district;
    } else if (location && location.address) {
      // Extract city from full address if available
      const addressParts = location.address.split(',');
      // Try to find city in address (usually second or third part)
      if (addressParts.length > 1) {
        // Look for city-like parts (not street number/name, not state/country)
        for (let i = 1; i < Math.min(4, addressParts.length); i++) {
          const part = addressParts[i].trim();
          if (part && part.length > 2 && !part.toLowerCase().includes('nigeria') && !part.toLowerCase().includes('state')) {
            locationString = part;
            break;
          }
        }
      }
      // If still default, try first part of address
      if (locationString === 'Lagos' && addressParts.length > 0) {
        locationString = addressParts[0].trim() || 'Lagos';
      }
    }
    
    console.log('Location selected:', location, 'Extracted location string:', locationString);
    setSelectedLocation(locationString);
    
    // Save location to AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('selectedLocation', locationString);
      if (location && typeof location === 'object') {
        // Also save full location data if available
        await AsyncStorage.setItem('locationData', JSON.stringify(location));
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
    
    setCurrentScreen('providers');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Handle tab navigation based on active tab
    switch (tab) {
      case 'home':
        setCurrentScreen('home');
        break;
      case 'search':
        setCurrentScreen('home');
        break;
      case 'bookings':
        setCurrentScreen('bookings');
        break;
      case 'earnings':
        setCurrentScreen('earnings');
        break;
      case 'messages':
        setCurrentScreen('messages');
        break;
      case 'profile':
        setCurrentScreen('profile');
        break;
      default:
        setCurrentScreen('home');
    }
  };

  if (isFirstLaunch === null) {
    // Show loading screen or splash screen
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <SplashScreen />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
      
      case 'user-type-selection':
        return <UserTypeSelectionScreen onUserTypeSelected={handleUserTypeSelected} />;
      
      case 'auth':
        // Safety check: ensure userType is set before rendering AuthNavigator
        if (!userType) {
          console.warn('[App] userType is null when rendering auth screen, redirecting to user-type-selection');
          // Don't call setCurrentScreen here as it causes infinite loop
          // Instead, return the user type selection screen directly
          return <UserTypeSelectionScreen onUserTypeSelected={handleUserTypeSelected} />;
        }
        console.log('[App] Rendering AuthNavigator with userType:', userType);
        return (
          <AuthNavigator 
            onAuthSuccess={handleAuthSuccess} 
            onBackToUserTypeSelection={handleBackToUserTypeSelection}
            userType={userType}
          />
        );
      
      case 'home':
        return (
          <HomeScreen 
            onCategorySelect={handleSelectCategory}
            userData={userData}
            selectedLocation={selectedLocation || 'Lagos'}
            onNavigate={(screen: string) => {
              if (screen === 'notifications') {
                setCurrentScreen('notifications');
              }
            }}
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
            searchQuery={searchQuery}
          />
        );
      
      case 'profile':
        if (userData?.role === 'provider') {
          return (
            <ProviderProfileManagementScreen
              userData={userData}
              onBack={() => {
                setActiveTab('home');
                setCurrentScreen('home');
              }}
              onLogout={handleLogout}
              onNavigate={(screen) => {
                if (screen === 'provider-settings') {
                  setActiveTab('profile');
                  setCurrentScreen('provider-settings');
                } else if (screen === 'provider-subscription') {
                  setActiveTab('profile');
                  setCurrentScreen('provider-subscription');
                }
              }}
            />
          );
        }

        return (
          <ProfileScreen 
            userData={userData}
            onLogout={handleLogout}
            onNavigate={(screen) => {
              switch (screen) {
                case 'Bookings':
                  setActiveTab('bookings');
                  setCurrentScreen('bookings');
                  break;
                case 'Messages':
                  setActiveTab('messages');
                  setCurrentScreen('messages');
                  break;
                case 'Notifications':
                  setCurrentScreen('notifications');
                  break;
                case 'Settings':
                  setCurrentScreen('settings');
                  break;
                default:
                  console.log('Navigate to:', screen);
              }
            }}
          />
        );
      
      case 'notifications':
        return (
          <NotificationsScreen 
            userData={userData}
            onNavigate={(screen) => {
              // Handle navigation to other screens from notifications
              console.log('Navigate to:', screen);
            }}
          />
        );
      
      case 'bookings':
        if (userData?.role === 'provider') {
          return (
            <ProviderBookingsScreen
              userData={userData}
              onNavigate={(screen) => {
                if (screen === 'messages') {
                  setCurrentScreen('messages');
                }
              }}
            />
          );
        }

        return (
          <BookingsScreen
            userData={userData}
            onNavigate={(screen, params) => {
              if (screen === 'messages' && params) {
                setMessageRecipientId(params.recipientId || null);
                setMessageBookingId(params.bookingId || null);
                setActiveTab('messages');
                setCurrentScreen('messages');
              } else {
                console.log('Navigate to:', screen);
              }
            }}
          />
        );

      case 'earnings':
        if (userData?.role === 'provider') {
          return (
            <ProviderEarningsScreen
              userData={userData}
              onNavigate={(screen) => {
                if (screen === 'messages') {
                  setCurrentScreen('messages');
                } else if (screen === 'provider-referrals') {
                  setActiveTab('earnings');
                  setCurrentScreen('provider-referrals');
                }
              }}
            />
          );
        }

        return (
          <BookingsScreen
            userData={userData}
            onNavigate={(screen, params) => {
              if (screen === 'messages' && params) {
                setMessageRecipientId(params.recipientId || null);
                setMessageBookingId(params.bookingId || null);
                setActiveTab('messages');
                setCurrentScreen('messages');
              } else {
                console.log('Navigate to:', screen);
              }
            }}
          />
        );

      case 'messages':
        return (
          <MessagingScreen 
            userData={userData}
            recipientId={messageRecipientId || undefined}
            bookingId={messageBookingId || undefined}
            onNavigate={(screen) => {
              setCurrentScreen(screen as AppScreen);
            }}
          />
        );

      case 'provider-settings':
        return (
          <ProviderSettingsScreen
            userData={userData}
            onBack={() => {
              setActiveTab('profile');
              setCurrentScreen('profile');
            }}
            onNavigate={(screen) => {
              if (screen === 'provider-subscription') {
                setActiveTab('profile');
                setCurrentScreen('provider-subscription');
              }
            }}
          />
        );

      case 'provider-subscription':
        return (
          <ProviderSubscriptionScreen
            userData={userData}
            onBack={() => {
              setActiveTab('profile');
              setCurrentScreen('profile');
            }}
            onNavigate={(screen) => {
              if (screen === 'provider-settings') {
                setCurrentScreen('provider-settings');
              }
            }}
          />
        );

      case 'provider-referrals':
        return (
          <ProviderReferralScreen
            userData={userData}
            onBack={() => {
              setActiveTab('earnings');
              setCurrentScreen('earnings');
            }}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            userData={userData}
            onBack={() => {
              setActiveTab('profile');
              setCurrentScreen('profile');
            }}
            onNavigate={(screen) => {
              switch (screen) {
                case 'About':
                  setCurrentScreen('about');
                  break;
                case 'HelpSupport':
                  setCurrentScreen('help-support');
                  break;
                default:
                  console.log('Navigate to:', screen);
              }
            }}
            onLogout={handleLogout}
          />
        );

      case 'about':
        return (
          <AboutScreen
            userData={userData}
            onBack={() => {
              setCurrentScreen('settings');
            }}
          />
        );

      case 'help-support':
        return (
          <HelpSupportScreen
            userData={userData}
            onBack={() => {
              setCurrentScreen('settings');
            }}
          />
        );
      
      default:
        return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
    }
  };

  // Determine if we should show bottom navigation
  const shouldShowBottomNav =
    _isAuthenticated &&
    [
      'home',
      'profile',
      'providers',
      'notifications',
      'bookings',
      'earnings',
      'messages',
      'provider-settings',
      'provider-subscription',
      'provider-referrals',
      'settings',
      'about',
      'help-support',
    ].includes(
      currentScreen,
    );

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.container}>
          {renderCurrentScreen()}
          {shouldShowBottomNav && (
            <BottomNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              isProvider={userData?.role === 'provider'}
            />
          )}
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
