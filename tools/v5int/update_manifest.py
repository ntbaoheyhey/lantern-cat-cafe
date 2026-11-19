import json

with open('/Users/bao/th-v5-ag4/apps/web/public/audio/v5/manifest.json', 'r') as f:
    data = json.load(f)

# Update music.battle
if 'music.battle' in data:
    data['music.battle']['opus'] = '/audio/v9/battle-v9.opus'
    data['music.battle']['m4a'] = '/audio/v9/battle-v9.m4a'
    data['music.battle']['durationSeconds'] = 60

# Update ambience.battle.bed (aliased to music.battle)
if 'ambience.battle.bed' in data:
    data['ambience.battle.bed']['opus'] = '/audio/v9/battle-v9.opus'
    data['ambience.battle.bed']['m4a'] = '/audio/v9/battle-v9.m4a'
    data['ambience.battle.bed']['durationSeconds'] = 60

# Add music.boss
data['music.boss'] = {
    'opus': '/audio/v9/boss-v9.opus',
    'm4a': '/audio/v9/boss-v9.m4a',
    'durationSeconds': 60,
    'gainDb': 0,
    'bus': 'music',
    'runtimeCueId': 'music.boss',
    'loop': True,
    'aliases': ['bgm.boss']
}

with open('/Users/bao/th-v5-ag4/apps/web/public/audio/v5/manifest.json', 'w') as f:
    json.dump(data, f, indent=2)
