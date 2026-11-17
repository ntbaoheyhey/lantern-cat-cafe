"""Reject damaged archives and unsafe restoration without printing contents."""
from pathlib import Path
import copy
import gzip
import importlib.util
import json
import sys
import tempfile

source = Path(__file__).with_name('evidence-archive.py')
spec = importlib.util.spec_from_file_location('evidence_archive', source)
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)
manifest = json.loads(archive.MANIFEST.read_bytes())
prepared = sys.argv[1] == 'prepared'
assert sys.argv[1] in ['prepared', 'installed']
row = manifest['files'][0]
encoded = archive.checked_bytes(row['candidate' if prepared else 'stored'])
controls = []


def reject(name, callback):
    try:
        callback()
    except Exception:
        controls.append(name)
    else:
        raise AssertionError('Accepted negative control: ' + name)


def mutated(callback):
    value = copy.deepcopy(manifest)
    callback(value)
    return archive.validate_manifest(value)


reject('original-path-traversal', lambda: mutated(lambda d: d['files'][0]['original'].update(path='../outside.json')))
reject('stored-path-traversal', lambda: mutated(lambda d: d['files'][0]['stored'].update(path='../outside.gz')))
reject('candidate-path-traversal', lambda: mutated(lambda d: d['files'][0]['candidate'].update(path='../outside.gz')))
reject('duplicate-original', lambda: mutated(lambda d: d['files'].__setitem__(1, copy.deepcopy(d['files'][0]))))
reject('missing-original', lambda: mutated(lambda d: d['files'].pop()))
reject('unknown-codec', lambda: mutated(lambda d: d.update(codec='xz')))
reject('wrong-source-commit', lambda: mutated(lambda d: d.update(sourceCommit='0' * 40)))
reject('noninteger-size', lambda: mutated(lambda d: d['files'][0]['original'].update(bytes=1.5)))
reject('oversized-declaration', lambda: mutated(lambda d: d['files'][0]['original'].update(bytes=10_000_001)))
reject('encoded-hash-mismatch', lambda: archive.checked_bytes({**row['candidate' if prepared else 'stored'], 'sha256': '0' * 64}))
reject('decoded-hash-mismatch', lambda: archive.decode(encoded, {**row['original'], 'sha256': '0' * 64}))
reject('decoded-size-mismatch', lambda: archive.decode(encoded, {**row['original'], 'bytes': row['original']['bytes'] + 1}))
reject('truncated-gzip', lambda: archive.decode(encoded[:-5], row['original']))
reject('extra-gzip-member', lambda: archive.decode(encoded + encoded, row['original']))
damaged = bytearray(encoded); damaged[len(damaged) // 2] ^= 255
reject('corrupted-gzip', lambda: archive.decode(bytes(damaged), row['original']))
reject('bounded-decoding', lambda: archive.decode(gzip.compress(b'A' * (row['original']['bytes'] + 1)), row['original']))
with tempfile.TemporaryDirectory(prefix='archive-controls-', dir=archive.ROOT / 'work/v4ship-prep') as temporary:
    root = Path(temporary)
    destination = root / 'existing'; destination.mkdir()
    marker = destination / 'keep.txt'; marker.write_bytes(b'preserve existing bytes\n')
    reject('existing-destination', lambda: archive.restore(manifest, destination, prepared))
    assert marker.read_bytes() == b'preserve existing bytes\n' and len(list(destination.iterdir())) == 1
    link = root / 'linked'; link.symlink_to(destination, target_is_directory=True)
    reject('symlink-destination', lambda: archive.restore(manifest, link, prepared))
    compressed = root / 'member.gz'; compressed.write_bytes(encoded)
    link_file = root / 'member-link.gz'; link_file.symlink_to(compressed)
    reject('symlink-archive', lambda: archive.checked_bytes({'path': str(link_file.relative_to(archive.ROOT)), 'bytes': len(encoded), 'sha256': archive.sha(encoded)}))
print(json.dumps({'pass': True, 'rejected': controls, 'count': len(controls)}))
