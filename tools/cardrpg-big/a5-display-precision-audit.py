# REFERENCE: display-precision50. Audit original TRAIN receipts, zero new battles.
from pathlib import Path
import gzip, hashlib, json, math

root = Path('reports/cardrpg-big/a5/b1/display-precision-50')
receipts = {}

def read(path):
    path = Path(path)
    data = path.read_bytes()
    receipts[str(path)] = hashlib.sha256(data).hexdigest()
    return json.loads(gzip.decompress(data) if path.suffix == '.gz' else data)

def mean(values):
    return sum(values) / len(values)

def ranks(values):
    return [sum(x < v for x in values) + (sum(x == v for x in values)-1)/2 for v in values]

def spearman(xs, ys):
    xs, ys = ranks(xs), ranks(ys)
    xm, ym = mean(xs), mean(ys)
    denominator = math.sqrt(sum((x-xm)**2 for x in xs) * sum((y-ym)**2 for y in ys))
    return sum((x-xm)*(y-ym) for x, y in zip(xs, ys)) / denominator if denominator else None

def paired(codes):
    n = len(codes)
    improved, worsened = codes.count(1), codes.count(2)
    delta = (improved-worsened)/n
    variance = (improved+worsened)/n-delta*delta
    se = math.sqrt(variance/(n-1))
    return dict(n=n, beforeWins=sum(code >= 2 for code in codes), wins=sum(code % 2 for code in codes),
                improved=improved, worsened=worsened, gainPp=100*delta,
                pairedNormal95Pp=[100*(delta-1.96*se),100*(delta+1.96*se)])

reg = read(root/'REGISTERED-METHOD.json')
assert read(root/'complete.json') == dict(complete=True, count=500, preservedPrefixCount=50, acceptanceSeedsUsed=False)
assert reg['newSeeds'] == [51,500] and reg['forecastCombatSeeds'] == [1,20] and reg['forecastGearSeeds'] == [1,50]
for path, digest in reg['inputs'].items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest, path
for path, digest in reg['source'].items():
    assert hashlib.sha256((Path(reg['sourceRoot'])/path).read_bytes()).hexdigest() == digest, path
for path, digest in reg['scripts'].items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest, path
for path, digest in reg['currentDifferences'].items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest, path
control = read(reg['control'])
forecast = read('reports/cardrpg-big/a5/b1/display-context-40/results.json.gz')
overlap = read('reports/cardrpg-big/a5/b1/display-context-40/audit.json')
split = read('reports/cardrpg-big/a5/b1/display-split-48/audit.json')
result = read(root/'balance/results.json')
assert result['count'] == 500 and result['offset'] == 0 and result['sample'] == 'train'
assert result['source'] == control['source'] == reg['combatSource']
assert len(result['rows']) == len(control['rows']) == len(forecast['rows']) == 384
cases = []
for row, old, predicted in zip(result['rows'], control['rows'], forecast['rows']):
    assert row['key'] == old['key'] == predicted['key']
    assert row['complete'] and len(row['outcomes']) == 500 and set(row['outcomes']) <= set('0123')
    assert row['outcomes'][:50] == old['outcomes'] == predicted['controlOutcomes']
    assert row['digest'] == hashlib.sha256(json.dumps(row['outcomes']).encode()).hexdigest()
    assert [item['seed'] for item in predicted['items']] == list(range(1,51))
    for item in predicted['items']:
        assert item['predictedGainPp'] == 5*(item['all']['wins']-item['none']['wins'])
    prediction = mean([item['predictedGainPp'] for item in predicted['items']])
    original_prediction = next(c for c in overlap['cases'] if c['key'] == row['key'])
    assert abs(prediction-original_prediction['predictedGainPp']) < 1e-12
    all_codes = list(map(int,row['outcomes']))
    full, separate = paired(all_codes), paired(all_codes[50:])
    summary = next(r for r in result['summaries'] if r['key'] == row['key'])
    assert full['beforeWins'] == summary['beforeWins'] and full['wins'] == summary['wins']
    assert abs(full['gainPp']-summary['gainPp']) < 1e-10
    cases.append(dict(key=row['key'],chapter=row['chapter'],predictedGainPp=prediction,
                      observedDisjoint=separate,observedFull=full))
chapters = []
for chapter in [1,2,3]:
    rows = [r for r in cases if r['chapter'] == chapter]
    assert len(rows) == 128
    xs, ys = [r['predictedGainPp'] for r in rows], [r['observedDisjoint']['gainPp'] for r in rows]
    rho = spearman(xs,ys)
    chapters.append(dict(chapter=chapter,cases=128,comparisonPairsPerCase=450,spearman=rho,
                         originalOverlappingSpearman=overlap['chapters'][chapter-1]['spearman'],
                         retrospective30Spearman=split['chapters'][chapter-1]['disjointCombatSpearman'],
                         meanAbsoluteErrorPp=mean([abs(x-y) for x,y in zip(xs,ys)]),
                         oppositeSigns=sum(x*y < 0 for x,y in zip(xs,ys)),
                         predictedNegative=sum(x < 0 for x in xs),observedNegative=sum(y < 0 for y in ys),
                         screen='PASS' if rho is not None and rho >= .6 else 'MISS'))
full = dict(cases=384,pairsPerCase=500,worstGainPp=max(r['observedFull']['gainPp'] for r in cases),
            pieceMisses=sum(r['observedFull']['gainPp'] > 12+1e-9 for r in cases),
            beforeSaturated=sum(r['observedFull']['beforeWins'] >= 475 for r in cases),
            afterSaturated=sum(r['observedFull']['wins'] >= 475 for r in cases))
audit = dict(status='PASS: receipt consistency',chapters=chapters,cases=cases,fullTrainPieces=full,receipts=receipts,
             preservedOriginalPairs=384*50,newPairSamples=384*450,newAuditBattles=0,acceptanceSeedsUsed=False,
             limitations=['TRAIN51–500 is disjoint from forecast combat1–20 and gear1–50, but is not fresh acceptance.',
                          'No score or model was fitted. The three chapter ranks compare the same registered384 cases.',
                          'Case averages over gear rolls do not validate per-item percentages or individual forecasts.',
                          'Case/seed dependencies mean paired normal intervals are descriptive, not simultaneous intervals.',
                          'Original22 source is preserved. The two later copy/advice differences are archived explicitly.',
                          'Neither this diagnostic nor a passing contextual screen calibrates the static utility display.'])
(root/'audit.json').write_text(json.dumps(audit,indent=2)+'\n')
table = '\n'.join(f"|{r['chapter']}|{r['originalOverlappingSpearman']:.3f}|{r['retrospective30Spearman']:.3f}|{r['spearman']:.3f}|{r['meanAbsoluteErrorPp']:.2f}|{r['oppositeSigns']}|{r['screen']}|" for r in chapters)
(root/'RESULTS.md').write_text(f'''# Contextual forecast on separate TRAIN seeds50

The original20-seed forecast and all384 cases are unchanged. Archived predictions across gear1–50 are compared with450paired outcomes per case at combat/gear51–500. The original1–50 prefixes are exact and were not rerun. The receipt auditor runs zero battles.

|Chapter|Original overlapping50 rho|Retrospective30 rho|Registered separate450 rho|Mean absolute error pp|Opposite signs|≥0.6 screen|
|---|---:|---:|---:|---:|---:|---|
{table}

FullTRAIN500 fourth-slot results retain **{full['pieceMisses']}/384 misses**, worst **{full['worstGainPp']:.1f}pp**, with{full['beforeSaturated']}/{full['afterSaturated']} before/after cells at≥95%wins. The single-piece gate remains≤12pp. All negative outcomes remain in the original matrix and[full audit](audit.json).

This is TRAIN evidence, not acceptance or a calibrated player probability. The static utility-display gate remains separate. Previous overlapping and retrospective results remain visible; no prediction, source rule, fixture, case or threshold was retuned. The exact original22 source preserves sample lineage; subsequent descriptions and reserve-advice differences are documented in[source-transport.diff](source-transport.diff). Fresh20001–20500 remains unused.

[Prospective method](REGISTERED-METHOD.md) · [raw outcomes](balance/results.json). No runtime change or adoption follows automatically.
''')
print(json.dumps(dict(chapters=chapters,fullTrainPieces=full,newAuditBattles=0)))
