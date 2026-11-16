"""Verify inventory against every tree in a controlled local history."""
from pathlib import Path
import datetime
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1] if len(sys.argv) > 1 else '1'
assert attempt.isdecimal()
output = root / ('reports/v4-ship/S11/history-path-inventory-check-' + attempt + '.json')
assert not output.exists()
module_path = Path(__file__).with_name('history-paths.py')
spec = importlib.util.spec_from_file_location('history_paths', module_path)
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
env = {**os.environ, 'GIT_AUTHOR_NAME': 'V4 SHIP fixture', 'GIT_COMMITTER_NAME': 'V4 SHIP fixture',
       'GIT_AUTHOR_EMAIL': 'fixture@example.invalid', 'GIT_COMMITTER_EMAIL': 'fixture@example.invalid',
       'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': os.devnull}

with tempfile.TemporaryDirectory(prefix='v4ship-path-history-') as temporary:
    folder = Path(temporary)

    def git(*args):
        return subprocess.check_output(['git', *args], cwd=folder, env=env, stderr=subprocess.DEVNULL)

    def commit(message):
        git('add', '-A'); git('-c', 'commit.gpgsign=false', 'commit', '-m', message)
        return git('rev-parse', 'HEAD').decode().strip()

    git('init', '-b', 'main')
    payload = b'Public synthetic inventory fixture.\n'
    (folder / 'plain.txt').write_bytes(payload)
    (folder / 'strange\nname.yaml').write_bytes(payload)
    (folder / 'link.yaml').symlink_to('/outside-path-that-must-not-be-read')
    first = commit('Root with newline path and link blob')
    git('checkout', '-b', 'side')
    (folder / 'plain.txt').rename(folder / 'certificate.p12')
    (folder / 'certificate.PFX').write_bytes(payload)
    commit('Rename and identical-byte alias')
    git('checkout', 'main')
    (folder / 'main.txt').write_bytes(payload)
    commit('Independent main branch')
    git('-c', 'commit.gpgsign=false', 'merge', '--no-ff', 'side', '-m', 'Two-parent merge')
    (folder / 'certificate.p12').unlink()
    commit('Historical certificate path removed')
    git('update-index', '--add', '--cacheinfo', '160000,' + first + ',deps/reference')
    absent = hashlib.sha1(b'Public synthetic external Gitlink identity').hexdigest()
    git('update-index', '--add', '--cacheinfo', '160000,' + absent + ',deps/external')
    git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Gitlink object retained without following')
    tips = sorted(set(git('for-each-ref', '--format=%(objectname)').decode().splitlines()))
    started = time.monotonic(); rows, details = module.inventory(folder, tips)
    raw_seconds = time.monotonic() - started
    started = time.monotonic(); expected = set()
    for commit_id in git('rev-list', *tips).decode().splitlines():
        for item in git('ls-tree', '-r', '-z', commit_id).split(b'\0'):
            if not item:
                continue
            metadata, name = item.split(b'\t', 1)
            mode, kind, oid = metadata.decode().split()
            expected.add((os.fsdecode(name), oid))
    tree_seconds = time.monotonic() - started
    actual = {(r['path'], r['oid']) for r in rows}
    assert actual == expected
    assert any(r['path'] == 'strange\nname.yaml' for r in rows)
    assert any(r['path'] == 'link.yaml' and r['mode'] == '120000' for r in rows)
    assert any(r['path'] == 'deps/reference' and r['kind'] == 'commit' for r in rows)
    assert any(r['path'] == 'deps/external' and r['externalGitlink'] and r['bytes'] is None for r in rows)
    assert any(r['path'] == 'certificate.p12' for r in rows)
    unique_blob_paths = {(r['path'], r['oid']) for r in rows if r['kind'] == 'blob'}
    hints = git('rev-list', '--objects', *tips).splitlines()
    blob_oids = {r['oid'] for r in rows if r['kind'] == 'blob'}
    hinted = [line for line in hints if line.split(b' ', 1)[0].decode() in blob_oids]
    assert len(hinted) < len(unique_blob_paths)
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pass': True,
              'commits': len(details['commits']), 'allTreePairs': len(expected), 'rawDiffPairs': len(actual),
              'rawDiffSeconds': raw_seconds, 'allTreesSeconds': tree_seconds,
              'uniqueBlobPaths': len(unique_blob_paths), 'revListObjectHints': len(hinted),
              'rootMergeRenameDeletionNewlineSymlinkGitlinkVerified': True, 'absentGitlinkVerifiedWithoutFollowing': True,
              'historicalFilesExecuted': False, 'symlinksFollowed': False,
              'harness': {'path': str(Path(__file__).relative_to(root)), 'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
              'implementation': {'path': str(module_path.relative_to(root)), 'sha256': hashlib.sha256(module_path.read_bytes()).hexdigest()}}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
