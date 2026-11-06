"""Losslessly package offline PNG assets; source files and resolution stay intact."""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


def sha(data):
    return hashlib.sha256(data).hexdigest()


request = json.loads(Path(sys.argv[1]).read_text())
cache = Path('/tmp/cardrpg-big2-lossless-images')
cache.mkdir(exist_ok=True)
rows = []
for source in request:
    path = Path(source)
    original = path.read_bytes()
    packed = cache / (sha(original) + '-exact-rgba.webp')
    with Image.open(path) as image:
        # Texture data must retain every channel, including transparent pixels.
        rgba = image.convert('RGBA')
        if not packed.exists():
            rgba.save(packed, 'WEBP', lossless=True, exact=True, quality=100, method=6)
        with Image.open(packed) as decoded:
            restored = decoded.convert('RGBA')
            assert restored.size == rgba.size, str(path)
            assert restored.tobytes() == rgba.tobytes(), str(path)
        rows.append({
            'source': str(path), 'packed': str(packed), 'width': rgba.width,
            'height': rgba.height, 'sourceBytes': len(original),
            'packedBytes': packed.stat().st_size, 'sourceSha256': sha(original),
            'packedSha256': sha(packed.read_bytes()), 'rgbaSha256': sha(rgba.tobytes()),
        })
print(json.dumps(rows))
