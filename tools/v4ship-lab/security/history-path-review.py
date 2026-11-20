"""Independently compare the raw-diff inventory with reachable Git tree contents."""
from pathlib import Path
from collections import deque
import datetime
import gzip
import hashlib
import json
import os
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]; assert attempt.isdecimal()
folder = root / 'reports/v4-ship/S11/history-paths-1'
output = root / ('reports/v4-ship/S11/history-path-review-' + attempt + '.json')
assert not output.exists() and not (root / 'STOP-V4SHIP').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(root)), 'sha256': sha(p.read_bytes())}
scope = json.loads((folder / 'scope.json').read_text())
packed = (folder / 'inventory.json.gz').read_bytes(); assert sha(packed) == scope['inventorySha256']
entries = json.loads(gzip.decompress(packed))
assert len(entries) == len({(r['path'], r['oid']) for r in entries}) == scope['uniquePathObjectPairs']
assert sha((root / 'tools/v4ship-lab/security/history-paths.py').read_bytes()) == scope['binding']['harnessSha256']
commits = gzip.decompress((folder / 'commits.txt.gz').read_bytes()).decode().splitlines()
assert len(commits) == scope['commitCount']
walk = subprocess.check_output(['git', 'rev-list', *scope['referenceTips']], cwd=root).decode().splitlines()
assert set(walk) == set(commits)
root_trees = subprocess.check_output(['git', 'log', '--no-walk=unsorted', '--format=%T', *commits], cwd=root).decode().splitlines()
assert len(root_trees) == len(commits)
todo = deque((oid, b'') for oid in set(root_trees)); seen, cache, found = set(), {}, set()
started = time.monotonic(); tree_bytes = 0
reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
try:
    while todo:
        oid, prefix = todo.popleft()
        if (oid, prefix) in seen:
            continue
        assert not (root / 'STOP-V4SHIP').exists()
        seen.add((oid, prefix))
        if oid not in cache:
            reader.stdin.write((oid + '\n').encode()); reader.stdin.flush()
            header = reader.stdout.readline().decode().split()
            assert len(header) == 3 and header[:2] == [oid, 'tree']
            data = reader.stdout.read(int(header[2])); assert len(data) == int(header[2])
            assert reader.stdout.read(1) == b'\n'
            assert hashlib.sha1(b'tree ' + str(len(data)).encode() + b'\0' + data).hexdigest() == oid
            children = []; offset = 0; tree_bytes += len(data)
            while offset < len(data):
                space = data.index(b' ', offset); end = data.index(b'\0', space)
                mode, name = data[offset:space], data[space + 1:end]
                assert name and b'/' not in name and name not in [b'.', b'..']
                child = data[end + 1:end + 21]; assert len(child) == 20
                children.append((mode, name, child.hex())); offset = end + 21
            assert offset == len(data)
            cache[oid] = children
        for mode, name, child in cache[oid]:
            path = prefix + name
            if mode == b'40000':
                todo.append((child, path + b'/'))
            else:
                assert mode in [b'100644', b'100755', b'120000', b'160000']
                found.add((os.fsdecode(path), child))
    reader.stdin.close()
    assert reader.wait(timeout=10) == 0
finally:
    if reader.poll() is None:
        reader.terminate(); reader.wait(timeout=10)
expected = {(r['path'], r['oid']) for r in entries}
assert found == expected, 'Raw-diff and recursive-tree inventory disagree'
check = json.loads(gzip.decompress((folder / 'check.json.gz').read_bytes()))
assert check['complete'] and check['scopeSha256'] == sha((folder / 'scope.json').read_bytes())
assert len(check['rows']) == len(scope['selected'])
for index, (row, selected) in enumerate(zip(check['rows'], scope['selected'])):
    entry = entries[selected['inventoryIndex']]
    assert row['index'] == index and row['complete']
    assert all(row[k] == selected[k] for k in ['inventoryIndex', 'rules', 'defaultPathExcluded'])
    assert all(row[k] == entry[k] for k in ['path', 'oid', 'commit', 'bytes', 'mode'])
    data = subprocess.check_output(['git', 'cat-file', 'blob', entry['oid']], cwd=root)
    assert sha(data) == row['sha256'] and len(data) == row['bytes']
    assert row['scannerExitCode'] in [0, 1]
alias_path = root / 'reports/v4-ship/S11/history-path-alias-1.json'
alias = json.loads(alias_path.read_text())
for item in alias['inputs']:
    assert sha((root / item['path']).read_bytes()) == item['sha256']
assert sha((root / alias['harness']['path']).read_bytes()) == alias['harness']['sha256']
excluded = [r for r in check['rows'] if r['defaultPathExcluded']]
assert len(alias['rows']) == len(excluded) == 19
for row, original in zip(alias['rows'], excluded):
    assert all(row[k] == original[k] for k in ['inventoryIndex', 'path', 'oid', 'commit', 'bytes', 'sha256'])
    assert row['samePathRulePredicates'] == original['rules'] and row['alias'] == 'payload.yaml'
failed_path = folder / 'attempt-1.json'
failed = json.loads(failed_path.read_text())
snapshot = root / failed['harnesses']['path']
assert sha(snapshot.read_bytes()) == failed['harnesses']['sha256']
archived = json.loads(gzip.decompress(snapshot.read_bytes()))
old_check_path = root / 'reports/v4-ship/S11/history-path-inventory-check-1.json'
old_check = json.loads(old_check_path.read_text())
for reference in [old_check['harness'], old_check['implementation']]:
    source = next(r for r in archived if r['path'] == reference['path'])
    assert sha(source['source'].encode()) == source['sha256'] == reference['sha256']
new_check_path = root / 'reports/v4-ship/S11/history-path-inventory-check-2.json'
new_check = json.loads(new_check_path.read_text())
assert new_check['pass'] and new_check['absentGitlinkVerifiedWithoutFollowing']
for reference in [new_check['harness'], new_check['implementation']]:
    assert sha((root / reference['path']).read_bytes()) == reference['sha256']
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pass': True,
          'method': 'Independent recursive traversal of exact binary Git tree objects for every frozen commit; each tree SHA-1 verified. Compare all unique path/object pairs with raw root/per-parent diff inventory, then verify selected payload hashes and alias-scan inputs.',
          'harness': sign(Path(__file__)), 'inputs': [sign(folder / p) for p in ['scope.json', 'inventory.json.gz', 'check.json.gz', 'commits.txt.gz']] + [sign(alias_path), sign(failed_path), sign(snapshot), sign(old_check_path), sign(new_check_path)],
          'failedAttemptAndOriginalHarnessesPreserved': True,
          'commits': len(commits), 'distinctRootTrees': len(set(root_trees)), 'treeObjects': len(cache),
          'treePrefixPairs': len(seen), 'treeBytes': tree_bytes, 'pathObjectPairs': len(found),
          'seconds': time.monotonic() - started, 'scannedPairs': len(check['rows']),
          'originalDefaultExclusions': len(excluded), 'aliasedExactYamlPairs': len(alias['rows']),
          'findings': check['findings'] + alias['findings'], 'fullHistoryPass': False,
          'limits': ['Frozen superproject names only; no submodule traversal or binary/encoded/archive claims.', 'The original textual scanner and subsequent refs remain open.']}
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['harness', 'inputs']}))
