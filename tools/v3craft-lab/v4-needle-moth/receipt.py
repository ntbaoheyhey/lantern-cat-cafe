"""Join unchanged source, decoded-film clocks and explicitly scoped visual reviews."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import math
import statistics

root = Path('reports/v4-art/REVIEW/A7/needle-moth')
read = lambda p: json.loads(Path(p).read_text())
load = lambda p: json.loads(gzip.decompress(Path(p).read_bytes()))
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
write = lambda name, data: (root / name).write_text(json.dumps(data, indent=2) + '\n')
source = read(root / 'source-hashes.json')
assert all(sha(p) == h for p, h in source.items()), 'Runtime source changed since capture'
reviews = read(root / 'film-review.json')
reviewed = {(f['fixture'], a['key']): a for f in reviews for a in f['actions']}
films, performance, actions, layout720 = [], [], [], []
for label, fixtures in [('V4-A7-NEEDLE', ['wave1', 'wave3', 'boss']),
                        ('V4-A7-NEEDLE-FLIGHT-R2', ['wave1'])]:
    base = Path('reports/v3-feel/REVIEW') / label
    for fixture in fixtures:
        d = load(base / fixture / 'capture.json.gz')
        assert sha(base / (fixture + '.webm')) == d['videoSha256']
        encoded = [(s, d['frames'][s['renderFrame']]) for s in d['resampled']]
        assert all(f['ordinal'] == s['renderFrame'] for s, f in encoded)
        films.append({'item': label, 'fixture': fixture, 'sourceCommit': d['sourceCommit'],
                      'videoSha256': d['videoSha256'], 'seconds': d['videoSeconds'], 'fps': d['fps'],
                      'width': d['width'], 'height': d['height'], 'audio': d['audio'],
                      'parity': d['parity'], 'errors': d['errors'],
                      'scope': 'All Needle actions/hits' if label == 'V4-A7-NEEDLE' else 'A5 flight retry only; other repeated windows not re-reviewed'})
        fs = [f for f in d['frames'] if 0 <= f['t'] < d['videoSeconds']]
        gaps = [b['t'] - a['t'] for a, b in zip(fs, fs[1:])]
        performance.append({'item': label, 'fixture': fixture, 'medianRenderFps': 1 / statistics.median(gaps),
                            'averageRenderFps': (len(fs) - 1) / (fs[-1]['t'] - fs[0]['t']),
                            'maxRenderGapMs': max(gaps) * 1000,
                            'maxCompositorGapSeconds': d['maxCompositorGapSeconds']})
        if label == 'V4-A7-NEEDLE':
            values = []
            for shot, f in encoded:
                cats = [u for u in f['units'] if u['side'] == 'party']
                foes = [u for u in f['units'] if u['side'] == 'enemy']
                if not cats or not foes:
                    continue
                hs = [u['box']['height'] / d['height'] for u in cats]
                median = statistics.median(hs)
                left = min(u['box']['x'] for u in f['units']) / d['width']
                right = 1 - max(u['box']['x'] + u['box']['width'] for u in f['units']) / d['width']
                values.append({'frame': shot['frame'], 'catMedian': median,
                               'catDeviation': max(abs(h / median - 1) for h in hs),
                               'left': left, 'right': right, 'span': 1 - left - right,
                               'gap': (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / d['width'],
                               'boss': next((u['box']['height'] / d['height'] for u in foes if u['kind'] == 'boss'), None)})
            limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03),
                      'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
            extrema, failures = {}, []
            for key, (direction, limit) in limits.items():
                valid = [v for v in values if v[key] is not None]
                if not valid:
                    continue
                worst = (min if direction == 'min' else max)(valid, key=lambda v: v[key])
                extrema[key] = {'value': worst[key], 'frame': worst['frame']}
                if worst[key] < limit if direction == 'min' else worst[key] > limit:
                    failures.append(key)
            layout720.append({'fixture': fixture, 'frames': len(values), 'extrema': extrema, 'failures': failures})
        for plan in d['plans']:
            if 'needle-moth' not in plan['actorId'] or (label != 'V4-A7-NEEDLE' and plan['key'] != 5):
                continue
            frames = [(s, f) for s, f in encoded if (f.get('action') or {}).get('key') == plan['key']]
            if not frames:
                continue
            motions = [m for s, f in frames for m in f['motion'] if m['id'] == plan['actorId']]
            contact = min(frames, key=lambda sf: abs(sf[1]['action']['elapsed'] - plan['impact']))
            camera = [{'frame': s['frame'], 'elapsed': f['action']['elapsed'],
                       'pixels': math.hypot(f['renderCamera']['x'], f['renderCamera']['y']) * f['field']['width'] / f['renderCamera']['worldWidth']}
                      for s, f in frames]
            shaken = [r for r in camera if r['pixels'] > .0001]
            after = next((f for s, f in encoded if s['frame'] > frames[-1][0]['frame']), None)
            returned = next((m for m in after['motion'] if m['id'] == plan['actorId']), None) if after else None
            actions.append({'item': label, 'fixture': fixture, 'key': plan['key'], 'ultimate': plan['ultimate'],
                            'complete': reviewed[fixture, plan['key']]['complete'],
                            'durationMs': plan['duration'], 'impactMs': plan['impact'],
                            'encodedFrames': len(frames), 'nearestImpactFrame': contact[0]['frame'],
                            'nearestImpactElapsed': contact[1]['action']['elapsed'],
                            'impactSamplingErrorMs': abs(contact[1]['action']['elapsed'] - plan['impact']),
                            'maxMotionPixels': max(math.hypot(m['dx'], m['dy']) for m in motions),
                            'firstFollowingFrameReturnPixels': math.hypot(returned['dx'], returned['dy']) if returned else None,
                            'maxCameraPixels': max(r['pixels'] for r in camera),
                            'nonzeroCameraFrames': shaken,
                            'observedCameraSpanMs': shaken[-1]['elapsed'] - shaken[0]['elapsed'] if shaken else 0,
                            'post600FocusFrames': [{'frame': s['frame'], 'elapsed': f['action']['elapsed'], 'brightness': f['focus']['brightness']}
                                                  for s, f in frames if f['action']['elapsed'] > 600 and f['focus']['brightness'] < .9999]})
probes = read(root / 'live-probe.json')
rows = [r for p in probes for r in p['rows']]
live = {'method': 'Live alpha probes, separately corroborated by the reviewed film appearance; not encoded-pixel segmentation.',
        'ultimateAreaByFixture': {p['fixture']: max(r['areaFraction'] for r in p['rows'] if r['ultimate']) for p in probes if p['present']},
        'maxFaceCoverage': max(r['maxFaceCoverage'] for r in rows),
        'maxPaintedTipErrorDuringFlight': max(r['paintedHeadError'] for r in rows if r['fx']['flight']),
        'maxLaunchSocketError': max(r['launchSocketError'] for r in rows if r['launchSocketError'] is not None),
        'maxUnitOcclusion': max(o['fraction'] for r in rows for o in r['occlusion'])}
original = [a for a in actions if a['item'] == 'V4-A7-NEEDLE']
flight = read(root / 'projectile-frames.json')
retry = read(root / 'flight-r2/projectile-frames.json')
markers = read(root / 'encoded-markers.json') + read(root / 'flight-r2/encoded-markers.json')
boss_perf = next(r for r in performance if r['item'] == 'V4-A7-NEEDLE' and r['fixture'] == 'boss')
out = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': 'Needle poses and original ranged FX; full A7 remains open for Yarn and shared gates.',
       'sourceHashesVerified': len(source), 'scopedWindows': sum(len(f['actions']) for f in reviews),
       'completeScopedWindows': sum(a['complete'] for f in reviews for a in f['actions']),
       'completeOwnWindows': sum(a['complete'] for a in original), 'completeOwnUltimates': sum(a['complete'] and a['ultimate'] for a in original),
       'films': films, 'ownActions': actions, 'liveMeasurements': live, 'layout720': layout720,
       'layout900': read(root / 'layout900.json'), 'assetBudget': read(root / 'asset-budget.json'),
       'poseMetrics': read(root / 'published-pose-metrics.json'), 'encodedMarkerFramesVerified': sum(r['frames'] for r in markers),
       'flightOriginal': flight, 'flightRetry': retry, 'validation': read(root / 'validation.json'),
       'limits': ['Original wave1 A5 failed the3-frame film gate; retain its133.4ms marked gap and separate unchanged-source retry.',
                  'Wave1 A27 received-hit recovery is truncated; A28 has no encoded frame before30s and is excluded.',
                  'Boss900 unit span falls to77.9451%; full G-FRAME remains OPEN despite Needle absent from that fixture.',
                  'Focus still fades after600ms. Reduced-motion film and strict shake-duration upper bound remain unproven in this item.',
                  'Pairwise FX distinctness, shared ensemble, production activation, final classes and authoring/time-split proof remain OPEN.',
                  '900p is silent fixed-clock layout evidence; alpha occlusion/HUD are not derived from bounding boxes.',
                  'The6MB asset subset bound is separate from SHIP8MB total initial-transfer gate.']}
out['scopedGates'] = {'poseNumeric': all(r['numericalGatesPass'] for r in out['poseMetrics']['rows']),
                      'blind9': read(root / 'blind-result.json')['pass'], 'encodedMarkers': all(r['pass'] for r in markers),
                      'rangedPlanted5Percent': all(r['maxMotionPixels'] <= 64 for r in original),
                      'schedule': all((r['durationMs'], r['impactMs']) == ((2200, 1100) if r['ultimate'] else (800, 350)) for r in original),
                      'camera4Pixels': all(r['maxCameraPixels'] <= 4 for r in original),
                      'flight3FramesAllOriginal': all(r['pass'] for r in flight),
                      'flight3FramesWithDisclosedA5Retry': all(r['pass'] for r in flight if not (r['fixture'] == 'wave1' and r['key'] == 5)) and all(r['pass'] for r in retry),
                      'ultimateArea20To45PercentLive': all(.20 <= v <= .45 for v in live['ultimateAreaByFixture'].values()),
                      'face50PercentLive': live['maxFaceCoverage'] <= .5, 'socket6PixelsLive': live['maxLaunchSocketError'] <= 6,
                      'bossMedian50Fps': boss_perf['medianRenderFps'] >= 50, 'assets6MB': out['assetBudget']['bytes'] <= 6000000,
                      'regression': out['validation']['pass'], 'allFixture900Layout': not out['layout900']['failures']}
write('performance.json', performance)
write('acceptance-receipt.json', out)
print(json.dumps({'windows': out['scopedWindows'], 'complete': out['completeScopedWindows'], 'own': out['completeOwnWindows'], 'markers': out['encodedMarkerFramesVerified'], 'gates': out['scopedGates']}))
