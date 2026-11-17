"""Resolve only fourteen positioned prefix3 entries; captures stay in memory."""
from pathlib import Path
from collections import Counter
import ast
import copy
import datetime
import gzip
import hashlib
import json
import os
import re
import runpy
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).parent
helpers = runpy.run_path(str(HERE / 'history-case-keys-review.py'))
load, verify, scalars = (helpers[k] for k in ('load', 'verify', 'scalars'))
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.resolve().relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
git = lambda c, p: subprocess.check_output(['git', 'cat-file', 'blob', c + ':' + p], cwd=ROOT, stderr=subprocess.DEVNULL)
identity = lambda r: (r['line'], r['endLine'], r['type'])
location = lambda c: (c['StartLine'], c['EndLine'], c['RuleID'])
FOUNDRY_URL = 'https://raw.githubusercontent.com/foundry-rs/foundry/6bad0a66de7c83f7b33695044138f0f5fa4c5990/crates/anvil/src/config.rs'
FOUNDRY_SHA = '4d8cce388125d8dec42900afee6851512fb58becb05f221a466d18db63aaf20c'
SOURCE_PATH = 'packages/game-rules/src/cardrpg/depth/forecast-key-v4.ts'


def node(request):
    child = subprocess.run(['node', str(HERE / 'prefix3-residual-node.mjs')], input=json.dumps(request).encode(), capture_output=True, cwd=ROOT)
    assert child.returncode == 0
    result = json.loads(child.stdout); assert result['pass']; return result


def reference(commit, path, data):
    return {'commit': commit, 'path': path, 'oid': oid_for(data), 'bytes': len(data)}


def positioned(data, capture, source):
    _, tokens = scalars(data)
    item = tokens.get((capture['ScalarStart'], capture['ScalarEnd']))
    if not capture['ExactBytes'] or item is None:
        return False
    path, value = item
    return path == ('source', SOURCE_PATH) and value.encode() == data[capture['ScalarStart']:capture['ScalarEnd']] and sha(source) == value


def experiment(tasks):
    known = {sha(source).encode() for _, _, source in tasks}
    membership = lambda b, c, s: b[c['ScalarStart']:c['ScalarEnd']] in known
    cases = [(b, c, s, True, 'original') for b, c, s in tasks]
    for b, c, s in tasks:
        changed = b.replace(b'"source":', b'"notSrc":'); assert changed != b
        cases += [(changed, c, s, False, 'wrong-property'), (b, {**c, 'ScalarStart': c['ScalarStart'] + 1}, s, False, 'wrong-position'), (b, c, s + b'\n', False, 'changed-source')]
    rows = []
    for name, fn in [('value-membership', membership), ('positioned-source-derivation', positioned)]:
        start = time.perf_counter(); accepted = [fn(b, c, s) for b, c, s, _, _ in cases]; elapsed = time.perf_counter() - start
        rows.append({'method': name, 'seconds': elapsed, 'originalAccepted': sum(a for a, x in zip(accepted, cases) if x[3]), 'invalidAccepted': sum(a for a, x in zip(accepted, cases) if not x[3]), 'controls': {kind: sum(a for a, x in zip(accepted, cases) if x[4] == kind) for kind in ('wrong-property', 'wrong-position', 'changed-source')}})
    assert rows[0]['originalAccepted'] == rows[1]['originalAccepted'] == 9
    assert rows[0]['invalidAccepted'] == 18 and rows[1]['invalidAccepted'] == 0
    return {'originals': 9, 'invalidCases': 27, 'methods': rows, 'selected': 'positioned-source-derivation', 'scope': 'Local warm comparison; not whole-history throughput.'}


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/prefix3-residual-{attempt}.json.gz'; assert not output.exists()
    previous_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-3-delta-digests-1.json.gz'
    review_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-3-delta-digests-review-1.json'
    prior = load(previous_path); prior_review = load(review_path); assert prior_review['pass'] and prior['unresolved'] == 14
    for item in [prior_review['harness'], *prior_review['inputs']]: verify(item)
    assert git('a240b4666', str(previous_path.relative_to(ROOT))) == previous_path.read_bytes()
    build_path = ROOT / 'reports/v4-ship/S11/text-positions-build-1.json'; build = load(build_path); assert build['pass']
    for item in build['sources'] + [build['binary'], build['config']]: verify(item)
    records = copy.deepcopy(prior['findings']); proofs = []; objects = []; tasks = []
    public_path = ROOT / 'reports/v4-ship/S11/history-public-contract-1.json'; public = load(public_path); verify(public['harness'])
    env = {**{k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}, 'GOMAXPROCS': '1'}
    for index, row in enumerate(records):
        if row['classification'] != 'unresolved': continue
        assert not (ROOT / 'STOP-V4SHIP').exists()
        mapping = row['mappings'][0]; data = git(mapping['commit'], mapping['path']); assert oid_for(data) == row['oid']
        child = subprocess.run([str(ROOT / build['binary']['path']), str(ROOT / build['config']['path'])], input=data, capture_output=True, env=env); assert child.returncode == 0
        captures = json.loads(child.stdout)
        expected = [r for r in records if r['oid'] == row['oid']]
        assert Counter(map(location, captures)) == Counter(map(identity, expected))
        selected = [c for c in captures if location(c) == identity(row)]; assert len(selected) == 1
        c = selected[0]; assert c['ExactBytes']; value = data[c['ScalarStart']:c['ScalarEnd']]
        proof = {'recordIndex': index, 'oid': row['oid'], 'mapping': mapping, 'capture': c}
        document, tokens = scalars(data) if mapping['path'].endswith('.json') else (None, {})
        if document is not None:
            path, decoded = tokens[(c['ScalarStart'], c['ScalarEnd'])]; assert decoded.encode() == value; proof['jsonPath'] = path
        if mapping['path'].endswith('/partial.json'):
            source = git(mapping['commit'], SOURCE_PATH); assert positioned(data, c, source)
            proof['reference'] = reference(mapping['commit'], SOURCE_PATH, source); tasks.append((data, c, source)); kind = 'verified-source-digest'
        elif mapping['path'] == 'docs/deploy.md':
            assert re.fullmatch(rb'0x[0-9a-fA-F]{64}', value)
            matches = list(re.finditer(rb'^DEPLOYER_PRIVATE_KEY=(0x[0-9a-fA-F]{64})\s*\\$', data, re.M))
            assert len(matches) == 1 and matches[0].span(1) == (c['ScalarStart'], c['ScalarEnd'])
            fence = data.rfind(b'```sh\n', 0, c['ScalarStart']); end = data.find(b'```', c['ScalarEnd']); assert fence >= 0 and end > c['ScalarEnd']
            block = data[fence:end]; assert b'\nanvil ' in block and b'--rpc-url http://127.0.0.1:8545' in block
            remote = urllib.request.urlopen(FOUNDRY_URL, timeout=25).read(); assert sha(remote) == FOUNDRY_SHA
            mnemonic = re.search(rb'pub const DEFAULT_MNEMONIC: &str\s*=\s*"([^\"]+)";', remote); assert mnemonic
            assert b'AccountGenerator::new(10)\n            .phrase(DEFAULT_MNEMONIC)\n            .generate()' in remote
            proof['fixture'] = node({'kind': 'fixture', 'mnemonic': mnemonic[1].decode(), 'candidate': value.decode()})
            proof['publicSource'] = {'url': FOUNDRY_URL, 'sha256': sha(remote), 'bytes': len(remote), 'symbol': 'DEFAULT_MNEMONIC'}
            proof['localDocumentationContext'] = True; kind = 'verified-public-anvil-fixture-key'
        elif mapping['path'] == 'packages/chain/src/index.ts':
            proof['ast'] = node({'kind': 'contract', 'mapping': mapping, 'capture': c})
            manifest_path = 'packages/chain/deployments/43113.json'; manifest = git(mapping['commit'], manifest_path)
            assert value.decode() in json.loads(manifest)
            proof['deployment'] = reference(mapping['commit'], manifest_path, manifest); kind = 'verified-contract-property-identifier'
        elif mapping['path'] == 'reports/demo-preview/source-lock.json':
            assert path == ('ai/codex-fix-decorative-key',) and re.fullmatch(rb'[a-f0-9]{40}', value)
            child = subprocess.run(['git', 'cat-file', '--batch'], input=value + b'\n', capture_output=True, cwd=ROOT); assert child.returncode == 0
            header, payload = child.stdout.split(b'\n', 1); obj, typ, size = header.split(); assert obj == value and typ == b'commit' and len(payload) == int(size) + 1 and payload[-1:] == b'\n'
            assert hashlib.sha1(b'commit ' + size + b'\0' + payload[:-1]).hexdigest().encode() == value
            proof['commitObject'] = {'type': 'commit', 'bytes': int(size), 'identityRecomputed': True, 'valuePersisted': False, 'historicalBranchCorrespondence': False}; kind = 'verified-git-commit-identifier'
        elif mapping['path'].endswith('/q8-final-unit.log'):
            matches = list(re.finditer(rb'^apps/web test: \+\s+"YarnToken": "(0x[0-9a-fA-F]{40})",\r?$', data, re.M))
            assert len(matches) == 1 and matches[0].span(1) == (c['ScalarStart'], c['ScalarEnd'])
            manifest_path = 'packages/chain/deployments/43113.json'; manifest = git(mapping['commit'], manifest_path)
            assert bytes.fromhex(value[2:].decode()) == bytes.fromhex(json.loads(manifest)['YarnToken'][2:])
            assert oid_for(manifest) == public['references'][0]['deployment']['oid']
            proof['deployment'] = reference(mapping['commit'], manifest_path, manifest); proof['publicEvidence'] = sign(public_path); kind = 'verified-public-contract-address'
        elif mapping['path'].endswith('/epic.json'):
            assert path == ('tokensSha256',)
            producer_path = 'tools/cardrpg-look/blender/art-frames.py'; producer = git(mapping['commit'], producer_path); assert sha(producer) == document['scriptSha256']
            tree = ast.parse(producer); source_path = 'apps/web/src/game/cardrpg/look-tokens.json'
            named = [n for n in ast.walk(tree) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'TOKENS' for t in n.targets)]; assert len(named) == 1
            assert ast.dump(named[0].value) == ast.dump(ast.parse("ROOT / '" + source_path + "'", mode='eval').body)
            digest = ast.dump(ast.parse('lambda path: hashlib.sha256(path.read_bytes()).hexdigest()', mode='eval').body)
            assert any(isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'sha' for t in n.targets) and ast.dump(n.value) == digest for n in ast.walk(tree))
            assert any(isinstance(n, ast.Dict) and any(isinstance(k, ast.Constant) and k.value == 'tokensSha256' and ast.dump(v) == ast.dump(ast.parse('sha(TOKENS)', mode='eval').body) for k, v in zip(n.keys, n.values)) for n in ast.walk(tree))
            source = git(mapping['commit'], source_path); assert sha(source).encode() == value
            proof['reference'] = reference(mapping['commit'], source_path, source); proof['producer'] = reference(mapping['commit'], producer_path, producer); kind = 'verified-source-digest'
        else:
            raise AssertionError('Unsupported residual retained in prior checkpoint')
        proof['classification'] = kind
        row.update(classification=kind, prefix3ResidualProof=len(proofs), reason='Exact position independently bound to immutable semantics; see prefix3 residual proof.')
        proofs.append(proof); objects.append({'oid': row['oid'], 'mapping': mapping, 'bytes': len(data), 'findings': len(captures), 'exactMultiplicity': True})
    comparison = experiment(tasks)
    counts = Counter(p['classification'] for p in proofs)
    assert len(records) == 1717 and len(proofs) == 14 and len(tasks) == 9
    assert all(a == b for a, b in zip(prior['findings'], records) if a['classification'] != 'unresolved')
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-prefix3-residual-semantics.md', 'harness': sign(Path(__file__)), 'helpers': [sign(HERE / name) for name in ['prefix3-residual-node.mjs', 'history-case-keys-review.py']], 'inputs': [sign(p) for p in [previous_path, review_path, build_path, public_path]], 'objects': objects, 'proofs': proofs, 'comparison': comparison, 'findings': records, 'inheritedClassifications': 1703, 'newlyReviewed': 14, 'newClassifications': dict(counts), 'unresolved': 0, 'fullPrefixFindingsPass': True, 'fullHistoryPass': False, 'limits': 'Only1717 findings in the12000-object frozen prefix. No excluded-byte or later-history clearance; public fixture is not a production credential. No historical code was executed, no values persisted, no live scanner input or runtime changed.'}
    output.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':')) + '\n').encode(), mtime=0))
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'newlyReviewed': 14, 'counts': dict(counts), 'comparison': comparison, 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Prefix3 residual review failed; raw values suppressed', file=sys.stderr)
        raise SystemExit(1) from None
