"""Audit recorded footer lifecycle evidence without a browser or image viewing."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import subprocess
import sys

sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np
cv2.setNumThreads(1)
root = Path(__file__).resolve().parents[2]
base, output = map(Path, sys.argv[1:])
assert not output.exists(), 'Preserve earlier evidence'
hashes = {}


def read(path, expected=None):
    path = Path(path).resolve()
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert expected is None or digest == expected, str(path)
    hashes[str(path)] = digest
    return data


def load(path, expected=None):
    return json.loads(read(path, expected))


def delta(a, b):
    assert a.shape == b.shape
    y, x = np.nonzero(np.any(a != b, axis=2))
    return dict(pixels=int(x.size), bbox=None if not x.size else
                [int(x.min()), int(y.min()), int(x.max()+1), int(y.max()+1)])


def world(snapshot):
    return [n for n in snapshot['information']['nodes'] if n['class'] == 'b3-world']


def values(node):
    return dict(meters=node['meters'], badges=[{k: v for k, v in b.items() if k != 'focus'} for b in node['badges']])


def contains(a, b):
    return a['left'] <= b['left'] and a['top'] <= b['top'] and a['right'] >= b['right'] and a['bottom'] >= b['bottom']


raw = load(base/'report.json')
pre = load(raw['preregistration']['path'], raw['preregistration']['sha256'])
artifact = load(base/'artifact-verification.json')
assert load(base/'exit.json')['exit'] == 0
assert raw['pass'] and raw['finishedUTC'] and not raw['errors']
assert raw['viewport'] == [1280, 720] and raw['fixture']['mediaCats'] == ['mochi']
assert len(raw['runs']) == pre['freshPages'] == 4
for k in ['url', 'sourceCommit', 'indexSha256']:
    assert raw[k] == pre[k] == artifact[k]
for item in load(base/'harness-provenance.json'):
    read(base/item['name'], item['sha256'])
read(base/'probe-footer-lifecycle.mjs', raw['harnessSha256'])
assert raw['harnessSha256'] == pre['harnessSha256']
read(base/'footer-identity-prototype.mjs', pre['prototypeSha256'])
assert raw['prototypeSha256'] == pre['prototypeSha256']
build = load(artifact['build']['path'], artifact['build']['sha256'])
assert raw['fixture']['buildSha256'] == artifact['build']['sha256']
dist = Path(build['dist'])
read(dist/'index.html', raw['indexSha256'])
for item in artifact['sourceFiles']:
    data = subprocess.check_output(['git', 'show', raw['sourceCommit']+':'+item['path']], cwd=root)
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
for item in artifact['artifacts']:
    assert len(read(dist/item['path'], item['sha256'])) == item['bytes']
for item in artifact['mediaFiles']:
    assert len(read(dist/item['url'].lstrip('/'), item['sha256'])) == item['bytes']
assert artifact['runtimePatchSha256'] == hashlib.sha256(b'').hexdigest()

images, results = {}, []
picture_count = state_count = repeat_count = 0
for run in raw['runs']:
    assert not run['errors'] and not run['blockedRequests']
    assert run['mode'] == 'normal' and run['cat'] == 'mochi' and run['skill'] == 1
    assert run['key'] == run['statusCase']+'-'+run['arm']
    assert run['statusCase'] in ['empty', 'capacity'] and run['arm'] in pre['arms']
    assert [p['phase'] for p in run['captures']] == ['initial', 'final']
    phases = []
    for phase in run['captures']:
        captures = phase['captures']
        assert [s['variant'] for s in captures] == ['screen0', 'canvas0', 'screen1', 'canvas1']
        reference, frames, states = captures[0]['before'], {}, []
        media = reference['scene']['media']['mochi']
        video = media['state']
        assert video['ready'] and not video['seeking'] and not video['disposed'] and not video.get('failure')
        assert media['rootVisible'] and media['planeVisible'] and reference['scene']['paused']
        assert abs(video['currentTime']-video['desired']) <= 1/60
        assert round(media['decoded']['mediaTime']*30) == video['sourceFrame']
        for shot in captures:
            data = read(shot['path'], shot['sha256'])
            frame = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
            assert list(frame.shape[1::-1]) == shot['dimensions'] == [1280, 720]
            frames[shot['variant']] = frame
            picture_count += 1
            for when in ['before', 'after']:
                states.append(shot[when] == reference)
                state_count += 1
        repeats = [dict(a=a, b=b, **delta(frames[a], frames[b])) for a, b in
                   [('screen0', 'screen1'), ('canvas0', 'canvas1')]]
        repeat_count += len(repeats)
        phases.append(dict(phase=phase['phase'], stateComparisons=states, repeatComparisons=repeats,
                           statePass=all(states), repeatPass=all(p['pixels'] == 0 for p in repeats)))
        images[(run['statusCase'], run['arm'], phase['phase'])] = frames
    assert [r['ms'] for r in run['rows']] == [0, 175, 250, 350, 600, 800]
    rows = []
    for row in run['rows']:
        before, after = row['before'], row['after']
        native = next(n for n in world(after) if n['actor'] == 'mochi')
        panels = [n for n in after['information']['nodes'] if n['class'] == 'b3-cxv-identity']
        prototype = run['arm'] == 'prototype'
        target = panels[0] if prototype and panels else native
        title = run.get('focusTitle')
        survives = bool(title) and any(b['title'] == title for b in target['badges'])
        focused = any(b['title'] == title and b['focus'] for b in target['badges'])
        geometry = []
        for panel in after['panels']:
            box = panel['rect']
            contained = all(not r['width'] or not r['height'] or contains(box, r)
                            for child in panel['children'] for r in [child['rect'], *child['textRects']])
            geometry.append(dict(name=panel['name'], size=[box['width'], box['height']], childrenContained=contained))
        rows.append(dict(ms=row['ms'], sceneUnchanged=before['scene'] == after['scene'],
                         worldUnchanged=world(before) == world(after),
                         footerControlsUnchanged=before['information']['controls'] == after['information']['controls'],
                         valuesExact=not prototype or len(panels) == 1 and values(native) == values(panels[0]),
                         panelsExpected=len(panels) == (1 if prototype else 0),
                         focusTitle=title, focusTargetSurvives=survives,
                         focusRetained=focused if survives else None, focus=after['information']['focus'], geometry=geometry))
    initial_world = next(n for n in world(run['initial']) if n['actor'] == 'mochi')
    initial_panels = [n for n in run['initial']['information']['nodes'] if n['class'] == 'b3-cxv-identity']
    empty = None
    if run['statusCase'] == 'empty':
        empty = not initial_world['badges'] and (run['arm'] == 'original' or
                 len(initial_panels) == 1 and initial_panels[0]['noEffects'] == 'No effects' and not initial_panels[0]['badges'])
    if run['statusCase'] == 'capacity':
        assert run['initial']['information']['focus']['sameNode']
        assert run['initial']['information']['focus']['title'] == run['focusTitle']
    results.append(dict(key=run['key'], phases=phases, rows=rows, emptyInitialCorrect=empty,
                        allRepeatStatePass=all(p['statePass'] and p['repeatPass'] for p in phases),
                        allTransferPass=all(all(row[k] for k in ['sceneUnchanged', 'worldUnchanged',
                                                               'footerControlsUnchanged', 'valuesExact', 'panelsExpected']) for row in rows),
                        survivingFocusPass=all(row['focusRetained'] for row in rows if row['focusTargetSurvives'])))
cross = []
for status in ['empty', 'capacity']:
    for phase in ['initial', 'final']:
        a, b = [images[(status, arm, phase)] for arm in ['original', 'prototype']]
        cross.append(dict(statusCase=status, phase=phase, rawCanvas=delta(a['canvas0'], b['canvas0']),
                          screen=delta(a['screen0'], b['screen0'])))
peer_path = base/'footer-lifecycle-measurement.json'
peer_checked = False
if peer_path.exists():
    peer = load(peer_path)
    assert peer['crossArm'] == cross
    assert len(results) == len(peer['runs'])
    for own, claim in zip(results, peer['runs']):
        for k in ['key', 'phases', 'emptyInitialCorrect', 'allRepeatStatePass', 'allTransferPass', 'survivingFocusPass']:
            assert own[k] == claim[k], (own['key'], k)
        assert len(own['rows']) == len(claim['rows'])
        for own_row, claim_row in zip(own['rows'], claim['rows']):
            assert {k: own_row[k] for k in claim_row} == claim_row
    peer_checked = True
failures = [dict(case=r['key'], ms=row['ms'], focus=row['focus']) for r in results
            for row in r['rows'] if row['focusTargetSurvives'] and not row['focusRetained']]
result = dict(utc=datetime.now(timezone.utc).isoformat(), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'],
              url=raw['url'], captureUTC=raw['utc'], finishedUTC=raw['finishedUTC'],
              pngs=picture_count, fullStateComparisons=state_count, repeatPairs=repeat_count,
              sourceAndArtifactItems=sum(len(artifact[k]) for k in ['sourceFiles', 'artifacts', 'mediaFiles']),
              runs=results, crossArm=cross, survivingFocusFailures=failures, peerNumbersExact=peer_checked,
              hashes=hashes, toolSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              imagesViewed=0, productionAcceptance=False,
              disposition='REJECT lifecycle: prototype loses surviving status focus' if failures else 'Scoped numeric acceptance only',
              limits=['Manual sync development pilot, normal Mochi only; not native integration or natural reachability.',
                      'Rules replay is separate. Full paint restoration, fallback, dual media, art and performance remain open.'])
output.write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps({k: result[k] for k in ['pngs', 'fullStateComparisons', 'repeatPairs', 'sourceAndArtifactItems', 'peerNumbersExact', 'disposition']}))
