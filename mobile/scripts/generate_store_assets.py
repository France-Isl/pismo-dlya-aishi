#!/usr/bin/env python3
"""Generate store artwork and native launcher icons from the lake scene."""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


SCRIPT_DIR = Path(__file__).resolve().parent
MOBILE_ROOT = SCRIPT_DIR.parent
WEB_ROOT = MOBILE_ROOT.parent


def load_source(path: Path) -> Image.Image:
    if path.is_file():
        return Image.open(path).convert("RGB")
    encoded = path.with_suffix(path.suffix + ".b64")
    if not encoded.is_file():
        raise FileNotFoundError(f"Neither {path} nor {encoded} exists")
    compact = "".join(encoded.read_text(encoding="ascii").split())
    from io import BytesIO

    return Image.open(BytesIO(base64.b64decode(compact, validate=True))).convert("RGB")


def cover(image: Image.Image, size: tuple[int, int], centering=(0.5, 0.5)) -> Image.Image:
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=centering)


def find_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def make_icon(source: Image.Image, size: int) -> Image.Image:
    # The fire and the two characters stay close to center in the source scene.
    icon = cover(source, (size, size), centering=(0.54, 0.52))
    icon = ImageEnhance.Color(icon).enhance(1.08)
    icon = ImageEnhance.Contrast(icon).enhance(1.05)

    # A restrained vignette preserves legibility when launchers apply a mask.
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    margin = max(1, size // 18)
    draw.ellipse((-margin, -margin, size + margin, size + margin), fill=235)
    mask = mask.filter(ImageFilter.GaussianBlur(max(1, size // 7)))
    shade = Image.new("RGB", (size, size), (15, 11, 20))
    return Image.composite(icon, shade, mask).convert("RGB")


def make_feature_graphic(source: Image.Image) -> Image.Image:
    width, height = 1024, 500
    canvas = cover(source, (width, height), centering=(0.57, 0.50))
    canvas = ImageEnhance.Color(canvas).enhance(1.05)

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = overlay.load()
    for x in range(width):
        left_strength = int(185 * max(0.0, 1.0 - x / (width * 0.68)) ** 1.35)
        for y in range(height):
            bottom = int(48 * (y / height) ** 2)
            pixels[x, y] = (19, 12, 24, min(215, left_strength + bottom))
    composed = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    draw = ImageDraw.Draw(composed)
    title_font = find_font(64, bold=True)
    subtitle_font = find_font(27, bold=False)
    draw.text((64, 165), "НурПисьмо", font=title_font, fill=(255, 247, 235, 255), stroke_width=1, stroke_fill=(70, 32, 48, 170))
    draw.text((67, 250), "Тёплые слова, которые хочется сохранить", font=subtitle_font, fill=(255, 226, 234, 242))
    draw.rounded_rectangle((66, 314, 282, 362), radius=24, fill=(197, 104, 139, 225))
    button_font = find_font(21, bold=True)
    draw.text((96, 325), "ПИСЬМО С ДУШОЙ", font=button_font, fill=(255, 250, 245, 255))
    return composed.convert("RGB")


ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


IOS_ICONS = [
    ("icon-20@2x.png", 40, "20x20", "2x", "iphone"),
    ("icon-20@3x.png", 60, "20x20", "3x", "iphone"),
    ("icon-29@2x.png", 58, "29x29", "2x", "iphone"),
    ("icon-29@3x.png", 87, "29x29", "3x", "iphone"),
    ("icon-40@2x.png", 80, "40x40", "2x", "iphone"),
    ("icon-40@3x.png", 120, "40x40", "3x", "iphone"),
    ("icon-60@2x.png", 120, "60x60", "2x", "iphone"),
    ("icon-60@3x.png", 180, "60x60", "3x", "iphone"),
    ("icon-ipad-20@1x.png", 20, "20x20", "1x", "ipad"),
    ("icon-ipad-20@2x.png", 40, "20x20", "2x", "ipad"),
    ("icon-ipad-29@1x.png", 29, "29x29", "1x", "ipad"),
    ("icon-ipad-29@2x.png", 58, "29x29", "2x", "ipad"),
    ("icon-ipad-40@1x.png", 40, "40x40", "1x", "ipad"),
    ("icon-ipad-40@2x.png", 80, "40x40", "2x", "ipad"),
    ("icon-ipad-76@1x.png", 76, "76x76", "1x", "ipad"),
    ("icon-ipad-76@2x.png", 152, "76x76", "2x", "ipad"),
    ("icon-ipad-83.5@2x.png", 167, "83.5x83.5", "2x", "ipad"),
    ("icon-store-1024.png", 1024, "1024x1024", "1x", "ios-marketing"),
]


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "PNG", optimize=True)


def generate_android(source: Image.Image) -> None:
    resources = MOBILE_ROOT / "android" / "app" / "src" / "main" / "res"
    fallback = resources / "mipmap-anydpi" / "ic_launcher.xml"
    if fallback.exists():
        # The checked-in vector lets the project configure before Pillow runs.
        # Density-specific photo icons become authoritative after generation.
        fallback.unlink()
    for folder, size in ANDROID_SIZES.items():
        save_png(make_icon(source, size), resources / folder / "ic_launcher.png")


def generate_ios(source: Image.Image) -> None:
    app_icon = MOBILE_ROOT / "ios" / "NurPismo" / "Assets.xcassets" / "AppIcon.appiconset"
    app_icon.mkdir(parents=True, exist_ok=True)
    images = []
    for filename, pixels, logical_size, scale, idiom in IOS_ICONS:
        save_png(make_icon(source, pixels), app_icon / filename)
        images.append({
            "filename": filename,
            "idiom": idiom,
            "scale": scale,
            "size": logical_size,
        })
    (app_icon / "Contents.json").write_text(
        json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )
    assets = app_icon.parent
    (assets / "Contents.json").write_text(
        json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=WEB_ROOT / "assets" / "campfire-lake.png")
    args = parser.parse_args()
    source = load_source(args.source.resolve())

    store_assets = MOBILE_ROOT / "store-assets"
    save_png(make_icon(source, 512), store_assets / "nurpismo-play-icon-512.png")
    save_png(make_feature_graphic(source), store_assets / "nurpismo-feature-1024x500.png")
    generate_android(source)
    generate_ios(source)
    print(f"Generated native and store assets in {MOBILE_ROOT}")


if __name__ == "__main__":
    main()
