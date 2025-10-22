import React from 'react';
import { View, StyleSheet } from 'react-native';

interface GoogleIconProps {
  size?: number;
}

const GoogleIcon: React.FC<GoogleIconProps> = ({ size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Google G Logo */}
      <View style={styles.logo}>
        {/* Blue section (top-left) */}
        <View style={[styles.quadrant, styles.blue]} />
        {/* Green section (top-right) */}
        <View style={[styles.quadrant, styles.green]} />
        {/* Yellow section (bottom-left) */}
        <View style={[styles.quadrant, styles.yellow]} />
        {/* Red section (bottom-right) */}
        <View style={[styles.quadrant, styles.red]} />
        {/* White center */}
        <View style={styles.centerWhite} />
        {/* Blue G arc */}
        <View style={styles.gArc} />
        {/* Blue horizontal line */}
        <View style={styles.gLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  quadrant: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  blue: {
    top: 0,
    left: 0,
    backgroundColor: '#4285F4',
  },
  green: {
    top: 0,
    right: 0,
    backgroundColor: '#34A853',
  },
  yellow: {
    bottom: 0,
    left: 0,
    backgroundColor: '#FBBC05',
  },
  red: {
    bottom: 0,
    right: 0,
    backgroundColor: '#EA4335',
  },
  centerWhite: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  gArc: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderWidth: 1.5,
    borderColor: '#4285F4',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderRadius: 8,
  },
  gLine: {
    position: 'absolute',
    top: '45%',
    left: '35%',
    width: '25%',
    height: 1.5,
    backgroundColor: '#4285F4',
  },
});

export default GoogleIcon;
