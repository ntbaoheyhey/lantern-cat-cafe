"""Independently reproduce source-digest derivations and regression comparison."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda data: hashlib.sha256(data).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
attempt = sys.argv[1]
assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
out = ROOT / f'reports/v4-ship/S11/history-text-prefix-triage-review-{attempt}.json'
assert not out.exists()
path = ROOT / 'reports/v4-ship/S11/history-text-prefix-triage-1.json'
triage = json.loads(path.read_bytes())
for record in [triage['harness'], triage['input']]:
    assert sha((ROOT / record['path']).read_bytes()) == record['sha256']
raw_path = ROOT / triage['input']['path']; raw = json.loads(raw_path.read_bytes())
identity = lambda row: (row['oid'], row['line'], row['endLine'], row['type'])
expected = {identity({'oid': r['oid'], **r['finding']}): r for r in raw['prefix']['findingMappings']}
actual = {identity(r): r for r in triage['findings']}
assert len(actual) == len(triage['findings']) == len(expected) == 61 and actual.keys() == expected.keys()
sources, documents = {}, {}
for key, row in actual.items():
    original = expected[key]
    assert row['mappings'] == original['mappings'] and row['classification'] == 'verified-source-digest'
    ref = row['reference']; location = (ref['commit'], ref['path'])
    if location not in sources:
        data = subprocess.check_output(['git', 'show', ref['commit'] + ':' + ref['path']], cwd=ROOT)
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == ref['oid']
        assert len(data) == ref['bytes']; sources[location] = data
    if row['oid'] not in documents:
        mapping = row['mappings'][0]
        data = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + mapping['path']], cwd=ROOT)
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == row['oid']
        documents[row['oid']] = data
    data = documents[row['oid']]
    pair = json.loads('{' + data.decode().splitlines()[row['line'] - 1].strip().rstrip(',') + '}')
    assert len(pair) == 1
    field, value = next(iter(pair.items()))
    assert re.fullmatch('[a-f0-9]{64}', value) and sha(sources[location]) == value
    document = json.loads(data)
    if row['field'] == 'root':
        assert document[field] == value and field == ref['path']
    elif row['field'] == 'tokensSha256':
        assert document[field] == value and ref['path'] == 'apps/web/src/game/cardrpg/look-tokens.json'
        producer = row['producer']
        data = subprocess.check_output(['git', 'show', producer['commit'] + ':' + producer['path']], cwd=ROOT)
        assert sha(data) == document['scriptSha256']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == producer['oid']
        assert b"TOKENS = ROOT / 'apps/web/src/game/cardrpg/look-tokens.json'" in data
        assert b"'tokensSha256': sha(TOKENS)" in data and b'lambda path: hashlib.sha256(path.read_bytes()).hexdigest()' in data
    else:
        assert document[row['field']][field] == value and field == ref['path']
assert len(sources) == triage['comparison']['batchCached']['requests'] == 32
assert triage['reviewed'] == 61 and triage['unresolved'] == 0 and triage['reviewedFindingsPass'] and not triage['fullHistoryPass']

folder = ROOT / 'reports/v4-ship/S11/history-text-prefix-triage-regression-1'
check_path = folder / 'check.json'; check = json.loads(check_path.read_bytes())
assert check['complete'] and not check['commandsPassed'] and not check['officialClassParityGate']
assert {r['name']: r['exitCode'] for r in check['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
assert sha((ROOT / check['log']['path']).read_bytes()) == check['log']['sha256']


def summary(p):
    rows = [json.loads(line) for line in gzip.decompress(p.read_bytes()).splitlines()]
    text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
    return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]


previous = ROOT / 'reports/v4-ship/S11/history-text-detector-regression-1'
web = summary(folder / 'log.jsonl.gz')
assert web == summary(previous / 'log.jsonl.gz') and sum(r.startswith('FAIL ') for r in web) == 7
assert 'Tests  7 failed | 2690 passed (2697)' in web
parity = json.loads((folder / 'parity-probe.json').read_bytes())
assert parity['rows'] == json.loads((previous / 'parity-probe.json').read_bytes())['rows']
assert parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
          'inputs': [sign(p) for p in [path, raw_path, check_path, folder / 'log.jsonl.gz', folder / 'parity-probe.json', previous / 'log.jsonl.gz', previous / 'parity-probe.json']],
          'exactFindings': 61, 'exactReportObjects': len(documents), 'exactReferencedSources': len(sources),
          'derivedRendererField': 1, 'sourceDerivationsPass': True, 'rawFindingSetUnchanged': True,
          'sameSevenArtFailures': True, 'webSummary': web, 'parityRowsUnchanged': True,
          'pass': True, 'gRegPass': False, 'fullHistoryPass': False,
          'limits': 'Independent git-show source derivation and exact finding-set/regression comparison. Does not clear unreviewed scanner rows, source contents or any other history surface. Captures/digests not emitted.'}
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['pass', 'exactFindings', 'exactReportObjects', 'exactReferencedSources', 'sameSevenArtFailures', 'fullHistoryPass']}))
