#!/bin/bash

# Script to generate iOS app icons with larger logo
# This script uses ImageMagick or sips (macOS built-in) to resize the logo

SOURCE_ICON="assets/IMG_3183.JPEG"
OUTPUT_DIR="ios/AlabastarMobile/Images.xcassets/AppIcon.appiconset"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Source icon not found: $SOURCE_ICON"
    exit 1
fi

# Check if output directory exists
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "❌ Output directory not found: $OUTPUT_DIR"
    exit 1
fi

echo "🖼️  Generating iOS app icons with larger logo..."

# Function to resize image (using sips on macOS or convert if ImageMagick is available)
resize_image() {
    local size=$1
    local output=$2
    
    if command -v sips &> /dev/null; then
        # Use macOS built-in sips command - convert to PNG and resize
        sips -s format png -z $size $size "$SOURCE_ICON" --out "$output" > /dev/null 2>&1
    elif command -v convert &> /dev/null; then
        # Use ImageMagick convert command
        convert "$SOURCE_ICON" -resize "${size}x${size}" "$output"
    else
        echo "⚠️  Neither sips nor ImageMagick found. Please install ImageMagick or use macOS."
        return 1
    fi
}

# Generate all required iOS icon sizes
# Note: iOS icons should be square, so we use the same size for width and height
# The sizes below are the actual pixel dimensions (size * scale)

echo "📱 Generating iOS icons..."

# 40pt @2x = 80px
resize_image 80 "$OUTPUT_DIR/AppIcon-40@2x.png" && echo "✅ Generated AppIcon-40@2x.png (80x80)"

# 40pt @3x = 120px
resize_image 120 "$OUTPUT_DIR/AppIcon-40@3x.png" && echo "✅ Generated AppIcon-40@3x.png (120x120)"

# 60pt @2x = 120px
resize_image 120 "$OUTPUT_DIR/AppIcon-60@2x.png" && echo "✅ Generated AppIcon-60@2x.png (120x120)"

# 60pt @3x = 180px
resize_image 180 "$OUTPUT_DIR/AppIcon-60@3x.png" && echo "✅ Generated AppIcon-60@3x.png (180x180)"

# 58pt @2x = 116px
resize_image 116 "$OUTPUT_DIR/AppIcon-58@2x.png" && echo "✅ Generated AppIcon-58@2x.png (116x116)"

# 87pt @3x = 261px
resize_image 261 "$OUTPUT_DIR/AppIcon-87@3x.png" && echo "✅ Generated AppIcon-87@3x.png (261x261)"

# 80pt @2x = 160px
resize_image 160 "$OUTPUT_DIR/AppIcon-80@2x.png" && echo "✅ Generated AppIcon-80@2x.png (160x160)"

# 120pt @2x = 240px
resize_image 240 "$OUTPUT_DIR/AppIcon-120@2x.png" && echo "✅ Generated AppIcon-120@2x.png (240x240)"

# 120pt @3x = 360px
resize_image 360 "$OUTPUT_DIR/AppIcon-120@3x.png" && echo "✅ Generated AppIcon-120@3x.png (360x360)"

# 180pt @3x = 540px
resize_image 540 "$OUTPUT_DIR/AppIcon-180@3x.png" && echo "✅ Generated AppIcon-180@3x.png (540x540)"

# 1024x1024 (App Store)
resize_image 1024 "$OUTPUT_DIR/AppIcon-1024.png" && echo "✅ Generated AppIcon-1024.png (1024x1024)"

echo ""
echo "🎉 iOS app icons generated successfully!"
echo "📝 Icons generated from: $SOURCE_ICON"

