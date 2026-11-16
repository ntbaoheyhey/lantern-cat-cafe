"""Bind sampled object evidence and the single explicit unit signing fixture."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdigit() and not (ROOT / 'STOP-V4SHIP').exists()
out = ROOT / f'reports/v4-ship/S11/history-text-object-study-review-{attempt}.json'
assert not out.exists()
sha = lambda data: hashlib.sha256(data).hexdigest()
sign = lambda path: {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}


def check(record):
    data = (ROOT / record['path']).read_bytes()
    assert sha(data) == record['sha256'], record['path']
    return data


source = ROOT / 'reports/v4-ship/S11/history-text-object-study-1.json'
study = json.loads(source.read_bytes())
check(study['harness']);check(study['helper'])
scope = json.loads(check(study['scope']))
packed = (ROOT / 'reports/v4-ship/S11/history-paths-1/inventory.json.gz').read_bytes()
assert sha(packed) == scope['inventorySha256']
inventory = json.loads(gzip.decompress(packed))
mapping_set = {(r['commit'], r['path'], r['oid'], r['bytes']) for r in inventory if r['kind'] == 'blob'}
assert study['complete'] and study['fixtureRootChecksPass'] and not study['fullHistoryPass']
cases = ['plain', 'application-header', 'large-multiline', 'no-final-newline', 'crlf', 'utf8-prefix', 'ignore-inline-suppression', 'filename-yaml', 'negative']
assert [r['case'] for r in study['fixtures']] == cases
for row in study['fixtures']:
    expected = 'kubernetes-secret-yaml' if row['case'] == 'filename-yaml' else 'private-key'
    assert len(row['rootGit']['findings']) == (0 if row['case'] == 'negative' else 1)
    assert not any(row['rootGit']['skipDiagnostics'].values())
    if row['case'] != 'negative':
        assert row['rootGit']['findings'][0]['type'] == expected
    assert row['patch']['verified'][0]['bytes'] == row['bytes']
    assert row['patch']['verified'][0]['sha256'] == row['sha256']
for case in ['application-header', 'large-multiline', 'filename-yaml']:
    assert not next(r for r in study['fixtures'] if r['case'] == case)['stdin']['findings']

rows = study['realObjects'];comparison = study['realComparison']
assert len(rows) == comparison['objects'] == 50 and len({r['oid'] for r in rows}) == 50
assert comparison['bytes'] == sum(r['bytes'] for r in rows) == 19075387
assert abs(comparison['stdinSeconds'] - sum(r['stdin']['seconds'] for r in rows)) < 1e-8
patch = {r['name']: r for r in comparison['patch']['verified']}
assert len(patch) == len(rows)
stdin_findings = []
fixture_data = None
for row in rows:
    m = row['mapping']
    assert (m['commit'], m['path'], m['oid'], m['bytes']) in mapping_set
    data = subprocess.check_output(['git', 'show', m['commit'] + ':' + m['path']], cwd=ROOT)
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == row['oid']
    assert len(data) == row['bytes'] and sha(data) == row['sha256'];data.decode('utf-8');assert b'\0' not in data
    assert patch[row['name']] == {'name': row['name'], 'bytes': len(data), 'lines': data.count(b'\n') + int(bool(data) and not data.endswith(b'\n')), 'sha256': sha(data)}
    stdin_findings.extend(row['stdin']['findings'])
    if row['oid'] == '8113b46907826e0fe282b0161527f5ee8d1e1759':
        fixture_data = data.decode().splitlines()
sort = lambda rows: sorted(rows, key=lambda r: (r['file'], r['line'] or 0, r['type']))
assert comparison['sameMetadataFindings'] and sort(stdin_findings) == comparison['rootGit']['findings']
assert not any(comparison['rootGit']['skipDiagnostics'].values())
finding = comparison['rootGit']['findings']
assert len(finding) == 1 and finding[0]['file'] == '8113b46907826e0fe282b0161527f5ee8d1e1759.txt'
assert finding[0]['line'] == finding[0]['endLine'] == 17 and finding[0]['type'] == 'generic-api-key'
assert fixture_data is not None
match = re.fullmatch(r'''const SECRET = (['"`])(.*?)\1;''', fixture_data[16])
assert match and len(match[2]) == 46 and re.search(r'unit|test', match[2], re.I)
assert 'secret = SECRET' in fixture_data[39] and 'createHmac(' in fixture_data[52] and 'SECRET' in fixture_data[52]

prior = ROOT / 'reports/v4-ship/S11/ranged-delivery-regression-1/log.jsonl.gz'
current = ROOT / 'reports/v4-ship/S11/history-text-study-regression-1/log.jsonl.gz'
check_path = current.with_name('check.json')
regression = json.loads(check_path.read_bytes());check(regression['log'])
assert regression['complete'] and not regression['commandsPassed']
assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}


def summary(path):
    rows = [json.loads(line) for line in gzip.decompress(path.read_bytes()).splitlines()]
    text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
    return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]


web = summary(current)
assert web == summary(prior) and sum(r.startswith('FAIL ') for r in web) == 7
assert 'Tests  7 failed | 2690 passed (2697)' in web
result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
          'inputs': [sign(p) for p in [source, prior, current, check_path]], 'fixtureCases': 9,
          'exactCommitPathObjects': 50, 'exactSourceBytes': comparison['bytes'], 'rawFindings': 1,
          'reviewedSyntheticTestFixtures': 1, 'unresolved': 0, 'review': {
              'oid': '8113b46907826e0fe282b0161527f5ee8d1e1759', 'path': 'supabase/tests/src/malformed.test.ts', 'line': 17,
              'reason': 'Exact frozen test blob: explicit unit/test signing constant, supplied to its local signing helper at line 40 and local expected-HMAC assertion at line 53. No value persisted.'},
          'sameSevenArtFailures': True, 'webSummary': web, 'gRegPass': False, 'fullHistoryPass': False, 'pass': True,
          'limits': 'Binds source objects and recorded patch attestations, aggregates and metadata-only findings. Does not rerun detector or independently replay discarded synthetic patches; no full-history or unexamined-content claim.'}
out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['pass', 'fixtureCases', 'exactCommitPathObjects', 'exactSourceBytes', 'rawFindings', 'reviewedSyntheticTestFixtures', 'unresolved', 'sameSevenArtFailures']}))
