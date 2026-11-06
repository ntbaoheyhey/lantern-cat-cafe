"""Pack the two demo comparison screenshots with pixel-identical WebP encoding."""

import gzip
import hashlib
import json
from pathlib import Path

from PIL import Image, __version__ as pillow_version


root = Path(__file__).resolve().parents[2]
output = root / "reports/cardrpg-big/demo/packaging"
output.mkdir(parents=True, exist_ok=True)
sources = {
    "baseline.webp": "reports/cardrpg-big/baseline/screens/1280-battle.png",
    "automatic.webp": "reports/cardrpg-big/flow/screens/1280-mochi-4.png",
}
rows = []

for filename, source in sources.items():
    source_bytes = (root / source).read_bytes()
    target = output / filename
    with Image.open(root / source) as image:
        original = image.convert("RGBA")
    original.save(target, format="WEBP", lossless=True, method=6, exact=True)
    with Image.open(target) as image:
        decoded = image.convert("RGBA")
    assert original.size == decoded.size
    assert original.tobytes() == decoded.tobytes(), source
    encoded = target.read_bytes()
    rows.append({
        "source": source,
        "output": str(target.relative_to(root)),
        "width": original.width,
        "height": original.height,
        "pngBytes": len(source_bytes),
        "webpBytes": len(encoded),
        "gzipPngBytes": len(gzip.compress(source_bytes, compresslevel=9)),
        "gzipWebpBytes": len(gzip.compress(encoded, compresslevel=9)),
        "sourceSha256": hashlib.sha256(source_bytes).hexdigest(),
        "outputSha256": hashlib.sha256(encoded).hexdigest(),
        "decodedRgbaSha256": hashlib.sha256(original.tobytes()).hexdigest(),
        "pixelsEqual": True,
    })

receipt = {
    "references": ["tools/cardrpg-big/pack-comparisons.py", *sources.values()],
    "tool": f"Pillow {pillow_version}",
    "parameters": {"format": "WEBP", "lossless": True, "method": 6, "exact": True},
    "rows": rows,
}
(output / "pixels.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"images": len(rows), "pixelsEqual": True,
                  "gzipBytesSaved": sum(row["gzipPngBytes"] - row["gzipWebpBytes"] for row in rows)}))
