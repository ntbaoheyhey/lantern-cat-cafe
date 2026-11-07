# REFERENCE: GAMEPLAY-V4 section9. Read retained samples; never resample or retune.
from pathlib import Path
from collections import Counter
import hashlib,json
root=Path(__file__).resolve().parents[2];base=root/'reports/cardrpg-big/a4/p6'
samples=[]
for sample in ['train','heldout']:
 path=base/sample/'results.json';raw=path.read_bytes();data=json.loads(raw)
 pieces=[row for row in data['summaries'] if row['kind'] in ['pieces','pieces-equipped']]
 assert len(pieces)==2688 and all(row['n']==500 for row in pieces)
 misses=sorted((row for row in pieces if row['gainPp']>12),key=lambda row:(-row['gainPp'],row['key']))
 samples.append({'sample':sample,'path':str(path.relative_to(root)),'sha256':hashlib.sha256(raw).hexdigest(),
  'cells':len(pieces),'over12pp':len(misses),'bareBothLose':sum(row['beforeWins']==0 and row['wins']==0 for row in pieces if row['kind']=='pieces'),
  'missesByKind':dict(Counter(row['kind'] for row in misses)),
  'missesBySet':dict(Counter(row['templateId'].split('-')[0] for row in misses)),
  'missesByCarrier':dict(Counter(row['cardId'] for row in misses)),
  'misses':[dict((key,row[key]) for key in ['key','templateId','cardId','chapter','level','beforeWins','wins','gainPp','maxShare']) for row in misses]})
result={'method':'Read-only residual map from the complete registered train and heldout receipts. Threshold >12 percentage points exactly matches acceptance. Counts describe sampled cells, not item prevalence among real players. No new seeds, battles or gameplay edits.','samples':samples}
(base/'residual-map.json').write_text(json.dumps(result,indent=2)+'\n')
lines=['# P6 residual map','',result['method'],'',
 '| Sample | Single-piece cells above12pp /2688 | Bare-build cells where both lose /2304 |',
 '|---|---|---|',*[f"|{s['sample']}|{s['over12pp']}|{s['bareBothLose']}|" for s in samples],
 '', 'The all-loss bare-build cells cannot establish that an item is harmless. The coherent-kit extension supplies an informative comparison by adding the fourth slot to an existing three-piece set.',
 '', '## Recorded heldout outliers',
 '| Piece | Carrier / chapter | Wins before → after /500 | Paired gain | Maximum displayed share |', '|---|---|---|---|---|']
for r in samples[1]['misses']:
 lines.append(f"|{r['templateId']}|{r['cardId']} / {r['chapter']}|{r['beforeWins']} → {r['wins']}|{r['gainPp']:.1f}pp|{r['maxShare']*100:.3f}%|")
lines += ['', '## What this establishes',
 '- All31 heldout outliers occur in the registered fourth-slot comparison: Hearthloom12, Bellsteel12, Crumbweave6 and Emberfelt1. They affect Mochi24cases and Soot7cases. These are sampled cells, not31 distinct items or a player incidence rate.',
 '- Filling the missing slot changes the main stat, rolled affixes, any unique behavior and the four-piece set threshold together. The paired result establishes their combined effect; it does not isolate which component caused the gain.',
 '- Hearthloom links an ally on Defend; Bellsteel grants Riposte and Shelter; Crumbweave adds detonation shield; Emberfelt adds first-Scald healing. These interactions are implemented in equipment-v4.ts and battle.ts. A small additive display estimate does not bound the effect of survival thresholds or automatic target choices.',
 '- Two heldout cells tie at93.4pp: Hearthloom Legendary charm11→478wins and Bellsteel Legendary charm30→497wins. Their maximum displayed contributions are about3%, which is a clear calibration failure despite meeting the separate10% display-share limit.',
 '', '## Next tuning experiment, not executed here',
 'On training fixtures, separate main-stat/affix/unique changes from the set-threshold change and inspect the first divergent automatic decision. Compare event counts and survival across the whole paired sample before attributing causality. The previous bounded-defense pilot had384 identical outcome digests; its non-improvement remains evidence against repeating that exact patch.',
 'Because heldout results are now visible, any tuning informed by this map must be labelled heldout-informed. Register a new, explicitly named unused seed block before the next acceptance sample, as GAMEPLAY-V4 section9 requires. Do not reroll10001–10500 or promote these residuals as a passing balance result.',
 '', 'Raw source paths and SHA-256 digests: [residual-map.json](p6/residual-map.json). Full acceptance and utility diagnostics: [P6 balance](P6-BALANCE.md). Reproduce this read-only map with `python3 tools/cardrpg-big/a4-p6-residuals.py`.']
(root/'reports/cardrpg-big/a4/P6-RESIDUALS.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'samples':[{k:s[k] for k in ['sample','cells','over12pp','bareBothLose']} for s in samples],'reportLines':len(lines)}))
