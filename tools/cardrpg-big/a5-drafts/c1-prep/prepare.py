"""Draft A-owned C1 changes without modifying the live H0 checkout.
Adoption must validate the input digests and run the full C1 gates/UI checks.
"""
from pathlib import Path
import hashlib, json

root = Path('/Users/bao/taskbar-hero-cardrpg-a4')
out = Path('/tmp/cardrpg-a5-c1-prep')
files = {}
def read(path):
    text = (root / path).read_text()
    files[path] = hashlib.sha256(text.encode()).hexdigest()
    return text
def replace(text, old, new):
    assert text.count(old) == 1, (old, text.count(old))
    return text.replace(old, new)
def save(path, text):
    target = out / 'source' / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)

base = 'apps/web/src/game/cardrpg/depth/'
p = base + 'App.tsx'
s = read(p)
s = 'import { showReviewTools } from "./player-mode";\n' + s
s = replace(s, '  const app = useRef<HTMLDivElement>(null);', '  const reviewTools = showReviewTools(activeGameplayV4(m.state));\n  const app = useRef<HTMLDivElement>(null);')
s = replace(s, '<div ref={app} data-look-v2=', '<div ref={app} data-player-v4={activeGameplayV4(m.state) && !reviewTools} data-look-v2=')
s = replace(s, "navigation.filter(([id])=>id!=='journal'||activeGameplayV4(m.state))", "navigation.filter(([id])=>(id!=='journal'||activeGameplayV4(m.state))&&(id!=='evidence'||reviewTools))")
s = replace(s, '{offline && <FeelLab', '{offline && reviewTools && <FeelLab')
s = replace(s, '{offline && m.labPerformance &&', '{offline && reviewTools && m.labPerformance &&')
save(p,s)

p = 'tools/cardrpg-big/offline.tsx'
s = read(p)
s = 'import { showReviewTools } from "../../apps/web/src/game/cardrpg/depth/player-mode";\n' + s
s = replace(s, '  const lookV2 = useSyncExternalStore', "  const reviewTools = showReviewTools(typeof __GAMEPLAY_V4__ !== 'undefined' && __GAMEPLAY_V4__);\n  const lookV2 = useSyncExternalStore")
s = replace(s, '{header && createPortal', '{reviewTools && header && createPortal')
save(p,s)

p = base + 'RunMap.tsx'
s = 'import { showReviewTools } from "./player-mode";\n' + read(p)
s = replace(s, '`${run.mode} · floor ${run.floor} · seed ${run.seed}`', '`${run.mode} · floor ${run.floor}${showReviewTools(!!run.gameplayV4) ? ` · seed ${run.seed}` : ""}`')
s = replace(s, "'Your capped partial rewards and earned gear are already in your account.'", "(run.gameplayV4 ? 'Your rewards are safe. Bring a fresh plan next time.' : 'Your capped partial rewards and earned gear are already in your account.')")
s = replace(s, "'Increase this skill’s effect power by 12% for this run. Up to three upgrades.'", "'Strengthen this skill by 12% tonight. Up to three upgrades.'")
# Mode-aware descriptions prevent removed mechanics resurfacing through existing charms.
s = s.replace('R.BOON_BY_ID[id]!.description', 'R.boonForMode(id, !!run.gameplayV4).description')
save(p,s)

p = base + 'Encounter.tsx'
s = 'import { showReviewTools } from "./player-mode";\n' + read(p)
s = replace(s, "`${m.replay ? 'Replay' : 'Encounter'} · ${battle.round} rounds · seed ${battle.seed}`", "`${m.replay ? 'Replay' : 'Encounter'} · ${battle.round} rounds${showReviewTools(!!battle.v4) ? ` · seed ${battle.seed}` : ''}`")
s = replace(s, 'Your companions choose their actions. Watch, then improve your team.', "{battle.v4 ? 'Pick your plan. Your cats take it from here.' : 'Your companions choose their actions. Watch, then improve your team.'}")
s = replace(s, "{prediction ? `${prediction.wins}/5 simulated wins` : 'Trying five seeded fights for this team'}", "{battle.v4 ? (prediction ? 'Rough forecast · your current crew' : 'Reading the matchup…') : prediction ? `${prediction.wins}/5 simulated wins` : 'Trying five seeded fights for this team'}")
s = replace(s, '<p>Enemy health and attack are fixed for this route band. Your equipment never raises enemy stats. Lower completed bands remain available for easier routes.</p>', '<p>Each band has fixed enemies. Choose a lower completed band for a gentler route.</p>')
s = replace(s, '<p>The boss changes its signature at half health. Defeating it retires its linked helpers together; there is no helpers-only cleanup.</p>', '<p>At half health, the boss changes tactics. Defeat the boss and its helpers leave.</p>')
save(p,s)

p = base + 'Equipment.tsx'
s = 'import { EquipmentFiltersV4 } from "./EquipmentFiltersV4";\n' + read(p)
s = replace(s, '<p>All equipment is account-bound. At 240 pieces, further route drops become salvage threads within the daily reward cap. Voluntary acquisitions require room for the entire batch.</p><details><summary>Rarity and sources</summary>', '<p>Choose a cat, compare a piece, then make it theirs.</p><details><summary>Odds and rules</summary><p>Equipment stays with your account. Your shelf holds 240 pieces.</p><p>At capacity, route drops become threads within today’s cap. Leave room before buying a basket.</p>')
start=s.index('      <div className="cr-filter">')
end=s.index('      {locked &&',start)
old=s[start:end]
s=s[:start]+'''      {v4 ? <EquipmentFiltersV4 state={state} cardId={cardId} slot={slot} rarity={rarity} setId={setId} ownership={ownership} sort={sort}
        chooseCat={id => { m.cardId=id; m.notify(false); }} chooseSlot={setSlot} chooseRarity={setRarity}
        chooseSet={setSetId} chooseOwnership={setOwnership} chooseSort={setSort} /> : <>
'''+old+'''      </>}
'''+s[end:]
save(p,s)

p = base + 'EquipmentV4.tsx'
s=read(p)
s=replace(s, '<p>Save three crews with their rows, standing plan and equipment. Saving and applying are free.</p>', '<p>Keep three favourite crews ready. Their gear, rows and plans come along.</p>')
s=replace(s, '<p>{result.gained.length?`Gains: ${result.gained.map(R.effectTextV4).join(\' \')}`:\'No new set threshold or unique effect.\'}</p>', '''{result.gained.map(effect => {
   const set=R.SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect);
   return <p key={effect}>{set&&<b>Set bonus: activates {set.fourEffect===effect?'4':'2'}-piece {set.name}. </b>}{R.effectTextV4(effect)}</p>;
 })}
 {!result.gained.length&&<p>No new set bonus.</p>}''')
s=replace(s, '<p>One packed effect for the next encounter. Replacing it returns the previous unspent supply. No pantry actions during a fight.</p>', '<p>Pack one treat before your next fight. Change your mind and the unused treat returns.</p>')
save(p,s)

# New files and A-owned CSS are staged only in this temporary directory.
for name in ['PreparationV4.tsx','EquipmentFiltersV4.tsx','player-mode.ts','player-mode.test.ts']:
    if (root/base/name).exists(): read(base+name)
    else: files[base+name] = None
    save(base+name,(out/name).read_text())
p=base+'depth.css'
s=read(p)+'\n'+(out/'player-meta.css').read_text()+'''\n.dp-v4-filter { border: 0; margin: 12px 0; padding: 0; min-width: 0; }
.dp-v4-filter legend { font-weight: 600; margin-bottom: 6px; }
.dp-v4-filter button[aria-pressed="true"] { outline: 2px solid currentColor; outline-offset: 2px; }
.dp-v4-filters .cr-actions { flex-wrap: wrap; }
'''
save(p,s)
(out/'inputs.json').write_text(json.dumps(files,indent=2))
print(json.dumps({'draftFiles':len(files),'runtimeApplied':False,'sourceRoot':str(out/'source')}))
