"""Read-only public code evidence; never emit detector-matching addresses."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()


def address_bytes(value):
    assert isinstance(value, str) and value.startswith('0x') and len(value) == 42
    return bytes.fromhex(value[2:])


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/history-public-contract-{attempt}.json'; assert not out.exists()
    refs = [('0554d23457ac84cd367de1b6355fd4b886ed7eed', '3e98961ed42f98353ce56208f666f95d7761e07f'),
            ('0a046ef99eed9bb2ec003057518c2d0d4bd7ed27', 'f738c8975d162bbd045b9d4782f14aab5845a5bf')]
    proofs, values = [], []
    for oid, commit in refs:
        raw = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=ROOT); assert oid_for(raw) == oid
        doc = json.loads(raw)
        deployment_path = 'packages/chain/deployments/43113.json'
        manifest = subprocess.check_output(['git', 'show', commit + ':' + deployment_path], cwd=ROOT)
        deployed = json.loads(manifest)
        if 'accounting' in doc:
            assert doc['accounting']['chainId'] == 43113
            found = [doc['accounting']['token']] + [row['token'] for row in doc['accounting']['rows']]
        else:
            assert doc['chainId'] == 43113
            found = [doc['contracts']['YarnToken']]
        assert all(address_bytes(v) == address_bytes(deployed['YarnToken']) for v in found)
        values += found
        proofs.append({'oid': oid, 'entries': len(found), 'deployment': {'commit': commit, 'path': deployment_path, 'oid': oid_for(manifest)}, 'sameAddressBytes': True})
    assert len(values) == 4 and len({address_bytes(v) for v in values}) == 1
    rpc = 'https://api.avax-test.network/ext/bc/C/rpc'
    calls = [{'jsonrpc': '2.0', 'id': 1, 'method': 'eth_chainId', 'params': []},
             {'jsonrpc': '2.0', 'id': 2, 'method': 'eth_getCode', 'params': [values[0], hex(60940393)]},
             {'jsonrpc': '2.0', 'id': 3, 'method': 'eth_getCode', 'params': [values[0], 'latest']}]
    request = urllib.request.Request(rpc, data=json.dumps(calls).encode(), headers={'Content-Type': 'application/json'})
    response = json.loads(urllib.request.urlopen(request, timeout=25).read()); by_id = {r['id']: r for r in response}
    assert set(by_id) == {1, 2, 3} and int(by_id[1]['result'], 16) == 43113
    runtime = []
    for index in [2, 3]:
        code = bytes.fromhex(by_id[index]['result'][2:]); assert code
        runtime.append({'block': 60940393 if index == 2 else 'latest', 'codeBytes': len(code), 'codeSha256': sha(code)})
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pass': True,
              'harness': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__).read_bytes())},
              'chainId': 43113, 'rpc': rpc, 'methods': [c['method'] for c in calls], 'readOnly': True,
              'addressValuesPersisted': False, 'references': proofs, 'runtime': runtime,
              'limits': 'Only public contract-address semantics. No transaction or accounting/burn claims verified.'}
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'pass': True, 'entries': len(values), 'runtime': runtime}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Public contract review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
