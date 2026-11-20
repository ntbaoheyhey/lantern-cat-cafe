"""Validate text extraction and reject corrupt byte containers; never render images."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys
import zlib
from png_metadata import MetadataError, decode_text_chunk, inspect

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal() and not (root / 'STOP-V4SHIP').exists()
out = root / f'reports/v4-ship/S11/history-png-parser-check-{attempt}.json'
assert not out.exists()
rows = []
marker = ('-----BEGIN ' + 'PRIVATE KEY-----\n' + 'PUBLIC INVALID TEST FIXTURE\n' * 8 + '-----END ' + 'PRIVATE KEY-----').encode()
variants = [
    (b'tEXt', b'Comment\0' + marker),
    (b'zTXt', b'Comment\0\0' + zlib.compress(marker)),
    (b'iTXt', b'Comment\0\0\0en\0Meaning\0' + marker),
    (b'iTXt', b'Comment\0\1\0en\0Meaning\0' + zlib.compress(marker)),
]
flags = ['--no-banner', '--no-color', '--redact=100', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
for i, (kind, data) in enumerate(variants):
    payload, details = decode_text_chunk(kind, data)
    assert payload.endswith(marker)
    result = subprocess.run(['gitleaks', 'stdin', *flags], input=payload, capture_output=True, cwd=root)
    findings = json.loads(result.stdout or b'[]')
    assert result.returncode == 1 and len(findings) == 1 and findings[0]['RuleID'] == 'private-key'
    rows.append({'case': 'positive-text-' + str(i), 'type': kind.decode(), **details,
                 'payloadBytes': len(payload), 'payloadSha256': hashlib.sha256(payload).hexdigest(),
                 'expectedPublicInvalidFixtureFindings': len(findings), 'pass': True})
for name, kind, data, limit, code in [
    ('missing-separator', b'tEXt', b'Comment', 1024, 'missing-keyword-separator'),
    ('bad-keyword', b'tEXt', b' Bad\0body', 1024, 'invalid-keyword-spacing'),
    ('wrong-compression', b'zTXt', b'Comment\0\1' + zlib.compress(b'body'), 1024, 'unsupported-compression-method'),
    ('truncated-zlib', b'zTXt', b'Comment\0\0' + zlib.compress(b'body')[:-2], 1024, 'incomplete-zlib'),
    ('trailing-zlib', b'zTXt', b'Comment\0\0' + zlib.compress(b'body') + b'x', 1024, 'trailing-zlib-data'),
    ('expansion-ceiling', b'zTXt', b'Comment\0\0' + zlib.compress(b'A' * 2048), 128, 'text-resource-limit'),
    ('invalid-utf8', b'iTXt', b'Comment\0\0\0en\0\0\xff', 1024, 'invalid-text-encoding'),
    ('invalid-flag', b'iTXt', b'Comment\0\2\0en\0\0body', 1024, 'invalid-compression-flag'),
    ('nul-text', b'tEXt', b'Comment\0body\0tail', 1024, 'text-contains-nul'),
]:
    try:
        decode_text_chunk(kind, data, limit)
    except MetadataError as exc:
        assert str(exc) == code
    else:
        raise AssertionError('Expected safe rejection: ' + name)
    rows.append({'case': name, 'expectedCode': code, 'pass': True})
payload, details = decode_text_chunk(b'iTXt', b'Title\0\0\xffvi\0T\xc3\xaan\0C\xc3\xa0 ph\xc3\xaa')
assert payload.decode() == 'Title\nvi\nTên\nCà phê'
rows.append({'case': 'utf8-and-ignored-uncompressed-method', 'pass': True})
comparison = json.loads((root / 'reports/v4-ship/S11/history-png-method-comparison-1.json').read_text())
sample = comparison['rows'][0]['hashes'][0]
original = subprocess.check_output(['git', 'cat-file', 'blob', sample['oid']], cwd=root)
assert hashlib.sha256(original).hexdigest() == sample['sha256']
parsed, _ = inspect(original)
assert parsed['framingAndTextComplete']
rows.append({'case': 'unchanged-existing-container', 'oid': sample['oid'], 'pass': True})
badcrc = bytearray(original)
badcrc[29] ^= 1
for name, data, code in [('crc', bytes(badcrc), 'chunk-crc-mismatch'),
                         ('truncated-container', original[:-3], 'truncated-chunk-header'),
                         ('trailing-container', original + b'PUBLIC TEST', 'trailing-png-data')]:
    parsed, _ = inspect(data)
    assert code in [r['code'] for r in parsed['errors']] and not parsed['framingAndTextComplete']
    rows.append({'case': name, 'expectedCode': code, 'pass': True})
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-png.md',
          'harness': [sign(Path(__file__)), sign(Path(__file__).with_name('png_metadata.py'))],
          'rows': rows, 'pass': all(r['pass'] for r in rows), 'imageOpens': 0, 'generatedImages': 0,
          'limits': 'Synthetic text-chunk payloads and in-memory corruptions of one existing container only; no PNG generated, rendered or saved.'}
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'cases': len(rows), 'pass': report['pass'], 'output': str(out.relative_to(root))}))
