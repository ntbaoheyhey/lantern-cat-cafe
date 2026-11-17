"""Tie the scoped transfer delivery to existing captures; never manufacture a gate pass."""
from pathlib import Path
from datetime import datetime, timezone
import gzip, hashlib, json, subprocess

root = Path(__file__).resolve().parents[3]
report = root / 'reports/v4-art/REVIEW/A10/transfer'
def read(name):
    return json.loads((report / (name + '.json')).read_text())

films, visual, markers = read('film-review'), read('visual-observations'), read('encoded-markers')
network, performance, layout = read('network-fixtures'), read('performance'), read('layout900')
source, regression, pixels = read('source-verification'), read('regression'), read('browser-pixels')
assert len(visual['pages']) == 42 and visual['allFilmPagesReviewed']
assert len(visual['layoutSheets']) == 3
assert all(hashlib.sha256((root / p['path']).read_bytes()).hexdigest() == p['sha256'] for p in visual['layoutSheets'])
assert not read('lane')['violations']
assert all(hashlib.sha256((root / p['path']).read_bytes()).hexdigest() == p['sha256'] for p in visual['pages'])
assert all(hashlib.sha256((root / f['path']).read_bytes()).hexdigest() == f['sha256'] for f in source['files'])
assert all(m['pass'] and m['frames'] == 900 for m in markers)
assert all(r['size'] == [1440, 900] and r['frames'] == 900 for r in layout['results'])
assert all(r['parity'] and not r['errors'] for r in layout['results'])
assert all(s['exit'] == 0 for s in regression['stages'])
assert all(f['parity'] and not f['errors'] for f in films)
assert all(r['runtime']['ready'] and not r['runtime']['missing'] and not r['errors'] for r in network['results'])
rows = []
for f in films:
    a = f['actions']
    rows.append({'fixture': f['fixture'], 'completeActorActions': sum(bool(x['actor']) and x['complete'] for x in a),
                 'actorlessStatusWindows': [x['key'] for x in a if not x['actor']],
                 'completeUltimates': sum(x['ultimate'] and x['complete'] for x in a),
                 'truncatedExcluded': [x for x in a if not x['complete']], 'videoSha256': f['videoSha256']})
receipt = {
    'at': datetime.now(timezone.utc).isoformat(), 'status': 'SCOPED_DELIVERY; full production transfer gate OPEN',
    'scope': 'Encounter-owned packed VFX readiness and six exact lossless WebGL atlas replacements; normal renderer, craft OFF.',
    'sourceCommit': source['sourceCommit'], 'sourceVerification': 'source-verification.json',
    'atlasBytes': {'source': 8327096, 'delivery': 4641562, 'saved': 3685534},
    'pixels': {'sourceRgbaExact': True, 'webGlRuntimePass': pixels['runtimePass'], 'canvasPass': pixels['canvasPass'],
               'restriction': 'Generic Canvas URLs retain originals; derivative substitution only in NoColorSpace WebGL texture consumers.'},
    'network': [{'fixture': r['fixture'], 'packedImagePages': len(r['packed']), 'assetSubsetBytes': r['assetTransferBytes'],
                 'completeDevelopmentTransferBytes': r['totalTransferBytes'], 'ready': r['runtime']['ready'],
                 'missing': r['runtime']['missing']} for r in network['results']],
    'productionInitialTransferGate': {'status': 'OPEN', 'limitBytes': 8000000, 'priorShipMeasuredBytes': 26411893,
                                     'reason': 'Boss asset subset alone is 8186048B. Development contexts are not production journeys; SHIP must rerun its shipping build.'},
    'regression': {'webTests': 2662, 'webFiles': 317, 'typecheckExit': 0, 'threeFixtureParity': True,
                   'stageEvidence': 'regression.json', 'layoutNote': 'Original layout900 stage was1600x900; separate required1440x900 captures are in layout900.json.'},
    'films': rows, 'verifiedEncodedMarkers': sum(m['frames'] for m in markers), 'reviewedPages': len(visual['pages']),
    'performance': [{'fixture': r['fixture'], 'medianRenderFps': r['medianRenderFps'], 'cameraMaximumPixels': r['cameraMaximumPixels'],
                     'cameraLatestMsAfterImpact': r['cameraLatestMsAfterImpact'], 'cameraNonUltimateFrames': r['cameraNonUltimateFrames']} for r in performance['rows']],
    'layout': layout, 'layoutVisualReview': 'visual-observations.json',
    'notClaimed': ['Full V4 art acceptance', 'Production initial transfer <=8MB', 'Cross-renderer pixel equivalence',
                   'Reduced-motion camera behavior in these films', 'Exact one-frame impact timing from10fps sheets',
                   'Craft activation, pose/readability/ensemble/focus gates', 'Authoring/measurement time split'],
}
(report / 'acceptance-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
lines = ['# A10 transfer delivery — scoped review', '',
         'Production source:48599c03a. All42marked-film pages were inspected once.73complete actor actions,15complete ultimates and8actorless status windows;3truncated actions excluded. No missing actor texture, expected effect, or atlas seam was observed. This is presence/continuity evidence, not a before/after movie pixel comparison.', '',
         'Six atlases shrink8,327,096→4,641,562B with exact source RGBA and exact tested NoColorSpace WebGL output. Canvas2D partial-alpha RGB differs, so generic Canvas consumers retain originals. Owner-selected packed images are8/10/6for wave1/wave3/boss. Boss asset subset8,186,048B already exceeds8MB; the actual production gate remains OPEN.', '',
         'Fullweb2662tests/317files, typecheck, three-fixture F6 and all2700encoded markers pass. Real-time median FPS59.88/60.24/60.24. Camera displacement<=3.117px, ultimate-only, ending<=116.7ms after impact; reduced motion was not measured. Separate1440x900 fixed-clock captures are layout-only evidence, not FPS/audio proof.', '',
         'The action table uses the paired schedule for times/outcomes. All anticipation/contact/recovery poses are the normal native rig, with craft OFF; no drawn K-pose acceptance is claimed. The10fps sheets sample full action durations, not a one-frame timing proof. Status rows have no independent actor.', '']
shapes = {'mochi': 'gold shield/crescents', 'soot': 'violet arc/flame', 'clover': 'green leaves/bloom', 'panko': 'gold wedge/shield',
          'needle-moth': 'cyan needle/gold swarm', 'binding-thread': 'violet thread/pink loops', 'yarn-giant': 'pink loops',
          'teacup-healer': 'mint leaves', 'button-guard': 'gold arc', 'sock-skipper': 'pink petals',
          'kettle-knight': 'white arc/orange sparks', 'crumb-sentinel': 'gold wedge', 'spool-ram': 'pink arcs', 'pollen-scout': 'lime plume'}
for f in films:
    d = json.loads(gzip.decompress((root / 'reports/v3-feel/REVIEW/V4-A10-TRANSFER' / f['fixture'] / 'capture.json.gz').read_bytes()))
    plans = {p['key']: p for p in d['plans']}
    lines += ['## ' + f['fixture'], '', '|Action|Start / impact seconds|Actor / type|Effect and observed reaction context|Window|', '|---|---|---|---|---|']
    for a in f['actions']:
        p = plans[a['key']]; owner = next((name for name in shapes if a['actor'].endswith(name)), '')
        outcomes = sorted({e['type'] for e in p['events'] if e['type'] in ('damage','heal','shield','status_apply','cleanse')})
        kind = 'ULT' if a['ultimate'] else 'basic' if a['actor'] else 'status'
        lines.append(f"|A{a['key']}|{a['times'][0]:.3f} / {a['times'][0]+p['impact']/1000:.3f}|{a['actor'] or 'none'} / {kind}|{shapes.get(owner,'status only')}; scheduled {', '.join(outcomes)}; native rig reactions|{'complete' if a['complete'] else 'TRUNCATED / EXCLUDED'}|")
    lines.append('')
lines += ['## Defect checklist and ownership', '',
          '- Camera pan/zoom: no observed; bounded ultimate shake is measured in performance.json. Reduced-motion proof remains A11.',
          '- Wrong facing: no observed. Layout scale/edge results are in layout900.json; this change does not author formation.',
          '- Missing actor/effect or atlas seam: no observed on42pages; A10 scoped pass.',
          '- Drawn anticipation/contact/recovery absent: yes, craft OFF; production activation remains A9/A11.',
          '- Broad light/ring forms and body washout: yes, e.g.wave1A18/A19 and bossA12; normal-renderer VFX remain visible. Own craft replacement/ensemble is A9/A11.',
          '- Ultimate area/face coverage: not numerically re-proven here; bright body obscuration is visible. No G-FX pass claimed.',
          '- Portrait beside focus banner: absent in sampled normal banners; A9/A11.',
          '- Old Clover/Teacup hostile outcomes: yes; final SHIP class integration remains open.',
          '- Pasted-image impression and number clutter: broad flat effects and stacked outcome labels remain; A9/A11.',
          '- Transfer<=8MB: not achieved; SHIP shipping rerun and further delivery work required.', '']
(report / 'REVIEW.md').write_text('\n'.join(lines))
print(json.dumps({'receipt': receipt['status'], 'actorActions': sum(r['completeActorActions'] for r in rows), 'pages': len(visual['pages']), 'layoutFailures': [r['failures'] for r in layout['results']]}))
