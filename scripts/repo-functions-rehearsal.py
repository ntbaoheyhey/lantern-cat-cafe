#!/usr/bin/env python3
"""Deterministic REPO-SOURCE rehearsal only. Never connects to a Supabase project."""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
LABEL = 'repo-source rehearsal only; NOT a backup of deployed functions'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def selected(path):
    # A closed source allowlist; never export working-tree environments or CLI state.
    if path == '.github/workflows/deploy-functions.yml':
        return True  # Static consistency-test input only; restore never runs Actions.
    parts = PurePosixPath(path).parts
    if any(p.startswith('.') or p in ('node_modules', 'dist') for p in parts):
        return False
    return (path.startswith(('packages/', 'supabase/functions/', 'supabase/tests/',
                             'supabase/migrations/', 'scripts/', 'docs/proposals/'))
            # Function tests compare server behavior with checked-in client mocks
            # and public Relic metadata; retain those real test dependencies.
            or path.startswith(('apps/web/src/', 'apps/web/public/relics/'))
            or path in ('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
                        'tsconfig.json', 'tsconfig.base.json', 'supabase/config.toml')
            or (path.startswith('apps/') and path.endswith('/package.json')))


def export_archive(output, ref='HEAD'):
    head = git('rev-parse', '--verify', ref + '^{commit}').decode().strip()
    files = {}
    for entry in git('ls-tree', '-r', '-z', head).split(b'\0'):
        if not entry:
            continue
        metadata, name = entry.split(b'\t', 1)
        path = name.decode()
        if not selected(path):
            continue
        mode, kind, oid = metadata.decode().split()
        if kind != 'blob' or mode not in ('100644', '100755'):
            raise ValueError('Non-regular source file: ' + path)
        files[path] = (git('cat-file', 'blob', oid), int(mode[-3:], 8))
    functions = sorted(p.rsplit('/', 1)[0] for p in files
                       if p.startswith('supabase/functions/') and p.endswith('/index.ts')
                       and '/_shared/' not in p)
    for fn in functions:
        if fn + '/deno.json' not in files:
            raise ValueError('Missing import map: ' + fn)
    manifest = {'label': LABEL, 'head': head, 'format': 1,
                'dependencyBoundary': 'Tracked source/import maps and existing locks; remote module payloads are NOT vendored or certified as deployed.',
                'functions': functions,
                'functionsWithoutTrackedDenoLock': [f for f in functions if f + '/deno.lock' not in files],
                'files': [{'path': p, 'sha256': digest(data), 'mode': mode}
                          for p, (data, mode) in sorted(files.items())]}
    files['SOURCE-MANIFEST.json'] = ((json.dumps(manifest, indent=2, sort_keys=True) + '\n').encode(), 0o644)
    output = Path(output)
    with output.open('xb') as raw, gzip.GzipFile(fileobj=raw, filename='', mode='wb', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w', format=tarfile.USTAR_FORMAT) as tar:
            for name, (data, mode) in sorted(files.items()):
                info = tarfile.TarInfo(name)
                info.size, info.mode, info.mtime = len(data), mode, 0
                info.uid = info.gid = 0
                info.uname = info.gname = ''
                tar.addfile(info, io.BytesIO(data))
    return {'label': LABEL, 'head': head, 'files': len(manifest['files']),
            'archiveSha256': digest(output.read_bytes()),
            'missingFunctionLocks': manifest['functionsWithoutTrackedDenoLock']}


def verified_members(archive):
    files = {}
    with tarfile.open(archive, 'r:gz') as tar:
        for member in tar:
            path = PurePosixPath(member.name)
            if (not member.isfile() or path.is_absolute() or '..' in path.parts
                    or str(path) != member.name or member.name in files
                    or member.size > 20_000_000 or len(files) > 10000):
                raise ValueError('Unsafe or duplicate archive member')
            files[member.name] = (tar.extractfile(member).read(), member.mode & 0o777)
    manifest = json.loads(files.pop('SOURCE-MANIFEST.json')[0])
    if manifest.get('format') != 1 or manifest.get('label') != LABEL:
        raise ValueError('Not a repository-source rehearsal bundle')
    if set(files) != {f['path'] for f in manifest['files']}:
        raise ValueError('Archive inventory mismatch')
    for row in manifest['files']:
        data, mode = files[row['path']]
        if not selected(row['path']) or digest(data) != row['sha256'] or mode != row['mode']:
            raise ValueError('Source integrity mismatch: ' + row['path'])
    return manifest, files


def restore_archive(archive, destination, run_tests=False):
    manifest, files = verified_members(archive)
    destination = Path(destination).absolute()
    if destination.exists() or destination.is_symlink():
        raise ValueError('Restore destination must not exist')
    destination.mkdir(parents=False)
    for name, (data, mode) in files.items():
        path = destination / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        path.chmod(mode)
    (destination / 'SOURCE-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
    if run_tests:
        # No inherited project credentials: tests use PGlite, mocked HTTP and local fixtures.
        env = {k: v for k, v in os.environ.items()
               if not any(word in k.upper() for word in ('SUPABASE', 'SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY', 'DATABASE_URL'))}
        env['CI'] = 'true'
        for command in [
            ['npx', '-y', 'pnpm@10.28.0', 'install', '--frozen-lockfile'],
            ['node', 'scripts/check-deno-imports.mjs'],
            ['npx', '-y', 'pnpm@10.28.0', '--filter', '@taskbar-hero/supabase-tests', 'test'],
        ]:
            subprocess.run(command, cwd=destination, env=env, check=True)
    return {'label': LABEL, 'head': manifest['head'], 'filesVerified': len(files),
            'localTestsRequested': run_tests}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    exp = sub.add_parser('export'); exp.add_argument('archive'); exp.add_argument('--ref', default='HEAD')
    restore = sub.add_parser('restore'); restore.add_argument('archive'); restore.add_argument('destination')
    restore.add_argument('--test', action='store_true', help='Install pinned Node dependencies and run local import/function tests; no Docker or deployment.')
    args = parser.parse_args()
    result = export_archive(args.archive, args.ref) if args.action == 'export' else restore_archive(args.archive, args.destination, args.test)
    print(json.dumps(result, indent=2))
