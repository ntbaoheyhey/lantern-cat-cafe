"""Isolated exact-byte root-commit scans; original refs and scanner stay untouched."""
from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import os
import re
import subprocess
import tempfile
import time
from stdin_worker import communicate

ROOT = Path(__file__).resolve().parents[3]
CONFIG = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
sha = lambda data: hashlib.sha256(data).hexdigest()


def environment():
    env = {k: v for k, v in os.environ.items() if not k.startswith(('GIT_', 'GITLEAKS_'))}
    env.update(GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM='1', GIT_ATTR_NOSYSTEM='1',
               GOMAXPROCS='1', GIT_AUTHOR_NAME='V4 SHIP study', GIT_AUTHOR_EMAIL='study@invalid',
               GIT_COMMITTER_NAME='V4 SHIP study', GIT_COMMITTER_EMAIL='study@invalid',
               GIT_AUTHOR_DATE='2000-01-01T00:00:00+00:00', GIT_COMMITTER_DATE='2000-01-01T00:00:00+00:00')
    return env


def git(where, *args, data=None):
    result = subprocess.run(['git', *args], cwd=where, input=data, capture_output=True, env=environment())
    if result.returncode:
        raise RuntimeError('Isolated Git operation failed; raw diagnostics suppressed')
    return result.stdout


def validate_tools():
    data = CONFIG.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == '256f64790ea6d954f0041024be2938089ae1e7a7'
    assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == '8.30.1'
    return {'scanner': '8.30.1', 'configSha256': sha(data), 'configGitBlob': '256f64790ea6d954f0041024be2938089ae1e7a7'}


def scan(method, where, payload=None, commit=None):
    assert method in ['stdin', 'git'] and not (ROOT / 'STOP-V4SHIP').exists()
    command = ['gitleaks', method]
    if method == 'git':
        assert re.fullmatch('[0-9a-f]{40}', commit)
        command += [str(where), '--log-opts=' + commit + ' --root --no-renames --no-ext-diff --no-textconv']
    command += ['--config', str(CONFIG), '--no-banner', '--no-color', '--redact=100',
                '--log-level=debug', '--report-format=json', '--report-path=-',
                '--ignore-gitleaks-allow', '--max-target-megabytes=0', '--max-decode-depth=0', '--max-archive-depth=0']
    started = time.monotonic()
    process = subprocess.Popen(command, cwd=where, stdin=subprocess.PIPE if payload is not None else subprocess.DEVNULL,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=environment())
    output, errors = communicate(process, payload, lambda: (ROOT / 'STOP-V4SHIP').exists())
    if process.returncode not in (0, 1):
        raise RuntimeError('Detector failed; raw diagnostics suppressed')
    try:
        findings = json.loads(output or b'[]')
    except Exception:
        raise RuntimeError('Invalid detector response; raw output suppressed') from None
    safe = sorted([{'file': r.get('File', ''), 'line': r.get('StartLine'), 'endLine': r.get('EndLine'),
                    'type': r.get('RuleID'), 'classification': 'unresolved'} for r in findings],
                  key=lambda r: (r['file'], r['line'] or 0, r['type']))
    diagnostic = errors.decode('utf-8', errors='replace')
    skips = {key: diagnostic.count(text) for key, text in {
        'binary': 'skipping binary file', 'file': 'skipping file:', 'fragment': 'skipping fragment:',
        'archive': 'skipping archive:', 'error': ' ERR '}.items()}
    return {'seconds': round(time.monotonic() - started, 6), 'exitCode': process.returncode,
            'findings': safe, 'skipDiagnostics': skips}


class RootScan:
    def __enter__(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='v4ship-text-root-')
        self.path = Path(self.temporary.name)
        git(self.path, 'init', '--quiet', '--initial-branch=codex/text-object-study')
        git(self.path, 'config', 'core.attributesfile', os.devnull)
        git(self.path, 'config', 'core.autocrlf', 'false')
        objects = Path(git(ROOT, 'rev-parse', '--git-path', 'objects').decode().strip())
        if not objects.is_absolute():
            objects = ROOT / objects
        objects = objects.resolve()
        assert '\n' not in str(objects)
        (self.path / '.git/objects/info/alternates').write_text(str(objects) + '\n')
        return self

    def __exit__(self, *_):
        self.temporary.cleanup()

    def add_public_fixture(self, data):
        return git(self.path, 'hash-object', '-w', '--stdin', data=data).decode().strip()

    def prepare(self, entries):
        assert entries and len({e['name'] for e in entries}) == len(entries)
        for entry in entries:
            assert re.fullmatch('[0-9a-f]{40}', entry['oid'])
            assert entry['name'] and not entry['name'].startswith('/') and '..' not in PurePosixPath(entry['name']).parts
            assert all(c not in entry['name'] for c in '\0\n\t"\\')
        git(self.path, 'read-tree', '--empty')
        lines = b''.join(('100644 ' + e['oid'] + '\t' + e['name']).encode() + b'\0' for e in entries)
        git(self.path, 'update-index', '-z', '--index-info', data=lines)
        tree = git(self.path, 'write-tree').decode().strip()
        commit = git(self.path, 'commit-tree', tree, data=b'V4 SHIP isolated text objects\n').decode().strip()
        assert git(self.path, 'rev-list', '--count', commit).strip() == b'1'
        expected = {e['name']: (e['oid'], e['bytes'], e['sha256']) for e in entries}
        actual = {}
        for row in git(self.path, 'ls-tree', '-r', '-z', '--full-tree', commit).split(b'\0'):
            if row:
                header, name = row.split(b'\t', 1);mode, kind, oid = header.decode().split()
                assert mode == '100644' and kind == 'blob'
                actual[name.decode()] = oid
        assert actual == {name: value[0] for name, value in expected.items()}
        patch = git(self.path, 'show', '--format=', '--root', '--no-renames', '--no-ext-diff', '--no-textconv',
                    '--no-color', '--unified=0', '--src-prefix=a/', '--dst-prefix=b/', commit)
        blocks, current = {}, None
        for line in io.BytesIO(patch):
            if line.startswith(b'diff --git '):
                current = None
            elif line.startswith(b'+++ b/'):
                name = line[6:-1].decode(); assert name in expected and name not in blocks
                current = {'name': name, 'parts': [], 'hunks': []};blocks[name] = current
            elif line.startswith(b'@@ '):
                assert current is not None
                match = re.match(rb'@@ -0,0 \+1(?:,(\d+))? @@', line);assert match
                current['hunks'].append(int(match[1] or 1))
            elif current is not None and line.startswith(b'+'):
                current['parts'].append(line[1:])
            elif current is not None and line == b'\\ No newline at end of file\n':
                assert current['parts'] and current['parts'][-1].endswith(b'\n')
                current['parts'][-1] = current['parts'][-1][:-1]
        # Empty blobs produce no text fragments and are separately classified.
        assert blocks.keys() == {n for n, (_, size, _) in expected.items() if size > 0}
        verified = []
        for name, block in blocks.items():
            raw = b''.join(block['parts']);count = raw.count(b'\n') + int(bool(raw) and not raw.endswith(b'\n'))
            assert block['hunks'] == [count] and (len(raw), sha(raw)) == expected[name][1:]
            verified.append({'name': name, 'bytes': len(raw), 'lines': count, 'sha256': sha(raw)})
        return commit, {'tree': tree, 'commit': commit, 'patchBytes': len(patch), 'patchSha256': sha(patch), 'verified': verified}
