"""Stage concise companion jobs without changing the source under validation."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

repo = Path.cwd()
out = Path('/tmp/cardrpg-a5-specialties-18')
assert not out.exists(), 'Do not overwrite a reviewed or staged candidate'
jobs = {
    'mochi': 'Shielding the crew against front-row pressure.',
    'soot': 'Detonating stacked Crumb trails.',
    'clover': 'Cleansing Scald and healing over time.',
    'panko': 'Returning damage when enemies hit the front row.',
    'mallow': 'Burning several foes through their shields.',
    'sorrel': 'Weakening rear attackers and sharing spare shields.',
    'biscuit': 'Finishing wounded foes through row cover.',
    'inkcap': 'Quieting healers and tangling dangerous targets.',
    'cinnamon': 'Rescuing a hurt ally with healing and Cozy.',
    'brioche': 'Building shields and lending them to an ally.',
    'velvet': 'Marking rear targets so the whole crew can reach them.',
    'marigold': 'Keeping several allies healthy over long fights.',
}
assert all(len(text.split()) <= 18 for text in jobs.values())
sha = lambda data: hashlib.sha256(data).hexdigest()
paths = [
    'packages/game-rules/src/cardrpg/depth/gameplay-v4.ts',
    'apps/web/src/game/cardrpg/depth/TeamCollection.tsx',
    'apps/web/src/game/cardrpg/depth/PreparationV4.tsx',
]
inputs = {path: sha((repo/path).read_bytes()) for path in paths}
sources = {path: (repo/path).read_text() for path in paths}
sources[paths[0]] += '''
/** A short description of each kit's job, not a promised win or a power ranking. */
export const CAT_SPECIALTIES_V4: Readonly<Record<string, string>> = ''' + json.dumps(jobs, indent=2) + ';\n'
needle = '<h3>{R.CAT_BY_ID[id]!.name}</h3><p>{v4 ? R.passiveDescriptionV4(id) : R.CAT_BY_ID[id]!.passive.description}</p>'
assert sources[paths[1]].count(needle) == 1
sources[paths[1]] = sources[paths[1]].replace(needle,
    '<h3>{R.CAT_BY_ID[id]!.name}</h3>{v4 && <p><b>Best at:</b> {R.CAT_SPECIALTIES_V4[id]}</p>}<p>{v4 ? R.passiveDescriptionV4(id) : R.CAT_BY_ID[id]!.passive.description}</p>')
needle = '''        {owned ? <>
          <p>Level {owned.level}'''
assert sources[paths[1]].count(needle) == 1
sources[paths[1]] = sources[paths[1]].replace(needle,
    '''        {v4 && <p data-companion-specialty={cat.id}><b>Best at:</b> {R.CAT_SPECIALTIES_V4[cat.id]}</p>}
        {owned ? <>
          <p>Level {owned.level}''')
needle = '<p aria-live="polite">{name} selected. Keep at least one cat in front.</p>'
assert sources[paths[2]].count(needle) == 1
sources[paths[2]] = sources[paths[2]].replace(needle,
    '''<p aria-live="polite">{name} selected. Keep at least one cat in front.</p>
      <p data-companion-specialty={selected}><b>Best at:</b> {R.CAT_SPECIALTIES_V4[selected]}</p>''')
for path, text in sources.items():
    dest = out/'source'/path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text)
(out/'manifest.json').write_text(json.dumps({
    'preparedAt': datetime.now(timezone.utc).isoformat(), 'inputs': inputs,
    'outputs': {path: sha(text.encode()) for path, text in sources.items()},
    'status': 'STAGED ONLY. Source suites still use the unchanged Hush-only source.',
    'purpose': 'Expose each cat kit job on Collection, Team and selected Prepare card; V4 only.',
    'limits': 'Capability descriptions, not measured best-team rankings. No battle/AI/power/state/asset change.',
    'adoptionChecks': ['input hashes before adoption', 'every named job supported by kit',
        'V4/OFF browser visibility', 'select different cat', '1280/1440/1024 overflow/contrast',
        'source gates and unchanged combat digest'],
}, indent=2))
print(out)
