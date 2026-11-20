"""Persist a completed built-in result before the next request (LEARN/P2.md)."""
from pathlib import Path
import datetime, hashlib, json, re, shutil, sys

key, source = sys.argv[1:]
assert re.fullmatch(r'K[1245]_A[1-9][0-9]*', key)
source = Path(source)
assert str(source).startswith('/Users/bao/.codex/generated_images/')
pose, variant = key.split('_')
destination = Path(f'tools/v3craft-lab/poses/raw/soot/{pose}-{variant}.png')
destination.parent.mkdir(parents=True, exist_ok=True)
if destination.exists():
    assert destination.read_bytes() == source.read_bytes(), 'Refuse to overwrite different art'
else:
    shutil.copy2(source, destination)
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
registry = Path('assets/provenance.json')
data = json.loads(registry.read_text())
identifier = f'v3pose-soot-{pose}-{variant}'
if not any(asset.get('id') == identifier for asset in data['assets']):
    data['assets'].append(dict(id=identifier, path=str(destination), tool='built-in image_gen',
        date=now, prompt=json.loads(Path('tools/v3craft-lab/p2/prompts.json').read_text())[key],
        referenceInput='own art: apps/web/public/units/soot/runtime.webp, apps/web/public/units/soot/portrait.webp',
        inputs=['apps/web/public/units/soot/runtime.webp', 'apps/web/public/units/soot/portrait.webp'],
        sourceGeneratedPath=str(source), status='candidate, unaccepted',
        sha256=hashlib.sha256(destination.read_bytes()).hexdigest()))
    registry.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n')
count = len(list(destination.parent.glob(f'{pose}-A*.png')))
state = Path('reports/v3-feel/STATE-POSE.md')
state.write_text(re.sub(rf'{pose} generated\d+[^;\n]*;?[^\n]*?(?=; K5|\n)',
    f'{pose} generated{count}/saved{count}/provenance{count}; chosen none/gate NOT YET', state.read_text()))
handoff = Path('reports/v3-feel/HANDOFF-FEEL.md')
text = re.sub(r'^NOW:.*$', f'NOW: P2 {pose} candidates {count}/4 saved with provenance; no production acceptance.', handoff.read_text(), flags=re.M)
text = re.sub(r'^UPDATED:.*$', f'UPDATED: {now}', text, flags=re.M)
text = re.sub(r'^FILES THIS STEP:.*$', f'FILES THIS STEP: {destination},assets/provenance.json,STATE-POSE.md,PROGRESS-POSE.log.', text, flags=re.M)
handoff.write_text(text)
with Path('reports/v3-feel/PROGRESS-POSE.log').open('a') as log:
    log.write(f'{now} P2 {key} generated/saved/provenance; candidate unaccepted; base SHA77136c874.\n')
print(f'Saved {destination}; {pose} {count}/4; provenance recorded.')
