"""Extend the verified prefix2 by reading only newly classified objects."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import re
import subprocess
import sys
import tomllib

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}


def checked(row):
    data = (ROOT / row['path']).read_bytes()
    assert sha(data) == row['sha256']
    return data


def main(prefix):
    assert prefix == '3' and not (ROOT / 'STOP-V4SHIP').exists()
    folder = ROOT / 'reports/v4-ship/S11/history-text-objects-1'
    output = ROOT / f'reports/v4-ship/S11/history-text-prefix-delta-{prefix}.json.gz'
    assert not output.exists()
    scope_path = folder / 'scope.json'; scope = json.loads(scope_path.read_bytes())
    for record in scope['binding'].values():
        checked(record)
    config = tomllib.loads(checked(scope['binding']['config']).decode())
    inventory = json.loads(gzip.decompress(checked(scope['binding']['inventory'])))
    objects, mappings = {}, {}
    for row in inventory:
        if row['kind'] == 'blob':
            assert objects.get(row['oid'], row['bytes']) == row['bytes']
            objects[row['oid']] = row['bytes']
            mappings.setdefault(row['oid'], []).append(row)
    ordered = sorted(objects)
    assert len(ordered) == scope['uniqueBlobs'] == 91187
    assert sum(objects.values()) == scope['uniqueBlobBytes']
    assert sha(('\n'.join(ordered) + '\n').encode()) == scope['sortedOidListSha256']
    predicates = {r['id']: re.compile(r['path'], re.ASCII) for r in config['rules'] if r.get('path')}
    contexts = {}
    for rule, predicate in predicates.items():
        matched = [r for r in inventory if predicate.search(r['path'])]
        assert scope['filenamePredicates'][rule] == {'pairs': len(matched), 'objects': len({r['oid'] for r in matched})}
        contexts[rule] = {r['oid'] for r in matched}
    assert len(contexts['kubernetes-secret-yaml']) == 51
    assert all(not values for name, values in contexts.items() if name != 'kubernetes-secret-yaml')
    packed_path = folder / f'prefix-{prefix}.check.json.gz'
    progress_path = folder / f'prefix-{prefix}.progress.json'
    packed = packed_path.read_bytes(); state = json.loads(gzip.decompress(packed)); progress = json.loads(progress_path.read_bytes())
    assert sha(packed) == progress['checkpointSha256']
    assert all(state[key] == value for key, value in progress.items() if key != 'checkpointSha256')
    assert state['scopeSha256'] == sha(scope_path.read_bytes()) and not state['fullHistoryPass']
    prior_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-review-2.json.gz'
    prior = json.loads(gzip.decompress(prior_path.read_bytes()))
    assert prior['pass'] and prior['exactObjectsVerified'] == 6000
    checked(prior['harness'])
    for item in prior['inputs']:
        checked(item)
    first = json.loads(gzip.decompress((folder / 'prefix-2.check.json.gz').read_bytes()))
    inherited = len(first['rows'])
    assert inherited == prior['prefix']['classifiedBlobs'] == 6000
    assert len(state['rows']) > inherited and state['rows'][:inherited] == first['rows']
    exclusions = config['allowlist']['paths'] + [p for r in config['rules'] for a in r.get('allowlists', []) for p in a.get('paths', [])]
    path_exclusions = [re.compile(p, re.ASCII) for p in exclusions]
    rules = {r['id'] for r in config['rules']}; findings = list(prior['prefix']['findingMappings'])
    assert len(findings) == first['rawFindings'] == 1350
    reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        for index, row in enumerate(state['rows']):
            assert not (ROOT / 'STOP-V4SHIP').exists()
            oid = ordered[index]
            assert row['index'] == index and row['oid'] == oid and row['bytes'] == objects[oid] and row['complete']
            if index < inherited:
                continue
            reader.stdin.write(oid.encode() + b'\n'); reader.stdin.flush()
            assert reader.stdout.readline().decode().split() == [oid, 'blob', str(objects[oid])]
            data = reader.stdout.read(objects[oid]); assert len(data) == objects[oid] and reader.stdout.read(1) == b'\n'
            assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == oid
            try:
                data.decode('utf-8'); utf8 = True
            except UnicodeDecodeError:
                utf8 = False
            nul = b'\0' in data
            assert row['utf8'] == utf8 and row['containsNul'] == nul
            if utf8 and not nul:
                assert row['status'] == 'text-scanned' and row['sha256'] == sha(data)
                expected = [('content', '.txt')] + ([('kubernetes-secret-yaml', '.yaml')] if oid in contexts['kubernetes-secret-yaml'] else [])
                assert [(s['context'], s['path']) for s in row['scans']] == [(c, oid + suffix) for c, suffix in expected]
                lines = data.count(b'\n') + int(bool(data) and not data.endswith(b'\n'))
                for scan in row['scans']:
                    assert not any(p.search(scan['path']) for p in path_exclusions)
                    for finding in scan['findings']:
                        assert set(finding) == {'file', 'line', 'endLine', 'type', 'classification'}
                        assert finding['file'] == scan['path'] and finding['type'] in rules and finding['classification'] == 'unresolved'
                        assert 1 <= finding['line'] <= finding['endLine'] <= lines
                        findings.append({'oid': oid, 'context': scan['context'], 'finding': finding,
                                         'mappings': [{'commit': m['commit'], 'path': m['path']} for m in mappings[oid]]})
            else:
                assert row['status'] == ('excluded-non-utf8' if not utf8 else 'excluded-nul') and 'scans' not in row
    finally:
        reader.stdin.close(); reader.wait(timeout=5); reader.stdout.close()
    rows = state['rows']; text = [r for r in rows if r['status'] == 'text-scanned']
    counts = {'classifiedBlobs': len(rows), 'classifiedBytes': sum(r['bytes'] for r in rows),
              'scannedTextBlobs': len(text), 'scannedTextBytes': sum(r['bytes'] for r in text),
              'scannedTextPathPairs': sum(len(mappings[r['oid']]) for r in text),
              'excludedNonUtf8Blobs': sum(not r['utf8'] for r in rows), 'containsNulBlobs': sum(r['containsNul'] for r in rows),
              'excludedBlobs': len(rows) - len(text), 'excludedBytes': sum(r['bytes'] for r in rows if r['status'] != 'text-scanned'),
              'yamlContextScans': sum(s['context'] == 'kubernetes-secret-yaml' for r in text for s in r['scans']), 'rawFindings': len(findings)}
    assert all(state[k] == v for k, v in counts.items())
    assert state['complete'] == (len(rows) == len(ordered))
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-text-triage.md',
              'harness': sign(Path(__file__)), 'inputs': [sign(p) for p in [scope_path, packed_path, progress_path, folder / 'prefix-2.check.json.gz', prior_path]],
              'prefix': {**counts, 'findingMappings': findings, 'findingsReviewed': 0, 'unresolved': len(findings), 'complete': state['complete']},
              'priorPrefixUnchanged': True, 'allSignedScannerInputsUnchanged': True, 'inheritedVerifiedBlobs': inherited,
              'exactNewObjectsVerified': len(rows) - inherited, 'priorRawFindingEntries': 1350, 'newRawFindingEntries': len(findings) - 1350,
              'pass': True, 'fullHistoryPass': False,
              'limits': 'Inherits exact unchanged prefix2 rows and its signed prior review; only later object bytes are reread. Verifies new identities, eligibility, aliases and locations without rescanning or classification. Live outputs remain untouched. Binary/encoded/archive/submodule/later-reference and unreviewed findings remain open.'}
    output.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':')) + '\n').encode(), mtime=0))
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'pass': True, **counts, 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Immutable prefix verification failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
