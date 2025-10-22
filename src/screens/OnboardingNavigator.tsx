import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import FeaturesScreen from './FeaturesScreen';

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const renderCurrentScreen = () => {
    if (currentScreen === 0) {
      return <WelcomeScreen onNext={() => setCurrentScreen(1)} />;
    } else {
      return <FeaturesScreen onNext={onComplete} onSkip={onComplete} />;
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

export default OnboardingNavigator;
