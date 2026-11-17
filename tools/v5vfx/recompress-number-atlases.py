"""Recompress PNG IDAT bytes without changing pixels, filters, or metadata."""
import binascii
import hashlib
import json
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[2]
input_path = root / 'work/v5/CXV/films/V7-F-offline-number-atlas-r2/report.json'
out = root / 'work/v5/CXV/films/V7-F-offline-number-atlas-png-deflate'
assert not (out / 'manifest.json').exists()
out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
source_bytes = input_path.read_bytes()
source = json.loads(source_bytes)
assert source['pass'] and source['sourceKind'] == 'canvas'
report = {k: source[k] for k in ['source', 'runtimePatchSha256', 'font', 'fontSha256', 'numberSourceSha256']}
report.update(utc=datetime.now(timezone.utc).isoformat(), toolSha256=sha(Path(__file__).read_bytes()), exportManifest=str(input_path), exportManifestSha256=sha(source_bytes), zlibVersion=zlib.ZLIB_VERSION, assets=[])
for row in source['assets']:
    data = Path(row['path']).read_bytes()
    assert sha(data) == row['sha256'] and data[:8] == b'\x89PNG\r\n\x1a\n'
    chunks = []
    offset = 8
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        body = data[offset+8:offset+8+length]
        assert struct.unpack('>I', data[offset+8+length:offset+12+length])[0] == binascii.crc32(kind+body)
        chunks.append((kind, body))
        offset += length+12
    assert offset == len(data) and chunks[-1][0] == b'IEND'
    raw = zlib.decompress(b''.join(body for kind, body in chunks if kind == b'IDAT'))
    candidates = []
    for strategy in [zlib.Z_DEFAULT_STRATEGY, zlib.Z_FILTERED, zlib.Z_RLE]:
        compressor = zlib.compressobj(9, zlib.DEFLATED, 15, 9, strategy)
        compressed = compressor.compress(raw)+compressor.flush()
        assert zlib.decompress(compressed) == raw
        candidates.append((len(compressed), strategy, compressed))
    _, strategy, compressed = min(candidates)
    new = data[:8]
    inserted = False
    for kind, body in chunks:
        if kind == b'IDAT':
            if inserted:
                continue
            body, inserted = compressed, True
        new += struct.pack('>I', len(body))+kind+body+struct.pack('>I', binascii.crc32(kind+body))
    path = out / Path(row['path']).name
    path.write_bytes(new)
    report['assets'].append(dict(row, originalPath=row['path'], originalBytes=row['bytes'], originalSha256=row['sha256'], path=str(path), bytes=len(new), sha256=sha(new), strategy=strategy, filteredDataSha256=sha(raw), nonIdatChunks=[kind.decode() for kind, _ in chunks if kind != b'IDAT']))
(out / 'manifest.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'out':str(out), 'originalBytes':sum(a['originalBytes'] for a in report['assets']), 'compressedBytes':sum(a['bytes'] for a in report['assets']), 'assets':[{k:a[k] for k in ['color','bytes']} for a in report['assets']]}))
