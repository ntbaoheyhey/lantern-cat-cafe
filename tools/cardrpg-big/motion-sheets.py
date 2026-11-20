"""Assemble captured game frames into compressed evidence sheets."""
import json
from pathlib import Path
import sys

from PIL import Image, ImageDraw

for item in json.loads(Path(sys.argv[1]).read_text()):
    sheet = Image.new("RGB", (1280, 720), "#171827")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 12), item["name"], fill="#f6e9d3")
    # One union crop keeps the action's travel visible across all eight frames.
    bounds = item["bounds"]
    left = min(box["x"] for box in bounds) - 48
    top = min(box["y"] for box in bounds) - 40
    right = max(box["x"] + box["width"] for box in bounds) + 48
    bottom = max(box["y"] + box["height"] for box in bounds) + 40
    for index, path in enumerate(item["frames"]):
        frame = Image.open(path).convert("RGB")
        frame = frame.crop((max(0, int(left)), max(0, int(top)),
                            min(frame.width, int(right)), min(frame.height, int(bottom))))
        frame.thumbnail((316, 314), Image.Resampling.LANCZOS)
        x = (index % 4) * 320 + (320 - frame.width) // 2
        y = 56 + (index // 4) * 332
        sheet.paste(frame, (x, y))
        draw.text(((index % 4) * 320 + 8, y - 18), f"{index / 7:.2f}", fill="#fff4dc")
    output = Path(item["output"])
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "WEBP", quality=85, method=6)
