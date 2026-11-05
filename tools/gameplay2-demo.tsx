import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CafeAdventure from '../apps/web/src/cafe/CafeAdventure';
import { CAFE_SAVE_KEY } from '../apps/web/src/cafe/save';
import { CONFIG } from '../packages/game-rules/src/config';
import * as G from '../packages/game-rules/client/cafe';
const C = CONFIG.cafe, host = document.getElementById('game')!;
let root = createRoot(host), first = true;
function kit(set: G.SetId) {
  const s = G.createCafe(29); s.chapter = 2; s.encounters = C.bossGate * 2;
  for (const i of s.inventory) Object.assign(i, { set, chapter: 2, level: 1, quality: 'fine', affix: set === 'ember' ? 'keen' : set === 'moss' ? 'cushioned' : 'lucky' });
  s.discovered = G.SLOTS.map(slot => `gear:${set}:${slot}`); return s;
}
function start(name: string) {
  if (!first) { root.unmount(); root = createRoot(host); } first = false;
  let s = G.createCafe(29), away = 0;
  if (name === 'boss') s = G.actCafe(G.advanceCafe(s, 140), { type: 'fight' });
  if (name === 'workshop') { s = G.advanceCafe(s, 140); s.patches = C.debug.patches; }
  if (G.SETS.includes(name as G.SetId)) { s = kit(name as G.SetId); s.patches = C.debug.patches; }
  if (name === 'return') { s = G.advanceCafe(s, 140); away = 86400000; }
  if (name === 'tour') { s = G.advanceCafe(s, 450); s.chapter = 3; s.clears = [1,2,3]; }
  try { localStorage.setItem(CAFE_SAVE_KEY, JSON.stringify({ state: s, lastSeen: Date.now() - away })); } catch { /* The real hook explains memory-only fallback. */ }
  root.render(<CafeAdventure active onExit={() => { document.getElementById('local')!.scrollIntoView({ behavior: 'instant' }); }} />);
  document.getElementById('scenario-name')!.textContent = `Review fixture: ${name}. Only this offline Sample save is replaced.`;
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-scenario]')) button.addEventListener('click', () => start(button.dataset.scenario!));
start('fresh');
function BuildLab() {
  const [tier, setTier] = useState(0), [active, setActive] = useState(true);
  const cards = G.SETS.map(set => {
    let s = kit(set); s.tier = tier; const stats = G.cafeStats(s); s = G.actCafe(s, { type: 'fight' });
    while (s.boss) {
      if (active) { s = G.actCafe(s, { type: 'counter', counter: s.boss.counter }); if (s.boss?.stage === 'recovery') s = G.actCafe(s, { type: 'pounce' }); }
      s = G.advanceCafe(s);
    }
    return { set, stats, result: s.lastBoss! };
  });
  return <><div className="lab-controls"><label>Chapter-two tier <select value={tier} onChange={e => setTier(Number(e.target.value))}>{C.tiers.map((t,i) => <option value={i} key={t.id}>{t.name}</option>)}</select></label><label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Match counters and Pounce during recovery</label></div><div className="lab-cards">{cards.map(c => <article key={c.set}><h3>{c.set.toUpperCase()}</h3><p>{c.set === 'ember' ? 'Burst · faster Pounce · stronger openings' : c.set === 'moss' ? 'Sustain · more HP · recovery each second' : 'Scavenger · more patches · better local quality'}</p><dl><dt>Damage / second</dt><dd>{c.stats.damage}</dd><dt>HP / auto-brace</dt><dd>{c.stats.hp} / {Math.round(c.stats.guard*100)}%</dd><dt>Pounce cooldown</dt><dd>{c.stats.cooldown}s</dd><dt>Local patch bonus</dt><dd>+{c.stats.patchBonus}</dd></dl><strong>{c.result.won ? c.result.grade : 'Retry'} · {c.result.seconds}s · {c.result.hp} HP left</strong><button onClick={() => { start(c.set); document.getElementById('play')!.scrollIntoView({ behavior: 'instant' }); }}>Try this kit</button></article>)}</div><p className="muted">Actual reducer simulation, seed 29; equal chapter-two Fine kits with one stitch per piece and themed affixes. This controlled comparison is separate from natural progression and human play. No server items or Relics.</p></>;
}
createRoot(document.getElementById('build-lab')!).render(<BuildLab />);
