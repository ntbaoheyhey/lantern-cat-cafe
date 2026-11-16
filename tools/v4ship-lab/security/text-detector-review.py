"""Independently bind the detector study and a frozen historical scan prefix.

Raw object bytes and detector matches never enter output. The live scan is read
only through an explicitly frozen checkpoint; no live harness is modified.
LEARN: reports/v4-ship/LEARN/S11-history-text-objects.md.
"""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import tarfile
import tomllib

ROOT = Path(__file__).resolve().parents[3]
sha = lambda data: hashlib.sha256(data).hexdigest()
sign = lambda path: {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}


def checked(record):
    data = (ROOT / record['path']).read_bytes()
    assert sha(data) == record['sha256']
    if 'bytes' in record:
        assert len(data) == record['bytes']
    return data


def web_summary(path):
    rows = [json.loads(line) for line in gzip.decompress(path.read_bytes()).splitlines()]
    text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
    return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/history-text-detector-review-{attempt}.json'
    assert not out.exists()
    build_path = ROOT / 'reports/v4-ship/S11/text-detector-build-1.json'
    study_path = ROOT / 'reports/v4-ship/S11/history-text-detector-study-1.json'
    build = json.loads(build_path.read_bytes())
    study = json.loads(study_path.read_bytes())
    assert build['complete'] and build['pass'] and not build['runtimeChanged']
    for item in build['sources'] + [build[k] for k in ['binary', 'moduleList', 'toolchain', 'config']]:
        checked(item)
    for item in study['harness']:
        checked(item)
    assert checked(study['build']) == build_path.read_bytes()
    prior = json.loads(checked(study['input']))
    assert study['complete'] and study['pass'] and not study['fullHistoryPass']
    assert study['ready'] == build['ready']

    # go list -m -json emits consecutive JSON objects, not JSON lines/an array.
    stream = checked(build['moduleList']).decode(); decoder = json.JSONDecoder(); modules = []
    while stream.strip():
        value, end = decoder.raw_decode(stream.lstrip())
        modules.append(value); stream = stream.lstrip()[end:]
    assert len({m['Path'] for m in modules}) == len(modules)
    assert not any('Replace' in m or 'Error' in m for m in modules)
    module = next(m for m in modules if m['Path'] == 'github.com/zricethezav/gitleaks/v8')
    assert module['Version'] == 'v8.30.1'
    sums = (ROOT / 'tools/v4ship-lab/security/text-detector/go.sum').read_text().splitlines()
    for row in modules:
        if row.get('Sum'):
            assert f"{row['Path']} {row['Version']} {row['Sum']}" in sums
        if row.get('GoModSum'):
            assert f"{row['Path']} {row['Version']}/go.mod {row['GoModSum']}" in sums
    config_bytes = checked(build['config'])
    assert (Path(module['Dir']) / 'config/gitleaks.toml').read_bytes() == config_bytes
    assert (Path(module['Dir']) / 'detect/detect.go').read_bytes() == (ROOT / 'work/v4ship-prep/security-sources-8.30.1/detect/detect.go').read_bytes()
    config = tomllib.loads(config_bytes.decode())
    assert len(config['rules']) == build['ready']['rules'] == 222
    toolchain = json.loads(checked(build['toolchain']))
    directory = ROOT / Path(build['toolchain']['path']).parent
    archive = directory / toolchain['file']['filename']
    assert sha(archive.read_bytes()) == toolchain['file']['sha256']
    assert archive.stat().st_size == toolchain['file']['size']
    go = directory / 'go/bin/go'
    with tarfile.open(archive) as package:
        assert package.extractfile('go/bin/go').read() == go.read_bytes()
    env = {**os.environ, 'GOTOOLCHAIN': 'local', 'GOMODCACHE': str(ROOT / 'work/v4ship-prep/go-modules'),
           'GOCACHE': str(ROOT / 'work/v4ship-prep/go-cache')}
    verify = subprocess.run([str(go), 'mod', 'verify'], cwd=ROOT / 'tools/v4ship-lab/security/text-detector',
                            capture_output=True, env=env)
    assert verify.returncode == 0 and verify.stdout.strip() == b'all modules verified'
    binary = ROOT / build['binary']['path']
    binary_info = subprocess.check_output([str(go), 'version', '-m', str(binary)], env=env, text=True)
    binary_rows = [line.strip().split('\t') for line in binary_info.splitlines()[1:]]
    dependencies = [r for r in binary_rows if r[0] == 'dep']
    module_map = {m['Path']: m for m in modules}
    for _, name, version, checksum in dependencies:
        assert module_map[name]['Version'] == version and module_map[name]['Sum'] == checksum
    assert ['build', '-trimpath=true'] in binary_rows
    assert binary_info.splitlines()[0].endswith(': go1.27.4')

    assert len(study['fixtures']) == len(prior['fixtures']) == 9
    for row, baseline in zip(study['fixtures'], prior['fixtures']):
        assert row['case'] == baseline['case'] and row['complete'] and row['sameAsRoot']
        assert row['bytes'] == baseline['bytes'] and row['sha256'] == baseline['sha256']
        assert row['path'] == baseline['patch']['verified'][0]['name']
        assert row['findings'] == baseline['rootGit']['findings']
    assert len(study['realObjects']) == len(prior['realObjects']) == 50
    for row, baseline in zip(study['realObjects'], prior['realObjects']):
        assert row['id'] == baseline['oid'] and row['path'] == baseline['name']
        mapping = baseline['mapping']
        data = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + mapping['path']], cwd=ROOT)
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == row['id']
        assert row['bytes'] == baseline['bytes'] == len(data)
        assert row['sha256'] == baseline['sha256'] == sha(data)
        assert row['complete'] and row['sameAsRoot']
        assert row['findings'] == [f for f in prior['realComparison']['rootGit']['findings'] if f['file'] == row['path']]
    comparison = study['comparison']
    assert comparison['objects'] == 50 and comparison['bytes'] == sum(r['bytes'] for r in study['realObjects']) == 19075387
    assert comparison['directDetectorSeconds'] == sum(r['seconds'] for r in study['realObjects'])
    assert comparison['directWallSeconds'] == sum(r['wallSeconds'] for r in study['realObjects'])
    assert comparison['stdinSeconds'] == prior['realComparison']['stdinSeconds']
    assert comparison['rootGitSeconds'] == prior['realComparison']['rootGit']['seconds']
    assert comparison['findings'] == sum(len(r['findings']) for r in study['realObjects']) == 1
    rejected = []
    for case, data, size, digest in [('invalid-utf8', b'public\xff', 7, sha(b'public\xff')),
                                     ('contains-nul', b'public\0', 7, sha(b'public\0')),
                                     ('digest-mismatch', b'public', 6, '0' * 64),
                                     ('truncated', b'public', 7, sha(b'public!'))]:
        header = {'id': case, 'path': 'public.txt', 'bytes': size, 'sha256': digest}
        run = subprocess.run([str(binary), str(ROOT / build['config']['path'])],
                             input=json.dumps(header).encode() + b'\n' + data, capture_output=True, timeout=10)
        lines = run.stdout.splitlines()
        assert run.returncode == 1 and len(lines) == 1 and json.loads(lines[0]) == build['ready']
        assert run.stderr == b'text detector failed; details suppressed\n'
        rejected.append({'case': case, 'exitCode': 1, 'noResultOrRawEcho': True})
    assert rejected == study['rejectedFrames']

    folder = ROOT / 'reports/v4-ship/S11/history-text-objects-1'
    scope_path = folder / 'scope.json'; scope = json.loads(scope_path.read_bytes())
    for value in scope['binding'].values():
        checked(value)
    inventory = json.loads(gzip.decompress(checked(scope['binding']['inventory'])))
    objects = {}
    mappings = {}
    for row in inventory:
        if row['kind'] == 'blob':
            assert objects.get(row['oid'], row['bytes']) == row['bytes']
            objects[row['oid']] = row['bytes']; mappings.setdefault(row['oid'], []).append(row)
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
    packed_path = folder / 'prefix-1.check.json.gz'; progress_path = folder / 'prefix-1.progress.json'
    packed = packed_path.read_bytes(); state = json.loads(gzip.decompress(packed)); progress = json.loads(progress_path.read_bytes())
    assert sha(packed) == progress['checkpointSha256']
    assert all(state[key] == value for key, value in progress.items() if key != 'checkpointSha256')
    assert state['scopeSha256'] == sha(scope_path.read_bytes()) and not state['fullHistoryPass']
    allow_paths = config['allowlist']['paths'] + [p for r in config['rules'] for a in r.get('allowlists', []) for p in a.get('paths', [])]
    path_exclusions = [re.compile(p, re.ASCII) for p in allow_paths]
    rules = {r['id'] for r in config['rules']}; finding_mappings = []
    reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        for index, row in enumerate(state['rows']):
            oid = ordered[index]
            assert row['index'] == index and row['oid'] == oid and row['bytes'] == objects[oid] and row['complete']
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
                        finding_mappings.append({'oid': oid, 'context': scan['context'], 'finding': finding,
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
              'yamlContextScans': sum(s['context'] == 'kubernetes-secret-yaml' for r in text for s in r['scans']),
              'rawFindings': len(finding_mappings)}
    assert all(state[k] == v for k, v in counts.items())
    assert state['complete'] == (len(rows) == len(ordered))

    regression_folder = ROOT / 'reports/v4-ship/S11/history-text-detector-regression-1'
    regression_path = regression_folder / 'check.json'; regression = json.loads(regression_path.read_bytes())
    checked(regression['log'])
    assert regression['complete'] and not regression['commandsPassed'] and not regression['officialClassParityGate']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    prior_log = ROOT / 'reports/v4-ship/S11/history-text-study-regression-1/log.jsonl.gz'
    web = web_summary(regression_folder / 'log.jsonl.gz')
    assert web == web_summary(prior_log) and sum(row.startswith('FAIL ') for row in web) == 7
    assert 'Tests  7 failed | 2690 passed (2697)' in web
    parity_path = regression_folder / 'parity-probe.json'; parity = json.loads(parity_path.read_bytes())
    prior_parity = json.loads(prior_log.with_name('parity-probe.json').read_bytes())
    assert parity['rows'] == prior_parity['rows'] and parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
              'inputs': [sign(p) for p in [build_path, study_path, scope_path, packed_path, progress_path, regression_path, prior_log, parity_path]],
              'build': {'moduleRecords': len(modules), 'binaryDependencies': len(dependencies), 'moduleVerification': True,
                        'replacements': 0, 'configByteEquality': True, 'pinnedApiSourceEquality': True, 'rules': 222,
                        'toolchainArchiveHashAndCompilerBytes': True, 'binaryBuildInfoMatches': True},
              'study': {'fixturePairs': 9, 'exactCommitPathObjects': 50, 'comparison': comparison, 'replayedRejectedFrames': rejected},
              'prefix': {**counts, 'immutableObjectsVerified': len(rows), 'findingMappings': finding_mappings,
                         'findingsReviewed': 0, 'unresolved': len(finding_mappings), 'complete': state['complete']},
              'webSummary': web, 'sameSevenArtFailures': True, 'parityRowsUnchanged': True,
              'pass': True, 'gRegPass': False, 'fullHistoryPass': False,
              'limits': ['Binds recorded fixture comparisons and exact historical samples; does not rerun the successful detector cases.',
                         'Prefix byte identity, text eligibility, aliases, findings metadata and mappings are verified; findings remain unreviewed.',
                         'No scan of excluded binary/NUL/encoded/archive/submodule/later-reference contents is inferred; default content allowlists remain.',
                         'No live scanner, signed harness/client/binary or installed product runtime is changed.']}
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'output': str(out.relative_to(ROOT)), 'pass': True, 'modules': len(modules), 'prefix': counts,
                      'sameSevenArtFailures': True, 'fullHistoryPass': False}))


if __name__ == '__main__':
    main(sys.argv[1])
