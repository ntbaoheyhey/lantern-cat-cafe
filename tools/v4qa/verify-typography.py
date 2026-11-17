#!/usr/bin/env python3
"""Verify committed typography checker and its repository tests in QA scratch."""
from pathlib import Path
import datetime, hashlib, io, json, re, subprocess, sys, tarfile

qa = Path('/Users/bao/taskbar-hero-qa')
source = Path('/Users/bao/taskbar-hero-chain')
target = sys.argv[1]
assert re.fullmatch(r'[0-9a-f]{40}', target)
destination = qa / 'work/v4qa' / f'typography-{target[:8]}'
report = qa / 'reports/v4-qa/Q2' / f'typography-recheck-{target[:8]}.json'
assert not destination.exists() and not report.exists(), 'Preserve previous evidence'
destination.mkdir()
paths = ['scripts/ui/check-typography.mjs', 'scripts/ui/check-typography.test.mjs',
         'apps/web/src', 'apps/web/public/fonts']
archive = subprocess.check_output(['git', 'archive', '--format=tar', target, *paths], cwd=source)
count = 0
with tarfile.open(fileobj=io.BytesIO(archive)) as stream:
    for member in stream:
        output = destination / member.name
        assert output.resolve().is_relative_to(destination.resolve()), 'Unsafe archive path'
        if member.isdir():
            output.mkdir(parents=True, exist_ok=True)
        elif member.isfile():
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(stream.extractfile(member).read())
            count += 1
        else:
            raise RuntimeError('Unexpected archive member type')
results = []
for command in [['node', 'scripts/ui/check-typography.mjs'],
                ['node', '--test', 'scripts/ui/check-typography.test.mjs']]:
    result = subprocess.run(command, cwd=destination, capture_output=True, text=True)
    results.append({'command': command, 'exitCode': result.returncode,
                    'output': (result.stdout + result.stderr)[-2200:]})
evidence = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'targetSha': target, 'exportedFiles': count,
            'archiveSha256': hashlib.sha256(archive).hexdigest(),
            'scope': 'Exact committed checker, repository tests, source and font inputs exported into QA-owned scratch.',
            'results': results, 'status': 'PASS' if all(r['exitCode'] == 0 for r in results) else 'FAIL'}
report.write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps({'report': str(report), 'targetSha': target, 'status': evidence['status'],
                  'results': [{'exitCode': r['exitCode'], 'command': r['command']} for r in results]}))
