# REFERENCE: A5 display-context40. Post-hoc TRAIN analysis; no new battles.
from pathlib import Path
import gzip
import hashlib
import json
import math

source = Path('reports/cardrpg-big/a5/b1/display-context-40')
out = Path('reports/cardrpg-big/a5/b1/display-split-48')
out.mkdir(exist_ok=True)
receipts = {}


def read(path):
    path = Path(path)
    data = path.read_bytes()
    receipts[str(path)] = hashlib.sha256(data).hexdigest()
    return json.loads(gzip.decompress(data) if path.suffix == '.gz' else data)


def mean(values):
    return sum(values) / len(values)


def ranks(values):
    return [sum(x < v for x in values) + (sum(x == v for x in values) - 1) / 2 for v in values]


def spearman(xs, ys):
    xs, ys = ranks(xs), ranks(ys)
    xm, ym = mean(xs), mean(ys)
    denominator = math.sqrt(sum((x-xm)**2 for x in xs) * sum((y-ym)**2 for y in ys))
    return sum((x-xm)*(y-ym) for x, y in zip(xs, ys)) / denominator if denominator else None


registration = read(source / 'REGISTERED-METHOD.json')
data = read(source / 'results.json.gz')
original_audit = read(source / 'audit.json')
control = read(registration['control'])
assert receipts[registration['control']] == registration['controlSha256']
assert control['count'] == 50 and control['offset'] == 0
assert len(data['rows']) == len(control['rows']) == 384
assert data['rows'] and len({row['key'] for row in data['rows']}) == 384
assert data['registrationSha256'] == hashlib.sha256(json.dumps(
    registration, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
for path, digest in registration['source'].items():
    assert hashlib.sha256((Path(registration['sourceRoot']) / path).read_bytes()).hexdigest() == digest, path

cases, full_cases, calibration = [], [], []
for row, old in zip(data['rows'], control['rows']):
    assert row['key'] == old['key'] and row['complete'] and old['complete']
    assert row['controlOutcomes'] == old['outcomes']
    assert [item['seed'] for item in row['items']] == list(range(1, 51))
    codes = list(map(int, old['outcomes']))
    assert len(codes) == 50 and all(code in range(4) for code in codes)
    assert old['digest'] == hashlib.sha256(json.dumps(old['outcomes']).encode()).hexdigest()
    gains = [(code % 2) - (code >= 2) for code in codes]
    for item in row['items']:
        assert item['predictedGainPp'] == 5 * (item['all']['wins'] - item['none']['wins'])
        for side in ['none', 'all']:
            wins = item[side]['wins']
            assert isinstance(wins, int) and 0 <= wins <= 20
            assert item[side]['band'] == ('Risky' if wins < 8 else 'Even' if wins < 15 else 'Favoured')
    full_cases.append(dict(key=row['key'], chapter=row['chapter'],
                           predictedGainPp=mean([i['predictedGainPp'] for i in row['items']]),
                           observedGainPp=100*mean(gains)))
    # Keep the exact same 30 gear rolls on both sides; only the combat seeds differ.
    items = row['items'][20:]
    cases.append(dict(key=row['key'], chapter=row['chapter'],
                      predictedGainPp=mean([i['predictedGainPp'] for i in items]),
                      observedGainPp=100*mean(gains[20:]),
                      improved=sum(code == 1 for code in codes[20:]),
                      worsened=sum(code == 2 for code in codes[20:])))
    for item, code in zip(items, codes[20:]):
        for side in ['none', 'all']:
            calibration.append(dict(key=row['key'], chapter=row['chapter'], gearSeed=item['seed'],
                                    outcomeSeed=item['seed'], forecastSeeds=[1, 20], side=side,
                                    band=item[side]['band'],
                                    won=code >= 2 if side == 'none' else code % 2 == 1))

chapters = []
for chapter in [1, 2, 3]:
    full = [row for row in full_cases if row['chapter'] == chapter]
    overlap = spearman([r['predictedGainPp'] for r in full], [r['observedGainPp'] for r in full])
    assert abs(overlap - original_audit['chapters'][chapter-1]['spearman']) < 1e-12
    rows = [row for row in cases if row['chapter'] == chapter]
    assert len(rows) == 128
    xs, ys = [r['predictedGainPp'] for r in rows], [r['observedGainPp'] for r in rows]
    bands = {}
    for band in ['Risky', 'Even', 'Favoured']:
        group = [r for r in calibration if r['chapter'] == chapter and r['band'] == band]
        bands[band] = dict(entries=len(group), wins=sum(r['won'] for r in group),
                           rate=mean([r['won'] for r in group]) if group else None)
    chapters.append(dict(chapter=chapter, cases=len(rows), overlappingSpearman=overlap,
                         disjointCombatSpearman=spearman(xs, ys),
                         meanAbsoluteErrorPp=mean([abs(x-y) for x, y in zip(xs, ys)]),
                         oppositeSigns=sum(x*y < 0 for x, y in zip(xs, ys)),
                         predictedNegative=sum(x < 0 for x in xs), observedNegative=sum(y < 0 for y in ys),
                         predictedTies=sum(x == 0 for x in xs), observedTies=sum(y == 0 for y in ys),
                         bands=bands))

audit = dict(status='PASS: original receipt reconstruction', analysis='Post-hoc TRAIN analysis',
             forecastCombatSeeds=[1, 20], comparisonCombatSeeds=[21, 50], gearSeeds=[21, 50],
             newCombatSamples=0, acceptanceSeedsUsed=False, chapters=chapters, cases=cases,
             receipts=receipts, limitations=[
                 'This split was selected after the original overlapping analysis; it is exploratory, not preregistered acceptance.',
                 'Only combat-seed ranges are disjoint. Builds, gear rolls, fixtures and previously inspected TRAIN outcomes are shared.',
                 'Thirty paired outcomes per case are noisy. Repeated bare builds and overlapping teams make aggregate entries dependent.',
                 'Band frequencies are descriptive counts, not calibrated player probabilities or a human playtest.',
                 'No static utility score, combat rule, fixture, numeric gate or UI is changed. Static display remains MISS.',
             ])
(out / 'audit.json').write_text(json.dumps(audit, indent=2) + '\n')
table = '\n'.join(f"|{r['chapter']}|{r['overlappingSpearman']:.3f}|{r['disjointCombatSpearman']:.3f}|{r['meanAbsoluteErrorPp']:.2f}|{r['oppositeSigns']}|" for r in chapters)
bands = '\n'.join(f"|{r['chapter']}|{band}|{v['wins']}/{v['entries']}|{100*v['rate']:.1f}%|"
                  for r in chapters for band, v in r['bands'].items() if v['entries'])
(out / 'RESULTS.md').write_text(f'''# Contextual forecast: separate TRAIN combat seeds

This post-hoc analysis reconstructs the original 384 cases without running new battles. It first reproduces every chapter correlation from diagnostic40. For each case, it then compares the existing forecasts on combat seeds1–20 with the actual paired outcomes on seeds21–50, using the same30 gear rolls. No case or negative pair is dropped.

|Chapter|Original overlapping Spearman|Separate combat-seed Spearman|Mean absolute error pp|Opposite signs|
|---|---:|---:|---:|---:|
{table}

|Chapter|Forecast band|Won / entries|Observed frequency|
|---|---|---:|---:|
{bands}

The band counts pool dependent build/seed entries and are not player probabilities. The split was chosen after the original analysis; all samples remain previously inspected TRAIN data. It supplies no fresh acceptance evidence and does not close the static utility display gate. Fresh20001–20500 remains unused. Source, fixture, score and UI are unchanged.

[Full cases, limitations and input hashes](audit.json) · [Original overlapping analysis](../display-context-40/RESULTS.md).
''')
print(json.dumps(dict(newCombatSamples=0, chapters=chapters)))
