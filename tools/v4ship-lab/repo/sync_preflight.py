"""Compare branch snapshots with a three-way merge without changing the worktree.

See reports/v4-ship/LEARN/S7.md. This is preparation, never a scheduled merge.
"""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import re
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
out = (root / sys.argv[1]).resolve()
if not out.is_relative_to(root / 'reports/v4-ship/S7') or out.exists():
    raise RuntimeError('Choose a new S7 evidence path')
if (root / 'STOP-V4SHIP').exists():
    raise RuntimeError('STOP-V4SHIP')


def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)


def paths(left, right):
    return sorted(p.decode() for p in git('diff', '--name-only', '-z', left, right).split(b'\0') if p)


def owner(path):
    audio = 'apps/web/src/game/cardrpg/battle-v3/'
    if path.startswith(audio) and re.fullmatch(
            r'(battle-audio|audio-timeline|callouts)(?:[.-][\w-]+)*\.(ts|json)', path[len(audio):]):
        return 'SHIP'
    art = ['apps/web/public/units/', 'apps/web/public/vfx/',
           'apps/web/src/game/rig/', 'tools/v3craft-lab/', 'scripts/v3feel/',
           'reports/v4-art/', 'reports/v3-feel/']
    art += ['apps/web/src/game/cardrpg/' + part + '/'
            for part in ['battle-v3', 'spine', 'stage', 'vfx-craft', 'vfx-layered']]
    return 'ART' if path == 'assets/provenance.json' or any(path.startswith(p) for p in art) else 'SHIP'


branch = git('branch', '--show-current').decode().strip()
if branch != 'codex/v4-ship-2026-11-16':
    raise RuntimeError('Integration branch required')
head = git('rev-parse', 'HEAD').decode().strip()
art = git('rev-parse', 'refs/remotes/origin/codex/v3-feel-2026-11-14').decode().strip()
base = git('merge-base', head, art).decode().strip()
index_before = hashlib.sha256(git('ls-files', '--stage', '-z')).hexdigest()
diff_before = git('diff', 'HEAD', '--binary')
direct, incoming, own = paths(head, art), paths(base, art), paths(base, head)
started = time.monotonic()
result = subprocess.run(['git', 'merge-tree', '--write-tree', '--name-only', '-z', '--no-messages', head, art],
                        cwd=root, capture_output=True, timeout=120)
if result.returncode not in [0, 1]:
    raise RuntimeError('Merge-tree failed; diagnostics suppressed')
tokens = [p.decode() for p in result.stdout.split(b'\0') if p]
tree = tokens[0]
if not re.fullmatch(r'[a-f0-9]{40,64}', tree):
    raise RuntimeError('Unexpected merge-tree object identifier')
conflicts = tokens[1:]
changed = paths(head, tree)
preserved = sorted(set(own) - set(changed))
unchanged = (head == git('rev-parse', 'HEAD').decode().strip()
             and index_before == hashlib.sha256(git('ls-files', '--stage', '-z')).hexdigest()
             and diff_before == git('diff', 'HEAD', '--binary'))
if not unchanged:
    raise RuntimeError('Repository state changed during preflight')
report = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Read-only worktree/index preflight; Git tree objects only. No merge commit or runtime change.',
    'scheduledMergeUtc': '2026-11-17T12:00:00Z', 'merged': False,
    'shipCommit': head, 'artCommit': art, 'mergeBase': base,
    'gitVersion': git('version').decode().strip(),
    'comparison': {
        'directTipComparison': {'files': len(direct), 'shipSidePathsIncluded': len(set(direct) & set(own)),
                                'limitation': 'Comparing tips mixes incoming ART work with SHIP-only changes; not an incoming patch.'},
        'mergeBaseIncomingComparison': {'files': len(incoming), 'owners': dict(collections.Counter(map(owner, incoming))),
                                       'shipSideOverlap': sorted(set(incoming) & set(own))},
    },
    'threeWayPrediction': {'exitCode': result.returncode, 'seconds': round(time.monotonic() - started, 3),
                          'tree': tree, 'conflicts': conflicts, 'filesChangedFromShip': len(changed),
                          'shipSideFilesPreserved': len(preserved), 'shipSideFilesTotal': len(own)},
    'incomingOutsideArtLane': [p for p in incoming if owner(p) != 'ART'],
    'indexWorktreeAndHeadUnchanged': unchanged,
    'next': 'At the scheduled time re-fetch, read ART SYNC, select a green ART commit, then merge and run every required regression/journey/audio gate.',
    'gatePass': False,
    'limitations': ['A conflict-free tree does not prove runtime compatibility.',
                    'Candidate is a fetched snapshot, not a selected green release.',
                    'Existing ART test failures and missing class baseline remain open.'],
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['shipCommit', 'artCommit', 'comparison', 'threeWayPrediction',
                                        'incomingOutsideArtLane', 'indexWorktreeAndHeadUnchanged', 'merged']}))
