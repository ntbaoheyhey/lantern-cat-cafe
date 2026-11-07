from pathlib import Path
import shutil
base=Path('/tmp/cardrpg-a4-p6');source=base/'tuning2-preview';target=base/'bounded-preview'
assert not target.exists()
shutil.copytree(source,target)
p=target/'packages/game-rules/src/cardrpg/depth/battle.ts';s=p.read_text()
replacements={
"if(hasEffect(actor,'defend-link')){":"if(hasEffect(actor,'defend-link')&&(!b.v4||!actor.bonuses.defendLinkUsed)){if(b.v4)actor.bonuses.defendLinkUsed=1;",
"if(hasEffect(actor,'defend-riposte')){":"if(hasEffect(actor,'defend-riposte')&&(!b.v4||!actor.bonuses.defendRiposteUsed)){if(b.v4)actor.bonuses.defendRiposteUsed=1;",
"if(hasEffect(actor,'unique:panlid'))applyStatus(b,actor,actor,'riposte',b.v4?1:2);":"if(hasEffect(actor,'unique:panlid')&&(!b.v4||!actor.bonuses.panlidUsed)){if(b.v4)actor.bonuses.panlidUsed=1;applyStatus(b,actor,actor,'riposte',b.v4?1:2);}",
"if(hasEffect(actor,'unique:doorstop'))gearGrant(b,actor,actor,'unique:doorstop','heal',b.v4?8:25);":"if(hasEffect(actor,'unique:doorstop')&&(!b.v4||!actor.bonuses.doorstopUsed)){if(b.v4)actor.bonuses.doorstopUsed=1;gearGrant(b,actor,actor,'unique:doorstop','heal',b.v4?8:25);}",
"if(actor.bonuses.setDetonateTurn!==actor.turns){actor.bonuses.setDetonateTurn=actor.turns;":"if(!actor.bonuses.setDetonateUsed){actor.bonuses.setDetonateUsed=1;",
"(!b.v4||actor.bonuses.bookTurn!==actor.turns)){if(b.v4)actor.bonuses.bookTurn=actor.turns;":"(!b.v4||!actor.bonuses.bookUsed)){if(b.v4)actor.bonuses.bookUsed=1;",
}
for a,b in replacements.items():assert s.count(a)==1,a;s=s.replace(a,b)
p.write_text(s)
p=target/'packages/game-rules/src/cardrpg/depth/equipment-v4.ts';s=p.read_text()
for a,b in {
"Defend links a weak ally; 15% of HP damage is shared.":"Your first Defend each encounter links a weak ally; 15% of HP damage is shared.",
"Detonation grants 8 shield once per own turn.":"Your first detonation each encounter grants 8 shield.",
"Defend grants one Riposte and Shelter.":"Your first Defend each encounter grants one Riposte and Shelter.",
"Defend restores 8 missing HP.":"Your first Defend each encounter restores 8 missing HP.",
"Detonation grants 10 shield once per turn.":"Your first detonation each encounter grants 10 shield.",
"Defend grants one Riposte stack.":"Your first Defend each encounter grants one Riposte stack.",
}.items():assert s.count(a)==1,a;s=s.replace(a,b)
p.write_text(s)
script=(base/'equipped-tuning2.mjs').read_text().replace('equipped-tuning2','equipped-bounded').replace('tuning2-preview','bounded-preview')
(base/'equipped-bounded.mjs').write_text(script)
print('Staged bounded defense candidate; no checkout source changed.')
