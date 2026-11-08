from pathlib import Path
import json, hashlib

root = Path('/Users/bao/taskbar-hero-cardrpg-a4')
out = Path('/tmp/cardrpg-a5-c1-revision')
out.mkdir(exist_ok=True)
files = ['apps/web/src/game/cardrpg/depth/Equipment.tsx', 'apps/web/src/game/cardrpg/depth/EquipmentV4.tsx', 'apps/web/src/game/cardrpg/depth/Encounter.tsx']
inputs = {f: hashlib.sha256((root / f).read_bytes()).hexdigest() for f in files}
source = {f: (root / f).read_text() for f in files}
f = files[0]
s = source[f]
start = s.index('  const item = state.gear.find(')
end = s.index('  const act = ', start)
variables = s[start:end]
s = s[:start] + s[end:]
needle = '  return <>\n    <PageTitle'
assert s.count(needle) == 1
variables = variables.replace('  const item = state.gear.find(gear => gear.id === m.itemId) ?? state.gear[0];', '  const visibleGear = v4 ? gear : state.gear;\n  const item = visibleGear.find(piece => piece.id === m.itemId) ?? visibleGear[0];')
s = s.replace(needle, variables + needle)
s = s.replace('<ShiftLoadouts m={m}/>', '<details className="cr-panel dp-v4-saved-shifts"><summary>Saved crews and gear</summary><ShiftLoadouts m={m}/></details>')
source[f] = s

f = files[1]
s = source[f].replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { gearComparison } from './meta-presentation';")
old = ''' const result=R.comparisonV4(state,cardId,instanceId);if(!result)return null;
 return <div className="dp-v4-utility"><h3>What this changes</h3><p>Approximate build score: {result.before.total.toFixed(1)} → {result.after.total.toFixed(1)}. Core {result.after.core.toFixed(1)} + utility {result.after.utility.toFixed(1)}.</p>
 <p>Crew score: {result.teamBefore.toFixed(1)} → {result.teamAfter.toFixed(1)} · piece contribution {(result.share*100).toFixed(1)}%.</p>'''
new = ''' const result=R.comparisonV4(state,cardId,instanceId);if(!result)return null;
 const delta=gearComparison(state,cardId,instanceId).delta;
 const changes=delta?([['hp','HP'],['attack','attack'],['defense','defense']] as const)
   .filter(([key])=>delta[key]!==0).map(([key,label])=>`${delta[key]>0?'+':''}${delta[key]} ${label}`):[];
 return <div className="dp-v4-utility"><h3>What this changes</h3>
 {changes.length>0&&<p>{R.CAT_BY_ID[cardId]!.name}: {changes.join(' · ')}.</p>}
 <p>Build estimate: {result.before.total.toFixed(1)} → {result.after.total.toFixed(1)}.</p>'''
assert old in s
s = s.replace(old,new)
s = s.replace('<details><summary>How the estimate works</summary><p>', '<details><summary>How the estimate works</summary><p>Crew score: {result.teamBefore.toFixed(1)} → {result.teamAfter.toFixed(1)}. Piece share: {(result.share*100).toFixed(1)}%.</p><p>Core {result.after.core.toFixed(1)} + utility {result.after.utility.toFixed(1)}.</p><p>')
s = s.replace('Consumed when Fight commits.', 'Used when the fight begins.')
source[f] = s

f = files[2]
s = source[f].replace("import { useEffect, useState } from 'react';", "import { useEffect, useState, type ReactNode } from 'react';")
anchor = 'export function Prepare({ m }: { m: DepthModel }) {'
s = s.replace(anchor, '''function CrewDetails({ v4, children }: { v4: boolean; children: ReactNode }) {
  return v4 ? <details className="cr-panel dp-v4-crew-details"><summary>Equipped gear and skills</summary>{children}</details> : <>{children}</>;
}

''' + anchor)
needle = '    <div className="dp-three">{battle.actors.filter(actor => actor.side === \'party\').map(actor =>'
assert s.count(needle) == 1
s = s.replace(needle, '    <CrewDetails v4={!!battle.v4}>\n' + needle)
needle = '    </section>)}</div>\n    <section className="cr-panel dp-opponents">'
assert s.count(needle) == 1
s = s.replace(needle, '    </section>)}</div></CrewDetails>\n    <section className="cr-panel dp-opponents">')
source[f] = s
for f, body in source.items():
    path = out / 'source' / f
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body)
(out / 'inputs.json').write_text(json.dumps(inputs, indent=2))
(out / 'REVIEW.md').write_text('''# C1 source review revision, staged only

Original1280 captures pass interactions and contrast but reveal an equipment selection mismatch: filtering Outfit leaves an invisible weapon selected for the primary Equip action. V4 now derives selection from the visible list and shows no action for an empty result. OFF selection stays unchanged.

Saved loadouts and detailed preparation gear are secondary information behind explicit expandable headings. Formation, plan, enemy traits and the primary action remain available. Comparison names the selected cat and exact changed HP/attack/defense, retaining utility methodology and crew-share numbers in its explanation. No survival-hit claim is invented without a measured combat preview.

Original C1 gate/browser processes keep their exact source inputs. This overlay must be checked, adopted and revalidated after their completion. Original results are retained. The original visible-word counter may include closed-details layout boxes; remeasure both A4 and C1 with an explicit closed-ancestor exclusion before reporting a reduction. This is a metric correction, not a new engagement run.
''')
print('Prepared C1 review revision; no production files changed.')
