import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { apiService, LoginData, RegisterData } from '../services/api';
import { googleSignInService } from '../services/googleSignInService';
import { Alert } from 'react-native';

interface AuthNavigatorProps {
  onAuthSuccess: (userData: any) => void;
  onBackToUserTypeSelection: () => void;
  userType: 'user' | 'provider';
}

type AuthScreen = 'login' | 'signup' | 'forgot-password';

interface AuthState {
  currentScreen: AuthScreen;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess, onBackToUserTypeSelection, userType }) => {
  const [authState, setAuthState] = useState<AuthState>({
    currentScreen: 'login',
  });

  const navigateTo = (screen: AuthScreen) => {
    setAuthState({
      currentScreen: screen,
    });
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email, userType });
      
      const loginData: LoginData = { email, password };
      
      // Use appropriate login endpoint based on user type
      const response = userType === 'provider' 
        ? await apiService.loginProvider(loginData)
        : await apiService.login(loginData);
      
      if (response.success && response.data) {
        // Store token for future API calls
        apiService.setToken(response.data.token);
        
        // Skip OTP verification and go directly to success
        onAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSignUp = async (userData: any) => {
    try {
      console.log('Signup attempt:', userData);
      
      const registerData: RegisterData = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone || undefined,
        password: userData.password,
      };
      
      const response = await apiService.register(registerData);
      
      if (response.success && response.data) {
        // Store token for future API calls
        apiService.setToken(response.data.token);
        
        // Skip OTP verification and go directly to success
        onAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      // TODO: Implement actual password reset logic
      console.log('Password reset request:', email);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw error;
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Sign in with Google
      const googleUserData = await googleSignInService.completeSignIn();
      
      if (googleUserData) {
        // Authenticate with backend
        const authData = await googleSignInService.authenticateWithBackend(googleUserData);
        
        if (authData) {
          onAuthSuccess(authData);
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert(
        'Google Sign-In Failed',
        error?.message || 'Failed to sign in with Google. Please try again or use email sign-in.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };


  const renderCurrentScreen = () => {
    switch (authState.currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => navigateTo('signup')}
            onForgotPassword={() => navigateTo('forgot-password')}
            onBackToUserTypeSelection={onBackToUserTypeSelection}
            onGoogleSignIn={handleGoogleSignIn}
            isGoogleLoading={isGoogleLoading}
          />
        );
      
      case 'signup':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onLogin={() => navigateTo('login')}
            onBackToUserTypeSelection={onBackToUserTypeSelection}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onSendResetEmail={handleSendResetEmail}
            onBackToLogin={() => navigateTo('login')}
          />
        );
      
      default:
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => navigateTo('signup')}
            onForgotPassword={() => navigateTo('forgot-password')}
            onBackToUserTypeSelection={onBackToUserTypeSelection}
            onGoogleSignIn={handleGoogleSignIn}
            isGoogleLoading={isGoogleLoading}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthNavigator;
