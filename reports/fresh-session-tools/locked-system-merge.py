"""One explicitly reviewed SYSTEM PR; finite shared-lock protocol, not a queue runner."""
from pathlib import Path
import datetime
import json
import os
import subprocess
import sys
import time

cfg = json.loads(Path(sys.argv[1]).read_text())
root = Path(cfg['root'])
out = Path(cfg['out'])
(out / 'logs').mkdir(parents=True, exist_ok=True)
lock = Path('/Users/bao/.taskbar-hero-locks/merge.lock')
board = lock.parent / 'board.log'
owner = lock / 'owner'
started = time.monotonic()
owned = False
result = {'status': 'WAITING_LOCK', 'pr': cfg['pr'], 'reviewedHead': cfg['head'], 'pid': os.getpid(), 'commands': []}

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def save():
    (out / 'result.json').write_text(json.dumps(result, indent=2) + '\n')

def milestone(message):
    fd = os.open(board, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    try:
        os.write(fd, (now() + ' SYSTEM ' + message + '\n').encode())
    finally:
        os.close(fd)

def run(name, argv):
    begin = now()
    with (out / 'logs' / (name + '.log')).open('w') as log:
        process = subprocess.run(argv, cwd=root, stdout=log, stderr=subprocess.STDOUT)
    (out / 'logs' / (name + '.exit')).write_text(str(process.returncode) + '\n')
    result['commands'].append({'name': name, 'argv': argv, 'exit': process.returncode, 'startedAt': begin, 'endedAt': now()})
    save()
    print(name, 'exit=' + str(process.returncode), flush=True)
    if process.returncode:
        raise RuntimeError(name + ' failed; see retained log')

def git(*args):
    return subprocess.check_output(['git', *args], cwd=root, text=True).strip()

try:
    assert git('branch', '--show-current').startswith('ai/codex-sys-')
    assert git('status', '--porcelain') == ''
    assert git('rev-parse', 'HEAD') == cfg['head']
    for path in cfg['grades']:
        grade = json.loads(Path(path).read_text())
        assert grade['head'] == cfg['head'] and grade['score'] >= 92 and not grade['autoFails']
        criteria = {c['id']: c['score'] for c in grade['criteria']}
        assert criteria['C1'] >= 23 and criteria['C2'] == 20 and criteria['C6'] == 5 and criteria['C7'] >= 8
        assert all(c['score'] >= .6 * c['max'] for c in grade['criteria'])
    while True:
        try:
            lock.mkdir()
            owned = True
            break
        except FileExistsError:
            result['status'] = 'WAITING_LOCK'
            result['lastLockCheck'] = now()
            save()
            if time.monotonic() - started >= 3600:
                raise RuntimeError('Shared merge lock still held after60 minutes; no merge')
            # Never remove a foreign lock automatically. A stale owner may be considered
            # only after90 minutes AND a verified dead PID, under the user protocol.
            time.sleep(min(150, 3600 - (time.monotonic() - started)))
    owner.write_text(json.dumps({'owner': 'SYSTEM', 'pid': os.getpid(), 'createdAt': now(), 'worktree': str(root), 'branch': git('branch', '--show-current'), 'pr': cfg['pr']}) + '\n')
    result['acquiredAt'] = now()
    result['status'] = 'LOCKED_CHECKS'
    milestone('acquired merge lock for PR' + str(cfg['pr']) + ' PID' + str(os.getpid()) + '; ' + str(root))
    run('fetch', ['git', 'fetch', 'origin'])
    result['baseBefore'] = git('rev-parse', 'origin/main')
    run('integrate-main', ['git', '-c', 'user.name=ntbaoheyhey', '-c', 'user.email=108352255+ntbaoheyhey@users.noreply.github.com', 'merge', '--no-stat', 'origin/main', '-m', 'Integrate current main into SYSTEM documentation [skip ci]'])
    result['integratedHead'] = git('rev-parse', 'HEAD')
    for name, argv in cfg['changedChecks']:
        run(name, argv)
    run('typecheck', ['npx', '-y', 'pnpm@10.28.0', 'typecheck'])
    run('lint', ['npx', '-y', 'pnpm@10.28.0', 'lint'])
    if result['integratedHead'] != cfg['head']:
        result['status'] = 'REVIEW_NEW_INTEGRATED_HEAD'
        milestone('PR' + str(cfg['pr']) + ' integrated new main; exact head changed to ' + result['integratedHead'][:7] + ', no merge until refreshed grades')
        save()
        sys.exit(3)
    changed = git('diff', '--name-only', 'origin/main...HEAD').splitlines()
    assert changed and all(p.startswith(('docs/', 'reports/')) or p == 'README.md' for p in changed), 'Docs merge contains out-of-scope paths'
    assert git('status', '--porcelain') == ''
    run('pr-state', ['gh', 'pr', 'view', str(cfg['pr']), '--repo', 'ntbaoheyhey/taskbar-hero', '--json', 'headRefOid,baseRefOid,isDraft,state'])
    pr = json.loads((out / 'logs/pr-state.log').read_text())
    assert pr['headRefOid'] == cfg['head'] and pr['state'] == 'OPEN' and not pr['isDraft']
    run('actions-state', ['gh', 'api', 'repos/ntbaoheyhey/taskbar-hero/actions/runs?head_sha=' + cfg['head'] + '&per_page=1'])
    assert json.loads((out / 'logs/actions-state.log').read_text())['total_count'] == 0
    payload = out / 'merge-request.json'
    payload.write_text(json.dumps({'sha': cfg['head'], 'merge_method': 'merge', 'commit_title': cfg['title'], 'commit_message': ''}) + '\n')
    assert cfg['title'].endswith(' [skip ci]')
    run('merge', ['gh', 'api', '--method', 'PUT', 'repos/ntbaoheyhey/taskbar-hero/pulls/' + str(cfg['pr']) + '/merge', '--input', str(payload)])
    receipt = json.loads((out / 'logs/merge.log').read_text())
    assert receipt['merged']
    result['mergeHead'] = receipt['sha']
    run('fetch-merged', ['git', 'fetch', 'origin'])
    assert git('rev-parse', receipt['sha'] + '^{tree}') == git('rev-parse', cfg['head'] + '^{tree}')
    author = git('show', '-s', '--format=%an%n%ae%n%s', receipt['sha']).splitlines()
    assert author[:2] == ['ntbaoheyhey', '108352255+ntbaoheyhey@users.noreply.github.com'] and author[2].endswith(' [skip ci]')
    result['status'] = 'MERGED_VERIFICATION_PENDING'
    milestone('merged PR' + str(cfg['pr']) + ' as ' + receipt['sha'][:7] + ' under shared lock; exact reviewed tree/author verified; post-main checks next')
except Exception as error:
    result['status'] = 'FAILED_NO_FURTHER_MERGE'
    result['error'] = str(error)
    milestone('PR' + str(cfg['pr']) + ' locked operation stopped: ' + str(error))
    sys.exit(1)
finally:
    if owned:
        if owner.exists():
            assert json.loads(owner.read_text())['pid'] == os.getpid()
            owner.unlink()
        lock.rmdir()
        result['releasedAt'] = now()
        milestone('released own merge lock for PR' + str(cfg['pr']))
    result['endedAt'] = now()
    save()
