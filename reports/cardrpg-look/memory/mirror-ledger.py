"""Mirror only B's report/STATE through an isolated index, never the ledger tree."""
import argparse
import os
from pathlib import Path
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('phase')
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
paths = ['reports/cardrpg-look/memory/STATE.md', 'reports/cardrpg-look/CARDRPG-LOOK-REPORT.md']


def git(*args, **kwargs):
    return subprocess.check_output(['git', *args], cwd=root, text=True, **kwargs).strip()


for attempt in range(5):
    git('fetch', 'origin', 'ai/codex-ui-ledger')
    base = git('rev-parse', 'FETCH_HEAD')
    fd, index = tempfile.mkstemp(prefix='cardrpg-look-ledger-index-', dir='/tmp')
    os.close(fd)
    os.unlink(index)
    env = dict(os.environ, GIT_INDEX_FILE=index)
    try:
        git('read-tree', base, env=env)
        for path in paths:
            blob = git('hash-object', '-w', path)
            git('update-index', '--add', '--cacheinfo', '100644', blob, path, env=env)
        tree = git('write-tree', env=env)
        if tree == git('rev-parse', base + '^{tree}'):
            print('Already mirrored ' + base)
            break
        commit = git('commit-tree', tree, '-p', base, input=f'LOOK {args.phase}: mirror audited report and state\n')
        changed = git('diff-tree', '--no-commit-id', '--name-only', '-r', commit).splitlines()
        assert changed and set(changed) <= set(paths), changed
        pushed = subprocess.run(['git', 'push', 'origin', commit + ':refs/heads/ai/codex-ui-ledger'], cwd=root)
        if pushed.returncode == 0:
            print(commit)
            break
        if attempt == 4:
            raise SystemExit('Ledger changed through all four retries; local report remains intact.')
        time.sleep(2 ** (attempt + 1))
    finally:
        Path(index).unlink(missing_ok=True)
