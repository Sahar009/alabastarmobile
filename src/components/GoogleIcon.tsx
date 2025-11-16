import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface GoogleIconProps {
  size?: number;
}

const GoogleIcon: React.FC<GoogleIconProps> = ({ size = 20 }) => {
  return (
    <Image
      source={require('../../assets/google.jpg')}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  image: {
    borderRadius: 4,
  },
});

export default GoogleIcon;
