#!/usr/bin/env python3
"""Lossless review contact sheets. No generated art or resampling; preserve every source pixel.
Requires the existing standard-library PNG pipeline and cwebp on PATH.
"""
import sys, json, subprocess, hashlib, shutil
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent/'art'))
from pipeline import decode_png, encode_png, pack
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'reports/squad'
RAW = Path('/tmp/taskbar-hero-squad-proof-raw')
RAW.mkdir(parents=True, exist_ok=True)
records = json.loads((OUT/'effects.json').read_text())
manifest = []
def convert(src, dest):
    subprocess.run(['cwebp', '-quiet', '-lossless', '-m', '6', str(src), '-o', str(dest)], check=True)
    manifest.append({'file':str(dest.relative_to(ROOT)), 'bytes':dest.stat().st_size,
                     'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
                     'tool':'cwebp -lossless -m 6', 'source':str(src.relative_to(ROOT)) if src.is_relative_to(ROOT) else str(src)})
for record in records['records']:
    frames = {}
    for i, f in enumerate(record['frames']):
        source = OUT/'effects'/f['file']
        if not source.exists(): source = RAW/f['file']
        frames[f'{i:02}'] = decode_png(source.read_bytes())
    sheet, meta = pack(frames, columns=2, gutter=1)
    temporary = RAW/(record['id']+'-strip.png'); temporary.write_bytes(encode_png(sheet))
    dest = OUT/'effects'/(record['id']+'-strip.webp'); convert(temporary, dest)
    record['sheet'] = 'effects/'+dest.name; record['sheetFrames'] = meta['frames']
    for f in record['frames']:
        src = OUT/'effects'/f['file']
        if src.exists(): shutil.copy2(src, RAW/src.name); src.unlink()
keep_screens = {'group-1280', 'group-1440', 'group-1920', 'boss-1280', 'boss-1440', 'boss-1920', 'patrol-1280', 'calm-1280'}
for folder in ['screens', 'fresh-eyes']:
    if not (OUT/folder).exists(): continue
    for src in (OUT/folder).rglob('*.png'):
        if folder != 'screens' or src.stem in keep_screens:
            convert(src, src.with_suffix('.webp'))
        backup=RAW/folder/src.relative_to(OUT/folder); backup.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src,backup); src.unlink()
# Art-study images are generator outputs and remain PNG; only disposable browser captures convert.
for src in (OUT/'art').glob('full-wave*.png'):
    convert(src,src.with_suffix('.webp')); shutil.copy2(src,RAW/src.name); src.unlink()
records['method'] = 'Controlled fixtures; actual engine events and actual Phaser presenter, 50ms steps. Frames are native 680×330. Lossless two-column contact sheets; frame rectangles and event values retained.'
# Keep only requested comparison views; performance uses numerical evidence, not duplicate images.
for src in (OUT/'screens').glob('*.webp'):
    if src.stem not in keep_screens:
        shutil.copy2(src, RAW/src.name); src.unlink()
# Retain metadata for already-converted captures on repeat runs.
known = {f['file'] for f in manifest}
previous = OUT/'proof-images.json'
if previous.exists():
    for f in json.loads(previous.read_text())['files']:
        if f['file'] not in known and (ROOT/f['file']).exists(): manifest.append(f)
(OUT/'effects.json').write_text(json.dumps(records, separators=(',',':'))+'\n')
(OUT/'proof-images.json').write_text(json.dumps({'date':'2026-11-05','tool':'python3 tools/squad-proof-images.py',
    'parameters':{'columns':2,'gutter':1,'resize':False,'webp':'lossless method 6'},'files':manifest},indent=2)+'\n')
print(json.dumps({'images':len(manifest),'bytes':sum(f['bytes'] for f in manifest)}))
