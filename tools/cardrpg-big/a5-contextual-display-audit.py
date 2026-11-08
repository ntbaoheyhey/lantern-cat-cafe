# REFERENCE: display-context40. Reconstruct registered results without new combat samples.
from pathlib import Path
import hashlib, json, math

root = Path('reports/cardrpg-big/a5/b1/display-context-40')
read = lambda p: json.loads(Path(p).read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
reg = read(root / 'REGISTERED-METHOD.json')
result = read(root / 'results.json')
partial = read(root / 'partial.json')
assert read(root / 'complete.json')['complete']
assert sha(reg['control']) == reg['controlSha256']
for p, digest in reg['source'].items():
    assert sha(Path(reg['sourceRoot']) / p) == digest, p
for p, digest in reg['scripts'].items():
    assert sha(p) == digest, p
control = read(reg['control'])
assert control['count'] == 50 and control['offset'] == 0
assert result['rows'] == partial['rows']
assert len(result['rows']) == len(control['rows']) == 384
original = {row['key']: row for row in control['rows']}
cache = dict(partial['cache'])
assert len(cache) == len(partial['cache']) == result['uniqueForecasts']
assert result['forecastCombatSamples'] == len(cache) * 20
assert len({r['key'] for r in result['rows']}) == 384

def mean(xs):
    return sum(xs) / len(xs)

def ranks(xs):
    return [sum(x < v for x in xs) + (sum(x == v for x in xs) - 1) / 2 for v in xs]

def spearman(xs, ys):
    a, b = ranks(xs), ranks(ys)
    am, bm = mean(a), mean(b)
    den = math.sqrt(sum((x-am)**2 for x in a) * sum((y-bm)**2 for y in b))
    return sum((x-am)*(y-bm) for x,y in zip(a,b)) / den if den else None

cases = []
for row in result['rows']:
    old = original[row['key']]
    assert row['complete'] and row['chapter'] == old['chapter']
    assert row['controlOutcomes'] == old['outcomes']
    assert [x['seed'] for x in row['items']] == list(range(1,51))
    for item in row['items']:
        for side in ['none','all']:
            forecast = item[side]
            assert {k:v for k,v in forecast.items() if k != 'key'} == cache[forecast['key']]
            assert isinstance(forecast['wins'],int) and 0 <= forecast['wins'] <= 20
            assert forecast['band'] == ('Risky' if forecast['wins'] < 8 else 'Even' if forecast['wins'] < 15 else 'Favoured')
        assert item['predictedGainPp'] == 5 * (item['all']['wins'] - item['none']['wins'])
    # Each original digit encodes before*2 + after, in seed order.
    outcomes = [int(code) for code in old['outcomes']]
    assert len(outcomes) == 50 and all(0 <= code <= 3 for code in outcomes)
    expected = next(s for s in control['summaries'] if s['key'] == row['key'])
    assert expected['beforeWins'] == sum(code >= 2 for code in outcomes)
    assert expected['wins'] == sum(code % 2 for code in outcomes)
    assert expected['gainPp'] == 2 * (expected['wins'] - expected['beforeWins'])
    cases.append(dict(key=row['key'],chapter=row['chapter'],predictedGainPp=mean([x['predictedGainPp'] for x in row['items']]),
                      observedGainPp=expected['gainPp']))

chapters = []
for chapter in [1,2,3]:
    rows = [r for r in cases if r['chapter'] == chapter]
    x, y = [r['predictedGainPp'] for r in rows], [r['observedGainPp'] for r in rows]
    correlation = spearman(x,y)
    chapters.append(dict(chapter=chapter,cases=len(rows),spearman=correlation,
                         meanAbsoluteErrorPp=mean([abs(a-b) for a,b in zip(x,y)]),
                         oppositeSigns=sum(a*b < 0 for a,b in zip(x,y)),
                         predictedNegative=sum(a < 0 for a in x),observedNegative=sum(b < 0 for b in y),
                         predictedTies=sum(a == 0 for a in x),observedTies=sum(b == 0 for b in y),
                         screen='PASS' if correlation is not None and correlation >= .6 else 'MISS'))
receipt_paths = [root/'REGISTERED-METHOD.json', root/'results.json', root/'partial.json', reg['control']]
audit = dict(status='PASS: receipt consistency',screen='PASS' if all(c['screen']=='PASS' for c in chapters) else 'MISS',
             chapters=chapters,cases=cases,uniqueForecasts=len(cache),newAuditCombatSamples=0,
             receipts=[dict(path=str(p),sha256=sha(p)) for p in receipt_paths],
             limitations=['Forecast TRAIN1–20 overlaps outcome TRAIN1–50. This is not independent validation.',
                          'This contextual forecast does not calibrate the static utility display.',
                          'No acceptance seeds or production combat changes. No UI adoption is automatic.'])
(root/'audit.json').write_text(json.dumps(audit,indent=2)+'\n')
table='\n'.join(f"|{r['chapter']}|{r['spearman']:.3f}|{r['meanAbsoluteErrorPp']:.2f}|{r['oppositeSigns']}|{r['predictedNegative']} / {r['observedNegative']}|{r['screen']}|" for r in chapters)
(root/'RESULTS.md').write_text(f'''# Contextual equipment forecast40

All384 original fourth-slot cases and50 gear rolls per case are retained. Each full build uses the existing20-seed forecast against its chapter boss. {len(cache):,} unique forecasts were sampled once; the auditor repeats zero battles.

|Chapter|Spearman|Mean absolute error pp|Opposite signs|Negative predicted / observed|Screen ≥0.6|
|---|---:|---:|---:|---:|---|
{table}

Registered diagnostic screen: **{audit['screen']}**. The forecast samples overlap the outcome samples: this supports only TRAIN exploration, never acceptance or a calibrated probability claim. The existing static display gate remains open. Every negative prediction and outcome, including zero ties, is retained in audit.json and results.json.

No production score, budget, fixture, combat or acceptance seed is changed. A contextual UI still needs worker cancellation, transfer, cache, CSP and latency verification. FullTRAIN500 and fresh registered acceptance remain required for a calibrated score claim.
''')
print(json.dumps({k:v for k,v in audit.items() if k not in ['cases','receipts']}))
