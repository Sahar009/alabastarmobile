# Alabastar Mobile Onboarding Screens

This directory contains the onboarding screens for the Alabastar mobile app.

## Components

### WelcomeScreen
- First screen shown to new users
- Displays the Alabastar logo and welcome message
- Features a "Get Started" button to proceed to the next screen

### FeaturesScreen
- Second screen highlighting key app features
- Shows 4 main benefits: Instant Booking, Verified Providers, Transparent Pricing, Quality Guaranteed
- Includes "Skip" and "Continue" buttons

### OnboardingNavigator
- Manages the flow between onboarding screens
- Handles navigation logic and screen transitions
- Calls `onComplete` when user finishes onboarding

### AuthScreen
- Placeholder authentication screen shown after onboarding
- Contains basic login/signup buttons
- Includes option to return to onboarding for testing

### SplashScreen
- Loading screen shown while checking first launch status
- Displays app logo and loading indicator

## Flow

1. **First Launch**: User sees SplashScreen → WelcomeScreen → FeaturesScreen → AuthScreen
2. **Subsequent Launches**: User goes directly to AuthScreen
3. **Testing**: AuthScreen has a "Back to Onboarding" button for testing purposes

## Storage

The app uses AsyncStorage to track whether the user has completed onboarding:
- Key: `hasLaunched`
- Value: `'true'` (after first launch)

## Styling

All screens use the Alabastar color scheme:
- Primary: `#2563EB` (Blue)
- Secondary: `#14B8A6` (Teal)
- Accent: `#a855f7` (Purple)
- Background: `#f8fafc` (Light gray)
- Text: `#0f172a` (Dark slate)

## Assets

- Logo: `assets/logo.png` (copied from frontend)
- Decorative elements: CSS circles with gradient backgrounds
