"""Supplement frozen history with filename-aware default-detector scans.

LEARN: reports/v4-ship/LEARN/S11-history-paths.md. No full-history claim.
"""
from pathlib import Path, PurePosixPath
import datetime
import fcntl
import gzip
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
import tempfile
import time
import tomllib
from stdin_worker import communicate

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()


def git(root, *args, data=None):
    return subprocess.check_output(['git', *args], cwd=root, input=data)


def atomic(path, data):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_bytes(data)
    os.replace(temporary, path)


def inventory(root, tips):
    commits = git(root, 'rev-list', '--topo-order', *tips).decode().splitlines()
    command = ['log', '--full-history', '-m', '--root', '-r', '--raw', '-z',
               '--no-abbrev', '--no-renames', '--format=%x00COMMIT:%H%x00', '--stdin']
    raw = git(root, *command, data=('\n'.join(tips) + '\n').encode())
    tokens, index, commit = raw.split(b'\0'), 0, None
    pairs, seen_commits, statuses, modes = {}, set(), {}, {}
    while index < len(tokens):
        token = tokens[index].lstrip(b'\n'); index += 1
        if not token:
            continue
        if token.startswith(b'COMMIT:'):
            commit = token[7:].decode('ascii')
            assert re.fullmatch('[0-9a-f]{40}', commit)
            seen_commits.add(commit)
            continue
        assert commit and token.startswith(b':') and index < len(tokens)
        old_mode, mode, old_oid, oid, status = token[1:].decode('ascii').split()
        assert status in ['A', 'D', 'M', 'T']
        path = os.fsdecode(tokens[index]); index += 1
        assert path and not path.startswith('/') and '..' not in PurePosixPath(path).parts
        statuses[status] = statuses.get(status, 0) + 1
        modes[mode] = modes.get(mode, 0) + 1
        if status == 'D':
            assert oid == '0' * 40 and mode == '000000'
            continue
        assert re.fullmatch('[0-9a-f]{40}', oid) and oid != '0' * 40
        key = (path, oid)
        if key not in pairs:
            pairs[key] = {'path': path, 'oid': oid, 'mode': mode, 'commit': commit}
    assert set(commits) == seen_commits
    rows = sorted(pairs.values(), key=lambda r: (r['path'], r['oid']))
    queries = b'\0'.join(os.fsencode(r['commit'] + ':' + r['path']) for r in rows) + b'\0'
    result = git(root, 'cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)', '-Z', data=queries)
    resolved = result.rstrip(b'\0').split(b'\0')
    assert len(resolved) == len(rows)
    for row, line in zip(rows, resolved):
        if row['mode'] == '160000':
            fields = line.decode('ascii').split()
            assert fields[0] == row['oid']
            assert fields[1:] == ['submodule'] or len(fields) == 3 and fields[1] == 'commit'
            tree = git(root, '--literal-pathspecs', 'ls-tree', '-z', row['commit'], '--', row['path'])
            matching = [item.split(b'\t', 1)[0].decode().split() for item in tree.split(b'\0')
                        if item and item.split(b'\t', 1)[1] == os.fsencode(row['path'])]
            assert matching == [['160000', 'commit', row['oid']]]
            row.update(kind='commit', bytes=int(fields[2]) if len(fields) == 3 else None,
                       externalGitlink=len(fields) == 2)
            continue
        oid, kind, size = line.decode('ascii').split()
        assert oid == row['oid'] and kind == 'blob'
        row.update(kind=kind, bytes=int(size))
    return rows, {'commits': commits, 'rawBytes': len(raw), 'rawSha256': sha(raw),
                  'command': command, 'statuses': statuses, 'modes': modes}


def run(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    assert git(ROOT, 'branch', '--show-current').decode().strip() == 'codex/v4-ship-2026-11-16'
    assert not git(ROOT, 'for-each-ref', '--format=%(refname)', 'refs/replace').strip()
    assert not any(os.environ.get(k) for k in ['GITLEAKS_CONFIG', 'GITLEAKS_CONFIG_TOML'])
    assert not (ROOT / '.gitleaks.toml').exists() and not (ROOT / '.gitleaksignore').exists()
    lock = (ROOT / 'work/v4ship-prep' / ('history-paths-' + attempt + '.lock')).open('a+')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    lock.seek(0); lock.truncate(); lock.write(str(os.getpid())); lock.flush()
    folder = ROOT / 'reports/v4-ship/S11' / ('history-paths-' + attempt)
    folder.mkdir(exist_ok=True)
    config_path = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
    config_bytes = config_path.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(config_bytes)).encode() + b'\0' + config_bytes).hexdigest() == '256f64790ea6d954f0041024be2938089ae1e7a7'
    config = tomllib.loads(config_bytes.decode())
    rules = [{'id': r['id'], 'path': r['path'], 'hasContentRegex': bool(r.get('regex'))}
             for r in config['rules'] if r.get('path')]
    assert {r['id'] for r in rules} == {'freemius-secret-key', 'hashicorp-tf-password',
           'kubernetes-secret-yaml', 'nuget-config-password', 'pkcs12-file'}
    predicates = [(r['id'], re.compile(r['path'], re.ASCII)) for r in rules]
    exclusions = [re.compile(p, re.ASCII) for p in config['allowlist']['paths']]
    scanner = subprocess.check_output(['gitleaks', 'version'], text=True).strip()
    assert scanner == '8.30.1'
    flags = ['--no-banner', '--no-color', '--redact=100', '--log-level=fatal',
             '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
    binding = {'harnessSha256': sha(Path(__file__).read_bytes()), 'scanner': scanner,
               'stdinWorkerSha256': sha(Path(__file__).with_name('stdin_worker.py').read_bytes()),
               'sourceConfigSha256': sha(config_bytes), 'sourceConfigGitBlob': '256f64790ea6d954f0041024be2938089ae1e7a7',
               'sourceUrl': 'https://github.com/gitleaks/gitleaks/blob/v8.30.1/config/gitleaks.toml',
               'rules': rules, 'flags': flags, 'learn': 'reports/v4-ship/LEARN/S11-history-paths.md'}
    scope_path, inv_path = folder / 'scope.json', folder / 'inventory.json.gz'
    if not scope_path.exists():
        tips = sorted(set(git(ROOT, 'for-each-ref', '--format=%(objectname)').decode().splitlines()
                          + [git(ROOT, 'rev-parse', 'HEAD').decode().strip()]))
        entries, details = inventory(ROOT, tips)
        assert set(details['commits']) == set(git(ROOT, 'rev-list', '--all').decode().splitlines())
        packed = gzip.compress(json.dumps(entries, separators=(',', ':')).encode(), mtime=0)
        atomic(inv_path, packed)
        commits = gzip.compress(('\n'.join(details.pop('commits')) + '\n').encode(), mtime=0)
        atomic(folder / 'commits.txt.gz', commits)
        selected = []
        for i, entry in enumerate(entries):
            matching = [rule for rule, pattern in predicates if pattern.search(entry['path'])]
            if matching and entry['kind'] == 'blob':
                selected.append({'inventoryIndex': i, 'rules': matching,
                                 'defaultPathExcluded': any(p.search(entry['path']) for p in exclusions)})
        scope = {'at': now(), 'head': git(ROOT, 'rev-parse', 'HEAD').decode().strip(),
                 'referenceTips': tips, 'commitCount': len(gzip.decompress(commits).splitlines()),
                 'commitListSha256': sha(commits), 'inventorySha256': sha(packed),
                 'uniquePathObjectPairs': len(entries), 'uniqueBlobs': len({r['oid'] for r in entries if r['kind'] == 'blob'}),
                 'unscannedGitlinkObjects': [r for r in entries if r['mode'] == '160000'],
                 'mappingIdentityVerified': True, 'selected': selected, 'binding': binding,
                 'defaultGlobalPathExclusions': config['allowlist']['paths'], **details}
        atomic(scope_path, (json.dumps(scope, indent=2) + '\n').encode())
    scope_bytes = scope_path.read_bytes(); scope = json.loads(scope_bytes)
    assert scope['binding'] == binding
    packed = inv_path.read_bytes(); assert sha(packed) == scope['inventorySha256']
    entries = json.loads(gzip.decompress(packed))
    assert len(entries) == scope['uniquePathObjectPairs']
    commits = (folder / 'commits.txt.gz').read_bytes(); assert sha(commits) == scope['commitListSha256']
    assert set(gzip.decompress(commits).decode().splitlines()) == set(git(ROOT, 'rev-list', *scope['referenceTips']).decode().splitlines())
    checkpoint = folder / 'check.json.gz'
    state = json.loads(gzip.decompress(checkpoint.read_bytes())) if checkpoint.exists() else {
        'scopeSha256': sha(scope_bytes), 'rows': [], 'interruptions': []}
    assert state['scopeSha256'] == sha(scope_bytes)
    for index, row in enumerate(state['rows']):
        assert row['index'] == index and row['complete'] and row['inventoryIndex'] == scope['selected'][index]['inventoryIndex']
    stopping = False

    def stop(*_):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop); signal.signal(signal.SIGINT, stop)

    def save():
        progress = {'at': now(), 'supervisorPid': os.getpid(),
                    'complete': len(state['rows']) == len(scope['selected']),
                    'scannedPairs': len(state['rows']), 'totalPairs': len(scope['selected']),
                    'defaultExcludedPairs': sum(r['defaultPathExcluded'] for r in state['rows']),
                    'nonUtf8Pairs': sum(not r['utf8'] for r in state['rows']),
                    'findings': sum(len(r['findings']) for r in state['rows']), 'fullHistoryPass': False,
                    'note': 'Default-detector filename supplement only. Default exclusions, submodule contents, binary/encoded contents, nested archive filenames, original text scan, unreferenced objects and later references remain separate.'}
        state.update(progress)
        packed = gzip.compress(json.dumps(state, separators=(',', ':')).encode(), mtime=0)
        atomic(checkpoint, packed)
        atomic(folder / 'progress.json', (json.dumps({**progress, 'checkpointSha256': sha(packed)}, indent=2) + '\n').encode())
        return progress

    print(json.dumps(save()), flush=True)
    for index in range(len(state['rows']), len(scope['selected'])):
        if stopping or (ROOT / 'STOP-V4SHIP').exists():
            break
        selection = scope['selected'][index]; entry = entries[selection['inventoryIndex']]
        started = time.monotonic()
        data = git(ROOT, 'cat-file', 'blob', entry['oid'])
        assert len(data) == entry['bytes']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == entry['oid']
        try:
            data.decode('utf-8'); utf8 = True
        except UnicodeDecodeError:
            utf8 = False
        with tempfile.TemporaryDirectory(prefix='v4ship-path-') as temporary:
            target = Path(temporary) / entry['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as handle:
                os.fchmod(handle.fileno(), 0o600); handle.write(data)
            process = subprocess.Popen(['gitleaks', 'dir', str(target), *flags], cwd=temporary,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                       env={**os.environ, 'GOMAXPROCS': '1'})
            try:
                output, errors = communicate(process, None, lambda: stopping or (ROOT / 'STOP-V4SHIP').exists())
            except InterruptedError:
                state['interruptions'].append({'at': now(), 'index': index, 'reason': 'Stopped; pair incomplete and must rerun'})
                print(json.dumps(save()), flush=True)
                return
            assert process.returncode in (0, 1), 'Scanner failed; raw output suppressed'
            found = json.loads(output or b'[]')
            safe = [{'line': f.get('StartLine'), 'endLine': f.get('EndLine'), 'type': f.get('RuleID'),
                     'classification': 'unresolved'} for f in found]
        row = {'index': index, **selection, 'path': entry['path'], 'oid': entry['oid'],
               'commit': entry['commit'], 'bytes': len(data), 'sha256': sha(data), 'utf8': utf8,
               'containsNul': b'\0' in data, 'mode': entry['mode'], 'complete': True,
               'scannerExitCode': process.returncode, 'findings': safe,
               'seconds': round(time.monotonic() - started, 6)}
        state['rows'].append(row)
        progress = save()
        if index % 25 == 0 or progress['complete']:
            print(json.dumps(progress), flush=True)
    print(json.dumps(save()), flush=True)


if __name__ == '__main__':
    run(sys.argv[1])
