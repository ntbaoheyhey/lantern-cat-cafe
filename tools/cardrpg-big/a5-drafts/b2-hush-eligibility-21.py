"""Register resolver-site suppression attribution before any phase/cap/death probe."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

repo = Path.cwd()
out = repo/'reports/cardrpg-big/a5/b2/hush-eligibility-21'
source = Path('/tmp/cardrpg-a5-hush-eligibility-21/source')
assert not out.exists() and not source.exists()
parent_path = 'reports/cardrpg-big/a5/b2/suppression-current-16/REGISTERED-METHOD.json'
parent = json.loads((repo/parent_path).read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
out.mkdir(parents=True)
hashes = {}
for path, expected in parent['source'].items():
    data = (Path(parent['sourceRoot'])/path).read_bytes()
    assert sha(data) == expected, path
    if path.endswith('/depth/battle.ts'):
        text = data.decode()
        old = """  if(b.v4 && (impaired || quiet&&['heal','shield','summon','bind','banquet'].includes(spec.mechanic))) {
    record(b,actor,actor,'suppressed',1,'Control suppressed enemy utility');
    const controller=b.actors.find(a=>a.id===actor.statuses.find(s=>s.id===(impaired?'drowsy':'hush'))?.source);
    if(controller?.bonuses.crewSuppress&&!controller.bonuses.crewSuppressed){controller.bonuses.crewSuppressed=1;heal(b,controller,controller,controller.bonuses.crewSuppress);}
  }
"""
        new = """  const creditSuppression = () => {
    record(b,actor,actor,'suppressed',1,impaired?'Control softened enemy action':'Hush stopped enemy utility');
    const controller=b.actors.find(a=>a.id===actor.statuses.find(s=>s.id===(impaired?'drowsy':'hush'))?.source);
    if(controller?.bonuses.crewSuppress&&!controller.bonuses.crewSuppressed){controller.bonuses.crewSuppressed=1;heal(b,controller,controller,controller.bonuses.crewSuppress);}
  };
  if(b.v4&&impaired) creditSuppression();
"""
        assert text.count(old) == 1
        text = text.replace(old, new)
        needle = '    // Suppression spends the committed utility turn; it does not replace it with a hit.\n'
        assert text.count(needle) == 1
        text = text.replace(needle, needle + '    creditSuppression();\n')
        old = "    if ((!b.v4||actor.hp>0)&&signature&&!quiet&&(spec.mechanic==='summon'||spec.mechanic==='banquet'&&actor.phase===2||spec.mechanic==='bind')) spawnThread(b,actor);"
        new = """    if ((!b.v4||actor.hp>0)&&signature&&(spec.mechanic==='summon'||spec.mechanic==='banquet'&&actor.phase===2||spec.mechanic==='bind')) {
      if(!quiet) spawnThread(b,actor);
      else if(b.v4&&living(b,'enemy').filter(a=>a.catalogId==='binding-thread').length<2) creditSuppression();
    }"""
        assert text.count(old) == 1
        data = text.replace(old, new).encode()
    elif path.endswith('/depth/events-v4.ts'):
        text = data.decode()
        needle = 'enemy utility actions.'
        assert text.count(needle) == 1
        data = text.replace(needle, 'enemy actions.').encode()
    for base in [source, out/'source-snapshot']:
        dest = base/path; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
    hashes[path] = sha(data)
method = {
    'registeredAt': datetime.now(timezone.utc).isoformat(), 'parent': parent_path,
    'sourceRoot': str(source), 'source': hashes,
    'hypothesis': 'Signature-only Hush attribution still credits phase-one Pantry, already-full summon slots, and a summoner killed by retaliation. Credit the resolver site which actually skips utility.',
    'candidate': 'Drowsy credits actual softened attacks; Hush credits skipped heal/shield or a live eligible summon with a free slot, at its resolution point. No timing, quantity, AI or stats change to the underlying enemy actions. The crew heal consequently follows actual summon suppression.',
    'cases': 'Original60 plus Pantryphase1(12), three summoners at two-thread cap(36), three summoners killed by Riposte(36); total144 controlled seed5 cases. Each crosses bothmodes, basic/signature, none/Hush/Drowsy.',
    'comparators': ['current16', 'signature19', 'eligibility21'],
    'scope': 'Prospective semantic extension, TRAIN only. Original19/20 files remain unchanged;20 wider matrix is not started because its candidate is incomplete.',
    'acceptance': '20001–20500 remains unused. No numeric gate or fixture change.',
}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(method, indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# Hush eligibility21 — resolver-site attribution

Before running any new fixture, extend the signature19 probe to phase-one Pantry, two occupied summon slots, and fatal Riposte. A condition on the intended signature alone cannot establish that a summon would execute. Preserve current16, signature19 and candidate21 observations on identical controlled seed5 inputs, both modes and none/Hush/Drowsy. There are 144 rows per source.

The candidate credits Hush only at the actual skipped utility branch. Drowsy still credits its softened attack. Summon credit follows the attack and therefore respects current phase, summon capacity and a summoner killed by retaliation. Crew healing moves with that credit; this is a gameplay change, not just copy. OFF, attack branches, utility quantities, skills, AI and equipment are unchanged. Result copy refers to enemy actions because Drowsy can soften basic attacks too.

Signature20's registered wider matrix remains unstarted and is not silently rewritten. A passing focused probe does not establish balance or earned progression. Register a new composition extension before broader simulation or adoption. No acceptance seeds or model requests.
''')
print(out)
