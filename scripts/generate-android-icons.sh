#!/bin/bash

# Script to generate Android app icons from mobileicon.png
# This script generates icons for all Android densities

SOURCE_ICON="assets/IMG_3183.JPEG"
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

# Function to resize image with padding (using sips on macOS or convert if ImageMagick is available)
resize_image() {
    local width=$1
    local height=$2
    local output=$3
    
    # Add 35% padding (icon will be 30% of total size, centered - reduced for smaller icon)
    local icon_width=$((width * 30 / 100))
    local icon_height=$((height * 30 / 100))
    
    if command -v sips &> /dev/null; then
        # Create temporary resized icon
        local temp_icon="/tmp/icon_${width}x${height}.png"
        sips -s format png -z $icon_height $icon_width "$SOURCE_ICON" --out "$temp_icon" > /dev/null 2>&1
        
        # Create canvas with padding and composite icon in center
        if command -v convert &> /dev/null; then
            convert -size ${width}x${height} xc:none "$temp_icon" -gravity center -composite "$output"
            rm -f "$temp_icon"
        else
            # Fallback: just resize without padding if ImageMagick not available
            sips -s format png -z $height $width "$SOURCE_ICON" --out "$output" > /dev/null 2>&1
        fi
    elif command -v convert &> /dev/null; then
        # Use ImageMagick: resize icon and center on transparent canvas
        convert -size ${width}x${height} xc:none \
                \( "$SOURCE_ICON" -resize ${icon_width}x${icon_height} \) \
                -gravity center -composite "$output"
    else
        echo "⚠️  Neither sips nor ImageMagick found. Please install ImageMagick or use macOS."
        return 1
    fi
}

echo "📱 Generating Android launcher icons..."

# Generate icons for mdpi (48x48)
mdpi_size=48
mdpi_dir="$ANDROID_RES_DIR/mipmap-mdpi"
mkdir -p "$mdpi_dir"
resize_image $mdpi_size $mdpi_size "$mdpi_dir/ic_launcher.png" && echo "✅ Generated mipmap-mdpi/ic_launcher.png (${mdpi_size}x${mdpi_size})"
resize_image $mdpi_size $mdpi_size "$mdpi_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-mdpi/ic_launcher_round.png (${mdpi_size}x${mdpi_size})"
resize_image $mdpi_size $mdpi_size "$mdpi_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-mdpi/ic_launcher_foreground.png (${mdpi_size}x${mdpi_size})"

# Generate icons for hdpi (72x72)
hdpi_size=72
hdpi_dir="$ANDROID_RES_DIR/mipmap-hdpi"
mkdir -p "$hdpi_dir"
resize_image $hdpi_size $hdpi_size "$hdpi_dir/ic_launcher.png" && echo "✅ Generated mipmap-hdpi/ic_launcher.png (${hdpi_size}x${hdpi_size})"
resize_image $hdpi_size $hdpi_size "$hdpi_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-hdpi/ic_launcher_round.png (${hdpi_size}x${hdpi_size})"
resize_image $hdpi_size $hdpi_size "$hdpi_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-hdpi/ic_launcher_foreground.png (${hdpi_size}x${hdpi_size})"

# Generate icons for xhdpi (96x96)
xhdpi_size=96
xhdpi_dir="$ANDROID_RES_DIR/mipmap-xhdpi"
mkdir -p "$xhdpi_dir"
resize_image $xhdpi_size $xhdpi_size "$xhdpi_dir/ic_launcher.png" && echo "✅ Generated mipmap-xhdpi/ic_launcher.png (${xhdpi_size}x${xhdpi_size})"
resize_image $xhdpi_size $xhdpi_size "$xhdpi_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-xhdpi/ic_launcher_round.png (${xhdpi_size}x${xhdpi_size})"
resize_image $xhdpi_size $xhdpi_size "$xhdpi_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-xhdpi/ic_launcher_foreground.png (${xhdpi_size}x${xhdpi_size})"

# Generate icons for xxhdpi (144x144)
xxhdpi_size=144
xxhdpi_dir="$ANDROID_RES_DIR/mipmap-xxhdpi"
mkdir -p "$xxhdpi_dir"
resize_image $xxhdpi_size $xxhdpi_size "$xxhdpi_dir/ic_launcher.png" && echo "✅ Generated mipmap-xxhdpi/ic_launcher.png (${xxhdpi_size}x${xxhdpi_size})"
resize_image $xxhdpi_size $xxhdpi_size "$xxhdpi_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-xxhdpi/ic_launcher_round.png (${xxhdpi_size}x${xxhdpi_size})"
resize_image $xxhdpi_size $xxhdpi_size "$xxhdpi_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-xxhdpi/ic_launcher_foreground.png (${xxhdpi_size}x${xxhdpi_size})"

# Generate icons for xxxhdpi (192x192)
xxxhdpi_size=192
xxxhdpi_dir="$ANDROID_RES_DIR/mipmap-xxxhdpi"
mkdir -p "$xxxhdpi_dir"
resize_image $xxxhdpi_size $xxxhdpi_size "$xxxhdpi_dir/ic_launcher.png" && echo "✅ Generated mipmap-xxxhdpi/ic_launcher.png (${xxxhdpi_size}x${xxxhdpi_size})"
resize_image $xxxhdpi_size $xxxhdpi_size "$xxxhdpi_dir/ic_launcher_round.png" && echo "✅ Generated mipmap-xxxhdpi/ic_launcher_round.png (${xxxhdpi_size}x${xxxhdpi_size})"
resize_image $xxxhdpi_size $xxxhdpi_size "$xxxhdpi_dir/ic_launcher_foreground.png" && echo "✅ Generated mipmap-xxxhdpi/ic_launcher_foreground.png (${xxxhdpi_size}x${xxxhdpi_size})"

echo ""
echo "🎉 Android app icons generated successfully!"
echo "📝 Icons generated from: $SOURCE_ICON"
echo "📦 All icons have been placed in their respective mipmap directories."
