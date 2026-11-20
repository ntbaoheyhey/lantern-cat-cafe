"""Persist one generated icon and provenance before any next generation."""
from pathlib import Path
from PIL import Image
import sys, shutil, json, hashlib
from datetime import datetime, timezone

root = Path(__file__).resolve().parents[3]
kind, source = sys.argv[1:3]
raw = root / f'tools/v3craft-lab/poses/raw/promo/class-{kind}-1.png'
raw.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(source, raw)
im = Image.open(raw).convert('RGBA')
alpha = im.getchannel('A')
if alpha.getextrema()[0] != 0:
    raise ValueError('Generated icon lacks transparent pixels; raw saved, needs regeneration')
out = root / f'apps/web/public/units/promo/v4/class-{kind}.png'
im.resize((256, 256), Image.Resampling.LANCZOS).save(out, optimize=True)
webp = out.with_suffix('.webp')
Image.open(out).save(webp, lossless=True, method=6)
preview = root / f'tools/v3craft-lab/v4-promo/previews/{kind}.png'
preview.parent.mkdir(exist_ok=True)
bg = Image.new('RGBA', (512, 280), '#292635')
bg.alpha_composite(Image.open(out), (0, 12))
bg.paste(Image.new('RGBA', (256, 280), '#f3ebdb'), (256, 0))
bg.alpha_composite(Image.open(out), (256, 12))
bg.convert('RGB').save(preview)
now = datetime.now(timezone.utc).isoformat()
p = root / 'assets/provenance.json'
data = json.loads(p.read_text())
prompt = (root/f'tools/v3craft-lab/v4-promo/{kind}-prompt.txt').read_text()
for path, tool, inputs in [(raw, 'OpenAI built-in image_gen', ['reports/v4-art/REVIEW/A10/approved-cats.jpg']), (out, 'Pillow RGBA resize256; PNG export', [str(raw.relative_to(root))]), (webp, 'Pillow lossless WebP export', [str(out.relative_to(root))])]:
    data['assets'].append({'id': f'v4art-{path.stem}-{path.suffix[1:]}', 'path': str(path.relative_to(root)), 'tool': tool, 'date': now, 'inputs': inputs, 'referenceInput': 'own art only: Mochi/Soot/Clover/Panko runtime.webp via approved-cats.jpg', 'prompt': prompt, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'status': 'candidate; visual review pending'})
p.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n')
row = {'kind': kind, 'sourceSize': im.size, 'alphaExtrema': alpha.getextrema(), 'alphaBBox': alpha.getbbox(), 'transparentFraction': sum(v==0 for v in alpha.getdata())/(im.width*im.height), 'pngBytes': out.stat().st_size, 'webpBytes': webp.stat().st_size}
(root/f'tools/v3craft-lab/v4-promo/{kind}-metrics.json').write_text(json.dumps(row,indent=2)+'\n')
with (root/'reports/v4-art/PROGRESS-ART.log').open('a') as f:
    f.write(f'{now} A10 {kind} raw+PNG+WebP+provenance saved; alpha valid; visual review next\n')
print(json.dumps(row))
