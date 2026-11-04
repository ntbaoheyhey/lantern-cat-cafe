#!/usr/bin/env python3
"""Held-stack release. Default is read-only planning; no integration branch is merged."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPO = 'ntbaoheyhey/taskbar-hero'
SITE = 'https://taskbarhero-eight.vercel.app'
ORDER = [262, 263, 264, 265, 266, 268, 269, 271]
PNPM = ['npx', '-y', 'pnpm@10.28.0']


def command(argv, cwd=ROOT, log=None):
    result = subprocess.run(argv, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if log:
        Path(log).write_text(result.stdout + '\nexit=' + str(result.returncode) + '\n')
    if re.search(r'api-deployments-free-per-day|deployment rate limited|rate limit exceeded|resource is limited', result.stdout, re.I):
        raise RuntimeError('Provider rate-limit signal; release stopped')
    if result.returncode:
        raise RuntimeError('Command failed: ' + ' '.join(argv[:4]) + ('; see ' + str(log) if log else ''))
    return result.stdout.strip()


def github(path):
    return json.loads(command(['gh', 'api', 'repos/' + REPO + '/' + path]))


def utc(value):
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()


def capacity(path, now=None):
    # An OK prose sentence elsewhere in the history must never lift the active hold.
    content = Path(path).read_text()
    matches = re.findall(r'```release-capacity\s*\n(.*?)\n```', content, re.S)
    if len(matches) != 1:
        raise ValueError('Capacity file lacks current machine-readable release-capacity evidence')
    data = json.loads(matches[0]); now = time.time() if now is None else now
    if (data.get('status') != 'OK' or data.get('rateLimited') is not False
            or data.get('source') not in ('authenticated-provider-usage', 'owner-verified-provider-usage')
            or not isinstance(data.get('deploymentsUsed'), int)
            or isinstance(data.get('deploymentsUsed'), bool)
            or not 0 <= data['deploymentsUsed'] < 80
            or not isinstance(data.get('remaining'), int) or isinstance(data['remaining'], bool) or data['remaining'] < 1
            or not 0 <= now - utc(data['checkedAt']) <= 1800):
        raise ValueError('Capacity BLOCKED, stale, rate-limited, exhausted or unverified')
    return data


def fresh_capacity(path, last_merge):
    data = capacity(path)
    if utc(data['checkedAt']) <= last_merge:
        raise ValueError('Capacity must be verified again after the previous merge')
    return data


def validate_manifest(manifest):
    steps = manifest['steps']
    if [s['pr'] for s in steps[:8]] != ORDER or len(steps) != 9:
        raise ValueError('Release order must preserve all held repairs and finish with refreshed gallery')
    if steps[-1]['role'] != 'gallery-refresh' or steps[-1]['pr'] in ORDER + [244, 252, 257]:
        raise ValueError('Last step must be the new gallery refresh draft')
    if not all(re.fullmatch(r'[0-9a-f]{40}', manifest.get(k, '')) for k in ('candidate', 'releaseTree')):
        raise ValueError('Candidate must be a full SHA')
    for step in steps:
        if step['branch'] in ('main', 'ai/codex-stack-tip', 'ai/codex-stack-tip-base'):
            raise ValueError('Integration/main branch is never a release PR')
        if not re.fullmatch(r'[0-9a-f]{40}', step['head']):
            raise ValueError('Every step requires a pinned head')
        if not step['specs'] or any(not s.startswith('e2e/') or '..' in Path(s).parts or not s.endswith('.spec.ts') for s in step['specs']):
            raise ValueError('Changed browser specifications must be explicit')


def receipt(step, directory, head):
    item = json.loads((Path(directory) / (str(step['pr']) + '.json')).read_text())
    if item.get('head') != head or item.get('complete') is not True:
        raise ValueError('Exact-head complete receipt required for #' + str(step['pr']))
    for reviewer in ('A', 'B'):
        grade = item.get(reviewer, {})
        if grade.get('score', 0) < 92 or grade.get('failures') != [] or grade.get('head') != head:
            raise ValueError('Fresh passing A/B receipts required')
    assets = item.get('assets', {})
    if not assets or not any(p.endswith('.js') for p in assets) or not any(p.endswith('.css') for p in assets):
        raise ValueError('Verified production-equivalent JS/CSS SHA-256 inventory required')
    for path, digest in assets.items():
        if not re.fullmatch(r'/assets/[A-Za-z0-9_.-]+', path) or not re.fullmatch(r'[a-f0-9]{64}', digest):
            raise ValueError('Invalid release asset path/hash')
    return item


def check_status(head):
    checks = github('commits/' + head + '/status')
    for check in checks.get('statuses', []):
        if re.search(r'rate.limit|resource is limited|api-deployments', check.get('description') or '', re.I):
            raise RuntimeError('Rate-limit status; release stopped')
    return checks


def gate(worktree, step, logs, port):
    for value in range(port, port + 5):
        with socket.socket() as sock: sock.bind(('127.0.0.1', value))
    env_names = ['E2E_PORT_CLASSIC', 'E2E_PORT_V2', 'E2E_PORT_SERVER', 'E2E_PORT_API']
    for index, name in enumerate(env_names): os.environ[name] = str(port + index)
    os.environ['NODE_OPTIONS'] = '--import=' + str(ROOT / 'scripts/release-ports.mjs')
    command(PNPM + ['install', '--frozen-lockfile'], worktree, logs / 'install.log')
    for label in ('typecheck', 'lint', 'build'):
        command(PNPM + [label], worktree, logs / (label + '.log'))
    for size in ('1280x720', '1600x900'):
        os.environ['E2E_VIEWPORT'] = size
        command(PNPM + ['exec', 'playwright', 'test', *step['specs'], '--workers=2', '--retries=0', '--reporter=line'], worktree / 'apps/web', logs / (size + '.log'))


def live_matches(assets):
    request = urllib.request.Request(SITE + '/?release-check=' + str(int(time.time())), headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=20) as response: html = response.read().decode()
    # Old immutable assets alone do not prove the new HTML points at the new entry.
    for path in assets:
        if '/index-' in path and path not in html:
            return False
        with urllib.request.urlopen(SITE + path, timeout=20) as response:
            if hashlib.sha256(response.read()).hexdigest() != assets[path]: return False
    return True


def execute(args, manifest):
    if args.confirm_release != manifest['candidate']:
        raise ValueError('--execute additionally requires --confirm-release <full candidate SHA>')
    capacity(args.capacity_file)
    state_path = Path(args.state); state_path.parent.mkdir(parents=True, exist_ok=True)
    state = json.loads(state_path.read_text()) if state_path.exists() else {'candidate': manifest['candidate'], 'completed': [], 'lastMergeAt': 0}
    if state['candidate'] != manifest['candidate']: raise ValueError('State belongs to another candidate')
    completed = [r['pr'] for r in state['completed']]
    if completed != [s['pr'] for s in manifest['steps'][:len(completed)]]: raise ValueError('Non-prefix release history')
    if state.get('pending'): raise ValueError('Previous merge has unresolved smoke; inspect pending state before any next merge')
    fresh_capacity(args.capacity_file, state['lastMergeAt'])
    if len(completed) == len(manifest['steps']):
        command(['git', 'fetch', 'origin', 'main'], ROOT)
        command(['git', 'diff', '--exit-code', 'origin/main', manifest['releaseTree']], ROOT)
        print('All release steps complete; main tree equals approved release tree.'); return
    step = manifest['steps'][len(completed)]
    if time.time() - state['lastMergeAt'] < 1200:
        raise ValueError('20-minute merge interval has not elapsed; rerun at ' + dt.datetime.fromtimestamp(state['lastMergeAt'] + 1200, dt.timezone.utc).isoformat())
    # Refresh a dedicated release worktree; never check out/reset/stash the main checkout.
    command(['git', 'fetch', 'origin', 'main', step['branch']])
    info = github('pulls/' + str(step['pr']))
    if info['state'] != 'open' or info['head']['ref'] != step['branch'] or info['head']['sha'] != step['head']:
        raise ValueError('PR changed since manifest; refresh its head and receipt')
    check_status(step['head'])
    worktree = Path(args.worktrees).absolute() / str(step['pr'])
    logs = state_path.parent / ('pr-' + str(step['pr'])); logs.mkdir(parents=True, exist_ok=True)
    if not worktree.exists():
        worktree.parent.mkdir(parents=True, exist_ok=True)
        command(['git', 'worktree', 'add', '--detach', str(worktree), step['head']])
    if command(['git', 'status', '--porcelain', '--untracked-files=no'], worktree): raise ValueError('Release worktree has tracked edits/conflict; inspect it')
    command(['git', '-c', 'user.name=ntbaoheyhey', '-c', 'user.email=108352255+ntbaoheyhey@users.noreply.github.com',
             'merge', '--no-edit', '-m', 'Refresh release candidate with main [skip ci]', 'origin/main'], worktree, logs / 'merge-main.log')
    head = command(['git', 'rev-parse', 'HEAD'], worktree)
    gate(worktree, step, logs, args.port)
    proof = receipt(step, args.receipts, head)  # Stops on an ungraded refreshed head; preserves its worktree.
    lock_path = Path.home() / '.taskbar-hero-locks/merge.lock'; lock_path.parent.mkdir(exist_ok=True)
    with lock_path.open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fresh_capacity(args.capacity_file, state['lastMergeAt'])
        if state_path.exists() and json.loads(state_path.read_text()) != state:
            raise ValueError('Release state changed while checks ran')
        command(['git', 'fetch', 'origin', 'main'], worktree)
        if command(['git', 'merge-base', '--is-ancestor', 'origin/main', head], worktree): raise ValueError('Unexpected ancestry output')
        last_main_time = int(command(['git', 'show', '-s', '--format=%ct', 'origin/main'], worktree))
        if time.time() - max(last_main_time, state['lastMergeAt']) < 1200:
            raise ValueError('Another main commit is within the 20-minute merge interval')
        changed_paths = command(['git', 'diff', '--name-only', 'origin/main', head], worktree).splitlines()
        if sorted(changed_paths) != sorted(proof.get('changedPaths', [])):
            raise ValueError('Post-refresh diff scope differs from approved receipt')
        current = github('pulls/' + str(step['pr']))
        if current['head']['sha'] != step['head']: raise ValueError('Concurrent PR update')
        check_status(step['head'])
        # Persist intent before the first remote write. An interruption or uncertain
        # merge response must stop the next invocation until it is reconciled.
        state['pending'] = {'pr': step['pr'], 'head': head, 'status': 'mutation-intent',
                            'previousMain': command(['git', 'rev-parse', 'origin/main'], worktree)}
        state_path.write_text(json.dumps(state, indent=2) + '\n')
        # Push only a fast-forward refresh, then retarget and remove draft status.
        command(['git', 'push', 'origin', head + ':refs/heads/' + step['branch']], worktree)
        check_status(head)
        command(['gh', 'pr', 'edit', str(step['pr']), '--repo', REPO, '--base', 'main'])
        if current['draft']: command(['gh', 'pr', 'ready', str(step['pr']), '--repo', REPO])
        # A frontend release must not dispatch the path-triggered Supabase workflow.
        # Vercel's branch build is separately verified below; never deploy functions here.
        command(['gh', 'pr', 'merge', str(step['pr']), '--repo', REPO, '--squash', '--match-head-commit', head,
                 '--subject', 'Release reviewed draft #' + str(step['pr']) + ' [skip ci]'])
        merged = github('pulls/' + str(step['pr']))
        if not merged['merged']: raise RuntimeError('Merge not confirmed; stop')
        merge_sha = merged['merge_commit_sha']
        state['lastMergeAt'] = time.time()
        state['pending'] = {'pr': step['pr'], 'head': head, 'merge': merge_sha, 'rollback': 'git revert ' + merge_sha}
        state_path.write_text(json.dumps(state, indent=2) + '\n')
        for attempt in range(40):
            check_status(merge_sha)
            try:
                if live_matches(proof['assets']): break
            except (OSError, ValueError): pass
            time.sleep(20)
        else: raise RuntimeError('Deployment assets unverified after timeout; pending merge blocks release')
        command(['node', str(ROOT / 'scripts/release-smoke.mjs'), str(worktree), SITE, str(logs / 'smoke'), '--require-reward' if step['pr'] >= 265 else '--baseline'], worktree, logs / 'smoke.log')
        state['completed'].append(state.pop('pending'))
        state_path.write_text(json.dumps(state, indent=2) + '\n')
    print('Released #' + str(step['pr']) + '; verified assets and smoke. Rerun after the 20-minute interval with fresh capacity evidence.')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest', required=True); p.add_argument('--capacity-file', required=True)
    p.add_argument('--receipts', required=True); p.add_argument('--state', default='logs/release-stack/state.json')
    p.add_argument('--worktrees', default='/tmp/taskbar-hero-release'); p.add_argument('--port', type=int, default=5360)
    p.add_argument('--execute', action='store_true'); p.add_argument('--confirm-release')
    a = p.parse_args()
    if not 5300 <= a.port <= 5395: p.error('Port must reserve five sockets in 5300–5399')
    manifest = json.loads(Path(a.manifest).read_text()); validate_manifest(manifest)
    if a.execute: execute(a, manifest); return
    blockers = []
    try: capacity(a.capacity_file)
    except (ValueError, OSError, KeyError) as error: blockers.append(str(error))
    for step in manifest['steps']:
        command(['git', 'cat-file', '-e', step['head'] + '^{commit}'])
        try: receipt(step, a.receipts, step['head'])
        except (ValueError, OSError, KeyError) as error: blockers.append('#' + str(step['pr']) + ': ' + str(error))
        print('#' + str(step['pr']) + ': fetch → isolated merge main → install/typecheck/lint/build/changed specs at both sizes → exact A/B+asset receipt → lock → squash → asset hashes → live smoke → 20-minute hold')
    print(json.dumps({'mode': 'DRY RUN', 'writes': 0, 'candidate': manifest['candidate'], 'executionBlockers': blockers}, indent=2))


if __name__ == '__main__':
    try: main()
    except (ValueError, RuntimeError, OSError, KeyError) as error: raise SystemExit('STOP: ' + str(error))
