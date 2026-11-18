"""Independent file/phase/projection audit of CXI's bounded native GPU study.

All pixels are numerical inputs. No image is displayed, and a unique match in a
partial reference window is never promoted to an unambiguous whole-cycle frame.
"""
from pathlib import Path
import datetime
import gzip
import hashlib
import importlib.util
import json
import math
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
INTEGRATION = Path('/Users/bao/taskbar-hero-chain')
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import numpy as np
spec = importlib.util.spec_from_file_location('projection', Path(__file__).with_name('media-phase-projection.py'))
projection = importlib.util.module_from_spec(spec)
spec.loader.exec_module(projection)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def check_record(row, verified):
    assert row['gl']['status'] == 36053
    assert row['gl']['error'] == row['gl']['restoreError'] == 0
    assert row['gl']['restored'] and all(row['gl']['restored'].values())
    assert row['textureVersion'] == row['uploadedVersion'] and row['materialUsesVideo']
    assert row['state']['ready'] and not row['state'].get('failure')
    rgba = None
    if row.get('path'):
        path = Path(row['path']);stored = path.read_bytes()
        assert row.get('encoding', 'raw') in ('raw', 'gzip')
        rgba = gzip.decompress(stored) if row.get('encoding') == 'gzip' else stored
        digest = hashlib.sha256(rgba).hexdigest()
        assert digest == row['sha256']
        verified[str(path)] = dict(storedSha256=hashlib.sha256(stored).hexdigest(), rgbaSha256=digest)
    for path_key, hash_key in [('canvasPath', 'canvasSha256'), ('screenPath', 'screenBeforeSha256')]:
        if row.get(path_key):
            path = Path(row[path_key]);digest = sha(path)
            assert digest == row[hash_key], str(path)
            verified[str(path)] = digest
    width, height = row['videoSize']
    assert row['bytes'] == width * height * 4
    if rgba is not None:
        assert len(rgba) == row['bytes']
    if row.get('screenBeforeSha256'):
        assert row['screenBeforeSha256'] == row['screenAfterSha256']
    if row.get('canvasPath'):
        gpu = np.frombuffer(rgba, dtype=np.uint8).reshape(height, width, 4).astype(np.int16)
        canvas = np.fromfile(row['canvasPath'], dtype=np.uint8).reshape(height, width, 4).astype(np.int16)
        measured = dict(direct=float(np.abs(gpu[:, :, :3] - canvas[:, :, :3]).mean()),
                        flipped=float(np.abs(gpu[::-1, :, :3] - canvas[:, :, :3]).mean()))
        assert all(abs(value-row['orientationMAE'][key]) < 1e-9 for key, value in measured.items())
        assert min(measured.values()) < 5 and max(measured.values()) - min(measured.values()) > 10


def normalize(row):
    return dict(adapterFrame=row['adapterFrame'], pose=row['pose'],
                sockets={name: row['sockets'][name]['local'] for name in projection.SOCKET_BONES},
                rootMatrixWorld=row['rootWorld'], cameraMatrixWorldInverse=row['cameraView'],
                cameraProjectionMatrix=row['cameraProjection'], canvas=row['canvas'])


def main():
    input_path, output = [Path(p).resolve() for p in sys.argv[1:3]]
    assert input_path.is_relative_to(INTEGRATION / 'work/v5/CXI')
    assert output.is_relative_to(ROOT / 'reports/v5/CXV') and not output.exists()
    raw = json.loads(input_path.read_text())
    build_path = Path(raw['build']['path'])
    assert sha(build_path) == raw['build']['sha256']
    build = json.loads(build_path.read_text())
    assert raw['sourceCommit'] == build['sourceCommit'] == '8aef40187d03fbc6651d5239e7a93907e973284a'
    assert raw['indexSha256'] == build['indexSha256']
    assert sha(input_path.parent / 'probe-media-texture-phase.mjs') == raw['harnessSha256']
    assert sha(raw['fixture']['path']) == raw['fixture']['sha256']
    source_hashes = []
    for item in build['runtimeSources']:
        relative = Path(item['path']).relative_to(INTEGRATION).as_posix()
        data = subprocess.check_output(['git', 'show', build['sourceCommit'] + ':' + relative], cwd=INTEGRATION)
        digest = hashlib.sha256(data).hexdigest()
        assert digest == item['sha256']
        source_hashes.append(dict(path=relative, sha256=digest))
    manifests = {}
    for item in raw['manifests']:
        assert sha(item['path']) == item['sha256']
        expected = Path(build['dist']) / build['registryOverride'][item['cat']].lstrip('/')
        assert expected.resolve() == Path(item['path']).resolve()
        m = json.loads(Path(item['path']).read_text())
        assert sha(Path(build['dist']) / m['video'].lstrip('/')) == item['videoSha256'] == m['videoSha256']
        manifests[item['cat']] = m
    verified, details, controls = {}, [], []
    for row in raw['controls']:
        check_record(row, verified);check_record(row['repeat'], verified)
        exact = row['sha256'] == row['repeat']['sha256'] and row['screenBeforeSha256'] == row['repeat']['screenBeforeSha256']
        frame = row['referenceFrame']
        assert abs(row['decoded']['mediaTime'] - frame/30) < 1e-5
        controls.append(dict(cat=row['cat'], frame=frame, exact=exact))
    for row in raw['references']:
        check_record(row, verified)
        assert abs(row['decoded']['mediaTime'] - row['referenceFrame']/30) < 1e-5
    for row in raw['running']:
        check_record(row, verified)
        refs = [r for r in raw['references'] if r['cat'] == row['cat']]
        matches = sorted(set(r['referenceFrame'] for r in refs if r['sha256'] == row['sha256']))
        coverage = sorted(set(r['referenceFrame'] for r in refs))
        unique = len(matches) == 1
        global_frame = unique and coverage == list(range(300))
        audit = projection.audit_draw(manifests[row['cat']], normalize(row), matches[0] if unique else None)
        world_errors, parent_errors = {}, {}
        for name, socket in row['sockets'].items():
            if name not in projection.SOCKET_BONES:
                continue
            world_errors[name] = math.dist(audit['sockets'][name]['observed']['world'], socket['world'][12:15])
            assert len(row['rootWorld']) == len(socket['parentWorld']) == 16
            parent_errors[name] = max(abs(a-b) for a, b in zip(row['rootWorld'], socket['parentWorld']))
        audit['phaseAttributableGivenExternalTextureProof'] = audit['samplerReproduced'] and global_frame
        details.append(dict(cat=row['cat'], label=row['label'], sha256=row['sha256'], nativeMatches=matches,
                            referenceFrameCount=len(coverage), globallyIdentified=global_frame,
                            conditionalOnPartialReferenceWindow=unique and not global_frame,
                            seeking=row['state']['seeking'], actionActive=bool(row.get('viewFrame')),
                            worldReconstructionErrors=world_errors, rootParentErrors=parent_errors, audit=audit))
    receipt = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   input=dict(path=str(input_path), sha256=sha(input_path)), sourceCommit=raw['sourceCommit'],
                   indexSha256=raw['indexSha256'], url=raw['url'], manifests=raw['manifests'], sourceHashes=source_hashes,
                   verifiedFiles=len(verified), controls=controls, samples=[], projectionMaxima={}, productionAcceptance=False,
                   imagesViewed=0, upstreamPass=raw['pass'], upstreamFailure=(raw.get('failure') or '')[:300])
    for d in details:
        receipt['samples'].append({k: d[k] for k in ('cat', 'label', 'nativeMatches', 'referenceFrameCount', 'globallyIdentified', 'conditionalOnPartialReferenceWindow', 'seeking', 'actionActive')} |
                                  dict(adapterFrame=d['audit']['adapterFrame'], samplerReproduced=d['audit']['samplerReproduced'],
                                       maxLocalError=max(s['localReconstructionError'] for s in d['audit']['sockets'].values()),
                                       maxWorldError=max(d['worldReconstructionErrors'].values()), maxParentError=max(d['rootParentErrors'].values())))
    for cat in ('mochi', 'clover'):
        receipt['projectionMaxima'][cat] = {}
        for name in projection.SOCKET_BONES:
            available = [(d, d['audit']['sockets'][name]) for d in details if d['cat'] == cat and len(d['nativeMatches']) == 1]
            if available:
                receipt['projectionMaxima'][cat][name] = {key: max(s[key] for d, s in available) for key in ('canonicalPhaseDelta', 'worldPhaseDelta', 'cssPhaseDelta')}
    receipt['arithmeticValid'] = (len(controls) == 8 and all(c['exact'] for c in controls) and len(details) == 24 and
                                  all(s['samplerReproduced'] and s['maxWorldError'] <= 1e-6 and s['maxParentError'] <= 1e-6 for s in receipt['samples']))
    receipt['allFramesGloballyIdentified'] = len(details) == 24 and all(d['globallyIdentified'] for d in details)
    receipt['controlledDrawAttributionValid'] = (receipt['arithmeticValid'] and receipt['allFramesGloballyIdentified'] and raw['pass'] and
                                                not any(d['actionActive'] for d in details))
    receipt['idlePhaseAttributionAccepted'] = (receipt['arithmeticValid'] and receipt['allFramesGloballyIdentified'] and raw['pass'] and
                                              not any(d['seeking'] or d['actionActive'] for d in details))
    receipt['subsetMaxima'] = {}
    for subset, include in [('settled', lambda d: not d['seeking']), ('seeking', lambda d: d['seeking'])]:
        receipt['subsetMaxima'][subset] = {}
        for cat in ('mochi', 'clover'):
            rows = [d for d in details if d['cat'] == cat and include(d) and len(d['nativeMatches']) == 1]
            receipt['subsetMaxima'][subset][cat] = dict(count=len(rows), actionActive=sum(d['actionActive'] for d in rows),
                cssPhaseMax=max((s['cssPhaseDelta'] for d in rows for s in d['audit']['sockets'].values()), default=None))
    receipt['limits'] = ['Partial-window unique native hashes are conditional, not whole-cycle frame identities.',
                         'Independent arithmetic does not certify source anchors, art, loop seam or performance.',
                         'GPU state/canvas controls are checked against the recorded instrumentation; no duplicate browser run.']
    detail_path = ROOT / 'work/v5/CXV/batch-m' / (output.stem + '-details.json')
    assert not detail_path.exists()
    detail_path.write_text(json.dumps(dict(verified=verified, details=details), separators=(',', ':')) + '\n')
    receipt['details'] = dict(path=str(detail_path), sha256=sha(detail_path))
    receipt['harnesses'] = [dict(path=str(p), sha256=sha(p)) for p in (Path(__file__), Path(projection.__file__))]
    output.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({k: receipt[k] for k in ('arithmeticValid', 'allFramesGloballyIdentified', 'verifiedFiles', 'projectionMaxima')}))


if __name__ == '__main__':
    main()
