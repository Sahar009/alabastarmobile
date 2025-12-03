#!/bin/bash
# Create a 1024x1024 canvas with 614px icon centered
sips -z 614 614 assets/mobileicon.png --out /tmp/icon_614.png
# Create white background
sips -z 1024 1024 --setProperty format png --padToHeightWidth 1024 1024 --padColor FFFFFF /tmp/icon_614.png --out assets/mobileicon_padded.png
echo "Created padded icon"
