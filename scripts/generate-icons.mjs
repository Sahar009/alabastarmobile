import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const sourceIcon = join(process.cwd(), 'assets', 'IMG_3183.JPEG');
const androidBasePath = join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
const iosBasePath = join(process.cwd(), 'ios', 'AlabastarMobile', 'Images.xcassets', 'AppIcon.appiconset');

// Android mipmap sizes (density-independent pixels, but actual sizes for each density)
const androidSizes = {
  'mipmap-mdpi': { size: 48, icon: 'ic_launcher.png', round: 'ic_launcher_round.png' },
  'mipmap-hdpi': { size: 72, icon: 'ic_launcher.png', round: 'ic_launcher_round.png' },
  'mipmap-xhdpi': { size: 96, icon: 'ic_launcher.png', round: 'ic_launcher_round.png' },
  'mipmap-xxhdpi': { size: 144, icon: 'ic_launcher.png', round: 'ic_launcher_round.png' },
  'mipmap-xxxhdpi': { size: 192, icon: 'ic_launcher.png', round: 'ic_launcher_round.png' },
};

// iOS AppIcon sizes
const iosSizes = [
  { size: 40, scale: 2, idiom: 'iphone', filename: 'AppIcon-40@2x.png' },
  { size: 40, scale: 3, idiom: 'iphone', filename: 'AppIcon-40@3x.png' },
  { size: 60, scale: 2, idiom: 'iphone', filename: 'AppIcon-60@2x.png' },
  { size: 60, scale: 3, idiom: 'iphone', filename: 'AppIcon-60@3x.png' },
  { size: 58, scale: 2, idiom: 'iphone', filename: 'AppIcon-58@2x.png' },
  { size: 87, scale: 3, idiom: 'iphone', filename: 'AppIcon-87@3x.png' },
  { size: 80, scale: 2, idiom: 'iphone', filename: 'AppIcon-80@2x.png' },
  { size: 120, scale: 2, idiom: 'iphone', filename: 'AppIcon-120@2x.png' },
  { size: 120, scale: 3, idiom: 'iphone', filename: 'AppIcon-120@3x.png' },
  { size: 180, scale: 3, idiom: 'iphone', filename: 'AppIcon-180@3x.png' },
  { size: 1024, scale: 1, idiom: 'ios-marketing', filename: 'AppIcon-1024.png' },
];

async function generateIcon(size, outputPath, isRound = false) {
  try {
    const actualSize = size;
    // Add padding to make icon smaller (35% padding = 30% of original size, reduced for smaller icon)
    const paddingPercent = 0.35;
    const iconSize = Math.floor(actualSize * (1 - paddingPercent * 2));
    const padding = Math.floor((actualSize - iconSize) / 2);
    
    let image = sharp(sourceIcon);
    
    if (isRound) {
      // Create a rounded icon with transparent corners
      const svg = `
        <svg width="${actualSize}" height="${actualSize}">
          <rect width="${actualSize}" height="${actualSize}" rx="${actualSize * 0.22}" ry="${actualSize * 0.22}" fill="white"/>
        </svg>
      `;
      
      // Resize the icon to fit within padding
      image = image.resize(iconSize, iconSize, { fit: 'cover' });
      
      // Create rounded mask
      const roundedMask = Buffer.from(svg);
      const mask = await sharp(roundedMask)
        .resize(actualSize, actualSize)
        .greyscale()
        .toBuffer();
      
      // Composite: resize icon, center it, then apply rounded mask
      const resized = await image.toBuffer();
      await sharp({
        create: {
          width: actualSize,
          height: actualSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([
          { input: resized, left: padding, top: padding },
          { input: mask, blend: 'dest-in' }
        ])
        .png()
        .toFile(outputPath);
    } else {
      // Square icon with padding (centered)
      const resized = await image
        .resize(iconSize, iconSize, { fit: 'cover' })
        .toBuffer();
      
      await sharp({
        create: {
          width: actualSize,
          height: actualSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        }
      })
        .composite([
          { input: resized, left: padding, top: padding }
        ])
        .png()
        .toFile(outputPath);
    }
    
    console.log(`✓ Generated ${outputPath} (${actualSize}x${actualSize} with ${iconSize}x${iconSize} icon)`);
  } catch (error) {
    console.error(`✗ Error generating ${outputPath}:`, error.message);
  }
}

async function generateAndroidIcons() {
  console.log('\n📱 Generating Android icons...');
  
  for (const [folder, config] of Object.entries(androidSizes)) {
    const folderPath = join(androidBasePath, folder);
    
    // Ensure directory exists
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }
    
    // Generate square icon
    await generateIcon(
      config.size,
      join(folderPath, config.icon),
      false
    );
    
    // Generate round icon
    await generateIcon(
      config.size,
      join(folderPath, config.round),
      true
    );
  }
}

async function generateIOSIcons() {
  console.log('\n🍎 Generating iOS icons...');
  
  // Ensure directory exists
  if (!existsSync(iosBasePath)) {
    await mkdir(iosBasePath, { recursive: true });
  }
  
  for (const iconConfig of iosSizes) {
    const actualSize = iconConfig.size * iconConfig.scale;
    const outputPath = join(iosBasePath, iconConfig.filename);
    await generateIcon(actualSize, outputPath, false);
  }
  
  // Update Contents.json
  const contentsJson = {
    images: iosSizes.map(icon => ({
      size: `${icon.size}x${icon.size}`,
      idiom: icon.idiom,
      filename: icon.filename,
      scale: `${icon.scale}x`
    })),
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  await writeFile(
    join(iosBasePath, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  
  console.log('✓ Updated iOS Contents.json');
}

async function main() {
  console.log('🎨 Starting icon generation...');
  console.log(`Source: ${sourceIcon}`);
  
  if (!existsSync(sourceIcon)) {
    console.error(`✗ Source icon not found: ${sourceIcon}`);
    process.exit(1);
  }
  
  try {
    await generateAndroidIcons();
    await generateIOSIcons();
    console.log('\n✅ Icon generation complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Rebuild your Android app: cd android && ./gradlew clean');
    console.log('   2. Rebuild your iOS app in Xcode (Product > Clean Build Folder)');
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

main();
