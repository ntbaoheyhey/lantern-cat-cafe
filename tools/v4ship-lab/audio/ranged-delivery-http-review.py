"""Recompute HTTP delivery comparisons from immutable files and server records."""
from pathlib import Path
import copy
import datetime
import gzip
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda data: hashlib.sha256(data).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}


def check(record):
    data = (ROOT / record['path']).read_bytes()
    assert sha(data) == record['sha256']
    if 'bytes' in record:
        assert len(data) == record['bytes']
    return data


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    out = ROOT / f'reports/v4-ship/S11/ranged-delivery-http-review-{attempt}.json'
    assert not out.exists()
    source_path = ROOT / 'reports/v4-ship/S11/ranged-delivery-comparison-2.json'
    source = json.loads(source_path.read_bytes())
    first_path = ROOT / 'reports/v4-ship/S11/ranged-delivery-http-1.json'
    second_path = ROOT / 'reports/v4-ship/S11/ranged-delivery-http-2.json'
    failed_path = ROOT / 'reports/v4-ship/S11/ranged-delivery-http-attempt-1.json'
    failed = json.loads(failed_path.read_bytes()); first = json.loads(check(failed['report']))
    old_harness = gzip.decompress(check(failed['snapshot']))
    assert sha(old_harness) == failed['uncompressedHarnessSha256'] == first['harness']['sha256']
    assert first['complete'] and not first['pass'] and len(first['rows']) == 96
    assert sum(r['pass'] for r in first['rows']) == 93 and len(failed['failures']) == 3
    second = json.loads(second_path.read_bytes()); check(second['harness']); check(second['priorAttempt'])
    assert second['complete'] and second['pass'] and len(second['rows']) == 96
    for record in second['inputs'] + second['signature']:
        check(record)
    assert not any(second[k] for k in ['runtimeChanged', 'productionWiringTested', 'overallTransferGatePass', 'physicalOnsetVerified', 'humanListeningVerified'])
    assert not second['policy']['browserRouting'] and second['policy']['loopbackOnly'] and second['policy']['masterBusZero']
    installed_path = ROOT / 'apps/web/public/audio/manifest.json'
    installed = json.loads(installed_path.read_bytes())
    candidate = json.loads(check(second['candidate']['manifest']))
    engine = check(second['candidate']['engine']).decode()
    original = (ROOT / 'apps/web/src/audio/engine.ts').read_text()
    palettes = {p['id']: p for p in source['packages'] if p['id'] in ['ember', 'heavy', 'shadow', 'tide']}
    all_packs = sorted(p['pack'] for p in palettes.values())
    needle = "['b2-hits','b2-motion','b2-magic','v4-ranged-impacts']"
    selector_start = engine.index(' private selectedRangedPacks?:string[];')
    selector_end = engine.index(' async preload(screen:', selector_start)
    restored_engine = engine[:selector_start] + engine[selector_end:]
    replacement = "['b2-hits','b2-motion','b2-magic',...(this.selectedRangedPacks??" + json.dumps(all_packs, separators=(',', ':')) + ')]'
    assert restored_engine.count(replacement) == 1
    assert restored_engine.replace(replacement, needle) == original
    restored = copy.deepcopy(candidate); restored['packs'] = installed['packs']; bound = 0
    by_variant = {v['sample']['variantId']: v for p in palettes.values() for v in p['variants']}
    for key, design in installed['designs'].items():
        for index, variant in enumerate(design.get('baked', [])):
            if variant['sample']['pack'] != 'v4-ranged-impacts':
                continue
            replacement_variant = by_variant[variant['sample']['variantId']]
            assert candidate['designs'][key]['baked'][index]['sample'] == replacement_variant['sample']
            assert candidate['designs'][key]['baked'][index]['layers'] == variant['layers'] == replacement_variant['layers']
            restored['designs'][key]['baked'][index]['sample'] = variant['sample']; bound += 1
    assert bound == second['candidate']['reboundMappings'] == 180
    assert len(by_variant) == second['candidate']['uniqueSprites'] == 144
    assert restored == installed
    expected_packs = copy.deepcopy(installed['packs']); del expected_packs['v4-ranged-impacts']
    for palette in palettes.values():
        expected_packs[palette['pack']] = {f['format']: '/audio/' + Path(f['path']).name for f in palette['files']}
        for record in palette['files']:
            check(record)
    assert candidate['packs'] == expected_packs
    inventory = json.loads((ROOT / 'reports/v4-ship/S11/ranged-class-inventory-1.json').read_bytes())
    routes = second['candidate']['rosterRouting']
    assert len(routes) == len(inventory['rows']) == 14
    for row, actor in zip(routes, inventory['rows']):
        assert row['owner'] == actor['owner'] and row['action'] == actor['id'] and row['element'] == actor['element']
        assert row['packs'] == ['v4-ranged-' + ('tide' if actor['element'] == 'ice' else actor['element'])]
        assert row['variants'] == 36

    raw = json.loads(gzip.decompress(check(second['log'])))
    assert not raw['pageErrors'] and not raw['foreignRequests']
    requests = raw['requests']; requests_by_phase = {}
    source_checks = {}
    for request in requests:
        assert request['finished']
        if '/audio/' not in request['path']:
            continue
        requests_by_phase.setdefault((request['caseId'], request['phase']), []).append(request)
        if request['status'] == 503:
            assert 'fallback-mp3' in request['caseId'] and request['path'].endswith('.webm')
            assert request['bodyBytes'] == 0 and request['sha256'] == sha(b'') and request['cacheControl'] == 'no-store'
        else:
            assert request['status'] == 200
            if request['sourceFile']:
                path = ROOT / request['sourceFile']
                if path not in source_checks:
                    data = path.read_bytes(); source_checks[path] = (len(data), sha(data))
                assert source_checks[path] == (request['bodyBytes'], request['sha256'])
                assert request['cacheControl'] == 'public, max-age=31536000, immutable'
            else:
                path = ROOT / second['candidate']['manifest']['path'] if request['caseId'].endswith('-palettes') else installed_path
                data = path.read_bytes()
                assert request['path'].endswith('/manifest.json') and len(data) == request['bodyBytes'] and sha(data) == request['sha256']
    matrix = set(); reload_rows = []; cold = []; clock_waits = []
    for row in second['rows']:
        key = (row['caseId'], row['phase']); assert key not in matrix; matrix.add(key)
        network = requests_by_phase.get(key, [])
        ranged = [r for r in network if re.search(r'/v4-ranged-[^/]+\.(webm|mp3)$', r['path'])]
        payloads = [r for r in ranged if r['status'] == 200]
        assert row['serverResponses'] == len(network)
        assert row['serverBodyBytes'] == sum(r['bodyBytes'] for r in network)
        assert row['rangedPayloadBytes'] == sum(r['bodyBytes'] for r in payloads)
        assert row['rangedPayloadRequests'] == len(payloads)
        assert row['expectedFallbacks'] == sum(r['status'] == 503 for r in ranged)
        assert not row['unexpectedStatuses'] and row['networkAfterReady'] == 0
        assert not [r for r in row['resources'] if r['startTime'] > row['readyAt'] + .01]
        assert all(p in row['decoded'] for p in row['expectedRangedPacks']) and row['allBounds'] and row['pass']
        for impact in row['impacts']:
            clock = impact['clock']; assert clock['state'] == 'running' and clock['ready']
            assert clock['target'] is None or clock['atRequest'] >= clock['target']
            assert len(impact['starts']) == 1 and impact['starts'][0]['pack'] in row['expectedRangedPacks']
            assert any(h['result'] == 'played' for h in impact['hits'])
            clock_waits.append(clock['waitMs'])
        format_ = 'mp3' if row['format'] == 'fallback-mp3' else 'webm'
        assert all(r['path'].endswith('.' + format_) for r in payloads)
        if row['phase'] == 'same-engine-repeat':
            assert not ranged and row['rangedPayloadBytes'] == 0
        if row['phase'] == 'cold':
            files = [f for f in source['inputs'] if f['path'].endswith('v4-ranged-impacts.' + format_)] if row['method'] == 'monolith' else [f for p in palettes.values() if row['scope'] == 'all' or p['id'] in ['ember', 'heavy'] for f in p['files'] if f['format'] == format_]
            assert row['rangedPayloadBytes'] == sum(f['bytes'] for f in files) and row['rangedPayloadRequests'] == len(files)
            cold.append({k: row[k] for k in ['caseId', 'browser', 'format', 'scope', 'method', 'rangedPayloadBytes', 'rangedPayloadRequests', 'serverBodyBytes', 'preloadMs']})
        if row['phase'].startswith('reload-'):
            reload_rows.append({k: row[k] for k in ['caseId', 'phase', 'rangedPayloadBytes', 'rangedPayloadRequests', 'preloadMs']})
    assert len(matrix) == 96 and len(cold) == 16 and len(reload_rows) == 32
    for case in {r['caseId'] for r in second['rows']}:
        assert {p for c, p in matrix if c == case} == {'cold', 'same-engine-repeat', 'overlap', 'unknown-all', 'reload-observed', 'reload-all'}
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)),
              'inputs': [sign(p) for p in [source_path, first_path, second_path, failed_path]],
              'preservedFirstAttempt': {'cases': 96, 'passed': 93, 'failed': 3, 'harnessSnapshotVerified': True, 'clockStartupCauseResolved': False},
              'candidate': {'onlyPreloadSelectionAndSamplePackStartChanged': True, 'mappings': 180, 'uniqueSprites': 144, 'rangedActionRoutes': 14},
              'server': {'responses': len(requests), 'distinctSourceFilesVerified': len(source_checks), 'bodyHashesAndSizesVerified': True},
              'cases': len(matrix), 'passed': len(matrix), 'impactStartsVerified': len(clock_waits), 'maximumCooldownWaitMs': max(clock_waits),
              'cold': cold, 'reloads': reload_rows, 'pass': True, 'runtimeChanged': False, 'productionWiringTested': False,
              'fullAudioGatePass': False, 'shippingTransferGatePass': False,
              'limits': ['No browser replay; independently verifies candidate mutation, full matrix and stored network/source evidence.',
                         'Observed reload cache behavior is specific to these browser processes and server policy; no portable cache savings claim.',
                         'Clock guards preserve normal cooldowns and observed source starts; physical onset and startup cause remain unverified.',
                         'Explicit palette selection is research-only; actor timing, production flow, listening and ART transfer remain open.']}
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['cases', 'passed', 'impactStartsVerified', 'maximumCooldownWaitMs', 'pass', 'runtimeChanged']}))


if __name__ == '__main__':
    main(sys.argv[1])
