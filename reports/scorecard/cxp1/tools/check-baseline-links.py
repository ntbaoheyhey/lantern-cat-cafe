"""Measure the cached origin/main docs without another checkout or ref change."""
import io
import pathlib
import subprocess
import tarfile
import tempfile

root = pathlib.Path(__file__).resolve().parents[4]
base = subprocess.check_output(['git', 'rev-parse', 'origin/main'], cwd=root, text=True).strip()
print('Cached origin/main:', base, flush=True)
with tempfile.TemporaryDirectory(prefix='.cxp1-links-', dir=root) as temporary:
    scratch = pathlib.Path(temporary)
    archive = subprocess.check_output(['git', 'archive', base, 'docs', 'README.md', 'scripts'], cwd=root)
    with tarfile.open(fileobj=io.BytesIO(archive)) as files:
        for member in files:
            target = scratch / member.name
            assert scratch in target.resolve().parents
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                assert member.isfile(), 'Only regular repository files are needed'
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(files.extractfile(member).read())
    for path in root.iterdir():
        if (path.name.startswith('.') and path.name != '.github') or (scratch / path.name).exists():
            continue
        (scratch / path.name).symlink_to(path, target_is_directory=path.is_dir())
    result = subprocess.run(['node', 'scripts/check-links.mjs', '--json'], cwd=scratch)
    print('Baseline checker exit:', result.returncode, flush=True)
    raise SystemExit(result.returncode)
