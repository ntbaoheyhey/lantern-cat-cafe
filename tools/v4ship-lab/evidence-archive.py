"""Lossless, catalogued storage for immutable SHIP parity reports.

Preparation is read-only with respect to originals. Apply requires independent
review. Restore writes only a new destination and never rewrites old signatures.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import re
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'reports/v4-ship/S11/evidence-archive-1.json'
STUDY = ROOT / 'reports/v4-ship/S11/evidence-archive-study-1.json'
COMMIT = '1ff998a8d28562ac58c0bf5b2104066088cda22a'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def validate_manifest(value):
    assert value['version'] == 1 and value['codec'] == 'gzip' and value['sourceCommit'] == COMMIT
    assert len(value['files']) == 37
    seen = set()
    for row in value['files']:
        name = row['original']['path']
        assert re.fullmatch(r'reports/v4-ship/S11/[a-z0-9-]*regression[a-z0-9-]*/parity-probe\.json', name)
        assert name not in seen
        seen.add(name)
        assert row['stored']['path'] == name + '.gz'
        assert row['candidate']['path'] == 'work/v4ship-prep/evidence-archive-1/candidates/gzip9/' + Path(name).parent.name + '.gz'
        assert re.fullmatch('[0-9a-f]{40}', row['gitBlob'])
        for item in [row['original'], row['stored'], row['candidate']]:
            assert type(item['bytes']) is int and 0 < item['bytes'] <= 10_000_000
            assert re.fullmatch('[0-9a-f]{64}', item['sha256'])
        assert row['stored']['bytes'] == row['candidate']['bytes']
        assert row['stored']['sha256'] == row['candidate']['sha256']
    return value


def checked_bytes(item):
    path = ROOT / item['path']
    assert path.resolve().is_relative_to(ROOT) and not path.is_symlink()
    assert path.stat().st_size == item['bytes']
    data = path.read_bytes()
    assert sha(data) == item['sha256']
    return data


def decode(encoded, original):
    decoder = zlib.decompressobj(31)
    decoded = decoder.decompress(encoded, original['bytes'] + 1)
    assert decoder.eof and not decoder.unused_data and not decoder.unconsumed_tail
    assert len(decoded) == original['bytes'] and sha(decoded) == original['sha256']
    return decoded


def payload(row, prepared=False):
    return decode(checked_bytes(row['candidate' if prepared else 'stored']), row['original'])


def restore(manifest, destination, prepared=False):
    validate_manifest(manifest)
    destination = Path(destination)
    assert not destination.exists() and not destination.is_symlink(), 'Restore requires a fresh destination'
    decoded = [(row, payload(row, prepared)) for row in manifest['files']]
    destination.mkdir(parents=True, exist_ok=False)
    base = destination.resolve()
    for row, data in decoded:
        target = base / row['original']['path']
        assert target.resolve().is_relative_to(base)
        target.parent.mkdir(parents=True, exist_ok=True)
        assert not target.is_symlink()
        with target.open('xb') as stream:
            stream.write(data)
        assert target.read_bytes() == data
    return {'files': len(decoded), 'bytes': sum(len(data) for _, data in decoded)}


def prepare():
    assert not MANIFEST.exists()
    study = json.loads(STUDY.read_bytes())
    assert study['allExact'] and study['sourceCommit'] == COMMIT
    rows = []
    for row in study['rows']:
        method = next(m for m in row['methods'] if m['method'] == 'gzip9')
        original = {k: row[k] for k in ['path', 'bytes', 'sha256']}
        candidate = {k: method[k] for k in ['path', 'bytes', 'sha256']}
        stored = {**candidate, 'path': row['path'] + '.gz'}
        assert not (ROOT / stored['path']).exists()
        decoded = decode(checked_bytes(candidate), original)
        assert checked_bytes(original) == decoded
        assert subprocess.check_output(['git', 'cat-file', 'blob', row['gitBlob']], cwd=ROOT) == decoded
        rows.append({'original': original, 'stored': stored, 'candidate': candidate, 'gitBlob': row['gitBlob']})
    manifest = {'version': 1, 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'codec': 'gzip', 'sourceCommit': COMMIT, 'files': rows,
                'study': {'path': str(STUDY.relative_to(ROOT)), 'sha256': sha(STUDY.read_bytes())},
                'rawBytes': sum(r['original']['bytes'] for r in rows),
                'storedBytes': sum(r['stored']['bytes'] for r in rows),
                'originalReferencesUnchanged': True,
                'note': 'Logical original paths and SHA256 remain valid after decoding. Historical report signatures are not rewritten. Restore into a fresh directory for replay.'}
    validate_manifest(manifest)
    with MANIFEST.open('x') as stream:
        stream.write(json.dumps(manifest, indent=2) + '\n')
    return {'prepared': len(rows), 'rawBytes': manifest['rawBytes'], 'storedBytes': manifest['storedBytes']}


def apply(manifest):
    assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == 'codex/v4-ship-2026-11-16'
    review = json.loads((ROOT / 'reports/v4-ship/S11/evidence-archive-review-1.json').read_bytes())
    assert review['pass'] and review['mode'] == 'prepared'
    assert review['manifest']['sha256'] == sha(MANIFEST.read_bytes())
    assert review['archiveTool']['sha256'] == sha(Path(__file__).read_bytes())
    assert review['files'] == len(manifest['files'])
    for row in manifest['files']:
        assert not (ROOT / 'STOP-V4SHIP').exists()
        decoded = payload(row, True)
        path = ROOT / row['original']['path']
        stored = ROOT / row['stored']['path']
        if stored.exists():
            assert payload(row) == decoded
        else:
            assert checked_bytes(row['original']) == decoded
            with stored.open('xb') as stream:
                stream.write(checked_bytes(row['candidate']))
            assert payload(row) == decoded
        if path.exists():
            assert checked_bytes(row['original']) == decoded
            path.unlink()
    total = sum(p.stat().st_size for p in (ROOT / 'reports/v4-ship').rglob('*') if p.is_file())
    assert total < 150_000_000
    return {'archived': len(manifest['files']), 'savedBytes': manifest['rawBytes'] - manifest['storedBytes'], 'reportBytes': total}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify', 'restore'])
    parser.add_argument('--destination')
    parser.add_argument('--prepared', action='store_true')
    args = parser.parse_args()
    assert not (ROOT / 'STOP-V4SHIP').exists()
    if args.action == 'prepare':
        result = prepare()
    else:
        manifest = validate_manifest(json.loads(MANIFEST.read_bytes()))
        if args.action == 'apply':
            assert not args.prepared and not args.destination
            result = apply(manifest)
        elif args.action == 'restore':
            assert args.destination
            result = restore(manifest, args.destination, args.prepared)
        else:
            result = {'verified': len(manifest['files']), 'bytes': sum(len(payload(r, args.prepared)) for r in manifest['files'])}
    print(json.dumps(result))


if __name__ == '__main__':
    main()
