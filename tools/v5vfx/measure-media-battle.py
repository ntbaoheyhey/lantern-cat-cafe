"""Measure natural media battles and prepare fresh desktop review sheets."""
from pathlib import Path
import datetime
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(2)
base, output = map(lambda p: Path(p).resolve(), sys.argv[1:3])
assert base.is_relative_to(ROOT / 'work/v5/CXV')
assert output.is_relative_to(ROOT / 'reports/v5/CXV') and not output.exists()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
stable = lambda v: json.dumps(v, sort_keys=True, separators=(',', ':'))

def stats(values):
    values = sorted(v for v in values if math.isfinite(v))
    if not values:
        return dict(samples=0)
    return dict(samples=len(values), median=values[len(values)//2],
                p95=values[min(len(values)-1, math.floor(.95*len(values)))], max=values[-1])

raw_path = base / 'report.json'
raw = json.loads(raw_path.read_text())
assert raw['pass'] and len(raw['runs']) == 2
assert raw['viewport'] == dict(width=1280, height=720)
assert raw['cpuRate'] == 1
roster = raw['artifactIdentity']['roster']
assert 'soot' not in roster and any(c in roster for c in ('mochi', 'clover'))
timelines = [json.loads((base / run['mode'] / 'timeline.json').read_text()) for run in raw['runs']]
plans = lambda t: [{k: v for k, v in p.items() if k != 'wallMs'} for p in t['plans']]
parity = dict(initial=raw['initialBattleEqual'], result=raw['finalResultEqual'],
              logs=stable(timelines[0]['log']) == stable(timelines[1]['log']),
              presentations=stable(plans(timelines[0])) == stable(plans(timelines[1])),
              finalActors=stable(raw['runs'][0]['final']['actors']) == stable(raw['runs'][1]['final']['actors']))
assert all(parity.values()), parity
result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
              sourceCommit=raw['servedSource'], indexSha256=raw['indexSha256'], url=raw['url'], viewport=raw['viewport'],
              raw=dict(path=str(raw_path), sha256=sha(raw_path)), browser=raw['browser'], hardware=raw['hardware'],
              cpuRate=1, roster=roster, harnessSha256=raw['harnessSha256'], fixtureSha256=raw['productionFixtureSha256'],
              provenance=dict(path=str(base/'harness-provenance.json'), sha256=sha(base/'harness-provenance.json')),
              hostLoad=dict(path=str(base/'host-load.txt'), sha256=sha(base/'host-load.txt')),
              runtimeSourceSubstitutions=[], parity=parity, runs=[], captures=[], reviewImages=[], visualReviewed=False,
              limits='Local M3 Pro descriptive timing under recorded background load. Seeded setup and timer wrappers; no ordinary account-progression, calibrated laptop, cold-byte, enrollment, or source-code optimization claim. Capture intervals excluded from frame statistics and explicitly counted. Decoder intervals use100ms sampled running state plus pause/seek/stall events. Callbacks measure presented media, not GPU pixel equality.')
review = base / 'review'
review.mkdir(exist_ok=True)
for run, timeline in zip(raw['runs'], timelines):
    assert run['reachedResult'] and not run['errors'] and not run['blockedRequests']
    assert run['identity']['indexSha256'] == run['identityAfter']['indexSha256'] == raw['indexSha256']
    windows = [(c['before']['wallMs'], c['after']['wallMs']) for c in run['captures']]
    overlaps = lambda a, b: any(y > a and x < b for x, y in windows)
    clean = [f for i, f in enumerate(timeline['frames']) if i and f['frameMs'] > 0 and not overlaps(timeline['frames'][i-1]['wallMs'], f['wallMs'])]
    audit = timeline['mediaAudit']
    assert audit and audit['cat'] in roster
    natural_end = run['final']['wallMs']
    samples = [s for s in audit['samples'] if s['fullAt'] is not None and 0 <= s['fullAt'] <= natural_end]
    assert samples
    failures = [s for s in samples if s['source'] != 'media' or not s['state']['ready'] or s['state'].get('failure') or s['state']['disposed'] or not s['videoTextureActive']]
    running = [s for s in samples if not s['state']['paused']]
    settled = [s for s in running if not s['state']['seeking']]
    drift = lambda s: abs(((s['state']['currentTime'] - s['state']['desired'] + 15) % 10) - 5)
    callbacks = [d for d in audit['decoded'] if d['fullAt'] is not None and 0 <= d['fullAt'] <= natural_end]
    decoded_clean = []
    wraps = []
    for a, b in zip(callbacks, callbacks[1:]):
        prior = [s for s in samples if s['fullAt'] <= a['fullAt']]
        between = ([prior[-1]] if prior else []) + [s for s in samples if a['fullAt'] < s['fullAt'] <= b['fullAt']]
        interrupted = any(e['fullAt'] is not None and a['fullAt'] <= e['fullAt'] <= b['fullAt'] and e['event'] in ('pause', 'seeking', 'waiting', 'stalled') for e in audit['events'])
        if between and not interrupted and all(not s['state']['paused'] and not s['state']['seeking'] for s in between) and not overlaps(a['fullAt'], b['fullAt']):
            decoded_clean.append(b['at'] - a['at'])
        if a['mediaTime'] > 9.5 and b['mediaTime'] < .5:
            wraps.append(dict(before=a['mediaTime'], after=b['mediaTime'], at=b['fullAt']))
    events = [e for e in audit['events'] if e['fullAt'] is not None and 0 <= e['fullAt'] <= natural_end]
    event_counts = {name: sum(e['event'] == name for e in events) for name in sorted({e['event'] for e in events})}
    quality = [s['quality'] for s in samples if s['quality']]
    sample_gaps = [b['fullAt']-a['fullAt'] for a, b in zip(samples, samples[1:])]
    media_gates = dict(noFailures=not failures, sampledThroughResult=samples[-1]['fullAt'] >= natural_end-250,
                       normalFramesAdvance=bool(callbacks) if run['mode'] == 'normal' else True,
                       reducedClockStatic=max(s['state']['currentTime'] for s in samples) <= 1/30 if run['mode'] == 'reduced' else True)
    post = [s for s in audit['samples'] if s['fullAt'] is not None and s['screen'] == 'result']
    stable_post = [s for s in post if s['fullAt'] >= post[0]['fullAt']+250] if post else []
    post_quality = [s['quality'] for s in stable_post if s['quality']]
    post_callbacks = [d for d in audit['decoded'] if d['fullAt'] is not None and stable_post and d['fullAt'] >= stable_post[0]['fullAt']]
    post_gates = dict(observed=len(stable_post)>=4,
                      allPaused=bool(post) and all(s['state']['paused'] for s in post),
                      allSuspended=bool(post) and all(s['state'].get('suspended') and not s['state']['disposed'] for s in post),
                      stoppedClock=bool(stable_post) and max(s['state']['currentTime'] for s in stable_post)-min(s['state']['currentTime'] for s in stable_post)<=1e-6,
                      stoppedDecoder=bool(post_quality) and all(q==post_quality[0] for q in post_quality) and not post_callbacks)
    phases = [s for s in samples if s.get('bossPhase')]
    phase_actions = [s for s in phases if s.get('phaseFrame') and s['phaseFrame']['actorId'] and s['phaseFrame']['elapsed'] >= 200]
    phase_overlaps = [dict(at=s['fullAt'],frame=s['phaseFrame'],phase=s['bossPhase']) for s in phase_actions if s['bossPhase']['visible']]
    phase_gates = dict(observed=bool(phase_actions),phaseAuraRetained=any(s['bossPhase']['phase']>1 and s['bossPhase']['aura'] for s in phases),
                       unopposedPortraitRetained=any(s['bossPhase']['visible'] for s in phases),actorFieldClear=not phase_overlaps)
    actions = [p for p in timeline['plans'] if any(e['type'] in ('action_start', 'charge') for e in p['events'])]
    assert all(p['fixedTiming'] and p['leadIn'] == 0 and p['duration'] == (2200 if p['ultimate'] else 800) for p in actions)
    row = dict(mode=run['mode'], result=run['final']['result'], naturalResultMs=natural_end,
               actions=run['actions'], ultimates={cat: sum(p['actorId']==cat and p['ultimate'] for p in timeline['plans']) for cat in roster},
               frameMsWithoutCaptureWindows=stats([f['frameMs'] for f in clean]),
               renderCpuMsWithoutCaptureWindows=stats([f['cpuMs'] for f in clean]), excludedFrameIntervals=len(timeline['frames'])-len(clean),
               intervalsOver50p5ms=sum(f['frameMs'] > 50.5 for f in clean),
               media=dict(samples=len(samples), firstSampleMs=samples[0]['fullAt'], lastSampleMs=samples[-1]['fullAt'],
                          sampleGapsMs=stats(sample_gaps), runningSamples=len(running), seekingSamples=sum(s['state']['seeking'] for s in samples),
                          nonseekingRunningClockDriftSeconds=stats([drift(s) for s in settled]),
                          allClockDriftSeconds=stats([drift(s) for s in samples]), callbacks=len(callbacks),
                          decodedIntervalsRunningWithoutCaptureMs=stats(decoded_clean), observedTenSecondWraps=wraps,
                          events=event_counts, qualityFirst=quality[0] if quality else None, qualityLast=quality[-1] if quality else None,
                          gates=media_gates, failures=failures),
               postResultMedia=dict(samples=len(post),stableSamples=len(stable_post),qualityFirst=post_quality[0] if post_quality else None,
                                    qualityLast=post_quality[-1] if post_quality else None,callbacksAfterSettledPause=len(post_callbacks),gates=post_gates),
               bossPhase=dict(samples=len(phases),actionSamplesAfter200ms=len(phase_actions),overlaps=phase_overlaps,gates=phase_gates),
               timeline=dict(path=str(base/run['mode']/'timeline.json'), sha256=sha(base/run['mode']/'timeline.json')))
    result['runs'].append(row)
    for c in run['captures']:
        image = cv2.imread(c['path'])
        assert image.shape == (720, 1280, 3) and float(image.std()) > 10
        result['captures'].append(dict(mode=run['mode'], reason=c['reason'], path=c['path'], sha256=sha(c['path']), dimensions=[1280,720], utc=c['utc'], rgbMean=float(image.mean()), rgbStdDev=float(image.std())))
    for part in range(math.ceil(len(run['captures'])/4)):
        captures = run['captures'][part*4:part*4+4]
        tiles = [cv2.resize(cv2.imread(c['path']), (512,288), interpolation=cv2.INTER_AREA) for c in captures]
        tiles += [np.zeros((288,512,3), np.uint8)] * (4-len(tiles))
        sheet = np.vstack([np.hstack(tiles[:2]), np.hstack(tiles[2:])])
        dest = review / f'{run["mode"]}-{part}.jpg'
        assert not dest.exists()
        cv2.imwrite(str(dest), sheet, [cv2.IMWRITE_JPEG_QUALITY,92])
        result['reviewImages'].append(dict(path=str(dest), sha256=sha(dest), dimensions=[1024,576], mode=run['mode'], reasons=[c['reason'] for c in captures], bytes=dest.stat().st_size, reviewed=False, views=0))
result['postResultDecoderPaused'] = all(all(r['postResultMedia']['gates'].values()) for r in result['runs'])
result['phaseYieldNumericPass'] = all(all(r['bossPhase']['gates'].values()) for r in result['runs'])
result['numericPass'] = all(parity.values()) and all(all(r['media']['gates'].values()) for r in result['runs']) and result['postResultDecoderPaused'] and result['phaseYieldNumericPass']
output.write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(dict(output=str(output), numericPass=result['numericPass'], runs=result['runs'], reviewImages=result['reviewImages'])))
