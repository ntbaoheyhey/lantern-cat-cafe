"""Report captured measurements; never assigns visual gate acceptance."""
from pathlib import Path
import json

root = Path('reports/v4-art/REVIEW/A2')
rows = json.loads((root / 'film-framing.json').read_text())
p = root / 'REVIEW.md'
text = p.read_text().split('\n## R6 geometry and camera reduction')[0]
text = text.replace('Corrected films are recording; no A2 acceptance yet.',
                    'Corrected720p films completed; their frame geometry passes. Dynamic overlap,900p evidence and final regressions remain pending; no complete A2 acceptance yet.')
text += '\n## R6 geometry and camera reduction\n\n| Fixture | Cat median min | Max cat deviation | Left min | Right min | Span min | Gap max | Boss min |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'
for r in rows:
    e = {k: v[k] for k, v in r['extrema'].items()}
    cells = [f'{100*e[k]:.2f}%' if k in e else '—' for k in ['catMedian', 'catDeviation', 'left', 'right', 'span', 'gap', 'boss']]
    text += '| ' + r['fixture'] + ' | ' + ' | '.join(cells) + ' |\n'
text += '\nCamera: scale1 and rotation0 on every rendered frame; maximum shake3.117px and zero shake outside ultimate impact1100–1220ms. Evidence camera-metrics.json. These are normal-motion films; reduced motion is covered separately by the existing presentation tests.\n\nR6 action register uses actual captured schedule timestamps. Available contact windows were viewed at10fps in the six overview sheets. Detailed blind-read remains A3–A7.\n'
for r in rows:
    text += '\n### R6 ' + r['fixture'] + '\n\n| Action | Impact(s) | Actor | Type | Contact coverage |\n|---|---:|---|---|---|\n'
    for a in r['actions']:
        available = sum(0 <= t < 30 for t in a['times'])
        kind = 'ultimate' if a['ultimate'] else 'basic/status'
        text += f'| {a["key"]} | {a["impact"]:.3f} | {a["actor"] or "round status"} | {kind} | {available}/9 sampled frames |\n'
text += '''
## Composition critique against the private dense reference

1. The larger cast fills the horizontal field instead of clustering on the far left.
2. Cats have comparable body scale; costume silhouettes remain distinct.
3. The boss dominates without reducing the cats to tiny markers.
4. Upper and lower helpers separate from the boss silhouette.
5. Our field retains more negative space than the reference because the15%occlusion gate is stricter.
6. Six-enemy staging is the most crowded case and needs moving alpha evidence.
7. The subdued warm floor competes less with faces than the original saturated rug.
8. The reference still has richer attack silhouettes; only Soot has drawn keys here.
9. Yellow and green area effects wash over faces and need the unit/effect passes.
10. Current movement and projectile timing do not yet match the reference class language; this framing pass does not accept class motion.
'''
p.write_text(text)
rest = json.loads(Path('tools/v3craft-lab/v4-frame/production.json').read_text())
summary = [{k: x[k] for k in ['fixture', 'width', 'height', 'occlusion', 'errors']} | {'units': x['audit']['units']} for x in rest]
(root / 'resting-metrics.json').write_text(json.dumps(summary, indent=2) + '\n')
print('Updated R6 geometry, action register, critique and exact resting reduction.')
