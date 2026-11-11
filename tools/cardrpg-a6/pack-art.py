"""Package published Lane B original concepts for A6 DOM screens. No art generation."""
from io import BytesIO
from pathlib import Path
import json
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BRANCH = 'origin/codex/cardrpg-art-r1-2026-11-09'
DEST = ROOT / 'assets/cardrpg-a6/illustrations'
DEST.mkdir(parents=True, exist_ok=True)
def published(path):
    return subprocess.check_output(['git', 'show', f'{BRANCH}:{path}'], cwd=ROOT)
manifest = json.loads(published('assets/cardrpg-look/v3-portraits/manifest.json'))
rows = {}
for unit, entry in manifest['portraits'].items():
    source = entry['provenance']['source']
    art = Image.open(BytesIO(published(source))).convert('RGBA')
    bounds = art.getchannel('A').getbbox()
    art = art.crop(bounds)
    art.thumbnail((768, 896), Image.Resampling.LANCZOS)
    art.save(DEST / f'{unit}.webp', quality=86, method=6)
    face = entry.get('uiPortrait', {}).get('2x')
    if face:
        (DEST / f'{unit}-face.webp').write_bytes(published(face))
    rows[unit] = {'art': f'{unit}.webp', **({'face':f'{unit}-face.webp'} if face else {}), 'source':source}
(DEST / 'manifest.json').write_text(json.dumps({'version':1, 'sourceBranch':BRANCH, 'units':rows}, indent=2)+'\n')
print(f'{len(rows)} units; {sum(p.stat().st_size for p in DEST.glob("*.webp")):,} image bytes')
