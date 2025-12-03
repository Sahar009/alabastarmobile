#!/bin/bash

# Generate Android adaptive icons with proper padding
# For adaptive icons, the foreground should have ~17% padding on all sides
# This means the icon content should be ~66% of the canvas size

ICON_SOURCE="assets/mobileicon.png"
RES_DIR="android/app/src/main/res"

if [ ! -f "$ICON_SOURCE" ]; then
  echo "Error: $ICON_SOURCE not found"
  exit 1
fi

# Create directories
mkdir -p "$RES_DIR/mipmap-mdpi"
mkdir -p "$RES_DIR/mipmap-hdpi"
mkdir -p "$RES_DIR/mipmap-xhdpi"
mkdir -p "$RES_DIR/mipmap-xxhdpi"
mkdir -p "$RES_DIR/mipmap-xxxhdpi"
mkdir -p "$RES_DIR/mipmap-anydpi-v26"

echo "Generating Android adaptive icons with proper padding..."

# Create padded source: resize icon to 66% (675px) and pad to 1024x1024 with white background
echo "Creating padded source icon..."
sips -z 675 675 "$ICON_SOURCE" --out /tmp/icon_resized.png
# Create white 1024x1024 canvas and composite icon in center
sips --padToHeightWidth 1024 1024 --padColor FFFFFF /tmp/icon_resized.png --out /tmp/icon_padded.png

# Generate foreground icons for each density (these need transparent background)
# For now, we'll use the padded version, but ideally foreground should be transparent
# mdpi: 108x108
sips -z 108 108 /tmp/icon_padded.png --out "$RES_DIR/mipmap-mdpi/ic_launcher_foreground.png"

# hdpi: 162x162
sips -z 162 162 /tmp/icon_padded.png --out "$RES_DIR/mipmap-hdpi/ic_launcher_foreground.png"

# xhdpi: 216x216
sips -z 216 216 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xhdpi/ic_launcher_foreground.png"

# xxhdpi: 324x324
sips -z 324 324 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_foreground.png"

# xxxhdpi: 432x432
sips -z 432 432 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_foreground.png"

# Generate legacy icons
echo "Generating legacy icons..."
sips -z 48 48 /tmp/icon_padded.png --out "$RES_DIR/mipmap-mdpi/ic_launcher.png"
sips -z 48 48 /tmp/icon_padded.png --out "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"
sips -z 72 72 /tmp/icon_padded.png --out "$RES_DIR/mipmap-hdpi/ic_launcher.png"
sips -z 72 72 /tmp/icon_padded.png --out "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"
sips -z 96 96 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
sips -z 96 96 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"
sips -z 144 144 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
sips -z 144 144 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"
sips -z 192 192 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"
sips -z 192 192 /tmp/icon_padded.png --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"

echo "✅ Icons generated successfully!"
