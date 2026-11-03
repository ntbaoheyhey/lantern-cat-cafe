#!/usr/bin/env python3
"""Run ART1 targeted checks and save raw command output; no scoring or full gate."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

from catalog import ROOT, source_paths

LOGS = ROOT / 'reports/art/validation/logs'


def fingerprint() -> dict:
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in source_paths()}


def main() -> int:
    global LOGS
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--logs', default='reports/art/validation/logs')
    parser.add_argument('--baseline-ref', default='origin/main')
    args = parser.parse_args()
    LOGS = (ROOT / args.logs).resolve()
    assert str(LOGS.relative_to(ROOT)).startswith(('reports/art/', 'reports/ui/'))
    LOGS.mkdir(parents=True, exist_ok=True)
    records = []

    def run(name, command):
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
        (LOGS / (name + '.log')).write_text('COMMAND: ' + shlex.join(command) + '\n' + result.stdout + result.stderr + '\nEXIT: ' + str(result.returncode) + '\n')
        records.append({'name': name, 'command': command, 'exit': result.returncode})
        print(f'{name}: exit {result.returncode}', flush=True)
        return result

    before = fingerprint()
    run('runtime', [sys.executable, '-B', '-c', 'import platform,zlib; print("Python",platform.python_version()); print("zlib",zlib.ZLIB_RUNTIME_VERSION)'])
    run('targeted-tests', [sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tools/art', '-v'])
    run('catalog-drift', [sys.executable, '-B', 'tools/art/catalog.py', '--check'])
    for i in range(1, 11):
        run(f'pipeline-repeat-{i:02}', [sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tools/art', '-p', 'test_pipeline.py', '-v'])
    run('mutations', [sys.executable, '-B', 'tools/art/mutation_check.py', '--logs', str(LOGS.relative_to(ROOT) / 'mutations')])
    baseline_paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', args.baseline_ref], cwd=ROOT, text=True).splitlines()
    baseline_docs = [p for p in baseline_paths if p == 'README.md' or (p.startswith('docs/') and not p.startswith('docs/ui/') and p.endswith('.md') and Path(p).name != 'link-check.md')]
    # UI never edits non-owned baseline docs: passing their explicit list excludes only this card's additions.
    run('baseline-docs-unchanged', ['git', 'diff', '--exit-code', args.baseline_ref, '--', *baseline_docs])
    baseline = run('links-base-docs', ['node', 'scripts/check-links.mjs', '--json', *baseline_docs])
    current = run('links-current', ['node', 'scripts/check-links.mjs', '--json'])
    old, new = json.loads(baseline.stdout), json.loads(current.stdout)
    old_items = {json.dumps(item, sort_keys=True) for item in old['brokenItems']}
    new_items = {json.dumps(item, sort_keys=True) for item in new['brokenItems']}
    link_delta = {'baseCommit': args.baseline_ref, 'baselineBroken': old['brokenCount'], 'currentBroken': new['brokenCount'],
                  'newFailures': [json.loads(item) for item in sorted(new_items - old_items)]}
    (LOGS / 'links-comparison.json').write_text(json.dumps(link_delta, indent=2) + '\n')
    run('whitespace', ['git', 'diff', '--check'])
    after = fingerprint()
    preservation = {'filesChecked': len(before), 'unchanged': before == after, 'before': before, 'after': after}
    (LOGS / 'source-preservation.json').write_text(json.dumps(preservation, indent=2) + '\n')
    (LOGS / 'commands.json').write_text(json.dumps(records, indent=2) + '\n')
    unexpected = [r for r in records if r['exit'] != 0 and not r['name'].startswith('links-')]
    print(f"source hashes unchanged: {before == after} ({len(before)} files)")
    print(f"links baseline={old['brokenCount']}, current={new['brokenCount']}, new={len(new_items - old_items)}")
    return 1 if unexpected or before != after or new_items - old_items else 0


if __name__ == '__main__':
    sys.exit(main())
