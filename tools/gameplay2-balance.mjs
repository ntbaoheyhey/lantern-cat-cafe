// Deterministic model evidence, explicitly not wall-clock play or human research.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..'), req = createRequire(resolve(root, 'apps/web/package.json'));
const { createServer } = await import(req.resolve('vite'));
const vite = await createServer({ configFile: false, root, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
try {
  const G = await vite.ssrLoadModule('/packages/game-rules/client/cafe.ts');
  const { CONFIG } = await vite.ssrLoadModule('/packages/game-rules/src/config.ts'), C = CONFIG.cafe;
  const records = [], builds = [];
  for (const seed of [11, 29, 47, 71, 101]) for (const style of ['idle', 'active', 'minmax']) {
    let s = G.createCafe(seed), actions = [], timeline = [...s.events], last = s.events.at(-1), battles = [];
    const doAction = action => { const next = G.actCafe(s, action); if (JSON.stringify(s) !== JSON.stringify(next)) actions.push({ at: s.seconds, ...action }); s = next; };
    for (let t = 0; t < 1200; t++) {
      if (s.boss && style !== 'idle') {
        if (s.boss.stage === 'windup' && (style === 'minmax' || s.boss.move % 3 !== 2)) doAction({ type: 'counter', counter: s.boss.counter });
        if (s.boss?.stage === 'recovery') doAction({ type: 'pounce' });
      } else if (!s.boss) {
        if (s.clears.includes(s.chapter) && s.chapter < G.ROOMS.length) doAction({ type: 'nextRoom' });
        if (s.encounter && style !== 'idle' && t > 0) doAction({ type: 'route', route: s.insight < C.maxInsight || s.encounter.kind === 'splitter' ? 'study' : style === 'minmax' ? 'risk' : 'gather' });
        if (style !== 'idle' && t % 32 === 0) {
          const set = style === 'minmax' ? 'ember' : 'moss';
          const missing = G.SLOTS.find(slot => !s.inventory.some(i => i.set === set && i.slot === slot));
          if (missing) doAction({ type: 'craft', slot: missing, set });
          doAction({ type: 'build', set });
          if (!missing) {
            const piece = s.inventory.filter(i => Object.values(s.equipped).includes(i.id)).sort((a, b) => a.level - b.level)[0];
            doAction({ type: 'stitch', id: piece.id, kind: style === 'minmax' ? 'spark' : 'steady' });
          }
          doAction({ type: 'mastery', mastery: style === 'minmax' ? 'bold' : 'gentle' });
        }
        if (G.bossReady(s) && !s.clears.includes(s.chapter) && (s.lastBoss?.won !== false || t % 60 === 0)) {
          doAction({ type: 'fight' });
          if (s.boss) battles.push({ at: t, chapter: s.chapter, stats: G.cafeStats(s), tier: s.tier });
        }
      }
      s = G.advanceCafe(s);
      if (s.lastBoss && battles.length && !battles.at(-1).result) { battles.at(-1).result = s.lastBoss; }
      const index = last ? s.events.map(e => `${e.at}:${e.text}`).lastIndexOf(`${last.at}:${last.text}`) : -1;
      timeline.push(...s.events.slice(index + 1)); last = s.events.at(-1);
    }
    const points = [0, ...timeline.filter(e => e.at <= 600 && ['reward', 'decision', 'goal'].includes(e.kind)).map(e => e.at), 600];
    records.push({ seed, style, duration:1200, firstReward: timeline.find(e => e.kind === 'reward')?.at, maxGap: Math.max(...points.slice(1).map((p, i) => p - points[i])), decisions: actions.filter(a => a.at < 600).length,
      bossFirstAttempt: battles[0]?.at, items: s.inventory.length, finalChapter: s.chapter, stats:G.cafeStats(s), battles, actions, timeline });
  }
  for (const seed of [11, 29, 47, 71, 101]) for (const set of G.SETS) for (const active of [false,true]) {
    let s = G.createCafe(seed); s.chapter=2; s.encounters=C.bossGate*2;
    for (const i of s.inventory) { i.set=set; i.chapter=2; i.level=1; i.quality='fine'; i.affix=set==='ember'?'keen':set==='moss'?'cushioned':'lucky'; }
    const stats=G.cafeStats(s); s=G.actCafe(s,{type:'fight'});
    while(s.boss) { if(active) {s=G.actCafe(s,{type:'counter',counter:s.boss.counter}); if(s.boss?.stage==='recovery')s=G.actCafe(s,{type:'pounce'});} s=G.advanceCafe(s); }
    builds.push({seed,set,active,stats,result:s.lastBoss});
  }
  mkdirSync(resolve(root,'reports/gameplay2'),{recursive:true});
  writeFileSync(resolve(root,'reports/gameplay2/balance.json'),JSON.stringify({ method:'Five independent deterministic seeds, 20 model minutes/style; decisions are scripted inputs, not human judgments. Equal-kit build benchmark is separate from natural progression.',records,builds},null,2));
  console.log(JSON.stringify(records.map(({seed,style,firstReward,maxGap,decisions,bossFirstAttempt,finalChapter,battles})=>({seed,style,firstReward,maxGap,decisions,bossFirstAttempt,finalChapter,battles:battles.map(b=>({chapter:b.chapter,at:b.at,...b.result}))})),null,2));
  console.log(JSON.stringify(builds.map(b=>({seed:b.seed,set:b.set,active:b.active,won:b.result.won,seconds:b.result.seconds,hp:b.result.hp})),null,2));
} finally { await vite.close(); }
