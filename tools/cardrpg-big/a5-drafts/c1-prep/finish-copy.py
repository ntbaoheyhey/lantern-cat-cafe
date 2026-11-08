"""Extend the isolated C1 draft. H0 source and its running browser remain untouched."""
from pathlib import Path
import hashlib, json

root = Path('/Users/bao/taskbar-hero-cardrpg-a4')
out = Path('/tmp/cardrpg-a5-c1-prep')
base = 'apps/web/src/game/cardrpg/depth/'
inputs = json.loads((out/'inputs.json').read_text())
def read(name):
    path = base+name
    inputs.setdefault(path, hashlib.sha256((root/path).read_bytes()).hexdigest())
    staged = out/'source'/path
    return staged.read_text() if staged.exists() else (root/path).read_text()
def save(name, text):
    (out/'source'/base/name).write_text(text)
def change(text, old, new):
    assert text.count(old) == 1, (old, text.count(old))
    return text.replace(old,new)

s=read('Invitations.tsx')
s=change(s, "import { useEffect, useRef, useState } from 'react';", "import { useEffect, useRef, useState, type ReactNode } from 'react';")
s=change(s, "type RevealPhase =", "function InvitationRules({ v4, children }: { v4: boolean; children: ReactNode }) {\n  return v4 ? <details className=\"dp-player-odds\"><summary>Odds and rules</summary>{children}</details> : <>{children}</>;\n}\n\ntype RevealPhase =")
s=change(s, "if (!m.apply(result, 'Invitations opened. Every result is saved in your account history.')) return;", "if (!m.apply(result, m.state.gameplayV4 ? 'Your invitations are here. Find them in your history.' : 'Invitations opened. Every result is saved in your account history.')) return;")
s=change(s, '<div className="dp-fairness-odds"><span>Base odds</span>', '{!m.state.gameplayV4 && <div className="dp-fairness-odds"><span>Base odds</span>')
s=change(s, '<span key={rarity}>{rarity} {value / 100}%</span>)}</div>', '<span key={rarity}>{rarity} {value / 100}%</span>)}</div>}')
s=change(s, '<p>Uncollected rewards are preferred within the rolled rarity and featured partition. Each draw commits before the skippable reveal.</p>', "{!m.state.gameplayV4 && <p>Uncollected rewards are preferred within the rolled rarity and featured partition. Each draw commits before the skippable reveal.</p>}")
s=change(s, '<p>{banner.description} Earn stamps from cafe service, routes and quests.</p>', "<p>{m.state.gameplayV4 ? 'Your cafe shifts, routes and board earn the stamps for every invitation.' : `${banner.description} Earn stamps from cafe service, routes and quests.`}</p>")
s=change(s, '<div className="dp-pity"><strong>Legendary pity progress</strong>', '<InvitationRules v4={!!m.state.gameplayV4}>\n        {m.state.gameplayV4 && <><p>{banner.description}</p><p>New discoveries come first within your rolled rarity and featured group.</p><p>Skipping the reveal keeps the same saved reward. Invitations use earned stamps only.</p><p>Each banner tracks its own pity. You can open up to 30 invitations daily.</p></>}\n        <div className="dp-pity"><strong>Legendary pity progress</strong>')
s=change(s, '        </details>\n      </section>\n      <section ref={stage}', '        </details>\n        </InvitationRules>\n      </section>\n      <section ref={stage}')
s=change(s, '<details className="dp-exact-odds"><summary>Exact next-pull probabilities</summary>', '<details className="dp-exact-odds" open={m.state.gameplayV4 || undefined}><summary>Exact next-pull probabilities</summary>')
s=change(s, '<h2>Your invitations</h2><p>Every result is account-bound. Duplicate companions grant matching shards.</p>', "<h2>Your invitations</h2><p>{m.state.gameplayV4 ? 'Yours to keep. Familiar faces bring shards to help them grow.' : 'Every result is account-bound. Duplicate companions grant matching shards.'}</p>")
save('Invitations.tsx',s)

s=read('CafeV4.tsx')
for old,new in [
 ('Prepare a crew and complete a rewarded route.','Your crew has a new route to explore.'),
 ('Cafe service collected. Your daily board has been updated.','Service collected. Your board is up to date.'),
 ('Lesson saved. The next cafe tip is ready.','Ready for the next cafe tip.'),
 ('Both services are complete. The next allowance begins at UTC midnight.','Both shifts are collected. Come back after midnight UTC.'),
 ('hours of away time count. Skipped days do not stack service rewards.','hours count toward your next service.'),
 ('Cafe service collected within the daily allowance.','A warm shift, collected.'),
 ("Today's reward space is full. Your service remains unclaimed.","You’ve earned today’s limit. Your service can wait."),
 ('Your collection remembers discoveries, even after salvaging gear.','Every discovery stays in your journal.'),
 ('equipment templates ·','gear designs ·'),
 ('Every journal milestone is collected. Keep building your favourite crew.','All milestones collected. Try a new crew tonight.'),
 ('Use the field guide to compare enemy signatures and counters. Your last route keeps its replay in Save & settings.','Read the field guide for enemy tricks. Find your last battle in Save & settings.'),
 ('<summary>Equipment templates ·','<summary>Gear designs ·'),
 ('`${x.name} collected once.`','`${x.name} collected.`'),
 ]:
    s=change(s,old,new)
save('CafeV4.tsx',s)

s=read('Pages.tsx')
s=change(s, '<small>Fixed enemies for the chosen band. Lower bands keep the same capped rewards.</small>', '<small>Lower bands offer a gentler route. Daily reward limits stay the same.</small>')
save('Pages.tsx',s)

# Draft fixes: keep historical copy unchanged whenever gameplayV4 is off.
s=read('RunMap.tsx')
s=change(s,"'Strengthen this skill by 12% tonight. Up to three upgrades.'", "(run.gameplayV4 ? 'Strengthen this skill by 12% tonight. Up to three upgrades.' : 'Increase this skill’s effect power by 12% for this run. Up to three upgrades.')")
save('RunMap.tsx',s)
(out/'inputs.json').write_text(json.dumps(inputs,indent=2))
print(json.dumps({'stagedFiles':len(inputs),'runtimeApplied':False}))
