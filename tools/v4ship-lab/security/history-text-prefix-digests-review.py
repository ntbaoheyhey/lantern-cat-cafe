"""Independent git-show derivation and exact finding/regression accounting."""
from pathlib import Path
from collections import Counter
import datetime
import gzip
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
identity = lambda r: (r['oid'], r['line'], r['endLine'], r['type'])


def unique(pairs):
    assert len({k for k, _ in pairs}) == len(pairs)
    return dict(pairs)


def invalid(_):
    raise ValueError('Invalid JSON constant')


def decode(data):
    return json.loads(data, object_pairs_hook=unique, parse_constant=invalid)


def load(path):
    data = path.read_bytes()
    return decode(gzip.decompress(data) if path.name.endswith('.gz') else data)


def check(row):
    assert sha((ROOT / row['path']).read_bytes()) == row['sha256']


def verify_correspondence(expected, actual):
    # A compact JSON line may contain multiple findings of the same rule.
    # Preserve every entry rather than collapsing that multiplicity into a dict.
    assert len(expected) == len(actual)
    for original, row in zip(expected, actual):
        assert identity({'oid': original['oid'], **original['finding']}) == identity(row)
        assert row['context'] == original['context'] and row['mappings'] == original['mappings']


def main(prefix, attempt, triage_attempt='1'):
    assert prefix.isdecimal() and attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/history-text-prefix-{prefix}-digests-review-{attempt}.json'
    assert not out.exists()
    source = ROOT / f'reports/v4-ship/S11/history-text-prefix-{prefix}-digests-{triage_attempt}.json.gz'
    triage = load(source)
    for key in ['harness', 'helper', 'input', 'previous']:
        check(triage[key])
    raw_path = ROOT / triage['input']['path']; raw = load(raw_path)
    for row in raw['inputs']:
        check(row)
    expected = raw['prefix']['findingMappings']; actual = triage['findings']
    verify_correspondence(expected, actual)
    multiplicities = Counter(identity(r) for r in actual)
    previous = load(ROOT / triage['previous']['path'])
    prior = {identity(r): r for r in previous['findings']}
    documents, sources, producers = {}, {}, {}
    resolved = 0
    for row in actual:
        key = identity(row)
        if row['classification'] == 'unresolved':
            assert 'reference' not in row
            continue
        assert row['classification'] == 'verified-source-digest'
        assert multiplicities[key] == 1, 'Ambiguous line locations cannot establish a digest derivation'
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
        pair = decode('{' + data.decode().splitlines()[row['line'] - 1].strip().rstrip(',') + '}')
        assert len(pair) == 1
        field, value = next(iter(pair.items()))
        assert isinstance(value, str) and re.fullmatch('[a-f0-9]{64}', value) and sha(sources[location]) == value
        document = decode(data)
        assert row['jsonPaths']
        for path in row['jsonPaths']:
            cursor = document
            for part in path:
                cursor = cursor[part]
            assert path[-1] == field and cursor == value
        if 'priorExactProducerDerivation' in row:
            check(row['priorExactProducerDerivation'])
            old = prior[key]; assert old['field'] == field == 'tokensSha256'
            assert ref['path'] == old['reference']['path'] == 'apps/web/src/game/cardrpg/look-tokens.json'
            producer = old['producer']; producer_key = (producer['commit'], producer['path'])
            if producer_key not in producers:
                producers[producer_key] = subprocess.check_output(['git', 'show', producer['commit'] + ':' + producer['path']], cwd=ROOT)
            script = producers[producer_key]
            assert sha(script) == document['scriptSha256']
            assert hashlib.sha1(b'blob ' + str(len(script)).encode() + b'\0' + script).hexdigest() == producer['oid']
            assert b"TOKENS = ROOT / 'apps/web/src/game/cardrpg/look-tokens.json'" in script
            assert b"'tokensSha256': sha(TOKENS)" in script and b'lambda path: hashlib.sha256(path.read_bytes()).hexdigest()' in script
        else:
            assert field == ref['path'] and field.startswith(('apps/', 'tools/', 'packages/'))
        resolved += 1
    assert resolved == triage['resolvedDigests'] and len(actual) - resolved == triage['unresolved']
    assert all(any(identity(row) == key and row['classification'] == 'verified-source-digest' for row in actual) for key in prior)
    folder = ROOT / f'reports/v4-ship/S11/history-text-prefix{prefix}-regression-1'
    baseline = ROOT / 'reports/v4-ship/S11/ranged-palette-production-regression-1'
    check_path = folder / 'check.json'; regression = load(check_path)
    check(regression['log'])
    assert regression['complete'] and not regression['commandsPassed'] and not regression['officialClassParityGate']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}

    def web(folder):
        rows = [decode(line) for line in gzip.decompress((folder / 'log.jsonl.gz').read_bytes()).splitlines()]
        text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
        return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]

    summary = web(folder)
    assert summary == web(baseline) and sum(line.startswith('FAIL ') for line in summary) == 7
    assert 'Tests  7 failed | 2697 passed (2704)' in summary
    parity = load(folder / 'parity-probe.json')
    assert parity['rows'] == load(baseline / 'parity-probe.json')['rows']
    assert parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
              'inputs': [sign(p) for p in [source, raw_path, check_path, folder / 'log.jsonl.gz', folder / 'parity-probe.json', baseline / 'log.jsonl.gz', baseline / 'parity-probe.json']],
              'exactFindingLocations': len(actual), 'resolvedDigests': resolved, 'unresolved': len(actual) - resolved,
              'distinctLineLocations': len(multiplicities), 'duplicateLineEntriesPreserved': sum(n - 1 for n in multiplicities.values()),
              'reportObjects': len(documents), 'immutableSourceReferences': len(sources), 'producerDerivations': len(producers),
              'originalFindingSetUnchanged': True, 'earlier61DerivationsPreserved': True, 'sourceDerivationsPass': True,
              'sameSevenArtFailures': True, 'webSummary': summary, 'parityRowsUnchanged': True,
              'pass': True, 'gRegPass': False, 'fullPrefixFindingsPass': not triage['unresolved'], 'fullHistoryPass': False,
              'limits': 'Independent git-show derivation only for resolved complete JSON digest values. All other exact locations remain unresolved. No captured values or their source digests are emitted; no source-content or full-history clearance.'}
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['pass', 'exactFindingLocations', 'resolvedDigests', 'unresolved', 'immutableSourceReferences', 'sameSevenArtFailures', 'fullHistoryPass']}))


if __name__ == '__main__':
    try:
        main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else '1')
    except BaseException:
        print('Independent digest review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
