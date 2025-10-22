import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { apiService, LoginData, RegisterData } from '../services/api';

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
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw error;
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
