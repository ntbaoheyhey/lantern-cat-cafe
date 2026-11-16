"""Bound exact digest triage; unknown forms stay unresolved, captures stay in RAM."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import re
import runpy
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
helper_path = Path(__file__).with_name('history-text-prefix-triage.py')
helper = runpy.run_path(str(helper_path))
decode, Single, Batch, resolve = (helper[k] for k in ['decode', 'Single', 'Batch', 'resolve'])


def pointers(document, key, value, prefix=()):
    found = []
    if isinstance(document, dict):
        for k, v in document.items():
            path = prefix + (k,)
            if k == key and v == value:
                found.append(path)
            if isinstance(v, (dict, list)):
                found += pointers(v, key, value, path)
    elif isinstance(document, list):
        for i, v in enumerate(document):
            found += pointers(v, key, value, prefix + (i,))
    return found


def main(prefix, attempt):
    assert prefix.isdecimal() and attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/history-text-prefix-{prefix}-digests-{attempt}.json.gz'
    assert not output.exists()
    input_path = ROOT / f'reports/v4-ship/S11/history-text-prefix-review-{prefix}.json.gz'
    review = decode(gzip.decompress(input_path.read_bytes()))
    assert review['pass']
    for row in review['inputs']:
        assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    previous_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-triage-1.json'
    previous = decode(previous_path.read_bytes())
    assert previous['reviewedFindingsPass'] and previous['reviewed'] == 61
    assert sha(helper_path.read_bytes()) == previous['harness']['sha256']
    old = {(r['oid'], r['line'], r['endLine'], r['type']): r for r in previous['findings']}
    config = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
    build = decode((ROOT / 'reports/v4-ship/S11/text-detector-build-1.json').read_bytes())
    assert sha(config.read_bytes()) == build['config']['sha256']
    groups = {}
    for row in review['prefix']['findingMappings']:
        groups.setdefault(row['oid'], []).append(row)
    tasks, records, observations = [], [], []
    env = {k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}
    for oid, rows in groups.items():
        assert not (ROOT / 'STOP-V4SHIP').exists()
        data = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=ROOT)
        assert helper['oid_for'](data) == oid
        mappings = rows[0]['mappings']
        for mapping in mappings:
            exact = subprocess.check_output(['git', 'cat-file', 'blob', mapping['commit'] + ':' + mapping['path']], cwd=ROOT)
            assert exact == data
        command = ['gitleaks', 'stdin', '--config', str(config), '--no-banner', '--no-color', '--redact=0', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
        scan = subprocess.run(command, input=data, capture_output=True, env={**env, 'GOMAXPROCS': '1'})
        assert scan.returncode in (0, 1)
        captures = decode(scan.stdout or b'[]')
        locations = sorted((f['StartLine'], f['EndLine'], f['RuleID']) for f in captures)
        expected = sorted((r['finding']['line'], r['finding']['endLine'], r['finding']['type']) for r in rows)
        equivalent = locations == expected
        try:
            document = decode(data)
        except Exception:
            document = None
        lines = data.decode().splitlines()
        observations.append({'oid': oid, 'bytes': len(data), 'findings': len(rows), 'exactMappings': len(mappings), 'stdinLocationsEqualDirect': equivalent, 'strictJson': document is not None})
        for row in rows:
            finding = row['finding']; identity = (oid, finding['line'], finding['endLine'], finding['type'])
            record = {'oid': oid, 'context': row['context'], **finding, 'mappings': row['mappings'], 'classification': 'unresolved', 'reason': 'Not an exact supported source digest; subsequent semantic review required.'}
            records.append(record)
            if not equivalent or finding['line'] != finding['endLine'] or document is None:
                continue
            matches = [f for f in captures if (f['StartLine'], f['EndLine'], f['RuleID']) == identity[1:]]
            if len(matches) != 1:
                continue
            capture = matches[0]['Secret']
            if not isinstance(capture, str) or not re.fullmatch('[a-f0-9]{64}', capture):
                continue
            try:
                pair = decode('{' + lines[finding['line'] - 1].strip().rstrip(',') + '}')
            except Exception:
                continue
            if len(pair) != 1:
                continue
            key, value = next(iter(pair.items()))
            if value != capture:
                continue
            paths = pointers(document, key, value)
            if not paths:
                continue
            commits = [m['commit'] for m in row['mappings']]
            if isinstance(document, dict):
                commits += [document[k] for k in ['head', 'sourceHead'] if isinstance(document.get(k), str) and re.fullmatch('[a-f0-9]{40}', document[k])]
            if key.startswith(('apps/', 'tools/', 'packages/')):
                source_path = key
            elif identity in old and old[identity]['field'] == 'tokensSha256':
                source_path = old[identity]['reference']['path']
                commits.insert(0, old[identity]['reference']['commit'])
                record['priorExactProducerDerivation'] = sign(previous_path)
            else:
                continue
            task = {'row': row, 'value': value, 'field': key, 'sourcePath': source_path, 'commits': list(dict.fromkeys(commits)), 'record': len(records) - 1}
            record['jsonPaths'] = paths
            tasks.append(task)
        print(json.dumps({'object': len(observations), 'objects': len(groups), 'locations': len(records), 'supportedDigestTasks': len(tasks)}), flush=True)
    started = time.monotonic(); single = Single(); first = resolve(tasks, single); single_seconds = time.monotonic() - started
    started = time.monotonic(); batch = Batch()
    try:
        second = resolve(tasks, batch)
    finally:
        batch.close()
    batch_seconds = time.monotonic() - started
    assert first == second
    for task, proof in zip(tasks, second):
        record = records[task['record']]
        if proof:
            record.update(classification='verified-source-digest', reference=proof, reason='Exact detector capture is a complete JSON value and SHA-256 of the immutable referenced source bytes.')
    resolved = sum(r['classification'] == 'verified-source-digest' for r in records)
    assert len(records) == review['prefix']['rawFindings']
    assert {r['oid'] for r in records} == set(groups)
    assert all(any((r['oid'], r['line'], r['endLine'], r['type']) == identity and r['classification'] == 'verified-source-digest' for r in records) for identity in old)
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-text-triage.md',
              'harness': sign(Path(__file__)), 'helper': sign(helper_path), 'input': sign(input_path), 'previous': sign(previous_path),
              'objects': observations, 'findings': records, 'exactLocations': len(records), 'resolvedDigests': resolved,
              'unresolved': len(records) - resolved, 'completeFindingAccounting': True, 'earlier61DerivationsPreserved': True,
              'comparison': {'sameSourceObjectsAndClassifications': True, 'tasks': len(tasks),
                             'single': {'requests': single.requests, 'seconds': single_seconds},
                             'batchCached': {'requests': batch.requests, 'seconds': batch_seconds}},
              'reviewedDigestsPass': True, 'fullPrefixFindingsPass': resolved == len(records), 'fullHistoryPass': False,
              'limits': 'Only supported complete JSON SHA-256 values with exact source derivation are classified. Unknown shapes, non-JSON and semantic identifiers remain unresolved. No match values or matching source digests persist. Live scanners and all original findings remain untouched.'}
    output.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':')) + '\n').encode(), mtime=0))
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'exactLocations': len(records), 'resolvedDigests': resolved, 'unresolved': len(records) - resolved, 'comparison': report['comparison'], 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1], sys.argv[2])
    except BaseException:
        print('Bounded digest triage failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
