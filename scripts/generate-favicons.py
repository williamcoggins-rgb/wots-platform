#!/usr/bin/env python3
"""
Generate all favicon/icon variants from the WOTS Cloudinary logo.

Requires: pip install Pillow requests

Usage:
  python scripts/generate-favicons.py

Downloads the logo once, then generates:
  frontend/public/favicon.ico        (multi-size: 16x16 + 32x32)
  frontend/public/favicon-16x16.png
  frontend/public/favicon-32x32.png
  frontend/public/apple-touch-icon.png  (180x180)
  frontend/public/android-chrome-192x192.png
  frontend/public/android-chrome-512x512.png
"""

import os
import io
import requests
from PIL import Image

LOGO_URL = "https://res.cloudinary.com/dcpeomifz/image/upload/v1775484956/image0_2_om8az4.png"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")

SIZES = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "apple-touch-icon.png": (180, 180),
    "android-chrome-192x192.png": (192, 192),
    "android-chrome-512x512.png": (512, 512),
}


def main():
    print(f"Downloading logo from {LOGO_URL}...")
    resp = requests.get(LOGO_URL, timeout=30)
    resp.raise_for_status()
    logo = Image.open(io.BytesIO(resp.content)).convert("RGBA")
    print(f"Logo size: {logo.size[0]}x{logo.size[1]}")

    os.makedirs(OUT_DIR, exist_ok=True)

    for filename, size in SIZES.items():
        resized = logo.resize(size, Image.LANCZOS)
        path = os.path.join(OUT_DIR, filename)
        resized.save(path, "PNG")
        print(f"  {filename} ({size[0]}x{size[1]})")

    # Multi-size favicon.ico
    ico_16 = logo.resize((16, 16), Image.LANCZOS)
    ico_32 = logo.resize((32, 32), Image.LANCZOS)
    ico_path = os.path.join(OUT_DIR, "favicon.ico")
    ico_16.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32)],
                append_images=[ico_32])
    print(f"  favicon.ico (16x16 + 32x32)")

    print("\nDone. All icons saved to frontend/public/")


if __name__ == "__main__":
    main()
