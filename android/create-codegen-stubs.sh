#!/bin/bash

# This script creates stub CMakeLists.txt files for codegen directories
# when newArchEnabled=false, to prevent CMake errors.

cd "$(dirname "$0")/.."

modules=(
  "@react-native-community/geolocation:RNCGeolocationSpec"
  "@react-native-clipboard/clipboard:rnclipboard"
  "@react-native-google-signin/google-signin:RNGoogleSignInCGen"
  "react-native-document-picker:rndocumentpicker"
  "react-native-image-picker:RNImagePickerSpec"
)

for module in "${modules[@]}"; do
  IFS=':' read -r path target <<< "$module"
  dir="node_modules/$path/android/build/generated/source/codegen/jni"
  mkdir -p "$dir"
  echo "// Stub file for old architecture compatibility" > "$dir/stub.cpp"
  
  cat > "$dir/CMakeLists.txt" << EOF
cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)
add_library(react_codegen_${target} OBJECT stub.cpp)
target_include_directories(react_codegen_${target} PUBLIC .)
target_link_libraries(react_codegen_${target} fbjni jsi reactnative)
EOF
done

echo "✓ Created stub CMakeLists.txt files for old architecture compatibility"
