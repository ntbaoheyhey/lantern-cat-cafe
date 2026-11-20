"""Scan exact indexed blobs, including gzip contents; persist location metadata only."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, subprocess, sys, tempfile

root = Path(__file__).resolve().parents[3]
assert not (root / 'STOP-V4SHIP').exists()
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip() == 'codex/v4-ship-2026-11-16'
names = [os.fsdecode(p) for p in subprocess.check_output(['git', 'diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], cwd=root).split(b'\0') if p]
assert names and not any(Path(p).name == '.DS_Store' for p in names)
manifest, expanded = [], 0
with tempfile.TemporaryDirectory(prefix='v4ship-index-') as temporary:
    for name in names:
        data = subprocess.check_output(['git', 'show', ':' + name], cwd=root)
        target = Path(temporary) / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        manifest.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        if name.endswith('.gz'):
            target.with_name(target.name + '.expanded.txt').write_bytes(gzip.decompress(data))
            expanded += 1
    result = subprocess.run(['gitleaks', 'dir', temporary, '--no-banner', '--no-color', '--redact=100', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow'], cwd=root, capture_output=True)
    if result.returncode not in (0, 1):
        raise RuntimeError('Staged scanner failed; raw diagnostics suppressed')
    try:
        findings = json.loads(result.stdout or b'[]')
    except Exception:
        raise RuntimeError('Invalid detector JSON; raw output suppressed') from None
    safe = [{'file': row.get('File', '').removeprefix(temporary + '/'), 'line': row.get('StartLine'), 'type': row.get('RuleID'), 'classification': 'unresolved'} for row in findings]
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': 'Exact staged Git blobs including decompressed gzip contents; generated scan report verified separately. No blanket finding exceptions.', 'scanner': subprocess.check_output(['gitleaks', 'version'], text=True).strip(), 'files': manifest, 'expandedGzip': expanded, 'findings': safe, 'unresolved': len(safe), 'pass': not safe}
if len(sys.argv) > 1:
    output = root / sys.argv[1]
    assert not output.exists(), 'Preserve previous scan evidence'
    output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'stagedFiles': len(names), 'expandedGzip': expanded, 'findings': len(safe), 'unresolved': len(safe), 'pass': not safe}))
if safe:
    sys.exit(1)
