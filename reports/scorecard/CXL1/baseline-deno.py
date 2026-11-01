"""Compare current failures with a read-only origin/main archive; never switch worktrees."""
import io
import pathlib
import subprocess
import tarfile
import tempfile
root = pathlib.Path(__file__).resolve().parents[3]
paths = ['scripts/check-deno-imports.mjs', 'packages', 'supabase/functions']
archive = subprocess.run(['git', 'archive', 'origin/main', *paths], cwd=root, capture_output=True, check=True)
with tempfile.TemporaryDirectory(prefix='baseline-', dir=root / 'reports/scorecard/CXL1') as temp:
    with tarfile.open(fileobj=io.BytesIO(archive.stdout)) as tar:
        for member in tar.getmembers():
            assert not member.name.startswith('/') and '..' not in pathlib.PurePosixPath(member.name).parts
            assert member.isfile() or member.isdir()
        tar.extractall(temp)
    command = ['node', 'scripts/check-deno-imports.mjs']
    baseline = subprocess.run(command, cwd=temp, capture_output=True, text=True)
    current = subprocess.run(command, cwd=root, capture_output=True, text=True)
    print('$ git archive origin/main ' + ' '.join(paths) + '\nEXIT: 0')
    print('$ node scripts/check-deno-imports.mjs (untouched origin/main scratch archive)')
    print(baseline.stdout + baseline.stderr + f'EXIT: {baseline.returncode}')
    print('$ node scripts/check-deno-imports.mjs (assigned worktree)')
    print(f'EXIT: {current.returncode}')
    assert current.returncode == baseline.returncode == 1
    assert sorted(current.stderr.splitlines()) == sorted(baseline.stderr.splitlines())
    print(f'Exact same {len(current.stderr.splitlines())} existing Deno failures; zero added failures. Scratch removed on exit.')
