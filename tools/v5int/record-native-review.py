#!/usr/bin/env python3
"""Record a completed human/model visual review, never infer it from passing numbers."""
from pathlib import Path
import sys,json,hashlib,datetime
root=Path(__file__).resolve().parents[2];cat=sys.argv[1];observation=sys.argv[2]
p=root/f'work/v5/CXI/batch-m/{cat}-production-r1';r=json.loads((p/'report.json').read_text());c=json.loads((p/'comparison.json').read_text())
assert r['pass'];assert len(c['images'])==4;now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for im in c['images']:
 assert not im['reviewed'];assert max(im['width'],im['height'])<=1024
 assert hashlib.sha256(Path(im['path']).read_bytes()).hexdigest()==im['sha256']
 im.update(reviewed=True,reviewedUTC=now)
c.update(visualDisposition='ACCEPT_SCOPED_SCENE_MOTION',observation=observation,reviewedImages=4)
(p/'comparison.json').write_text(json.dumps(c,indent=2)+'\n')
r.update(comparison=c,disposition='ACCEPT_SCOPED_SCENE_MOTION',releaseReady=False)
out=root/f'reports/v5/CXI/evidence/v8-m-{cat}-production-review.json';out.write_text(json.dumps(r,indent=2)+'\n')
lines=[f'# {cat.title()} production motion acceptance','',f"Own1280×720 {r['utc']}–{r['completedUTC']}; build {r['buildSource']}; index {r['indexSha256']}. URL {r['url']}.",'','| Channel | Own peak-to-peak %H X/Y | Dominant periods seconds X/Y |','|---|---|---|']
for v in c['channels'][1]['channels']:lines.append(f"| {v['name']} | {v['rangePercentH'][0]:.3f}/{v['rangePercentH'][1]:.3f} | {v['dominantPeriodSeconds']} |")
lines+=['','Designer L1: Mochi head1.84/2.11%H,3.333s dominant; full10s loop. Native10s turn plus3.333s breathing is authored interpretation, not recovered Cubism parameters. Tail tracking was unreliable in source; do not invent comparison amplitudes.',f"Same-height{c['sameHeightPx']}px/1×/300frames/30fps/10s comparison;four fresh measured images viewed once. Both modes worldfeet/root/mesh seam0. Rules hit{r['cast']['hit']}ms maps to clip.55;1s clip,cast.25/hit.55 cues. Max handoff mesh{max(x['maxMeshDelta'] for x in r['cast']['handoffs']):.8g}. Reduced-mode contact also.55.",'',observation,'','Accepts scoped scene motion only. No continuously watched film or real-time FPS claim. Budget/performance/journey/audio/release gates remain separate.']
(root/f'reports/v5/CXI/M-{cat.upper()}-TIMING.md').write_text('\n'.join(lines)+'\n')
with (root/'reports/v5/CXI/PROGRESS.log').open('a') as f:f.write(f'{now} v8 CXI {cat} ownproduction motion ACCEPT;4freshimages once;10s1x comparison;source85cb62233;Soot parity inherited;releaseheld.\n')
print(json.dumps({'cat':cat,'disposition':r['disposition'],'reportBytes':out.stat().st_size,'reviewedUTC':now}))
