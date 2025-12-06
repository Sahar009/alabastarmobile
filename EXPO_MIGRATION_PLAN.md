# Expo Migration Plan (Least Disruptive Approach)

## Option A: Enable New Architecture (RECOMMENDED - Simplest)
This is the easiest fix and aligns with React Native 0.82 requirements:

1. Remove `newArchEnabled=false` from `android/gradle.properties`
2. Rebuild APK
3. Test thoroughly

**Pros:**
- Minimal changes
- Aligns with RN 0.82
- No migration needed
- All existing code works

**Cons:**
- None significant

---

## Option B: Expo Prebuild (If Option A doesn't work)
Use Expo's prebuild system which keeps your current codebase but uses Expo's build infrastructure.

### Steps:

1. **Install Expo CLI and dependencies:**
```bash
npm install -g expo-cli
npm install expo expo-dev-client @expo/config-plugins
```

2. **Create app.json/app.config.js:**
```json
{
  "expo": {
    "name": "AlabastarMobile",
    "slug": "alabastarmobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/mobileicon.png",
    "splash": {
      "image": "./assets/logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      "@react-native-google-signin/google-signin",
      "expo-image-picker"
    ],
    "ios": {
      "bundleIdentifier": "com.alabastarmobile",
      "googleServicesFile": "./ios/AlabastarMobile/GoogleService-Info.plist"
    },
    "android": {
      "package": "com.alabastarmobile",
      "googleServicesFile": "./android/app/google-services.json"
    }
  }
}
```

3. **Run prebuild:**
```bash
npx expo prebuild --clean
```

4. **Build with Expo:**
```bash
npx expo run:android
```

**Pros:**
- Uses Expo's build system (handles CMake issues)
- Keeps your existing code
- Automatic native config generation
- EAS Build support

**Cons:**
- Requires configuring plugins
- May need to adjust custom native code
- Learning curve

---

## Option C: Full Expo Managed (Most Complex)
Complete migration to Expo managed workflow - NOT RECOMMENDED for your use case due to:
- Custom native code (Firebase initialization)
- Complex native module requirements
- Risk of breaking existing functionality

---

## Recommendation
**Try Option A first (Enable New Architecture)** - it's the simplest and should resolve your build issues. Only move to Expo if absolutely necessary.

