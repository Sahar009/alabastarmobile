#!/bin/bash

# Generate Android launcher icons from mobileicon.png
# Android icon sizes for different densities:
# mdpi: 48x48
# hdpi: 72x72
# xhdpi: 96x96
# xxhdpi: 144x144
# xxxhdpi: 192x192

ICON_SOURCE="assets/mobileicon.png"
RES_DIR="android/app/src/main/res"

if [ ! -f "$ICON_SOURCE" ]; then
  echo "Error: $ICON_SOURCE not found"
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$RES_DIR/mipmap-mdpi"
mkdir -p "$RES_DIR/mipmap-hdpi"
mkdir -p "$RES_DIR/mipmap-xhdpi"
mkdir -p "$RES_DIR/mipmap-xxhdpi"
mkdir -p "$RES_DIR/mipmap-xxxhdpi"

# Generate icons for each density
echo "Generating Android launcher icons..."

# mdpi: 48x48
sips -z 48 48 "$ICON_SOURCE" --out "$RES_DIR/mipmap-mdpi/ic_launcher.png"
sips -z 48 48 "$ICON_SOURCE" --out "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"
# Foreground for adaptive icons (mdpi: 108x108)
sips -z 108 108 "$ICON_SOURCE" --out "$RES_DIR/mipmap-mdpi/ic_launcher_foreground.png"

# hdpi: 72x72
sips -z 72 72 "$ICON_SOURCE" --out "$RES_DIR/mipmap-hdpi/ic_launcher.png"
sips -z 72 72 "$ICON_SOURCE" --out "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"
# Foreground for adaptive icons (hdpi: 162x162)
sips -z 162 162 "$ICON_SOURCE" --out "$RES_DIR/mipmap-hdpi/ic_launcher_foreground.png"

# xhdpi: 96x96
sips -z 96 96 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
sips -z 96 96 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"
# Foreground for adaptive icons (xhdpi: 216x216)
sips -z 216 216 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_foreground.png"

# xxhdpi: 144x144
sips -z 144 144 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
sips -z 144 144 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"
# Foreground for adaptive icons (xxhdpi: 324x324)
sips -z 324 324 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_foreground.png"

# xxxhdpi: 192x192
sips -z 192 192 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"
sips -z 192 192 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"
# Foreground for adaptive icons (xxxhdpi: 432x432)
sips -z 432 432 "$ICON_SOURCE" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_foreground.png"

echo "✅ Icons generated successfully!"
echo "Generated icons in:"
echo "  - mipmap-mdpi (48x48 + 108x108 foreground)"
echo "  - mipmap-hdpi (72x72 + 162x162 foreground)"
echo "  - mipmap-xhdpi (96x96 + 216x216 foreground)"
echo "  - mipmap-xxhdpi (144x144 + 324x324 foreground)"
echo "  - mipmap-xxxhdpi (192x192 + 432x432 foreground)"
