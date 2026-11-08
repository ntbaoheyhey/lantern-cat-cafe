// REFERENCE: E3 recorded observations. Numeric gates derive from the retained clicks and battle fields.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),base='reports/cardrpg-big/a5/e3/';
const bytes=p=>readFileSync(new URL(p,root)),read=p=>JSON.parse(bytes(p)),hash=p=>createHash('sha256').update(bytes(p)).digest('hex');
test('E3 binds the measured artifact, guide and all six source checks',()=>{
 const a=read(base+'audit.json');assert.equal(hash(a.artifact.path),a.artifact.sha256);assert.equal(bytes(a.artifact.path).length,a.artifact.bytes);assert.equal(hash(a.guide.path),a.guide.sha256);
 for(const r of a.receipts)assert.equal(hash(r.path),r.sha256,r.path);
 for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){const g=a.gates.findLast(g=>g.name===name);assert(g);assert.equal(g.head,a.source);assert.equal(g.code,0);assert.equal(hash(g.log),g.sha256);}
 assert.equal(a.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(a.off.cells,165);assert.equal(a.off.routes,8250);
});
test('fresh three-width x1 journeys meet all three opening deadlines without skip or imports',()=>{
 const a=read(base+'audit.json');for(const width of [1280,1440,1024]){
  const r=read(base+`browser-${width}/checks.json`);assert(r.complete);assert.equal(r.sha256,a.artifact.sha256);
  assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
  const lesson=r.encounters.find(e=>e.kind==='practice');assert.equal(lesson.battle.result,'party');assert(lesson.wallMs>0&&lesson.wallMs<=25000);
  assert(r.timeline.find(e=>e.kind==='equipped').atMs<=180000);assert(r.timeline.find(e=>e.kind==='scouted').atMs<=300000);
  const labels=r.timeline.filter(e=>e.kind==='click').map(e=>e.label);assert(labels.includes('welcome invitation'));assert(labels.includes('equip Soot wand'));assert(labels.includes('Soot front'));assert(labels.includes('Soot back'));assert(!labels.some(s=>/skip|import/i.test(s)));
  assert(r.captures.every(c=>c.overflow===0&&c.contrast.every(t=>t.ratio>=4.5)));
  assert.equal(r.beforeEquipment.account.currencies.fish-r.afterEquipment.account.currencies.fish,180);assert.equal(r.beforeEquipment.account.currencies.threads-r.afterEquipment.account.currencies.threads,30);
 }
});
test('paired next-battle effect is visible in real damage logs, not a fabricated victory claim',()=>{
 const p=read(base+'payoff.json');assert(p.passed);assert.equal(p.rows.length,3);
 for(const r of p.rows){assert.equal(hash(r.receipt),r.receiptSha256);const observed=read(r.receipt).encounters.find(e=>e.kind==='route-first').battle;assert.deepEqual(r.after.battle,observed);
  assert.equal(r.before.battle.seed,observed.seed);assert.equal(r.before.battle.result,'party');assert.equal(observed.result,'party');
  const sum=b=>b.log.filter(e=>e.actorId==='soot'&&['damage','reflect','scald'].includes(e.kind)).reduce((n,e)=>n+e.amount,0);
  assert.equal(sum(r.before.battle),r.sootDamage.before);assert.equal(sum(observed),r.sootDamage.after);assert(r.sootDamage.after>r.sootDamage.before);assert(r.stats.after.attack>r.stats.before.attack);
 }
});
