module.exports = {
  expo: {
    name: "AlabastarMobile",
    slug: "alabastarmobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/mobileicon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.alabastarmobile",
      googleServicesFile: "./ios/AlabastarMobile/GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/mobileicon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.alabastarmobile",
      googleServicesFile: "./android/app/google-services.json"
    },
    plugins: [
      // Note: Expo plugins may need custom config for React Native 0.82
      // You may need to use config plugins from community
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true // Expo prebuild handles this better
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "your-project-id-here"
      }
    }
  }
};

