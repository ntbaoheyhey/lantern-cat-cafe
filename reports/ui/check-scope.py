#!/usr/bin/env python3
"""Read-only enforcement of this UI session's path and asset contract."""
import json
import subprocess
import sys

def git(*args):
    return subprocess.check_output(['git', *args], text=True)

base = sys.argv[1] if len(sys.argv) > 1 else 'origin/main'
changes = [line.split('\t') for line in git('diff', '--name-status', '--no-renames', base + '...HEAD').splitlines()]
failures = []
for status, path in changes:
    owned = (
        path.startswith('apps/web/src/') and not path.startswith(('apps/web/src/api/', 'apps/web/src/wallet/', 'apps/web/src/v2text/'))
        or path.startswith(('apps/web/e2e/', 'tools/art/', 'reports/ui/', 'reports/ui-redesign/', 'reports/art/', 'screenshots/ui-2026-11-03/'))
        or path == 'apps/web/playwright.config.ts'
        or path.startswith(('apps/web/public/', 'docs/ui/')) and status == 'A'
    )
    if path == 'reports/asset-provenance.md':
        ancestor = git('merge-base', base, 'HEAD').strip()
        old = git('show', ancestor + ':' + path)
        owned = git('show', 'HEAD:' + path).startswith(old)
    if not owned:
        failures.append({'path': path, 'reason': 'outside UI ownership or non-additive shared/public path'})
    if path.startswith('apps/web/src/art/') and status != 'A':
        failures.append({'path': path, 'reason': 'existing art must remain untouched'})
    if path.lower().endswith(('.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp')) and status != 'A':
        failures.append({'path': path, 'reason': 'existing image cannot be replaced or removed'})
for row in git('log', '--format=%H%x09%an%x09%ae%x09%s', base + '..HEAD').splitlines():
    sha, name, email, subject = row.split('\t', 3)
    if name != 'ntbaoheyhey' or email != '108352255+ntbaoheyhey@users.noreply.github.com' or not subject.endswith(' [skip ci]'):
        failures.append({'commit': sha, 'reason': 'author or skip-ci suffix mismatch'})
result = {'head': git('rev-parse', 'HEAD').strip(), 'base': git('rev-parse', base).strip(), 'paths': changes, 'failures': failures, 'status': 'FAIL' if failures else 'PASS'}
print(json.dumps(result, indent=2))
sys.exit(bool(failures))
