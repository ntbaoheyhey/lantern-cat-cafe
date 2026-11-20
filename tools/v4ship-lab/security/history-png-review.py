"""Independently reconstruct PNG metadata from immutable commit:path inputs."""
from pathlib import Path
import collections
import datetime
import gzip
import hashlib
import json
import subprocess
import sys
import time
import zlib

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal() and not (root / 'STOP-V4SHIP').exists()
source = root / f'reports/v4-ship/S11/history-png-{attempt}/check.json'
out = root / f'reports/v4-ship/S11/history-png-review-{attempt}.json'
assert not out.exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': sha(p.read_bytes())}
report = json.loads(source.read_text())
assert report['complete'] and report['inspectedBlobs'] == report['selectedBlobs'] == 27892
for ref in [*report['harness'], *report['inputs'], report['rows']]:
    assert sha((root / ref['path']).read_bytes()) == ref['sha256']
raw = json.loads(gzip.decompress((root / report['rows']['path']).read_bytes()))
inventory_path = root / 'reports/v4-ship/S11/history-paths-1/inventory.json.gz'
inventory = json.loads(gzip.decompress(inventory_path.read_bytes()))
groups = {}
for i, entry in enumerate(inventory):
    if entry['kind'] == 'blob' and entry['path'].lower().endswith('.png'):
        groups.setdefault(entry['oid'], []).append(i)
assert [r['oid'] for r in raw['rows']] == sorted(groups)
assert len({r['sha256'] for r in raw['scans']}) == len(raw['scans'])
used_scans = set()
total_bytes = 0
anomalies = []
chunks_all = collections.Counter()
nontext_all = collections.Counter()
decoded_total = 0
started = time.monotonic()
batch = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
try:
    for number, row in enumerate(raw['rows']):
        assert not (root / 'STOP-V4SHIP').exists()
        assert row['inventoryIndices'] == groups[row['oid']]
        item = inventory[row['inventoryIndices'][0]]
        reference = item['commit'] + ':' + item['path']
        batch.stdin.write((reference + '\n').encode())
        batch.stdin.flush()
        header = batch.stdout.readline().decode().split()
        assert header == [row['oid'], 'blob', str(row['bytes'])]
        data = batch.stdout.read(row['bytes'])
        assert len(data) == row['bytes'] and batch.stdout.read(1) == b'\n'
        assert sha(data) == row['sha256']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == row['oid']
        total_bytes += len(data)
        if not data.startswith(bytes.fromhex('89504e470d0a1a0a')):
            assert row['errors'] == [{'chunk': 0, 'offset': 8, 'code': 'not-png-signature'}]
            assert not row['texts'] and not row['chunks'] and not row['framingAndTextComplete']
            kind = 'jpeg' if data.startswith(bytes.fromhex('ffd8ff')) else 'webp' if data[:4] == b'RIFF' and data[8:12] == b'WEBP' else 'other'
            anomalies.append({'oid': row['oid'], 'bytes': len(data), 'detectedContainer': kind,
                              'inventoryIndices': row['inventoryIndices'], 'metadataUnscanned': True})
            continue
        assert not row['errors'] and row['framingAndTextComplete'], 'New parse anomaly needs explicit independent review'
        offset, index, decoded = 8, 0, 0
        texts = []
        counts = collections.Counter()
        nontext = collections.Counter()
        while offset < len(data):
            length = int.from_bytes(data[offset:offset + 4], 'big')
            kind = data[offset + 4:offset + 8]
            end = offset + length + 12
            assert end <= len(data)
            body = data[offset + 8:end - 4]
            assert zlib.crc32(kind + body) == int.from_bytes(data[end - 4:end], 'big')
            name = kind.decode('ascii')
            counts[name] += 1
            if kind in (b'tEXt', b'zTXt', b'iTXt'):
                textrow = row['texts'][len(texts)]
                assert {k: textrow[k] for k in ['index', 'offset', 'type', 'bytes', 'sha256']} == {'index': index, 'offset': offset, 'type': name, 'bytes': length, 'sha256': sha(body)}
                separator = body.index(0)
                fields = [body[:separator].decode('latin-1')]
                rest = body[separator + 1:]
                compressed = False
                encoding = 'latin-1'
                if kind == b'tEXt':
                    value = rest
                elif kind == b'zTXt':
                    assert rest[0] == 0
                    value = zlib.decompress(rest[1:])
                    compressed = True
                else:
                    flag, method = rest[0], rest[1]
                    assert flag in (0, 1) and (flag == 0 or method == 0)
                    parts = rest[2:].split(bytes([0]))
                    assert len(parts) >= 3
                    fields.extend([parts[0].decode('ascii'), parts[1].decode('utf-8')])
                    encoded = bytes([0]).join(parts[2:])
                    value = zlib.decompress(encoded) if flag else encoded
                    compressed = bool(flag)
                    encoding = 'utf-8'
                fields.append(value.decode(encoding))
                payload = '\n'.join(fields).encode('utf-8')
                assert textrow['compressed'] == compressed and textrow['textEncoding'] == encoding
                assert textrow['fieldCount'] == len(fields) and textrow['decodedBytes'] == len(payload)
                assert textrow['decodedSha256'] == sha(payload)
                scan = raw['scans'][textrow['scanIndex']]
                assert scan['sha256'] == sha(payload) and scan['bytes'] == len(payload)
                assert scan['scannerExitCode'] == (1 if scan['findings'] else 0)
                used_scans.add(textrow['scanIndex'])
                decoded += len(payload)
                texts.append(textrow)
            else:
                nontext[name] += length
            offset = end
            index += 1
            if kind == b'IEND':
                assert length == 0 and offset == len(data)
                break
        assert counts['IHDR'] == 1 and counts['IEND'] == 1 and counts['IDAT'] > 0
        assert dict(counts) == row['chunks'] and dict(nontext) == row['nonTextBytesByType']
        assert texts == row['texts'] and decoded == row['decodedBytes']
        chunks_all.update(counts)
        nontext_all.update(nontext)
        decoded_total += decoded
        if (number + 1) % 5000 == 0:
            print(json.dumps({'verified': number + 1, 'total': len(raw['rows'])}), flush=True)
    batch.stdin.close()
    assert batch.wait() == 0
finally:
    if batch.poll() is None:
        batch.terminate()
        batch.wait()
assert used_scans == set(range(len(raw['scans'])))
assert total_bytes == report['inspectedBytes'] and decoded_total == report['mappedDecodedBytes']
assert dict(chunks_all) == report['chunkCounts'] and dict(nontext_all) == report['unscannedNonTextBytesByType']
assert len(anomalies) == report['objectsWithErrors']
assert len(raw['scans']) == report['uniqueDecodedTexts']
assert sum(s['bytes'] for s in raw['scans']) == report['uniqueDecodedBytes']
assert sum(len(s['findings']) for s in raw['scans']) == report['findings']
result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
          'inputs': [sign(source), report['rows'], sign(inventory_path)], 'scopeMatchesAllFrozenPngPairs': True,
          'commitPathObjectsVerified': len(raw['rows']), 'pathBlobPairs': sum(map(len, groups.values())),
          'objectBytes': total_bytes, 'decodedChunkMappingsVerified': sum(len(r['texts']) for r in raw['rows']),
          'uniqueScannedTextsVerified': len(raw['scans']), 'findings': report['findings'],
          'anomalies': anomalies, 'pass': True, 'fullHistoryPass': False, 'binaryCoveragePass': False,
          'imageOpens': 0, 'seconds': time.monotonic() - started,
          'limits': 'Independent mapping/byte/decode/aggregate review; detector was not rerun. Non-PNG anomalies and all non-text/encoded/binary scopes remain open.'}
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k not in ['inputs', 'harness', 'anomalies']}))
