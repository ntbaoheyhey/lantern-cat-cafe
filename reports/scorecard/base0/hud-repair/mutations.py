"""Temporary mutations in this isolated worktree; restore exact bytes after each run."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[4]
css = root / 'apps/web/src/shell/shell.css'
hud = root / 'apps/web/src/shell/Hud.tsx'
original = {path: path.read_text() for path in [css, hud]}
normal = 'shared HUD.*1280x720$'
mutations = [
    ('xp-dot', css, 'grid-template-columns: auto 160px auto;', 'grid-template-columns: auto 8px auto;', normal),
    ('xp-static-fill', css, '.shell-hud .hud-xp-fill { background:', '.shell-hud .hud-xp-fill { width: 24.9516441% !important; background:', normal),
    ('action-truncated', css, '.shell-context .v2-hint { max-width: 100%; }', '.shell-context .v2-hint { max-width: 120px; }', normal),
    ('action-inert', hud, 'onClick={onHintAction ?? undefined}', 'onClick={undefined}', normal),
    ('gated-ancestor-clip', css, 'height: auto;\n  min-height: calc(var(--hud-h, 56px) + var(--sp-5, 24px));\n  max-height: none;', 'height: 52px;\n  min-height: 52px;\n  max-height: 52px;', 'shared HUD.*1280x720 when gated'),
    ('error-action-collapsed', css, '.shell-context .v2-hint { max-width: 100%; }', '.shell-context .v2-hint { max-width: 100%; }\n  .shell-body:has([data-sync-status="error"]) .v2-hint-btn { max-width: 0; overflow: hidden; }', 'guidance.*503 at 1280x720'),
]
results = []
try:
    for name, path, before, after, pattern in mutations:
        assert original[path].count(before) == 1, name
        path.write_text(original[path].replace(before, after))
        try:
            command = [sys.executable, str(Path(__file__).with_name('run-check.py')), f'mutant-{name}', 'pnpm', '--dir', 'apps/web', 'test:e2e', 'e2e/ui/baseline-hud.spec.ts', '--grep', pattern, '--workers=1']
            run = subprocess.run(command, cwd=root, env=dict(os.environ, SCREENSHOTS='0', E2E_VIEWPORT='1280x720'))
            log = (Path(__file__).parent / 'logs' / f'mutant-{name}.log').read_text()
            killed = run.returncode == 1 and '1 failed' in log and 'expect(' in log
            results.append({'mutation': name, 'path': str(path.relative_to(root)), 'before': before, 'after': after, 'exit': run.returncode, 'killed': killed})
            if not killed:
                raise RuntimeError(f'Mutation survived or failed outside an assertion: {name}')
        finally:
            path.write_text(original[path])
finally:
    for path, content in original.items():
        path.write_text(content)
    restoration = {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in original}
    (Path(__file__).parent / 'mutations.json').write_text(json.dumps({'results': results, 'restored_sha256': restoration}, indent=2)+'\n')
print(json.dumps({'mutations': len(results), 'killed': sum(result['killed'] for result in results), 'restored': True}))
