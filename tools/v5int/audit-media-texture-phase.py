#!/usr/bin/env python3
"""Rehash every native reference and identify actual draw textures independently."""
import argparse
import gzip
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('raw', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    assert not args.output.exists()
    raw = json.loads(args.raw.read_text())
    assert raw['pass'] and raw['finishedUTC'] and raw['controlsPass']
    assert not raw['errors'] and not raw['blockedRequests']
    assert raw['viewport'] == [1280, 720]
    verified = {}

    def file(path, expected):
        path = Path(path)
        data = path.read_bytes()
        actual = sha(data)
        assert actual == expected, str(path)
        verified[str(path)] = actual
        return data

    file(args.raw.parent / 'probe-media-texture-phase.mjs', raw['harnessSha256'])
    file(raw['fixture']['path'], raw['fixture']['sha256'])
    build = json.loads(file(raw['build']['path'], raw['build']['sha256']))
    assert build['indexSha256'] == raw['indexSha256']
    assert build['sourceCommit'] == raw['sourceCommit']
    manifests = {}
    for item in raw['manifests']:
        manifests[item['cat']] = json.loads(file(item['path'], item['sha256']))
    pixel_cache = {}

    def pixels(record):
        path = Path(record['path'])
        if str(path) in pixel_cache:
            return pixel_cache[str(path)]
        packed = path.read_bytes()
        data = gzip.decompress(packed) if record.get('encoding') == 'gzip' else packed
        assert len(data) == record['bytes'] and sha(data) == record['sha256']
        verified[str(path)] = sha(packed)
        w, h = record['videoSize']
        assert len(data) == w * h * 4
        assert set(record['gl']['restored']) == set(raw['gpu']['installedParameters'])
        assert all(record['gl']['restored'].values())
        assert record['gl']['status'] == 36053 and record['gl']['error'] == record['gl']['restoreError'] == 0
        assert record['textureVersion'] == record['uploadedVersion']
        assert record['materialUsesVideo']
        # Keep only a digest in the cache:600decoded planes would waste memory.
        pixel_cache[str(path)] = record['sha256']
        return record['sha256']

    assert len(raw['controls']) == 8
    for control in raw['controls']:
        pixels(control)
        assert control['pass'] and control['sha256'] == control['repeatSha256'] == control['repeat']['sha256']
        for row in (control, control['repeat']):
            assert row['screenBeforeSha256'] == row['screenAfterSha256']
            data = file(row['screenPath'], row['screenBeforeSha256'])
            assert len(data) == 1280 * 720 * 4
            assert all(row['gl']['restored'].values())
        assert control['screenBeforeSha256'] == control['repeat']['screenBeforeSha256']
        canvas = file(control['canvasPath'], control['canvasSha256'])
        native = Path(control['path']).read_bytes()
        w, h = control['videoSize']
        a, b = (np.frombuffer(x, dtype=np.uint8).reshape(h, w, 4) for x in (canvas, native))
        assert np.array_equal(a, b[::-1]), 'Known-frame native texture row orientation'
        assert control['orientationMAE']['flipped'] == 0
        for state in control['allMediaClocks'].values():
            assert state['state']['ready'] and state['state']['paused'] and not state['state']['seeking']
    native = {'mochi': {}, 'clover': {}}
    assert len(raw['references']) == 600
    for reference in raw['references']:
        digest = pixels(reference)
        cat, frame = reference['cat'], reference['referenceFrame']
        assert frame not in native[cat] and 0 <= frame < 300
        assert reference['state']['paused'] and not reference['state']['seeking']
        assert abs(reference['decoded']['mediaTime'] - frame / 30) < 1e-5
        native[cat][frame] = digest
    assert all(set(values) == set(range(300)) for values in native.values())
    assert len(raw['running']) == len(raw['matches']) == 24
    samples = []
    for sample, declared in zip(raw['running'], raw['matches']):
        digest = pixels(sample)
        hits = [frame for frame, value in native[sample['cat']].items() if value == digest]
        assert len(hits) == 1 and hits == declared['matchingNativeFrames']
        assert declared['uniqueAcrossAll300Frames'] and declared['referenceCount'] == 300
        assert sample['viewFrame'] is None and all(v == 0 for v in sample['pose'].values())
        assert not sample['state']['paused']
        actual = hits[0]
        callback = round(sample['decoded']['mediaTime'] * 30) % 300
        phase_error = (sample['adapterFrame'] - actual + 150) % 300 - 150
        samples.append(dict(cat=sample['cat'], label=sample['label'], path=sample['path'],
                            sha256=digest, gpuFrame=actual, callbackFrame=callback,
                            adapterFrame=sample['adapterFrame'], frameError=phase_error,
                            seeking=sample['state']['seeking'], callbackMatchesGPU=callback == actual))
    groups = {}
    for cat in native:
        groups[cat] = {}
        for label, seeking in [('seeking', True), ('steady', False)]:
            selected = [s for s in samples if s['cat'] == cat and s['seeking'] == seeking]
            groups[cat][label] = dict(count=len(selected), maxAbsoluteFrameError=max((abs(s['frameError']) for s in selected), default=None),
                                     callbacksMatch=all(s['callbackMatchesGPU'] for s in selected))
    phase_candidate = raw.get('phaseCandidate', False)
    phase_gate = all(s['frameError'] == 0 and s['callbackMatchesGPU'] for s in samples)
    if phase_candidate:
        assert phase_gate and raw['phaseGate']
        assert all(c['adapterFrame'] == c['referenceFrame'] for c in raw['controls'])
    result = dict(utc=datetime.now(timezone.utc).isoformat(), raw=dict(path=str(args.raw), sha256=sha(args.raw.read_bytes())),
                  toolSha256=sha(Path(__file__).read_bytes()), sourceCommit=raw['sourceCommit'], indexSha256=raw['indexSha256'],
                  url=raw['url'], viewport=raw['viewport'], verifiedFiles=len(verified),
                  verifiedFileDigest=sha(json.dumps(verified, sort_keys=True).encode()),
                  controls=8, nativeReferenceFrames=600, globallyUniqueActualMatches=24,
                  distinctNativeFrameHashes={k:len(set(v.values())) for k,v in native.items()},
                  groups=groups, samples=samples, rulesSha256=raw['rulesSha256'],
                  diagnosticAccepted=True, phaseCandidate=phase_candidate, phaseGate=phase_gate,
                  productionAcceptance=False, imagesViewed=0,
                  limits=[raw['runningFixture'], '12controlled draws percat,not an allframe/action temporal guarantee.',
                          'Seeking and steady samples are retained separately;counts depend on the observed run.',
                          'Source anchors/art/loop/performance and remaining lifecycle/native gates remain separate.'])
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k:result[k] for k in ('verifiedFiles','controls','nativeReferenceFrames','globallyUniqueActualMatches','distinctNativeFrameHashes','groups')}))


if __name__ == '__main__':
    main()
