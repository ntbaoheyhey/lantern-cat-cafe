"""Join Yarn source hashes, encoded film clocks and explicit visual reviews."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import math
import statistics
import subprocess
import sys

root = Path('reports/v4-art/REVIEW/A7/yarn-giant')
capture = Path('reports/v3-feel/REVIEW/V4-A7-YARN')
read = lambda p: json.loads(Path(p).read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
write = lambda name, data: (root / name).write_text(json.dumps(data, indent=2) + '\n')
source = read(root / 'source-hashes.json')
assert all(sha(p) == h for p, h in source.items()), 'Runtime source changed since capture'
validation = read(root / 'validation.json')
assert validation.get('finished') and validation['pass']
assert all(sha(p) == h for p, h in validation['runtimeSourceHashes'].items())
reviews = read(root / 'film-review.json')
reviewed = {(f['fixture'], a['key'], a['unit']): a for f in reviews for a in f['actions']}
markers = read(root / 'encoded-markers.json')
assert all(m['pass'] for m in markers), 'Film ordinals must be decoded before measurement'
visual = read(root / 'visual-review.json')
visual_keys = {(r['fixture'], r['key'], r['unit']) for r in visual['windows'] if r['reviewed']}
assert visual_keys == set(reviewed), 'Review every captured Yarn window, including truncated windows'
films, performance, actions, layout720 = [], [], [], []
limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03),
          'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
for fixture in ['wave1', 'wave3', 'boss']:
    d = json.loads(gzip.decompress((capture / fixture / 'capture.json.gz').read_bytes()))
    video = capture / (fixture + '.webm')
    assert sha(video) == d['videoSha256']
    assert d['sourceCommit'] == validation['sourceCommit']
    encoded = [(s, d['frames'][s['renderFrame']]) for s in d['resampled']]
    assert all(f['ordinal'] == s['renderFrame'] for s, f in encoded)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'stream=codec_type,codec_name,width,height,r_frame_rate:format=duration', '-of', 'json', str(video)]))
    films.append({'fixture': fixture, 'sourceCommit': d['sourceCommit'], 'videoSha256': d['videoSha256'],
        'seconds': d['videoSeconds'], 'fps': d['fps'], 'width': d['width'], 'height': d['height'],
        'audio': d['audio'], 'mediaProbe': probe, 'parity': d['parity'], 'errors': d['errors']})
    fs = [f for f in d['frames'] if 0 <= f['t'] < d['videoSeconds']]
    gaps = [b['t'] - a['t'] for a, b in zip(fs, fs[1:])]
    performance.append({'fixture': fixture, 'medianRenderFps': 1 / statistics.median(gaps),
        'averageRenderFps': (len(fs) - 1) / (fs[-1]['t'] - fs[0]['t']),
        'maxRenderGapMs': max(gaps) * 1000, 'maxCompositorGapSeconds': d['maxCompositorGapSeconds']})
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
            'catDeviation': max(abs(h / median - 1) for h in hs), 'left': left, 'right': right,
            'span': 1 - left - right,
            'gap': (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / d['width'],
            'boss': next((u['box']['height'] / d['height'] for u in foes if u['kind'] == 'boss'), None)})
    extrema, failures = {}, []
    for key, (direction, limit) in limits.items():
        valid = [v for v in values if v[key] is not None]
        if not valid:
            continue
        worst = (min if direction == 'min' else max)(valid, key=lambda v: v[key])
        extrema[key] = {'value': worst[key], 'frame': worst['frame']}
        if (worst[key] < limit if direction == 'min' else worst[key] > limit):
            failures.append(key)
    layout720.append({'fixture': fixture, 'frames': len(values), 'extrema': extrema, 'failures': failures})
    for plan in d['plans']:
        if 'yarn-giant' not in plan['actorId']:
            continue
        frames = [(s, f) for s, f in encoded if (f.get('action') or {}).get('key') == plan['key']]
        if not frames:
            continue
        contact = min(frames, key=lambda sf: abs(sf[1]['action']['elapsed'] - plan['impact']))
        cf = contact[1]
        own = next(u for u in cf['units'] if u['id'] == plan['actorId'])
        target_ids = sorted({i for e in plan['events'] if e['type'] == 'damage' and e['actorId'] == plan['actorId'] for i in e['targetIds']})
        targets = [u for u in cf['units'] if u['id'] in target_ids and u['side'] != own['side']]
        contact_gaps = [{'id': u['id'], 'pixels': max(0, own['box']['x'] - u['box']['x'] - u['box']['width'])} for u in targets]
        for g in contact_gaps:
            g['viewportFraction'] = g['pixels'] / d['width']
        motions = [m for s, f in frames for m in f['motion'] if m['id'] == plan['actorId']]
        after = next((f for s, f in encoded if s['frame'] > frames[-1][0]['frame']), None)
        returned = next((m for m in after['motion'] if m['id'] == plan['actorId']), None) if after else None
        camera = [{'frame': s['frame'], 'elapsed': f['action']['elapsed'],
            'pixels': math.hypot(f['renderCamera']['x'], f['renderCamera']['y']) * f['field']['width'] / f['renderCamera']['worldWidth']} for s, f in frames]
        shaken = [r for r in camera if r['pixels'] > .0001]
        actions.append({'fixture': fixture, 'key': plan['key'], 'ultimate': plan['ultimate'],
            'complete': reviewed[fixture, plan['key'], plan['actorId']]['complete'],
            'durationMs': plan['duration'], 'impactMs': plan['impact'], 'encodedFrames': len(frames),
            'nearestImpactFrame': contact[0]['frame'], 'nearestImpactElapsed': cf['action']['elapsed'],
            'impactSamplingErrorMs': abs(cf['action']['elapsed'] - plan['impact']), 'recipientGaps': contact_gaps,
            'maxMotionPixels': max(math.hypot(m['dx'], m['dy']) for m in motions),
            'firstFollowingFrameReturnPixels': math.hypot(returned['dx'], returned['dy']) if returned else None,
            'maxCameraPixels': max(r['pixels'] for r in camera), 'nonzeroCameraFrames': shaken,
            'observedCameraSpanMs': shaken[-1]['elapsed'] - shaken[0]['elapsed'] if shaken else 0,
            'post600FocusFrames': [{'frame': s['frame'], 'elapsed': f['action']['elapsed'], 'brightness': f['focus']['brightness']}
                for s, f in frames if f['action']['elapsed'] > 600 and f['focus']['brightness'] < .9999]})
if '--metrics-only' in sys.argv:
    write('performance.json', performance)
    write('layout720.json', layout720)
    write('own-actions.json', actions)
    print(json.dumps({'performance': performance, 'layoutFailures': [(f['fixture'], f['failures']) for f in layout720], 'ownWindows': len(actions)}))
    raise SystemExit(0)
blind = read(root / 'blind-result.json')
layout900 = read(root / 'layout900.json')
assert all(f['visuallyReviewed'] for f in layout900['fixtures']), 'Inspect each new 900p sheet before the receipt'
poses = read(root / 'published-pose-metrics.json')
budget = read(root / 'asset-budget.json')
live = read(root / 'live-gates-r5.json')
complete = [a for a in actions if a['complete']]
assert complete, 'Need complete own windows'
receipt = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Yarn authored poses, original texture and sampled live/encoded-film choreography; full A7 shared gates remain separate',
    'sourceHashesVerified': len(source), 'sourceCommit': validation['sourceCommit'],
    'scopedWindows': len(reviewed), 'completeScopedWindows': sum(a['complete'] for a in reviewed.values()),
    'completeOwnWindows': len(complete), 'completeOwnUltimates': sum(a['ultimate'] for a in complete),
    'films': films, 'ownActions': actions, 'blind': blind, 'liveMeasurements': live,
    'liveMethod': 'Live alpha readback corroborated by the reviewed films; not encoded-pixel segmentation.',
    'layout720': layout720, 'layout900': layout900, 'assetBudget': budget, 'poseMetrics': poses,
    'encodedMarkerFramesVerified': sum(m['frames'] for m in markers), 'validation': validation,
    'limits': ['Live alpha area/face/occlusion samples are distinct from exact encoded-pixel masks.',
        'Observed nonzero shake span is not a continuous-duration upper bound; reduced-motion film remains separate.',
        'Full ultimate pairwise distinctness, focus after600ms, production activation, final SHIP classes and process time split remain open.'],
    'scopedGates': {
        'poseNumerical': all(r['numericalGatesPass'] for r in poses['rows']),
        'blindRead': blind['pass'], 'everyCapturedWindowReviewed': visual_keys == set(reviewed),
        'fixedSchedule': all(a['durationMs'] == (2200 if a['ultimate'] else 800) and a['impactMs'] == (1100 if a['ultimate'] else 350) for a in actions),
        'meleeRecipientGapOnCompleteFilmWindows': all(g['viewportFraction'] <= .04 for a in complete for g in a['recipientGaps']),
        'returnsOnFirstFollowingFilmFrame': all(a['firstFollowingFrameReturnPixels'] is not None and a['firstFollowingFrameReturnPixels'] <= 3 for a in complete),
        'sampledLiveAlpha': all(r['numericalSamplePass'] for r in live['rows']),
        'layout720BoundingBoxes': all(not f['failures'] for f in layout720),
        'layout900BoundingBoxes': not layout900['failures'],
        'layout900VisuallyReviewed': all(f['visuallyReviewed'] for f in layout900['fixtures']),
        'bossMedian50fps': next(p['medianRenderFps'] for p in performance if p['fixture'] == 'boss') >= 50,
        'addedAssetUpperBound6MB': budget['bytes'] <= 6000000,
        'regression': validation['pass'], 'laneAudit': read(root / 'lane-audit.json')['pass']}}
write('performance.json', performance)
write('layout720.json', layout720)
write('acceptance-receipt.json', receipt)
print(json.dumps({'windows': len(reviewed), 'completeOwn': len(complete), 'gates': receipt['scopedGates']}))
