"""Compose the measured camera comparison and its conservative bounds overlay."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

directory = Path(sys.argv[1] if len(sys.argv) > 1 else "reports/cardrpg-big/layout")
data = json.loads((directory / "measurements.json").read_text())
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 22)
small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 17)

for width in (1280, 1440, 1024):
    rows = [row for row in data["rows"] if row["width"] == width and row["sample"] == 0]
    comparison = Image.new("RGB", (width * len(rows), rows[0]["height"] + 90), "#211d2a")
    draw = ImageDraw.Draw(comparison)
    for index, row in enumerate(rows):
        screenshot = Image.open(directory / f"{width}-{row['preset']}-{row['id']}.png").convert("RGB")
        comparison.paste(screenshot, (index * width, 90))
        heroes = [unit for unit in row["units"] if unit["side"] == "party"]
        low = min(unit["heightFraction"] for unit in heroes) * 100
        high = max(unit["heightFraction"] for unit in heroes) * 100
        draw.text((index * width + 20, 14), row["preset"].capitalize(), font=font, fill="#f1d1a1")
        draw.text((index * width + 20, 48), f"Stage {row['stageFraction'] * 100:.1f}% | Hero heights {low:.1f}-{high:.1f}%", font=small, fill="#eee4da")
    comparison.save(directory / f"{width}-camera-comparison.webp", quality=88)

    row = next(row for row in rows if row["preset"] == "wide")
    overlay = Image.open(directory / f"{width}-wide-{row['id']}.png").convert("RGB")
    draw = ImageDraw.Draw(overlay)
    for unit in row["units"]:
        for key, color in (("box", "#68edd8"), ("faceBox", "#f3c574")):
            box = unit[key]
            draw.rectangle((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"]), outline=color, width=2)
    for item in row["hud"]:
        box = item["box"]
        draw.rectangle((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"]), outline="#d69af3", width=2)
    overlay.save(directory / f"{width}-bounds.webp", quality=90)

print(json.dumps({"directory": str(directory), "comparison_sizes": [1280, 1440, 1024]}))
