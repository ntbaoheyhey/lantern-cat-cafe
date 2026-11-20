"""Register a manually reviewed built-in generation; no generation/model calls.

The user expressly permits local alpha cleanup, cropping and packing. Original
pixels and prompt are preserved separately; colour and anatomy are untouched.
"""
import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('unit')
p.add_argument('input', type=Path)
p.add_argument('--review', required=True)
a = p.parse_args()
root = Path(__file__).resolve().parents[3]
if (root / 'STOP-B').exists():
    raise RuntimeError('STOP-B requested')
prompt_file = root / 'tools/cardrpg-look/art-rebuild/prompts' / (a.unit + '.txt')
prompt = prompt_file.read_text().strip()
output = root / 'assets/source/look-v3/concepts' / (a.unit + '.png')
if output.exists():
    raise RuntimeError('Preserve existing concept: ' + str(output))
archive = Path.home() / 'art/look-v3/concepts'
archive.mkdir(parents=True, exist_ok=True)
raw = archive / (a.unit + '-raw.png')
if raw.exists() and raw.read_bytes() != a.input.read_bytes():
    raise RuntimeError('Preserve existing raw master')
shutil.copy2(a.input, raw)
im = Image.open(raw).convert('RGBA')
alpha = im.getchannel('A')
if alpha.getextrema()[0] == 255:
    raise RuntimeError('Concept has no transparency; review before packing')
alpha = alpha.point(lambda value: 0 if value < 10 else value)
im.putalpha(alpha)
im = im.crop(alpha.getbbox())
pad = round(max(im.size) * .08)
packed = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2))
packed.alpha_composite(im, (pad, pad))
output.parent.mkdir(parents=True, exist_ok=True)
packed.save(output)
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
source_bytes = sum(f.stat().st_size for f in (root / 'assets/source/look-v3').rglob('*') if f.is_file())
if source_bytes > 60_000_000:
    outside = archive / output.name
    if outside.exists():
        raise RuntimeError('Existing external normalized master needs review')
    shutil.move(output, outside)
    output = outside
record = dict(id=a.unit, generatedAt=datetime.now(timezone.utc).isoformat(),
              tool='built-in image_gen', model='not exposed', seed='not exposed',
              parameters=dict(transparent_background=True, references=[]), prompt=prompt,
              raw=str(raw), rawSha256=sha(raw), output=str(output), sha256=sha(output),
              postprocess='Pillow: alpha<10 removed; crop to alpha bounds; add8% transparent margin; painted colours unchanged',
              review=a.review, runtimeAccepted=False)
folder = root / 'reports/cardrpg-look/art-rebuild/r2/concepts'
folder.mkdir(parents=True, exist_ok=True)
(folder / (a.unit + '.json')).write_text(json.dumps(record, indent=2) + '\n')
provenance = root / 'assets/provenance/look.md'
with provenance.open('a') as f:
    f.write('\n## ' + a.unit + ' original concept — 2026-11-10\n')
    f.write('Built-in image_gen; model/seed not exposed; transparent_background=true; no reference inputs. ')
    f.write(record['postprocess'] + '. Master: ' + str(raw) + '; output: ' + str(output) + '; SHA256 ' + sha(output) + '.\n')
    f.write('Review: ' + a.review + ' Concept only; runtime pending.\n```text\n' + prompt + '\n```\n')
print(json.dumps(dict(id=a.unit, output=str(output), bytes=output.stat().st_size, sha256=sha(output))))
