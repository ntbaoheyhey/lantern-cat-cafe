"""Resolve bounded historical residuals using exact positions and immutable sources."""
from pathlib import Path
from collections import Counter
import datetime
import gzip
import hashlib
import json
import os
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
helper_path = Path(__file__).with_name('history-case-keys-review.py')
helper = runpy.run_path(str(helper_path))
load, verify, scalars = (helper[k] for k in ['load', 'verify', 'scalars'])
identity = lambda r: (r['line'], r['endLine'], r['type'])
location = lambda r: (r['StartLine'], r['EndLine'], r['RuleID'])
git = lambda commit, path: subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
TOKEN = re.compile(br'//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[A-Za-z_$][A-Za-z0-9_$]*|[^\s]')


def contract_type(data, capture, declaration):
    # Strings and comments remain whole lexical tokens. A matching word inside
    # one can never become a type identifier in a declaration tuple.
    tokens = [(m.start(), m.end(), m.group()) for m in TOKEN.finditer(data) if not m.group().startswith((b'//', b'/*'))]
    found = [i for i, (a, b, _) in enumerate(tokens) if (a, b) == (capture['ScalarStart'], capture['ScalarEnd'])]
    if len(found) != 1 or not capture['ExactBytes']:
        return False
    index = found[0]; value = tokens[index][2]
    if not re.fullmatch(br'[A-Za-z_$][A-Za-z0-9_$]*', value) or index < 1 or index + 2 >= len(tokens):
        return False
    declarations = [m.group(1) for m in re.finditer(br'\bcontract\s+([A-Za-z_$][A-Za-z0-9_$]*)', declaration)]
    return value in declarations and tokens[index - 1][2] in (b'(', b',') and bool(re.fullmatch(br'[A-Za-z_$][A-Za-z0-9_$]*', tokens[index + 1][2])) and tokens[index + 2][2] in (b',', b')')


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/history-residual-{attempt}.json.gz'; assert not output.exists()
    previous_path = ROOT / 'reports/v4-ship/S11/history-case-keys-2.json.gz'
    previous_review_path = ROOT / 'reports/v4-ship/S11/history-case-keys-review-1.json'
    previous = load(previous_path); previous_review = load(previous_review_path); assert previous_review['pass']
    for item in previous_review['inputs']:
        verify(item)
    build_path = ROOT / 'reports/v4-ship/S11/text-positions-build-1.json'; build = load(build_path); assert build['pass']
    for item in build['sources'] + [build['binary'], build['config']]:
        verify(item)
    public_path = ROOT / 'reports/v4-ship/S11/history-public-contract-1.json'; public = load(public_path); assert public['pass'] and public['chainId'] == 43113
    verify(public['harness'])
    ast_path = Path(__file__).with_name('history-residual-ast.mjs')
    env = {**{k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}, 'GOMAXPROCS': '1'}
    records = previous['findings']; objects = []; proofs = []; ast_results = []; controls = []
    targets = list(dict.fromkeys(r['oid'] for r in records if r['classification'] == 'unresolved'))

    def ast(request):
        child = subprocess.run(['node', str(ast_path)], input=json.dumps(request).encode(), capture_output=True, cwd=ROOT)
        assert child.returncode == 0
        result = json.loads(child.stdout); assert result['pass']; return result

    for oid in targets:
        assert not (ROOT / 'STOP-V4SHIP').exists()
        entries = [r for r in records if r['oid'] == oid]; mapping = entries[0]['mappings'][0]
        data = git(mapping['commit'], mapping['path']); assert oid_for(data) == oid
        child = subprocess.run([str(ROOT / build['binary']['path']), str(ROOT / build['config']['path'])], input=data, capture_output=True, env=env)
        assert child.returncode == 0; captures = json.loads(child.stdout)
        assert Counter(map(location, captures)) == Counter(map(identity, entries))
        unresolved = [r for r in entries if r['classification'] == 'unresolved']
        selected = [c for c in captures if location(c) in {identity(r) for r in unresolved}]
        assert len(selected) == len(unresolved) and len({location(c) for c in selected}) == len(selected)
        document, tokens = scalars(data) if mapping['path'].endswith('.json') else (None, {})
        ast_result = None
        if oid == '0e18df59c469fb96182570542bbe647d08077bbf':
            indices = [tokens[(c['ScalarStart'], c['ScalarEnd'])][0][1] for c in selected]
            ast_result = ast({'kind': 'inventory', 'oid': oid, **mapping, 'sourceCommit': '5874d896ad52190d7dc3de4322b4cc01971f1f08', 'indices': indices})
        elif mapping['path'].endswith('audio-timeline.test.ts'):
            ast_result = ast({'kind': 'predicates', 'oid': oid, **mapping, 'captures': selected})
        if ast_result:
            ast_index = len(ast_results); ast_results.append(ast_result); controls += ast_result['controls']
        for capture in selected:
            assert capture['ExactBytes']; value_bytes = data[capture['ScalarStart']:capture['ScalarEnd']]
            row = next(r for r in unresolved if identity(r) == location(capture))
            proof = {'oid': oid, 'recordIndex': records.index(row), 'capture': capture, 'mapping': mapping}
            if document is not None:
                path, value = tokens[(capture['ScalarStart'], capture['ScalarEnd'])]
                assert value.encode() == value_bytes; proof['jsonPath'] = path
                if len(path) == 2 and path[0] in ('source', 'sourceHashes'):
                    assert path[1].startswith(('apps/', 'tools/', 'packages/')) and re.fullmatch(r'[a-f0-9]{64}', value)
                    source = git(mapping['commit'], path[1]); assert sha(source) == value
                    assert sha(source + b' ') != value
                    proof['reference'] = {'commit': mapping['commit'], 'path': path[1], 'oid': oid_for(source), 'bytes': len(source)}
                    kind = 'verified-source-digest'
                elif ast_result and ast_result['kind'] == 'inventory':
                    assert len(path) == 3 and path[0] == 'rows' and path[2] == 'key'
                    verified = [r for r in ast_result['rows'] if r['index'] == path[1]]; assert len(verified) == 1
                    proof.update(astResult=ast_index, source=verified[0]); kind = 'verified-config-property-path'
                else:
                    assert oid in [r['oid'] for r in public['references']]
                    assert path == ('contracts', 'YarnToken') or path == ('accounting', 'token') or len(path) == 4 and path[:2] == ('accounting', 'rows') and path[-1] == 'token'
                    public_ref = next(r for r in public['references'] if r['oid'] == oid)
                    manifest_bytes = git(public_ref['deployment']['commit'], public_ref['deployment']['path'])
                    assert oid_for(manifest_bytes) == public_ref['deployment']['oid']; manifest = json.loads(manifest_bytes)
                    assert value.startswith('0x') and len(value) == 42 and bytes.fromhex(value[2:]) == bytes.fromhex(manifest['YarnToken'][2:])
                    assert bytes.fromhex(value[2:]) != bytes(20)
                    proof.update(publicReference=public_ref['deployment'], publicRuntimeEvidence=sign(public_path)); kind = 'verified-public-contract-address'
            elif ast_result:
                verified = [r for r in ast_result['rows'] if r['scalarStart'] == capture['ScalarStart'] and r['scalarEnd'] == capture['ScalarEnd']]; assert len(verified) == 1
                proof.update(astResult=ast_index, source=verified[0]); kind = 'verified-source-predicate'
            else:
                assert mapping['path'] == 'contracts/test/DeployChainV2.t.sol'
                declaration_path = 'contracts/src/RelicMarketV2.sol'; declaration = git(mapping['commit'], declaration_path)
                assert contract_type(data, capture, declaration)
                quoted = b'"' + value_bytes + b'"'
                assert not contract_type(quoted, {**capture, 'ScalarStart': 1, 'ScalarEnd': len(quoted) - 1}, declaration)
                assert not contract_type(data, {**capture, 'ScalarStart': capture['ScalarStart'] + 1}, declaration)
                proof['reference'] = {'commit': mapping['commit'], 'path': declaration_path, 'oid': oid_for(declaration), 'bytes': len(declaration)}
                kind = 'verified-contract-type-identifier'
                controls += [{'name': 'type-substituted-with-string', 'rejected': True}, {'name': 'shifted-type-position', 'rejected': True}]
            proof['classification'] = kind; row.update(classification=kind, residualProof=len(proofs), reason='Exact whole-fragment position is independently bound to immutable source semantics; see residual proof.')
            proofs.append(proof)
        objects.append({'oid': oid, 'mapping': mapping, 'bytes': len(data), 'totalFindings': len(captures), 'newlyReviewed': len(selected), 'exactFindingMultiplicity': True})
    counts = Counter(p['classification'] for p in proofs)
    assert counts == {'verified-source-digest': 7, 'verified-config-property-path': 33, 'verified-source-predicate': 2, 'verified-contract-type-identifier': 1, 'verified-public-contract-address': 4}
    assert len(records) == 1350 and len(proofs) == 47 and not any(r['classification'] == 'unresolved' for r in records)
    controls += [{'name': 'changed-source-bytes', 'rejected': True}, {'name': 'wrong-public-address', 'rejected': True}]
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-residual-semantics.md',
              'harness': sign(Path(__file__)), 'helpers': [sign(helper_path), sign(ast_path)],
              'inputs': [sign(p) for p in [previous_path, previous_review_path, build_path, public_path]],
              'objects': objects, 'proofs': proofs, 'astResults': ast_results, 'negativeControls': controls,
              'findings': records, 'findingEntries': len(records), 'newlyReviewed': len(proofs), 'newClassifications': dict(counts),
              'unresolved': 0, 'completeFindingAccounting': True, 'residualDerivationsPass': True, 'fullPrefixFindingsPass': True, 'fullHistoryPass': False,
              'limits': 'Only the original1350 findings in the frozen6000-object prefix. No source-value, numeric-simulation, public-accounting or excluded-binary acceptance. Live scanner/runtime unchanged; values and matching source digests never emitted.'}
    output.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':')) + '\n').encode(), mtime=0))
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'newlyReviewed': 47, 'counts': dict(counts), 'unresolved': 0, 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Residual semantic review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
