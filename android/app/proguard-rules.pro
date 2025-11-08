# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotation default values
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# Keep custom model classes
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }

# Google Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
