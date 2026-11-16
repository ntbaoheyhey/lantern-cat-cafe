"""Recompute roster/pack delivery evidence; never infer physical playback from source calls."""
from pathlib import Path
import copy
import datetime
import gzip
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda data: hashlib.sha256(data).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}


def verified(record):
    data = (ROOT / record['path']).read_bytes()
    assert sha(data) == record['sha256']
    if 'bytes' in record:
        assert len(data) == record['bytes']
    return data


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/ranged-roster-review-{attempt}.json'
    assert not output.exists()
    path = ROOT / f'reports/v4-ship/S11/ranged-roster-http-{attempt}.json'
    report = json.loads(path.read_bytes()); raw = json.loads(gzip.decompress(verified(report['raw'])))
    install = json.loads(verified(report['installedEvidence']))
    for record in report['signature']:
        verified(record)
    baseline = json.loads(verified(report['baseline']['manifest']))
    old_engine = verified(report['baseline']['engine'])
    assert old_engine == subprocess.check_output(['git', 'show', install['sourceCommit'] + ':apps/web/src/audio/engine.ts'], cwd=ROOT)
    assert baseline == json.loads(subprocess.check_output(['git', 'show', install['sourceCommit'] + ':apps/web/public/audio/manifest.json'], cwd=ROOT))
    manifest = json.loads(verified(install['manifest'])); licenses = json.loads(verified(install['licenses']))
    study = json.loads((ROOT / 'reports/v4-ship/S11/ranged-delivery-comparison-2.json').read_bytes())
    packages = [p for p in study['packages'] if p['id'] in ['ember', 'heavy', 'shadow', 'tide']]
    replacements = {v['sample']['variantId']: v for p in packages for v in p['variants']}
    restored = copy.deepcopy(manifest); restored['packs'] = baseline['packs']; bound = 0
    for cue, design in baseline['designs'].items():
        for index, variant in enumerate(design.get('baked', [])):
            if variant['sample']['pack'] != 'v4-ranged-impacts':
                continue
            current = manifest['designs'][cue]['baked'][index]
            assert current['sample'] == replacements[variant['sample']['variantId']]['sample']
            assert current['layers'] == variant['layers']
            restored['designs'][cue]['baked'][index]['sample'] = variant['sample']; bound += 1
    assert restored == baseline and bound == 180 and len(replacements) == 144
    expected_manifest_packs = copy.deepcopy(baseline['packs']); del expected_manifest_packs['v4-ranged-impacts']
    for package in packages:
        expected_manifest_packs[package['pack']] = {f['format']: '/audio/' + Path(f['path']).name for f in package['files']}
    assert manifest['packs'] == expected_manifest_packs
    assert len(install['copied']) == 8
    for record in install['copied']:
        assert verified(record['source']) == verified(record['installed'])
        license = next(r for r in licenses['files'] if r['path'] == record['installed']['path'])
        assert license['sha256'] == record['installed']['sha256'] and license['license'] == 'CC0-1.0'
        for source in license['sourceFiles']:
            verified(source)
    all_packs = sorted(p['pack'] for p in packages); rows = report['rows']; matrix = set()
    assert report['complete'] and len(rows) == len(raw['details']) == 104 and not raw['errors']
    source_cache = {}; requests_by_case = {}; requests_by_phase = {}
    for request in raw['requests']:
        assert request['finished']
        requests_by_case.setdefault(request['caseId'], []).append(request)
        requests_by_phase.setdefault((request['caseId'], request['phase']), []).append(request)
        if '/audio/' not in request['path']:
            continue
        if request['status'] == 503:
            assert request['bytes'] == 0 and request['sha256'] == sha(b'')
            assert ('-mp3-' in request['caseId'] and request['path'].endswith('.webm')) or ('-retry-' in request['caseId'] and request['phase'] == 'expected-failure')
        else:
            assert request['status'] == 200
            if request['sourceFile']:
                p = ROOT / request['sourceFile']
                if p not in source_cache:
                    data = p.read_bytes(); source_cache[p] = (len(data), sha(data))
                assert source_cache[p] == (request['bytes'], request['sha256'])
            else:
                assert request['path'].endswith('/manifest.json')
                data = verified(report['baseline']['manifest']) if request['caseId'].endswith('-monolith') else verified(install['manifest'])
                assert (len(data), sha(data)) == (request['bytes'], request['sha256'])
    starts = 0; payload_discrepancies = []; cold = []
    for row, detail in zip(rows, raw['details']):
        key = (row['caseId'], row['phase']); assert key == (detail['caseId'], detail['phase']) and key not in matrix; matrix.add(key)
        mono = row['method'] == 'monolith'; scenario = row['scenario']
        expected = ['v4-ranged-impacts'] if mono else all_packs if scenario in ['late-roster', 'unknown', 'absent'] or row['phase'] == 'new-arrival' else [] if scenario == 'melee-healers' else ['v4-ranged-ember'] if scenario == 'new-arrival' else ['v4-ranged-ember', 'v4-ranged-heavy']
        if row['phase'] == 'expected-failure':
            expected = [] if mono else ['v4-ranged-heavy']
            failures = [r for r in requests_by_phase[key] if r['status'] == 503 and ('v4-ranged-impacts.' in r['path'] if mono else 'v4-ranged-ember.' in r['path'])]
            assert len(failures) == 2
        assert row['decoded'] == sorted(expected) == sorted(p for p in detail['decoded'] if p.startswith('v4-ranged-'))
        for impact in detail['impacts']:
            assert len(impact['starts']) == 1 and any(h['result'] == 'played' for h in impact['hits'])
            start = impact['starts'][0]; assert start['pack'] in expected
            selected = (baseline if mono else manifest)['designs'][impact['cue']]['baked']
            assert len(selected) == 36
            assert all(v['sample']['pack'] == start['pack'] and v['sample']['start'] >= 0 and v['sample']['start'] + v['sample']['duration'] <= (start['frames'] + 1) / start['rate'] for v in selected)
            assert start['at'] >= impact['requestedAt'] and impact['requestedAt'] >= detail['readyAt']; starts += 1
        assert row['impactStarts'] == len(detail['impacts'])
        if row['phase'] == 'repeat':
            assert row['rangedBytes'] == 0
        if scenario == 'early-roster':
            cold.append({k: row[k] for k in ['browser', 'format', 'method', 'preloadMs', 'rangedBytes', 'rangedRequests']})
    for case in {r['caseId'] for r in rows}:
        payload = sum(r['bytes'] for r in requests_by_case[case] if r['status'] == 200 and '/v4-ranged-' in r['path'])
        recorded = sum(r['rangedBytes'] for r in rows if r['caseId'] == case)
        if payload != recorded:
            payload_discrepancies.append({'caseId': case, 'recorded': recorded, 'server': payload})
    assert len({r['caseId'] for r in rows}) == 72 and len(cold) == 8
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)), 'input': sign(path),
              'raw': report['raw'], 'candidateMappings': bound, 'uniqueSprites': len(replacements), 'installedFilesVerified': 8,
              'phases': len(rows), 'sourceStarts': starts, 'functionalEvidencePass': True, 'payloadDiscrepancies': payload_discrepancies,
              'payloadAccountingPass': not payload_discrepancies, 'cold': cold, 'pass': not payload_discrepancies,
              'productionValidated': False, 'fullAudioGatePass': False, 'shippingTransferGatePass': False}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['phases', 'sourceStarts', 'functionalEvidencePass', 'payloadDiscrepancies', 'pass']}))
    if not result['pass']:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1])
