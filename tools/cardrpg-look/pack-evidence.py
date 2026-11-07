"""Archive screenshot pixels without changing measurements or deleting originals.

RGBA XOR prediction shares the unchanged stage between neighboring captures.
Every decoded image is verified. PNG container bytes can differ on restoration;
both the original file SHA and the invariant decoded-pixel SHA are recorded.
"""
import argparse
import hashlib
import io
import json
import zlib
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('directory', type=Path)
parser.add_argument('archive', type=Path)
parser.add_argument('--restore', action='store_true')
parser.add_argument('--destination', type=Path, default=Path('.'))
args = parser.parse_args()
sha = lambda data: hashlib.sha256(data).hexdigest()

if args.restore:
    previous = {}
    destination = args.destination.resolve()
    with zipfile.ZipFile(args.archive) as bundle:
        manifest = json.loads(bundle.read('manifest.json'))
        for row in manifest['images']:
            path = (destination / row['path']).resolve()
            if not path.is_relative_to(destination):
                raise ValueError('Archive path escapes destination')
            payload = bundle.read(row['entry'])
            if row.get('encoding') == 'png':
                with Image.open(io.BytesIO(payload)) as residual:
                    delta = np.array(residual.convert('RGBA')).reshape(-1)
            else:  # Preserve restoration of the immutable v1 archive.
                delta = np.frombuffer(zlib.decompress(payload), dtype=np.uint8)
            key = row['predictor']
            pixels = np.bitwise_xor(delta, previous[key]) if key in previous else delta
            assert sha(pixels.tobytes()) == row['rgbaSha256'], row['path']
            previous[key] = pixels
            image = Image.fromarray(pixels.reshape((row['height'], row['width'], 4)), 'RGBA')
            if path.exists():
                with Image.open(path) as existing:
                    assert sha(existing.convert('RGBA').tobytes()) == row['rgbaSha256'], row['path']
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                image.save(path)
    print(json.dumps({'restoredOrVerified': len(manifest['images']), 'pixelExact': True}))
else:
    root = Path.cwd().resolve()
    directory = args.directory.resolve()
    if not directory.is_relative_to(root):
        raise ValueError('Only repository-relative evidence can be packed')
    files = sorted(directory.rglob('*.png'))
    if not files:
        raise ValueError('No PNG evidence found')
    if args.archive.exists():
        raise FileExistsError('Keep immutable packs; choose a new output')
    args.archive.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.archive.with_suffix(args.archive.suffix + '.tmp')
    previous, rows = {}, []
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_STORED) as bundle:
        for index, path in enumerate(files):
            encoded = path.read_bytes()
            with Image.open(path) as image:
                image = image.convert('RGBA')
                width, height = image.size
                raw = image.tobytes()
            pixels = np.frombuffer(raw, dtype=np.uint8)
            category = path.stem.rsplit('-', 1)[-1]
            # Adjacent real/without pairs share the same scene and camera.
            if category in {'real', 'without'}:
                category = 'scene'
            key = f'{width}x{height}/{category}'
            delta = np.bitwise_xor(pixels, previous[key]) if key in previous else pixels
            payload = zlib.compress(delta.tobytes(), level=3)
            encoding = 'zlib'
            filtered = io.BytesIO()
            Image.fromarray(delta.reshape((height, width, 4)), 'RGBA').save(filtered, 'PNG', compress_level=3)
            if len(filtered.getbuffer()) < len(payload):
                payload, encoding = filtered.getvalue(), 'png'
                with Image.open(io.BytesIO(payload)) as residual:
                    check = np.array(residual.convert('RGBA')).reshape(-1)
            else:
                check = np.frombuffer(zlib.decompress(payload), dtype=np.uint8)
            check = np.bitwise_xor(check, previous[key]) if key in previous else check
            assert check.tobytes() == raw, path
            entry = f'pixels/{index:05}.xor.{encoding}'
            bundle.writestr(entry, payload)
            rows.append({'path': path.relative_to(root).as_posix(), 'width': width, 'height': height,
                         'sourceBytes': len(encoded), 'pngSha256': sha(encoded), 'rgbaSha256': sha(raw),
                         'entry': entry, 'encoding': encoding, 'predictor': key, 'compressedBytes': len(payload)})
            previous[key] = pixels
        manifest = {'format': 'lantern-rgba-xor-filtered-v2', 'pixelExact': True,
                    'pngContainerByteExact': False, 'originalsDeleted': False,
                    'toolSha256': sha(Path(__file__).read_bytes()), 'images': rows}
        bundle.writestr('manifest.json', json.dumps(manifest, indent=2) + '\n')
    temporary.rename(args.archive)
    receipt = {'archive': args.archive.as_posix(), 'sha256': sha(args.archive.read_bytes()),
               'images': len(rows), 'sourceBytes': sum(row['sourceBytes'] for row in rows),
               'archiveBytes': args.archive.stat().st_size, 'pixelExact': True,
               'pngContainerByteExact': False, 'originalsDeleted': False}
    args.archive.with_suffix('.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
