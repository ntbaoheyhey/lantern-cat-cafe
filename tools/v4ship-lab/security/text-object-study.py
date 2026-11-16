"""Compare pinned stdin and exact root patches; persist no detector match values."""
from pathlib import Path
import base64
import datetime
import gzip
import hashlib
import json
import sys
import time
from text_objects import ROOT, CONFIG, RootScan, git, scan, sha, validate_tools

attempt = sys.argv[1]
assert attempt.isdigit() and not (ROOT / 'STOP-V4SHIP').exists()
output = ROOT / f'reports/v4-ship/S11/history-text-object-study-{attempt}.json'
assert not output.exists()
binding = validate_tools()
scope_path = ROOT / 'reports/v4-ship/S11/history-paths-1/scope.json'
inventory_path = scope_path.with_name('inventory.json.gz')
scope = json.loads(scope_path.read_bytes())
assert sha(inventory_path.read_bytes()) == scope['inventorySha256']
inventory = json.loads(gzip.decompress(inventory_path.read_bytes()))
assert len(inventory) == scope['uniquePathObjectPairs']

# Public deliberately invalid syntax, not generated cryptographic material.
begin = b'-----BEGIN ' + b'PRIVATE ' + b'KEY-----\n'
end = b'-----END ' + b'PRIVATE ' + b'KEY-----'
marker = begin + (b'PUBLIC INVALID NOT KEY MATERIAL\n' * 4) + end
large_marker = begin + (b'PUBLIC INVALID NOT KEY MATERIAL\n' * 9000) + end
yaml = b'kind: ' + b'Secret\ndata:\n  demonstration: ' + base64.b64encode(b'public-invalid-study-value') + b'\n'
fixtures = [
    ('plain', marker + b'\n', 'txt', 'private-key'),
    ('application-header', b'%PDF-1.7\n' + marker + b'\n', 'txt', 'private-key'),
    ('large-multiline', large_marker + b'\n', 'txt', 'private-key'),
    ('no-final-newline', marker, 'txt', 'private-key'),
    ('crlf', (marker + b'\n').replace(b'\n', b'\r\n'), 'txt', 'private-key'),
    ('utf8-prefix', 'Tiếng Việt\n'.encode() + marker + b'\n', 'txt', 'private-key'),
    ('ignore-inline-suppression', marker + b' # gitleaks:allow\n', 'txt', 'private-key'),
    ('filename-yaml', yaml, 'yaml', 'kubernetes-secret-yaml'),
    ('negative', b'ordinary public study text\n', 'txt', None),
]
study = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-text-objects.md',
         'binding': binding, 'harness': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__).read_bytes())},
         'helper': {'path': 'tools/v4ship-lab/security/text_objects.py', 'sha256': sha(Path(__file__).with_name('text_objects.py').read_bytes())},
         'scope': {'path': str(scope_path.relative_to(ROOT)), 'sha256': sha(scope_path.read_bytes())},
         'fixtures': [], 'realObjects': [], 'complete': False, 'fullHistoryPass': False}


def save():
    output.write_text(json.dumps(study, indent=2) + '\n')


with RootScan() as isolated:
    for case, data, extension, expected in fixtures:
        data.decode('utf-8');assert b'\0' not in data
        oid = isolated.add_public_fixture(data);entry = {'oid': oid, 'name': oid + '.' + extension, 'bytes': len(data), 'sha256': sha(data)}
        commit, patch = isolated.prepare([entry])
        stdin_result = scan('stdin', isolated.path, payload=data)
        git_result = scan('git', isolated.path, commit=commit)
        actual = {r['type'] for r in git_result['findings']}
        row = {'case': case, 'bytes': len(data), 'sha256': sha(data), 'expectedRule': expected,
               'stdin': stdin_result, 'rootGit': git_result, 'patch': patch,
               'expectedRootDetection': expected in actual if expected else not actual}
        study['fixtures'].append(row);save()
        print(json.dumps({'case': case, 'stdinFindings': len(stdin_result['findings']), 'rootFindings': len(git_result['findings']), 'expectedRootDetection': row['expectedRootDetection']}), flush=True)
    # Deterministic extension/size strata, not a random or full-history sample.
    unique = {r['oid']: r for r in reversed(inventory) if r['kind'] == 'blob'}
    chosen = {}
    for extension in ['.json', '.html', '.ts', '.tsx', '.js', '.md', '.log', '.yaml']:
        candidates = sorted([r for r in unique.values() if Path(r['path']).suffix.lower() == extension and 0 < r['bytes'] <= 1_000_000], key=lambda r: r['oid'])
        for fraction in range(min(6, len(candidates))):
            r = candidates[fraction * len(candidates) // 6];chosen[r['oid']] = r
    for extension in ['.json', '.html']:
        candidates = sorted([r for r in unique.values() if Path(r['path']).suffix.lower() == extension and 1_000_000 < r['bytes'] <= 10_000_000], key=lambda r: (-r['bytes'], r['oid']))
        if candidates:
            chosen[candidates[0]['oid']] = candidates[0]
    entries, stdin_findings, input_bytes, stdin_seconds = [], [], 0, 0
    for r in sorted(chosen.values(), key=lambda r: r['oid']):
        assert not (ROOT / 'STOP-V4SHIP').exists()
        data = git(ROOT, 'cat-file', 'blob', r['oid'])
        assert len(data) == r['bytes'] and hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == r['oid']
        data.decode('utf-8');assert b'\0' not in data
        entry = {'oid': r['oid'], 'name': r['oid'] + '.txt', 'bytes': len(data), 'sha256': sha(data)};entries.append(entry)
        result = scan('stdin', isolated.path, payload=data)
        for f in result['findings']:
            f['file'] = entry['name'];stdin_findings.append(f)
        stdin_seconds += result['seconds'];input_bytes += len(data)
        study['realObjects'].append({'mapping': r, **entry, 'stdin': result});save()
    started = time.monotonic();commit, patch = isolated.prepare(entries);prepare_seconds = time.monotonic() - started
    root_result = scan('git', isolated.path, commit=commit)
    sort_findings = lambda rows: sorted(rows, key=lambda r: (r['file'], r['line'] or 0, r['type']))
    study['realComparison'] = {'objects': len(entries), 'bytes': input_bytes, 'stdinSeconds': round(stdin_seconds, 6),
                               'rootPreparationAndAuditSeconds': round(prepare_seconds, 6), 'rootGit': root_result,
                               'sameMetadataFindings': sort_findings(stdin_findings) == root_result['findings'], 'patch': patch}
study.update(complete=True, fixtureRootChecksPass=all(r['expectedRootDetection'] for r in study['fixtures']))
study['limits'] = [
    'Public invalid fixture matches are expected detector tests, not credential findings; no private key or credential was generated.',
    'Real sample is deterministic and stratified by extension/size; it is not representative proof of all blobs, original paths, encoded content or later refs.',
    'Synthetic root-commit metadata is artificial. Every source blob and root patch is byte-exact, but findings must be mapped back through the frozen inventory.',
    'Original historical text scanner is untouched. Default content allowlists and filename-specific rules require explicit consideration before any coverage claim.'
]
save()
print(json.dumps({'output': str(output.relative_to(ROOT)), 'fixtureRootChecksPass': study['fixtureRootChecksPass'],
                  'realComparison': {k: v for k, v in study['realComparison'].items() if k not in ['rootGit', 'patch']},
                  'rootScanSeconds': root_result['seconds'], 'realFindings': len(root_result['findings'])}), flush=True)
if not study['fixtureRootChecksPass']:
    sys.exit(1)
