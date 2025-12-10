# Expo Prebuild Setup Guide

## Step 1: Install Dependencies
```bash
cd /Users/mac/Documents/s/Projects/sahar/alabastar/alabastarmobile
npm install
```

## Step 2: Backup Your Native Folders (IMPORTANT!)
```bash
# Create backups
cp -r android android.backup
cp -r ios ios.backup
```

## Step 3: Run Expo Prebuild
This will regenerate your `android/` and `ios/` folders using Expo's build system:
```bash
npx expo prebuild --clean
```

**Note:** The `--clean` flag will regenerate folders. Your existing native code will be preserved through Expo plugins.

## Step 4: Build APK with Expo
```bash
npx expo run:android
```

Or build APK directly:
```bash
cd android && ./gradlew assembleDebug
```

## What Expo Prebuild Does:
- ✅ Regenerates `android/` and `ios/` folders with Expo-compatible configs
- ✅ Configures native modules automatically via plugins
- ✅ Handles CMake/autolinking issues
- ✅ Keeps your JavaScript code unchanged
- ✅ Maintains your assets and configuration

## If Something Goes Wrong:
1. Restore from backup:
   ```bash
   rm -rf android ios
   mv android.backup android
   mv ios.backup ios
   ```

2. Your JavaScript code is untouched, so no risk to app functionality

## Benefits:
- ✅ Resolves CMake/build issues
- ✅ Easier native module management
- ✅ Can use EAS Build for cloud builds
- ✅ Better compatibility with React Native 0.82+

## Next Steps After Prebuild:
1. Test the app thoroughly
2. Adjust any custom native code if needed
3. Configure EAS Build (optional) for cloud builds



