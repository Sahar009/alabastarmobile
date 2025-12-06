#!/bin/bash

# Script to generate Android app icons from mobileicon.png
# This script generates icons for all Android densities

SOURCE_ICON="assets/mobileicon.png"
ANDROID_RES_DIR="android/app/src/main/res"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Source icon not found: $SOURCE_ICON"
    exit 1
fi

# Check if output directory exists
if [ ! -d "$ANDROID_RES_DIR" ]; then
    echo "❌ Android res directory not found: $ANDROID_RES_DIR"
    exit 1
fi

echo "🖼️  Generating Android app icons from $SOURCE_ICON..."

# Function to resize image (using sips on macOS or convert if ImageMagick is available)
resize_image() {
    local width=$1
    local height=$2
    local output=$3
    
    if command -v sips &> /dev/null; then
        # Use macOS built-in sips command
        sips -z $height $width "$SOURCE_ICON" --out "$output" > /dev/null 2>&1
    elif command -v convert &> /dev/null; then
        # Use ImageMagick convert command
        convert "$SOURCE_ICON" -resize "${width}x${height}" "$output"
    else
        echo "⚠️  Neither sips nor ImageMagick found. Please install ImageMagick or use macOS."
        return 1
    fi
}

# Android icon sizes for different densities
# Format: density_name:size
declare -A ANDROID_SIZES=(
    ["mdpi"]="48"
    ["hdpi"]="72"
    ["xhdpi"]="96"
    ["xxhdpi"]="144"
    ["xxxhdpi"]="192"
)

echo "📱 Generating Android launcher icons..."

# Generate icons for each density
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    size="${ANDROID_SIZES[$density]}"
    mipmap_dir="$ANDROID_RES_DIR/mipmap-$density"
    
    # Create directory if it doesn't exist
    mkdir -p "$mipmap_dir"
    
    # Generate ic_launcher.png (square icon)
    resize_image $size $size "$mipmap_dir/ic_launcher.png" && echo "✅ Generated mipmap-$density/ic_launcher.png (${size}x${size})"
    
    # Generate ic_launcher_round.png (round icon - same as square for now)
    resize_image $size $size "$mipmap_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-$density/ic_launcher_round.png (${size}x${size})"
    
    # Generate ic_launcher_foreground.png (for adaptive icons)
    resize_image $size $size "$mipmap_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-$density/ic_launcher_foreground.png (${size}x${size})"
done

echo ""
echo "🎉 Android app icons generated successfully!"
echo "📝 Icons generated from: $SOURCE_ICON"
echo "📦 All icons have been placed in their respective mipmap directories."

