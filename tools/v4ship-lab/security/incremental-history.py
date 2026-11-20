"""Scan frozen reference IDs; keep detector output and any matches in memory only."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, subprocess, sys, time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal()
scope_path = root / f'reports/v4-ship/S11/history-scope-{attempt}.json'
output = root / f'reports/v4-ship/S11/history-incremental-{attempt}.json'
assert not output.exists() and not (root / 'STOP-V4SHIP').exists()
scope = json.loads(scope_path.read_text())
packed = (root / scope['commitList']).read_bytes()
assert hashlib.sha256(packed).hexdigest() == scope['commitListSha256']
expected = set(gzip.decompress(packed).decode().splitlines())
revisions = [*scope['referenceTips'], '^' + scope['base']]
actual = set(subprocess.check_output(['git', 'rev-list', *revisions], cwd=root, text=True).splitlines())
assert actual == expected
started = time.monotonic()
command = ['gitleaks', 'git', '--log-opts=' + ' '.join(revisions), str(root), '--no-banner', '--no-color', '--redact=100', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
process = subprocess.Popen(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env={**os.environ, 'GOMAXPROCS': '1'})
print(json.dumps({'scannerPid': process.pid, 'scopeCommits': len(expected), 'scope': str(scope_path.relative_to(root))}), flush=True)
data, errors = process.communicate()
if process.returncode not in (0, 1):
    raise RuntimeError('Incremental history scanner failed; raw diagnostics suppressed')
try:
    findings = json.loads(data or b'[]')
except Exception:
    raise RuntimeError('Invalid scanner JSON; raw output suppressed') from None
safe = []
for row in findings:
    commit = row.get('Commit', '')
    assert not commit or commit in expected
    safe.append({'file': row.get('File', '').removeprefix(str(root) + '/'), 'line': row.get('StartLine'), 'endLine': row.get('EndLine'), 'commit': commit, 'type': row.get('RuleID'), 'classification': 'unresolved'})
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': str(scope_path.relative_to(root)), 'scopeSha256': hashlib.sha256(scope_path.read_bytes()).hexdigest(), 'commits': len(expected), 'elapsedSeconds': round(time.monotonic() - started, 3), 'scannerExitCode': process.returncode, 'scanner': subprocess.check_output(['gitleaks', 'version'], text=True).strip(), 'findings': safe, 'rawFindingCount': len(safe), 'unresolved': len(safe), 'incrementalPass': not safe, 'fullHistoryPass': False, 'note': 'Exact captured references excluding pre-S0 SHIP-base ancestors. This conservatively overlaps older unmerged branches; it is not a claim that all these commits were newly created. The separate all-history scan remains required.'}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'findings'}), flush=True)
