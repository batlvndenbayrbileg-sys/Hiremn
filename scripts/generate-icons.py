#!/usr/bin/env python3
import sys
from PIL import Image
import os

try:
    # Load mascot image
    mascot = Image.open('/vercel/share/v0-project/public/mascot.jpg')
    
    # Convert to RGBA if needed
    if mascot.mode != 'RGBA':
        mascot = mascot.convert('RGBA')
    
    # Create light version (32x32)
    light_icon = mascot.resize((32, 32), Image.Resampling.LANCZOS)
    light_icon.save('/vercel/share/v0-project/public/icon-light-32x32.png')
    print("[v0] Created icon-light-32x32.png")
    
    # Create dark version (32x32) - same as light for now
    dark_icon = mascot.resize((32, 32), Image.Resampling.LANCZOS)
    dark_icon.save('/vercel/share/v0-project/public/icon-dark-32x32.png')
    print("[v0] Created icon-dark-32x32.png")
    
    # Create standard icon (192x192)
    standard_icon = mascot.resize((192, 192), Image.Resampling.LANCZOS)
    standard_icon.save('/vercel/share/v0-project/public/icon.png')
    print("[v0] Created icon.png")
    
    # Create apple icon (180x180)
    apple_icon = mascot.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('/vercel/share/v0-project/public/apple-icon.png')
    print("[v0] Created apple-icon.png")
    
    print("[v0] All icons generated successfully!")
    
except Exception as e:
    print(f"[v0] Error: {e}", file=sys.stderr)
    sys.exit(1)
