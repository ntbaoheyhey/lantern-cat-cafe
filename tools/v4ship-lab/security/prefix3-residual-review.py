"""Independent byte-parser, lexical, Rust derivation and public-code review."""
from pathlib import Path
from collections import Counter
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
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
helper_path = HERE / 'history-residual-review.py'
helper = runpy.run_path(str(helper_path))
load, verify, tokens = (helper[k] for k in ('load', 'verify', 'tokens'))
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.resolve().relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
git = lambda c, p: subprocess.check_output(['git', 'show', c + ':' + p], cwd=ROOT, stderr=subprocess.DEVNULL)
identity = lambda r: (r['oid'], r['line'], r['endLine'], r['type'])
TOKEN = re.compile(br'//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[A-Za-z_$][A-Za-z0-9_$]*|[^\s]')


def contract(data, capture):
    lex = [(m.start(), m.end(), m.group()) for m in TOKEN.finditer(data) if not m.group().startswith((b'//', b'/*'))]
    selected = [i for i, (a, b, t) in enumerate(lex) if (a + 1, b - 1) == (capture['ScalarStart'], capture['ScalarEnd']) and t[:1] == t[-1:] == b"'"]
    if len(selected) != 1 or not capture['ExactBytes']: return False
    i = selected[0]; value = lex[i][2][1:-1]
    if not re.fullmatch(br'[A-Za-z_$][A-Za-z0-9_$]*', value): return False
    start = i
    while start >= 0 and lex[start][2] != b'[': start -= 1
    end = i
    while end < len(lex) and lex[end][2] != b']': end += 1
    if start < 0 or end == len(lex): return False
    array = [t for _, _, t in lex[start + 1:end]]
    if len(array) != 7 or not all(t == b',' for t in array[1::2]) or not all(t[:1] == t[-1:] == b"'" for t in array[::2]): return False
    tail = b''.join(t for _, _, t in lex[end + 1:end + 59])
    expected = b'asconst).flatMap(key=>{constvalue=d?.[key]&&asAddress(d[key]!);returnvalue?[[key,value]]:[];})'
    if not tail.startswith(expected): return False
    compact = b''.join(t for _, _, t in lex)
    interface = re.search(br'exportinterfaceAddresses\{([^}]+)\}', compact)
    if not interface or value + b'?:Address;' not in interface[1]: return False
    union = re.search(br'Partial<Record<([^>]+),string>>', compact)
    if not union or b"'" + value + b"'" not in union[1].split(b'|'): return False
    return b'exportfunctiongetAddresses(chainId:number):Addresses{constd=deployments[chainId];return{' in compact and b'...Object.fromEntries(([' in compact


def valid_commit(value):
    if not re.fullmatch(rb'[a-f0-9]{40}', value): return False
    kind = subprocess.run(['git', 'cat-file', '-t', value.decode()], cwd=ROOT, capture_output=True)
    if kind.returncode or kind.stdout.strip() != b'commit': return False
    payload = subprocess.check_output(['git', 'cat-file', 'commit', value.decode()], cwd=ROOT, stderr=subprocess.DEVNULL)
    return hashlib.sha1(b'commit ' + str(len(payload)).encode() + b'\0' + payload).hexdigest().encode() == value


def correspondence(before, rows, proofs):
    assert len(rows) == len(before) == 1717 and len(proofs) == 14
    proof_indices = [p['recordIndex'] for p in proofs]
    assert proof_indices == [i for i, old in enumerate(before) if old['classification'] == 'unresolved']
    for i, (old, new) in enumerate(zip(before, rows)):
        if old['classification'] != 'unresolved': assert old == new; continue
        assert identity(old) == identity(new)
        assert {k: v for k, v in old.items() if k not in ('classification', 'reason')} == {k: v for k, v in new.items() if k not in ('classification', 'reason', 'prefix3ResidualProof')}
        index = proof_indices.index(i); proof = proofs[index]
        assert new['prefix3ResidualProof'] == index and new['classification'] == proof['classification']
        assert proof['oid'] == old['oid'] and proof['mapping'] == old['mappings'][0]


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/prefix3-residual-review-{attempt}.json'; assert not output.exists()
    source = ROOT / 'reports/v4-ship/S11/prefix3-residual-3.json.gz'; report = load(source)
    for item in [report['harness'], *report['helpers'], *report['inputs']]: verify(item)
    prior_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-3-delta-digests-1.json.gz'; prior = load(prior_path)
    before, actual, proofs = prior['findings'], report['findings'], report['proofs']
    correspondence(before, actual, proofs)
    controls = []
    def rejects(name, fn):
        try: result = fn()
        except (AssertionError, ValueError, KeyError): controls.append(name); return
        assert result is False, 'Invalid rejection control'
        controls.append(name)
    build_path = ROOT / 'reports/v4-ship/S11/text-positions-build-1.json'; build = load(build_path)
    for item in build['sources'] + [build['binary'], build['config']]: verify(item)
    env = {**{k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}, 'GOMAXPROCS': '1'}
    docs = {}; address = None; fixture_evidence = None
    for proof in proofs:
        mapping = proof['mapping']; data = git(mapping['commit'], mapping['path']); assert oid_for(data) == proof['oid']; docs[proof['oid']] = data
        child = subprocess.run([str(ROOT / build['binary']['path']), str(ROOT / build['config']['path'])], input=data, capture_output=True, env=env); assert child.returncode == 0
        captures = json.loads(child.stdout)
        expected = [r for r in before if r['oid'] == proof['oid']]
        assert Counter((c['StartLine'], c['EndLine'], c['RuleID']) for c in captures) == Counter((r['line'], r['endLine'], r['type']) for r in expected)
        c = proof['capture']; assert c in captures and c['ExactBytes']
        row = before[proof['recordIndex']]; assert identity(row) == (proof['oid'], c['StartLine'], c['EndLine'], c['RuleID'])
        value = data[c['ScalarStart']:c['ScalarEnd']]
        if 'jsonPath' in proof:
            decoded = tokens(data); path, selected = decoded[(c['ScalarStart'], c['ScalarEnd'])]
            assert list(path) == proof['jsonPath'] and selected.encode() == value
            assert (c['ScalarStart'] + 1, c['ScalarEnd']) not in decoded
            controls.append('shifted-json-position-' + str(proof['recordIndex']))
        kind = proof['classification']
        if kind == 'verified-source-digest':
            ref = proof['reference']; source_bytes = git(ref['commit'], ref['path'])
            assert ref['commit'] == mapping['commit'] and oid_for(source_bytes) == ref['oid'] and len(source_bytes) == ref['bytes'] and sha(source_bytes).encode() == value
            rejects('changed-source-' + str(proof['recordIndex']), lambda: sha(source_bytes + b' ') .encode() == value)
            if mapping['path'].endswith('/partial.json'):
                assert path == ('source', ref['path'])
                changed = data.replace(b'"source":', b'"notSrc":'); changed_path = tokens(changed)[(c['ScalarStart'], c['ScalarEnd'])][0]
                assert changed_path != path
                controls.append('wrong-json-property-' + str(proof['recordIndex']))
            else:
                producer = proof['producer']; original = git(producer['commit'], producer['path']); document = json.loads(data)
                assert oid_for(original) == producer['oid'] and sha(original) == document['scriptSha256']
                assert b"TOKENS = ROOT / 'apps/web/src/game/cardrpg/look-tokens.json'" in original
                assert b"'tokensSha256': sha(TOKENS)" in original and b'lambda path: hashlib.sha256(path.read_bytes()).hexdigest()' in original
                assert path == ('tokensSha256',) and ref['path'] == 'apps/web/src/game/cardrpg/look-tokens.json'
                rejects('changed-producer', lambda: sha(original + b' ') == document['scriptSha256'])
        elif kind == 'verified-public-anvil-fixture-key':
            src = proof['publicSource']; remote = urllib.request.urlopen(src['url'], timeout=25).read(); assert sha(remote) == src['sha256'] and len(remote) == src['bytes']
            strings = re.findall(rb'pub const DEFAULT_MNEMONIC: &str\s*=\s*"([^\"]+)";', remote); assert len(strings) == 1
            assert b'.phrase(DEFAULT_MNEMONIC)' in remote
            line_start = data.rfind(b'\n', 0, c['ScalarStart']) + 1; line_end = data.find(b'\n', c['ScalarEnd'])
            line = data[line_start:line_end]; prefix = b'DEPLOYER_PRIVATE_KEY='
            assert line.startswith(prefix) and c['ScalarStart'] == line_start + len(prefix) and line[len(prefix):].split()[0] == value
            assert b'anvil ' in data[:line_start] and b'--rpc-url http://127.0.0.1:8545' in data[line_end:]
            clean = {'PATH': os.environ['PATH']}
            def derive(index):
                process = subprocess.run(['cast', 'wallet', 'private-key', strings[0].decode(), str(index)], capture_output=True, cwd='/tmp', env=clean)
                assert process.returncode == 0; return process.stdout.strip()
            assert derive(0).lower() == value.lower()
            rejects('wrong-fixture-account', lambda: derive(1).lower() == value.lower())
            fixture_evidence = {'method': 'Independent Rust cast derivation', 'version': subprocess.check_output(['cast', '--version'], env=clean, text=True).splitlines()[0], 'path': "m/44'/60'/0'/0/0", 'matches': True, 'adjacentAccountRejected': True, 'noKeysPersisted': True}
            for dep in proof['fixture']['dependencies']: verify(dep)
        elif kind == 'verified-contract-property-identifier':
            assert contract(data, c)
            rejects('wrong-contract-position', lambda: contract(data, {**c, 'ScalarStart': c['ScalarStart'] + 1}))
            changed = data.replace(value + b'?: Address', b'Q' * len(value) + b'?: Address'); assert changed != data
            rejects('wrong-contract-property', lambda: contract(changed, c))
            ref = proof['deployment']; manifest = git(ref['commit'], ref['path']); assert oid_for(manifest) == ref['oid'] and value.decode() in json.loads(manifest)
            verify(proof['ast']['compiler'])
        elif kind == 'verified-git-commit-identifier':
            assert path == ('ai/codex-fix-decorative-key',) and valid_commit(value)
            rejects('malformed-commit-identifier', lambda: valid_commit(value[:-1] + b'g'))
            rejects('blob-is-not-commit', lambda: valid_commit(proof['oid'].encode()))
            assert not proof['commitObject']['valuePersisted'] and not proof['commitObject']['historicalBranchCorrespondence']
        elif kind == 'verified-public-contract-address':
            line_start = data.rfind(b'\n', 0, c['ScalarStart']) + 1; line_end = data.find(b'\n', c['ScalarEnd'])
            line = data[line_start:line_end]; prefix = b'apps/web test: +'; assert line.startswith(prefix)
            pair = line[len(prefix):].strip().rstrip(b','); key, scalar = next(iter(json.loads(b'{' + pair + b'}').items()))
            assert key == 'YarnToken' and scalar.encode() == value and line_start + line.index(value) == c['ScalarStart']
            ref = proof['deployment']; manifest = git(ref['commit'], ref['path']); assert oid_for(manifest) == ref['oid']
            target = bytes.fromhex(json.loads(manifest)['YarnToken'][2:]); assert bytes.fromhex(value[2:].decode()) == target and target != bytes(20)
            rejects('wrong-public-address', lambda: bytes(20) == target)
            verify(proof['publicEvidence']); address = value.decode()
        else:
            raise AssertionError('Unknown classification')
    assert len(docs) == len(proofs) == 14 and address and fixture_evidence
    public_path = ROOT / 'reports/v4-ship/S11/history-public-contract-1.json'; public = load(public_path)
    requests = [{'jsonrpc': '2.0', 'id': 1, 'method': 'eth_chainId', 'params': []}, {'jsonrpc': '2.0', 'id': 2, 'method': 'eth_getCode', 'params': [address, hex(60940393)]}]
    request = urllib.request.Request(public['rpc'], data=json.dumps(requests).encode(), headers={'Content-Type': 'application/json'})
    response = json.loads(urllib.request.urlopen(request, timeout=25).read()); by_id = {r['id']: r['result'] for r in response}
    def public_ok(result):
        expected = next(r for r in public['runtime'] if r['block'] == 60940393)
        code = bytes.fromhex(result[2][2:])
        return int(result[1], 16) == 43113 and len(code) == expected['codeBytes'] and sha(code) == expected['codeSha256']
    assert public_ok(by_id)
    rejects('wrong-public-chain', lambda: public_ok({**by_id, 1: '0x1'}))
    rejects('missing-public-code', lambda: public_ok({**by_id, 2: '0x'}))
    rejects('removed-entry', lambda: correspondence(before, actual[:-1], proofs))
    rejects('extra-entry', lambda: correspondence(before, actual + [actual[-1]], proofs))
    changed = copy.deepcopy(actual); changed[1380], changed[1414] = changed[1414], changed[1380]
    rejects('reordered-residual-entries', lambda: correspondence(before, changed, proofs))
    changed = copy.deepcopy(actual); changed[1380]['mappings'][0]['path'] = 'wrong/path'
    rejects('wrong-residual-mapping', lambda: correspondence(before, changed, proofs))
    changed = copy.deepcopy(actual); changed[0]['classification'] = 'unresolved'
    rejects('changed-inherited-classification', lambda: correspondence(before, changed, proofs))
    changed = copy.deepcopy(actual); changed[1350]['reference']['path'] = 'wrong/source'
    rejects('changed-inherited-source', lambda: correspondence(before, changed, proofs))
    rejects('missing-proof', lambda: correspondence(before, actual, proofs[:-1]))
    multiplicity = Counter(identity(r) for r in actual); assert sum(n - 1 for n in multiplicity.values()) == 437
    counts = Counter(r['classification'] for r in actual); assert counts.get('unresolved', 0) == 0
    assert counts['verified-source-digest'] == 797
    assert report['inheritedClassifications'] == 1703 and report['newlyReviewed'] == 14 and report['unresolved'] == 0
    comparison = report['comparison']; assert comparison['originals'] == 9 and comparison['invalidCases'] == 27
    assert [m['originalAccepted'] for m in comparison['methods']] == [9, 9] and [m['invalidAccepted'] for m in comparison['methods']] == [18, 0]
    folder = ROOT / 'reports/v4-ship/S11/prefix3-residual-regression-1'; baseline = ROOT / 'reports/v4-ship/S11/history-text-prefix3-regression-1'
    regression = load(folder / 'check.json'); verify(regression['log']); assert regression['complete'] and not regression['commandsPassed']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    def web(path):
        rows = [json.loads(line) for line in gzip.decompress(path.read_bytes()).splitlines()]
        text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
        return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]
    summary = web(folder / 'log.jsonl.gz'); assert summary == web(baseline / 'log.jsonl.gz') and sum(r.startswith('FAIL ') for r in summary) == 7
    assert 'Tests  7 failed | 2697 passed (2704)' in summary
    parity = load(folder / 'parity-probe.json'); assert parity['rows'] == load(baseline / 'parity-probe.json')['rows']
    assert parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)), 'helper': sign(helper_path), 'inputs': [sign(p) for p in [source, prior_path, public_path, folder / 'check.json', folder / 'log.jsonl.gz', folder / 'parity-probe.json', baseline / 'log.jsonl.gz', baseline / 'parity-probe.json']], 'pass': True, 'newlyReviewed': 14, 'inheritedClassificationsPreserved': 1703, 'findingEntries': len(actual), 'classifications': dict(counts), 'unresolved': 0, 'duplicateLineEntriesPreserved': 437, 'negativeControls': controls, 'fixture': fixture_evidence, 'publicRuntime': {'chainId': 43113, 'block': 60940393, 'codeBytes': 8352, 'matchesPriorRuntime': True, 'readOnly': True}, 'sameSevenArtFailures': True, 'webSummary': summary, 'parityRowsUnchanged': True, 'gRegPass': False, 'fullPrefixFindingsPass': True, 'fullHistoryPass': False, 'limits': 'Independent exact-byte/lexical/Git-object/Rust/public-runtime derivation of only14 new classifications. Prior1703 records inherited unchanged, including multiplicity. No historical branch-correspondence, source-content, later-history or excluded-byte clearance. No match values or matching digests persisted.'}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['pass', 'newlyReviewed', 'inheritedClassificationsPreserved', 'findingEntries', 'unresolved', 'duplicateLineEntriesPreserved', 'sameSevenArtFailures', 'fullHistoryPass']} | {'negativeControls': len(controls)}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Independent prefix3 residual review failed; raw values suppressed', file=sys.stderr)
        raise SystemExit(1) from None
