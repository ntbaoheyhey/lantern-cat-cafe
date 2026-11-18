"""Freeze a first-view manual endpoint batch without fitting or altering images."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--out', type=Path, required=True)
p.add_argument('--group', choices=['training', 'holdouts'], required=True)
p.add_argument('--batch', type=int, required=True)
p.add_argument('--points', required=True, help='JSON of four sheet-coordinate endpoints per frame; null if unknown')
p.add_argument('--notes', default='Approximate visible eyelid/aperture joins; closed lids use visible crease ends. Excludes protruding eyelash tips and pupil position.')
args = p.parse_args()
base = args.out.resolve()
assert base.is_relative_to(ROOT / 'work/v5/CXV')
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
config = json.loads((base / 'preregistration.json').read_text())
plots = json.loads((base / args.group / 'plots.json').read_text())['plots']
plot = next(x for x in plots if Path(x['path']).name == f'eye-line-source-observation-{args.batch}.jpg')
assert plot['views'] == 0 and max(plot['dimensions']) <= 1024
assert sha(plot['path']) == plot['sha256']
points = json.loads(args.points)
assert len(points) == len(plot['cells'])
output = base / args.group / f'observations-{args.batch}.json'
assert not output.exists(), 'Never revise frozen observations'
rows = []
for cell, endpoints in zip(plot['cells'], points):
    assert endpoints is None or len(endpoints) == 4
    converted = None if endpoints is None else [
        [round(cell['crop'][axis] + (point[axis] - cell['origin'][axis]) / cell['scale'], 4)
         for axis in (0, 1)] for point in endpoints]
    rows.append(dict(frame=cell['frame'], eyeLineEndpointsSheetPx=endpoints,
                     eyeLineEndpointsSourcePx=converted,
                     eyeLineCenterSourcePx=None if converted is None else [round(sum(pt[a] for pt in converted)/4, 4) for a in (0, 1)],
                     observationBoundSourcePxPerAxis=config['observationBoundSourcePxPerAxis'],
                     confidence='medium; manually estimated, not empirical confidence interval' if converted else 'unknown', notes=args.notes))
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), group=args.group, batch=args.batch,
              plot=dict(path=plot['path'], sha256=plot['sha256'], views=1),
              toolSha256=sha(__file__), preregistrationSha256=sha(base/'preregistration.json'),
              frozen=True, fitInspected=False, rows=rows)
with output.open('x') as f:
    json.dump(result, f, indent=2)
    f.write('\n')
print(json.dumps(dict(utc=result['utc'], path=str(output), sha256=sha(output),
                     frames=[r['frame'] for r in rows], unknown=sum(r['eyeLineCenterSourcePx'] is None for r in rows))))
