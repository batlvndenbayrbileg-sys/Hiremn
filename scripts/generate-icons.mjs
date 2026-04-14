#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const mascotPath = './public/mascot.jpg';
const outputDir = './public';

async function generateIcons() {
  console.log('[v0] Starting icon generation from mascot...');
  
  try {
    // Generate 32x32 light version
    await sharp(mascotPath)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(path.join(outputDir, 'icon-light-32x32.png'));
    console.log('[v0] Generated icon-light-32x32.png');

    // Generate 32x32 dark version (same image, just renamed)
    await sharp(mascotPath)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(path.join(outputDir, 'icon-dark-32x32.png'));
    console.log('[v0] Generated icon-dark-32x32.png');

    // Generate SVG version (convert PNG to SVG-like output, but we'll use PNG scaled up)
    await sharp(mascotPath)
      .resize(256, 256, { fit: 'cover' })
      .png()
      .toFile(path.join(outputDir, 'icon.png'));
    console.log('[v0] Generated icon.png');

    // For Apple icon
    await sharp(mascotPath)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(path.join(outputDir, 'apple-icon.png'));
    console.log('[v0] Generated apple-icon.png');

    console.log('[v0] Icon generation completed successfully!');
  } catch (error) {
    console.error('[v0] Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
