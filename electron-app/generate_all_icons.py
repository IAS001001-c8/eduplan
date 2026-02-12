#!/usr/bin/env python3
"""
Generate ALL required icons for Microsoft Store from EduPlan logo.
This script creates every icon size and variant needed for Windows Store certification.
"""

from PIL import Image
import os
import shutil

# Source logo
SOURCE_LOGO = "/tmp/eduplan_logo.png"

# Output directories
ASSETS_DIR = "/app/electron-app/assets"
BUILD_DIR = "/app/electron-app/build"
PUBLIC_DIR = "/app/public"

def create_square_icon(source_img, size, output_path, padding_percent=10):
    """Create a square icon with padding, centered on white background."""
    # Create white background
    result = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    
    # Calculate padding
    padding = int(size * padding_percent / 100)
    inner_size = size - (padding * 2)
    
    # Resize source maintaining aspect ratio
    source_copy = source_img.copy()
    source_copy.thumbnail((inner_size, inner_size), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (size - source_copy.width) // 2
    y = (size - source_copy.height) // 2
    
    # Paste with alpha channel support
    if source_copy.mode == 'RGBA':
        result.paste(source_copy, (x, y), source_copy)
    else:
        result.paste(source_copy, (x, y))
    
    # Convert to RGB for certain formats
    if output_path.endswith('.ico'):
        result = result.convert('RGB')
    
    result.save(output_path, quality=95)
    print(f"  Created: {output_path} ({size}x{size})")

def create_wide_icon(source_img, width, height, output_path, padding_percent=10):
    """Create a wide icon (e.g., 310x150) with the logo centered."""
    result = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    
    padding = int(min(width, height) * padding_percent / 100)
    inner_height = height - (padding * 2)
    inner_width = width - (padding * 2)
    
    source_copy = source_img.copy()
    source_copy.thumbnail((inner_width, inner_height), Image.Resampling.LANCZOS)
    
    x = (width - source_copy.width) // 2
    y = (height - source_copy.height) // 2
    
    if source_copy.mode == 'RGBA':
        result.paste(source_copy, (x, y), source_copy)
    else:
        result.paste(source_copy, (x, y))
    
    result.save(output_path, quality=95)
    print(f"  Created: {output_path} ({width}x{height})")

def create_ico_file(source_img, output_path):
    """Create a Windows .ico file with multiple sizes."""
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icons = []
    
    for size in sizes:
        img = Image.new('RGBA', size, (255, 255, 255, 255))
        source_copy = source_img.copy()
        
        # Calculate inner size with padding
        inner_size = int(size[0] * 0.85)
        source_copy.thumbnail((inner_size, inner_size), Image.Resampling.LANCZOS)
        
        x = (size[0] - source_copy.width) // 2
        y = (size[1] - source_copy.height) // 2
        
        if source_copy.mode == 'RGBA':
            img.paste(source_copy, (x, y), source_copy)
        else:
            img.paste(source_copy, (x, y))
        
        icons.append(img)
    
    # Save as .ico with all sizes
    icons[0].save(output_path, format='ICO', sizes=[(s[0], s[1]) for s in sizes])
    print(f"  Created: {output_path} (multi-size .ico)")

def main():
    print("=" * 60)
    print("EduPlan Icon Generator for Microsoft Store")
    print("=" * 60)
    
    # Load source logo
    print(f"\nLoading source logo: {SOURCE_LOGO}")
    source_img = Image.open(SOURCE_LOGO).convert('RGBA')
    print(f"  Source size: {source_img.width}x{source_img.height}")
    
    # Create output directories
    os.makedirs(ASSETS_DIR, exist_ok=True)
    os.makedirs(BUILD_DIR, exist_ok=True)
    
    # ===== ASSETS DIRECTORY =====
    print(f"\n1. Creating icons in {ASSETS_DIR}:")
    create_square_icon(source_img, 256, f"{ASSETS_DIR}/icon.png")
    create_ico_file(source_img, f"{ASSETS_DIR}/icon.ico")
    
    # ===== BUILD DIRECTORY (Microsoft Store icons) =====
    print(f"\n2. Creating Microsoft Store icons in {BUILD_DIR}:")
    
    # Square44x44Logo - App list icon
    print("\n  Square44x44Logo:")
    for scale, size in [(100, 44), (125, 55), (150, 66), (200, 88), (400, 176)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square44x44Logo.scale-{scale}.png")
    create_square_icon(source_img, 44, f"{BUILD_DIR}/Square44x44Logo.png")
    
    # Target sizes for Square44x44Logo
    print("\n  Square44x44Logo target sizes:")
    for size in [16, 24, 32, 48, 256]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square44x44Logo.targetsize-{size}.png")
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square44x44Logo.targetsize-{size}_altform-unplated.png")
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square44x44Logo.targetsize-{size}_altform-lightunplated.png")
    
    # Square71x71Logo - Small tile
    print("\n  Square71x71Logo:")
    for scale, size in [(100, 71), (125, 89), (150, 107), (200, 142), (400, 284)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square71x71Logo.scale-{scale}.png")
    create_square_icon(source_img, 71, f"{BUILD_DIR}/Square71x71Logo.png")
    
    # Square150x150Logo - Medium tile
    print("\n  Square150x150Logo:")
    for scale, size in [(100, 150), (125, 188), (150, 225), (200, 300), (400, 600)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square150x150Logo.scale-{scale}.png")
    create_square_icon(source_img, 150, f"{BUILD_DIR}/Square150x150Logo.png")
    
    # Square310x310Logo - Large tile
    print("\n  Square310x310Logo:")
    for scale, size in [(100, 310), (125, 388), (150, 465), (200, 620)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/Square310x310Logo.scale-{scale}.png")
    create_square_icon(source_img, 310, f"{BUILD_DIR}/Square310x310Logo.png")
    
    # Wide310x150Logo - Wide tile
    print("\n  Wide310x150Logo:")
    for scale, (w, h) in [(100, (310, 150)), (125, (388, 188)), (150, (465, 225)), (200, (620, 300))]:
        create_wide_icon(source_img, w, h, f"{BUILD_DIR}/Wide310x150Logo.scale-{scale}.png")
    create_wide_icon(source_img, 310, 150, f"{BUILD_DIR}/Wide310x150Logo.png")
    
    # StoreLogo - Store listing icon
    print("\n  StoreLogo:")
    for scale, size in [(100, 50), (125, 63), (150, 75), (200, 100), (400, 200)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/StoreLogo.scale-{scale}.png")
    create_square_icon(source_img, 50, f"{BUILD_DIR}/StoreLogo.png")
    
    # BadgeLogo - Badge/notification icon
    print("\n  BadgeLogo:")
    for scale, size in [(100, 24), (125, 30), (150, 36), (200, 48), (400, 96)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/BadgeLogo.scale-{scale}.png")
    create_square_icon(source_img, 24, f"{BUILD_DIR}/BadgeLogo.png")
    
    # LockScreenLogo
    print("\n  LockScreenLogo:")
    for scale, size in [(100, 24), (200, 48)]:
        create_square_icon(source_img, size, f"{BUILD_DIR}/LockScreenLogo.scale-{scale}.png")
    create_square_icon(source_img, 24, f"{BUILD_DIR}/LockScreenLogo.png")
    
    # SplashScreen - Splash screen
    print("\n  SplashScreen:")
    for scale, (w, h) in [(100, (620, 300)), (125, (775, 375)), (150, (930, 450)), (200, (1240, 600))]:
        create_wide_icon(source_img, w, h, f"{BUILD_DIR}/SplashScreen.scale-{scale}.png")
    create_wide_icon(source_img, 620, 300, f"{BUILD_DIR}/SplashScreen.png")
    
    # Main icon in build directory
    create_square_icon(source_img, 256, f"{BUILD_DIR}/icon.png")
    
    # ===== PUBLIC DIRECTORY =====
    print(f"\n3. Creating icons in {PUBLIC_DIR}:")
    create_square_icon(source_img, 192, f"{PUBLIC_DIR}/icon-192x192.png")
    create_square_icon(source_img, 512, f"{PUBLIC_DIR}/icon-512x512.png")
    create_square_icon(source_img, 180, f"{PUBLIC_DIR}/apple-icon.png")
    create_square_icon(source_img, 32, f"{PUBLIC_DIR}/favicon.png")
    
    # Also update the main logo
    source_img.save(f"{PUBLIC_DIR}/images/logo-eduplan.png")
    print(f"  Updated: {PUBLIC_DIR}/images/logo-eduplan.png")
    
    print("\n" + "=" * 60)
    print("Icon generation complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. cd /app/electron-app")
    print("2. npm run build:win")
    print("3. Submit the new .appx to Microsoft Store")

if __name__ == "__main__":
    main()
