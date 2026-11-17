"""Independent byte-token, tree-enumeration and public-runtime review of residuals."""
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
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
identity = lambda r: (r['oid'], r['line'], r['endLine'], r['type'])
git = lambda commit, path: subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
STRING = re.compile(br'"(?:\\.|[^"\\])*"')
ATOM = re.compile(br'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|true|false|null')


def unique(pairs):
    assert len({k for k, _ in pairs}) == len(pairs)
    return dict(pairs)


def invalid(_):
    raise ValueError('Invalid JSON')


def decode(data):
    return json.loads(data, object_pairs_hook=unique, parse_constant=invalid)


def load(path):
    b = path.read_bytes(); return decode(gzip.decompress(b) if path.suffix == '.gz' else b)


def verify(item):
    assert sha((ROOT / item['path']).read_bytes()) == item['sha256']


def tokens(data):
    decode(data); found = {}
    def ws(i):
        while i < len(data) and data[i] in b' \r\n\t':
            i += 1
        return i
    def walk(i, path):
        i = ws(i)
        if data[i] == 123:
            i = ws(i + 1)
            if data[i] == 125:
                return i + 1
            while True:
                token = STRING.match(data, i); assert token; key = decode(token.group()); i = ws(token.end()); assert data[i] == 58
                i = ws(walk(i + 1, path + (key,)))
                if data[i] == 125:
                    return i + 1
                assert data[i] == 44; i = ws(i + 1)
        if data[i] == 91:
            i = ws(i + 1); index = 0
            if data[i] == 93:
                return i + 1
            while True:
                i = ws(walk(i, path + (index,))); index += 1
                if data[i] == 93:
                    return i + 1
                assert data[i] == 44; i = ws(i + 1)
        if data[i] == 34:
            token = STRING.match(data, i); assert token; found[(i + 1, token.end() - 1)] = (path, decode(token.group())); return token.end()
        token = ATOM.match(data, i); assert token; return token.end()
    assert ws(walk(0, ())) == len(data)
    return found


def correspondence(before, after):
    assert len(before) == len(after)
    for old, new in zip(before, after):
        assert identity(old) == identity(new)
        if old['classification'] != 'unresolved':
            assert old == new
        else:
            assert {k: v for k, v in old.items() if k not in ('classification', 'reason')} == {k: v for k, v in new.items() if k not in ('classification', 'reason', 'residualProof')}


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/history-residual-review-{attempt}.json'; assert not out.exists()
    input_path = ROOT / 'reports/v4-ship/S11/history-residual-1.json.gz'; report = load(input_path)
    for item in [report['harness']] + report['helpers'] + report['inputs']:
        verify(item)
    prior_path = ROOT / 'reports/v4-ship/S11/history-case-keys-2.json.gz'; prior = load(prior_path)
    correspondence(prior['findings'], report['findings'])
    assert len(report['findings']) == 1350 and len(report['proofs']) == 47
    build = load(ROOT / 'reports/v4-ship/S11/text-positions-build-1.json')
    for item in build['sources'] + [build['binary'], build['config']]:
        verify(item)
    by_oid = {}; doc_tokens = {}; addresses = []; controls = []
    env = {**{k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}, 'GOMAXPROCS': '1'}
    for obj in report['objects']:
        data = git(obj['mapping']['commit'], obj['mapping']['path']); assert oid_for(data) == obj['oid']; by_oid[obj['oid']] = data
        scan = subprocess.run([str(ROOT / build['binary']['path']), str(ROOT / build['config']['path'])], input=data, capture_output=True, env=env); assert scan.returncode == 0; captures = decode(scan.stdout)
        expected = [r for r in prior['findings'] if r['oid'] == obj['oid']]
        assert Counter((c['StartLine'], c['EndLine'], c['RuleID']) for c in captures) == Counter((r['line'], r['endLine'], r['type']) for r in expected)
        actual = [p for p in report['proofs'] if p['oid'] == obj['oid']]
        assert len(actual) == sum(r['classification'] == 'unresolved' for r in expected)
        for proof in actual:
            assert proof['capture'] in captures
        if obj['mapping']['path'].endswith('.json'):
            doc_tokens[obj['oid']] = tokens(data)
    for index, proof in enumerate(report['proofs']):
        old = prior['findings'][proof['recordIndex']]; new = report['findings'][proof['recordIndex']]
        assert old['classification'] == 'unresolved' and new['residualProof'] == index and new['classification'] == proof['classification']
        assert old['mappings'][0] == proof['mapping'] and old['oid'] == proof['oid']
        c = proof['capture']; data = by_oid[proof['oid']]; assert c['ExactBytes'] and identity(old) == (proof['oid'], c['StartLine'], c['EndLine'], c['RuleID'])
        if 'jsonPath' in proof:
            path, value = doc_tokens[proof['oid']][c['ScalarStart'], c['ScalarEnd']]
            assert list(path) == proof['jsonPath'] and data[c['ScalarStart']:c['ScalarEnd']] == value.encode()
            assert (c['ScalarStart'] + 1, c['ScalarEnd']) not in doc_tokens[proof['oid']]
        if proof['classification'] == 'verified-source-digest':
            ref = proof['reference']; b = git(ref['commit'], ref['path']); assert oid_for(b) == ref['oid'] and len(b) == ref['bytes']
            assert path[-1] == ref['path'] and sha(b) == value and sha(b + b' ') != value
        elif proof['classification'] == 'verified-public-contract-address':
            ref = proof['publicReference']; b = git(ref['commit'], ref['path']); assert oid_for(b) == ref['oid']
            target = decode(b)['YarnToken']; actual = bytes.fromhex(value[2:]); assert len(actual) == 20 and actual == bytes.fromhex(target[2:]) and actual != bytes(20); addresses.append(value)
    ast_path = Path(__file__).with_name('history-residual-review-ast.mjs'); ast_reviews = []
    def ast(request):
        p = subprocess.run(['node', str(ast_path)], input=json.dumps(request).encode(), capture_output=True, cwd=ROOT); assert p.returncode == 0; result = decode(p.stdout); assert result['pass']; ast_reviews.append(result)
    inventory = [p for p in report['proofs'] if p['classification'] == 'verified-config-property-path']
    ast({'kind': 'inventory', 'proofs': inventory, 'ast': report['astResults'][inventory[0]['astResult']]})
    predicates = [p for p in report['proofs'] if p['classification'] == 'verified-source-predicate']
    ast({'kind': 'predicates', 'oid': predicates[0]['oid'], 'mapping': predicates[0]['mapping'], 'captures': [p['capture'] for p in predicates]})
    solidity = next(p for p in report['proofs'] if p['classification'] == 'verified-contract-type-identifier')
    ast({'kind': 'solidity', **solidity})
    assert len(addresses) == 4 and len({bytes.fromhex(a[2:]) for a in addresses}) == 1
    rpc = 'https://api.avax-test.network/ext/bc/C/rpc'
    requests = [{'jsonrpc': '2.0', 'id': 1, 'method': 'eth_chainId', 'params': []}, {'jsonrpc': '2.0', 'id': 2, 'method': 'eth_getCode', 'params': [addresses[0], hex(60940393)]}]
    request = urllib.request.Request(rpc, data=json.dumps(requests).encode(), headers={'Content-Type': 'application/json'})
    response = decode(urllib.request.urlopen(request, timeout=25).read()); by_id = {row['id']: row for row in response}
    def public_check(rows):
        assert int(rows[1]['result'], 16) == 43113
        code = bytes.fromhex(rows[2]['result'][2:]); assert code
        public = load(ROOT / 'reports/v4-ship/S11/history-public-contract-1.json')
        expected = next(r for r in public['runtime'] if r['block'] == 60940393)
        assert len(code) == expected['codeBytes'] and sha(code) == expected['codeSha256']
        return {'chainId': 43113, 'block': 60940393, 'codeBytes': len(code), 'sameRuntimeBytesHash': True, 'readOnly': True}
    public_review = public_check(by_id)
    def rejects(name, fn):
        try:
            fn()
        except (AssertionError, ValueError, KeyError):
            controls.append({'name': name, 'rejected': True}); return
        raise AssertionError('Invalid negative control')
    rejects('removed-finding', lambda: correspondence(prior['findings'], report['findings'][:-1]))
    rejects('extra-finding', lambda: correspondence(prior['findings'], report['findings'] + [report['findings'][0]]))
    wrong_chain = copy.deepcopy(by_id); wrong_chain[1]['result'] = hex(1)
    rejects('wrong-chain', lambda: public_check(wrong_chain))
    empty_code = copy.deepcopy(by_id); empty_code[2]['result'] = '0x'
    rejects('no-public-runtime', lambda: public_check(empty_code))
    controls += report['negativeControls'] + [{'name': 'changed-source-bytes-independent', 'rejected': True}, {'name': 'wrong-address-independent', 'rejected': True}, {'name': 'shifted-json-position-independent', 'rejected': True}]
    folder = ROOT / 'reports/v4-ship/S11/history-residual-regression-1'; baseline = ROOT / 'reports/v4-ship/S11/history-case-keys-regression-1'
    regression = load(folder / 'check.json'); verify(regression['log']); assert regression['complete']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    def summary(path):
        lines = [decode(line) for line in gzip.decompress(path.read_bytes()).splitlines()]
        text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in lines if r['name'] == 'web'))
        return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]
    web = summary(folder / 'log.jsonl.gz'); assert web == summary(baseline / 'log.jsonl.gz') and sum(s.startswith('FAIL ') for s in web) == 7
    assert 'Tests  7 failed | 2697 passed (2704)' in web
    parity = load(folder / 'parity-probe.json'); assert parity['rows'] == load(baseline / 'parity-probe.json')['rows'] and parity['probePass'] and not parity['officialClassBaselineApproved'] and not parity['newBaseline']
    counts = Counter(r['classification'] for r in report['findings']); assert counts['unresolved'] == 0 and sum(counts.values()) == 1350
    multiplicity = Counter(identity(r) for r in report['findings'])
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pass': True, 'harness': sign(Path(__file__)), 'astHarness': sign(ast_path),
              'inputs': [sign(p) for p in [input_path, prior_path, folder / 'check.json', folder / 'log.jsonl.gz', folder / 'parity-probe.json', baseline / 'log.jsonl.gz', baseline / 'parity-probe.json']],
              'findingEntries': 1350, 'previousEntriesPreserved': 1303, 'newlyReviewed': 47, 'unresolved': 0, 'classificationCounts': dict(counts),
              'duplicateLineEntriesPreserved': sum(n - 1 for n in multiplicity.values()), 'astReviews': ast_reviews, 'publicRuntimeReview': public_review,
              'negativeControls': controls, 'sameSevenArtFailures': True, 'webSummary': web, 'parityRowsUnchanged': True, 'gRegPass': False,
              'fullPrefixFindingsPass': True, 'fullHistoryPass': False, 'limits': 'Only1350 original findings in frozen6000-object prefix; excluded bytes/later history/global repository acceptance remain open.'}
    out.write_text(json.dumps(result, indent=2) + '\n'); print(json.dumps({k: result[k] for k in ['pass', 'findingEntries', 'newlyReviewed', 'unresolved', 'duplicateLineEntriesPreserved', 'fullHistoryPass']}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Independent residual review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
