"""Archive a fixed set of immutable, non-security reports; preserve exact bytes."""
from pathlib import Path
import argparse
import datetime
import gzip
import hashlib
import json
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'd029bc9c448ba0c35672bcae132e02262d6e30c9'
MANIFEST = ROOT / 'reports/v4-ship/S11/evidence-archive-2.json'
WORK = ROOT / 'work/v4ship-prep/evidence-archive-2'
NAMES = tuple('reports/v4-ship/' + name + '.json' for name in (
    'S8/initial-transfer-1', 'S8/initial-transfer-2',
    'S11/ranged-delivery-http-1', 'S11/ranged-delivery-http-2',
    'S11/forge-composite-bake-1', 'S11/ranged-source-review-1',
    'S11/ranged-class-review-1', 'S11/ranged-flight-frame-review-2',
    'S11/ranged-delivery-comparison-2', 'S11/ranged-mp3-muxers-1',
    'S11/ranged-mp3-tags-1', 'S11/ui-audit-1',
    'S10/offline-build-1', 'S10/offline-build-2',
    'S10/offline-build-3', 'S10/offline-build-4',
    'S2b/boundary-diagnosis', 'S2b/progression-study',
    'S2b/current-matrix', 'S2b/matrix',
))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checked(row, path):
    assert not path.is_symlink()
    packed = path.read_bytes()
    assert len(packed) == row['storedBytes'] and sha(packed) == row['storedSha256']
    raw = gzip.decompress(packed)
    assert len(raw) == row['bytes'] and sha(raw) == row['sha256']
    assert raw == subprocess.check_output(['git', 'show', SOURCE + ':' + row['path']], cwd=ROOT)
    # Independent decoders, without printing report contents.
    assert raw == subprocess.check_output(['gzip', '-dc', str(path)])
    node = "process.stdout.write(require('node:zlib').gunzipSync(require('node:fs').readFileSync(process.argv[1])))"
    assert raw == subprocess.check_output(['node', '-e', node, str(path)])
    return raw


def prepare():
    assert not MANIFEST.exists()
    WORK.mkdir(parents=True, exist_ok=False)
    rows = []
    for name in NAMES:
        source = ROOT / name
        assert not source.is_symlink() and not source.with_suffix('.json.gz').exists()
        raw = source.read_bytes()
        assert raw == subprocess.check_output(['git', 'show', SOURCE + ':' + name], cwd=ROOT)
        methods = []
        for level in (1, 9):
            start = time.perf_counter()
            encoded = gzip.compress(raw, compresslevel=level, mtime=0)
            encode_seconds = time.perf_counter() - start
            start = time.perf_counter()
            assert gzip.decompress(encoded) == raw
            methods.append({'level': level, 'bytes': len(encoded), 'encodeSeconds': encode_seconds,
                            'decodeSeconds': time.perf_counter() - start, 'exact': True})
            candidate = WORK / ('gzip' + str(level)) / name
            candidate.parent.mkdir(parents=True, exist_ok=True)
            candidate.write_bytes(encoded)
        row = {'path': name, 'bytes': len(raw), 'sha256': sha(raw), 'storedBytes': len(encoded),
               'storedSha256': sha(encoded), 'methods': methods}
        checked(row, WORK / 'gzip9' / name)
        rows.append(row)
    manifest = {'version': 1, 'sourceCommit': SOURCE, 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'files': rows, 'toolSha256': sha(Path(__file__).read_bytes()), 'codec': 'gzip9',
                'originalReferencesUnchanged': True, 'allExact': True}
    (WORK / 'prepared.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify', 'restore'])
    parser.add_argument('--destination', type=Path)
    args = parser.parse_args()
    assert not (ROOT / 'STOP-V4SHIP').exists()
    if args.action == 'prepare':
        manifest = prepare()
    else:
        source = WORK / 'prepared.json' if args.action == 'apply' else MANIFEST
        manifest = json.loads(source.read_bytes())
        assert manifest['sourceCommit'] == SOURCE and manifest['codec'] == 'gzip9'
        assert tuple(row['path'] for row in manifest['files']) == NAMES
        assert manifest['toolSha256'] == sha(Path(__file__).read_bytes())
        decoded = [(row, checked(row, WORK / 'gzip9' / row['path'] if args.action == 'apply'
                                 else ROOT / (row['path'] + '.gz'))) for row in manifest['files']]
        if args.action == 'apply':
            assert not MANIFEST.exists()
            assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == 'codex/v4-ship-2026-11-16'
            for row, raw in decoded:
                original = ROOT / row['path']
                assert original.read_bytes() == raw
                stored = ROOT / (row['path'] + '.gz')
                with stored.open('xb') as stream:
                    stream.write((WORK / 'gzip9' / row['path']).read_bytes())
                assert checked(row, stored) == raw
                assert original.read_bytes() == raw
                original.unlink()
            MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
        elif args.action == 'restore':
            assert args.destination and not args.destination.exists() and not args.destination.is_symlink()
            args.destination.mkdir(parents=True, exist_ok=False)
            for row, raw in decoded:
                target = args.destination / row['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as stream:
                    stream.write(raw)
                assert target.read_bytes() == raw
    print(json.dumps({'action': args.action, 'files': len(manifest['files']),
                      'rawBytes': sum(r['bytes'] for r in manifest['files']),
                      'storedBytes': sum(r['storedBytes'] for r in manifest['files']),
                      'allExact': manifest['allExact']}))


if __name__ == '__main__':
    main()
