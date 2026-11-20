"""Review only the first immutable text prefix; no detector values persist.

LEARN: reports/v4-ship/LEARN/S11-history-text-triage.md.
"""
from pathlib import Path
import ast
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
sha = lambda data: hashlib.sha256(data).hexdigest()
oid_for = lambda data: hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
sign = lambda path: {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}


def unique(pairs):
    assert len({k for k, _ in pairs}) == len(pairs)
    return dict(pairs)


def invalid_constant(_):
    raise ValueError('Non-JSON constant rejected')


def decode(data):
    return json.loads(data, object_pairs_hook=unique, parse_constant=invalid_constant)


class Single:
    def __init__(self):
        self.requests = 0

    def get(self, commit, path):
        self.requests += 1
        run = subprocess.run(['git', 'cat-file', 'blob', commit + ':' + path], cwd=ROOT, capture_output=True)
        if run.returncode != 0:
            return None
        return {'bytes': run.stdout, 'oid': oid_for(run.stdout)}


class Batch:
    def __init__(self):
        self.requests = 0; self.cache = {}
        self.process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)

    def get(self, commit, path):
        key = (commit, path)
        if key not in self.cache:
            self.requests += 1
            query = commit + ':' + path
            assert '\n' not in query and '\0' not in query
            self.process.stdin.write(query.encode() + b'\n'); self.process.stdin.flush()
            header = self.process.stdout.readline().decode().split()
            if header == [query, 'missing']:
                self.cache[key] = None
            else:
                assert len(header) == 3 and header[1] == 'blob' and re.fullmatch('[a-f0-9]{40}', header[0])
                data = self.process.stdout.read(int(header[2]))
                assert len(data) == int(header[2]) and self.process.stdout.read(1) == b'\n'
                assert oid_for(data) == header[0]
                self.cache[key] = {'bytes': data, 'oid': header[0]}
        return self.cache[key]

    def close(self):
        self.process.stdin.close(); self.process.wait(timeout=5); self.process.stdout.close()


def resolve(tasks, reader):
    results = []
    for task in tasks:
        assert not (ROOT / 'STOP-V4SHIP').exists()
        proof = None
        for commit in task['commits']:
            source = reader.get(commit, task['sourcePath'])
            if source is not None and sha(source['bytes']) == task['value']:
                proof = {'commit': commit, 'path': task['sourcePath'], 'oid': source['oid'], 'bytes': len(source['bytes']), 'sha256EqualsExactCapture': True}
                break
        results.append(proof)
    return results


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/history-text-prefix-triage-{attempt}.json'
    assert not out.exists()
    review_path = ROOT / 'reports/v4-ship/S11/history-text-detector-review-1.json'
    review = decode(review_path.read_bytes())
    assert review['pass'] and review['prefix']['rawFindings'] == 61 and review['prefix']['findingsReviewed'] == 0
    for row in review['inputs']:
        assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    config = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
    build = decode((ROOT / 'reports/v4-ship/S11/text-detector-build-1.json').read_bytes())
    assert sha(config.read_bytes()) == build['config']['sha256']
    assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == '8.30.1'
    groups = {}
    for row in review['prefix']['findingMappings']:
        groups.setdefault(row['oid'], []).append(row)
    assert len(groups) == 4
    tasks, object_records, producer_records = [], [], []
    env = {k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}
    for oid, rows in groups.items():
        data = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=ROOT)
        assert oid_for(data) == oid
        document = decode(data); lines = data.decode().splitlines()
        for mapping in rows[0]['mappings']:
            exact = subprocess.check_output(['git', 'cat-file', 'blob', mapping['commit'] + ':' + mapping['path']], cwd=ROOT)
            assert exact == data
        command = ['gitleaks', 'stdin', '--config', str(config), '--no-banner', '--no-color', '--redact=0', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
        scan = subprocess.run(command, input=data, capture_output=True, env={**env, 'GOMAXPROCS': '1'})
        assert scan.returncode in (0, 1)
        captures = decode(scan.stdout or b'[]')
        assert sorted((f['StartLine'], f['EndLine'], f['RuleID']) for f in captures) == sorted((r['finding']['line'], r['finding']['endLine'], r['finding']['type']) for r in rows)
        object_records.append({'oid': oid, 'bytes': len(data), 'findings': len(rows), 'sameDirectAndStdinLocations': True, 'duplicateKeys': 0})
        for row in rows:
            finding = row['finding']
            assert finding['type'] == 'generic-api-key' and finding['line'] == finding['endLine']
            captures_here = [f for f in captures if f['StartLine'] == finding['line'] and f['EndLine'] == finding['endLine'] and f['RuleID'] == finding['type']]
            assert len(captures_here) == 1
            capture = captures_here[0]['Secret']
            pair = decode('{' + lines[finding['line'] - 1].strip().rstrip(',') + '}')
            assert len(pair) == 1
            key, value = next(iter(pair.items()))
            assert isinstance(value, str) and value == capture and re.fullmatch('[a-f0-9]{64}', value)
            producer = None
            if '/' in key:
                assert re.match('^(apps|tools|packages)/', key)
                if document.get(key) == value:
                    field = 'root'
                else:
                    fields = [name for name in ['sourceHashes', 'sourceAssetHashes', 'source'] if isinstance(document.get(name), dict) and document[name].get(key) == value]
                    assert len(fields) == 1
                    field = fields[0]
                path = key
            else:
                assert key == 'tokensSha256' and document[key] == value
                commit = row['mappings'][0]['commit']; producer_path = 'tools/cardrpg-look/blender/art-frames.py'
                source = subprocess.check_output(['git', 'cat-file', 'blob', commit + ':' + producer_path], cwd=ROOT)
                assert sha(source) == document['scriptSha256']
                tree = ast.parse(source)
                token = [n for n in ast.walk(tree) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'TOKENS' for t in n.targets)]
                assert len(token) == 1 and isinstance(token[0].value, ast.BinOp)
                assert isinstance(token[0].value.left, ast.Name) and token[0].value.left.id == 'ROOT' and isinstance(token[0].value.op, ast.Div)
                path = token[0].value.right.value
                assert path == 'apps/web/src/game/cardrpg/look-tokens.json'
                expected = ast.dump(ast.parse('lambda path: hashlib.sha256(path.read_bytes()).hexdigest()', mode='eval').body)
                assert any(isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'sha' for t in n.targets) and ast.dump(n.value) == expected for n in ast.walk(tree))
                assert any(isinstance(n, ast.Dict) and any(isinstance(k, ast.Constant) and k.value == 'tokensSha256' and ast.dump(v) == ast.dump(ast.parse('sha(TOKENS)', mode='eval').body) for k, v in zip(n.keys, n.values)) for n in ast.walk(tree))
                field = 'tokensSha256'
                producer = {'commit': commit, 'path': producer_path, 'oid': oid_for(source), 'matchesReceiptScriptDigest': True, 'tokenPathAndSha256AssignmentVerified': True}
                producer_records.append(producer)
            commits = [m['commit'] for m in row['mappings']]
            if isinstance(document.get('head'), str) and re.fullmatch('[a-f0-9]{40}', document['head']):
                commits.append(document['head'])
            tasks.append({'row': row, 'value': value, 'field': field, 'sourcePath': path, 'commits': list(dict.fromkeys(commits)), 'producer': producer})

    start = time.monotonic(); single = Single(); first = resolve(tasks, single); single_seconds = time.monotonic() - start
    start = time.monotonic(); batch = Batch()
    try:
        second = resolve(tasks, batch)
    finally:
        batch.close()
    batch_seconds = time.monotonic() - start
    assert first == second
    rows = []
    for task, proof in zip(tasks, second):
        row = task['row']
        rows.append({'oid': row['oid'], 'context': row['context'], **row['finding'], 'mappings': row['mappings'],
                     'classification': 'verified-source-digest' if proof else 'unresolved',
                     'field': task['field'], 'reference': proof, 'producer': task['producer'],
                     'reason': 'Exact detector capture equals the JSON value and SHA-256 of the immutable referenced source bytes.' if proof else 'No exact source derivation found; remains unresolved.'})
    unresolved = sum(r['classification'] == 'unresolved' for r in rows)
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-text-triage.md',
              'harness': sign(Path(__file__)), 'input': sign(review_path), 'objects': object_records,
              'comparison': {'sameSourceObjectsAndClassifications': True, 'findings': len(tasks),
                             'single': {'requests': single.requests, 'seconds': single_seconds, 'resolved': sum(r is not None for r in first)},
                             'batchCached': {'requests': batch.requests, 'seconds': batch_seconds, 'resolved': sum(r is not None for r in second)}},
              'findings': rows, 'reviewed': len(rows), 'unresolved': unresolved, 'producerDerivations': producer_records,
              'reviewedFindingsPass': unresolved == 0, 'fullHistoryPass': False,
              'inspectionFailures': {'adHocSyntaxErrorsBeforeExecution': 2, 'cause': 'Literal newline escape in the inspection command; corrected by a multiline command. No evidence or input was altered.'},
              'limits': ['Only 61 exact first-prefix locations. Original raw findings and live scanner files are untouched.',
                         'Stdin equivalence is independently checked only for these four objects; its known coverage limitations remain.',
                         'Captured values and matching source SHA-256 digests remain in memory; persisted evidence uses source object IDs and equality checks.',
                         'No source-content, future-checkpoint, binary/encoded/archive/submodule/later-reference or full-history clearance.']}
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'output': str(out.relative_to(ROOT)), 'objects': len(groups), 'reviewed': len(rows), 'unresolved': unresolved, 'comparison': report['comparison'], 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Exact prefix review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
