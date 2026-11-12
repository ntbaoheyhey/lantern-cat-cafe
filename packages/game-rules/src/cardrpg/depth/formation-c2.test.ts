import { describe, expect, it } from 'vitest';
import * as R from './index';
import { clone } from '../internal';

const fresh = () => R.setFormationC2(R.setGameplayA6(R.createDepthAccount(11,0),true));
describe('four-companion migration and formation', () => {
  it('adds the fourth starter once and round-trips THC16 without losing property', () => {
    const before = R.setGameplayA6(R.createDepthAccount(11,0),true), s = R.setFormationC2(before);
    expect(s.team).toHaveLength(4); expect(R.validRowsC2(s.team,s.rows)).toBe(true);
    expect(s.account.currencies).toEqual(before.account.currencies); expect(s.gear).toEqual(before.gear);
    expect(R.setFormationC2(s)).toBe(s); expect(R.exportSave(s)).toMatch(/^THC16\./);
    expect(R.importSave(R.exportSave(s))).toEqual(s);
  });
  it.each([5,6])('keeps the four strongest from an old %i-cat save and benches the rest', count => {
    const s=R.setGameplayA6(R.createDepthAccount(11,0),true);
    for(const c of R.CATS.filter(c=>!s.account.cards.some(o=>o.cardId===c.id)).slice(0,count-3)){
      s.account.cards.push({id:c.id,cardId:c.id,level:10,stars:1,shards:0,soulbound:true});s.team.push(c.id);s.rows[c.id]=c.row;s.skills[c.id]=c.skills.slice(0,3).map(k=>k.id);
    }
    const strongest=[...s.team].sort((a,b)=>R.powerScoreA6(R.depthStats(s,b))-R.powerScoreA6(R.depthStats(s,a))||a.localeCompare(b)).slice(0,4);
    const payload=JSON.stringify(s), migrated=R.importSave(`THC15.${R.saveChecksum(payload)}.${payload}`,0,true);
    expect(migrated.team).toEqual(strongest); expect(migrated.account.cards).toEqual(s.account.cards);
    expect(migrated.formationNoticeC2).toBe('bench'); expect(R.validRowsC2(migrated.team,migrated.rows)).toBe(true);
    expect(R.importSave(R.exportSave(migrated),0,true)).toEqual(migrated);
  });
  it('migrates an untouched preparation but preserves a committed replay exactly', () => {
    let old=R.enterNode(R.startRun(R.setGameplayA6(R.createDepthAccount(11,0),true),1,11).state,'0-0').state;
    const preparation=R.setFormationC2(old);
    expect(preparation.run!.battle!.initial.formationC2).toBe(true);expect(preparation.run!.battle!.initial.cats).toHaveLength(4);
    old=R.commitPreparation(old).state;const snapshot=clone(old.run!.battle);
    const migrated=R.setFormationC2(old);expect(migrated.run!.battle).toEqual(snapshot);
    expect(R.playBattle(migrated.run!.battle!,'auto')).toEqual(R.playBattle(snapshot!,'auto'));
  });
  it.each(['campaign','daily','tower'] as const)('starts %s with four and two per row', mode => {
    const s=fresh();s.cleared=[1,2,3];s.tutorial=4;
    const result=R.startRun(s,1,23,mode,'2026-11-12');expect(result.ok).toBe(true);
    const started=result.state, run=started.run!;
    const ready=run.battle?started:R.enterNode(started,R.availableNodes(run)[0]!.id).state;
    expect(ready.run!.battle!.initial.cats).toHaveLength(4);expect(ready.run!.battle!.initial.formationC2).toBe(true);
  });
  it('swaps seats without rerolling, healing, or permitting a third cat in a row', () => {
    let s=R.enterNode(R.startRun(fresh(),1,11).state,'0-0').state;
    const initial=clone(s.run!.battle!.initial),front=s.team.filter(id=>s.rows[id]==='front');
    expect(R.configurePreparation(s,s.team,{...s.rows,[front[0]!]:'rear'},R.DEFAULT_PLAN).ok).toBe(false);
    s.run!.hp[front[0]!]=0;s.run!.battle!.actors.find(a=>a.id===front[0])!.hp=0;
    const next=R.placeInSlotC2(s.team,s.rows,s.team.find(id=>s.rows[id]==='rear')!,0)!;
    const result=R.configurePreparation(s,next.team,next.rows,R.DEFAULT_PLAN);expect(result.ok).toBe(true);s=result.state;
    expect(s.run!.battle!.initial.seed).toBe(initial.seed);expect(s.run!.battle!.initial.enemyStats).toEqual(initial.enemyStats);
    expect(s.run!.hp[front[0]!]).toBe(0);expect(R.validRowsC2(s.team,s.rows,s.run!.hp)).toBe(true);
  });
});

it('ordinary enemy attacks cannot bypass a living front, even with rear Shelter', () => {
  for(const enemy of R.ENEMIES) for(let seed=1;seed<=6;seed++) {
    const s=fresh(), b=R.createBattle({seed,chapter:1,formationC2:true,gameplayA6:true,skillsV5:true,gameplayV4:true,cats:R.battleCats(s),enemies:[enemy.id]});
    const foe=b.actors.find(a=>a.side==='enemy')!,rear=b.actors.find(a=>a.side==='party'&&a.row==='rear')!;
    rear.statuses.push({id:'shelter',stacks:1,remaining:2,source:rear.id,appliedRound:b.round});
    b.queue=[foe.id];foe.charge=0;const intent=b.intents.find(i=>i.actorId===foe.id)!;intent.signature=false;intent.targetId=rear.id;
    R.enemyAct(b);
    for(const hit of b.log.filter(e=>e.kind==='damage'&&e.actorId===foe.id))expect(b.actors.find(a=>a.id===hit.targetId)!.row,enemy.id).toBe('front');
  }
});
it('backline signatures and ordinary attacks after both fronts fall can reach the back', () => {
  for(const signature of [false,true]) {
    const s=fresh(),b=R.createBattle({seed:5,chapter:1,formationC2:true,gameplayA6:true,skillsV5:true,gameplayV4:true,cats:R.battleCats(s),enemies:['sock-skipper']});
    const foe=b.actors.find(a=>a.side==='enemy')!;b.queue=[foe.id];foe.charge=signature?100:0;b.intents[0]!.signature=signature;
    if(!signature)for(const a of b.actors.filter(a=>a.side==='party'&&a.row==='front'))a.hp=0;
    R.enemyAct(b);expect(b.log.some(e=>e.kind==='damage'&&e.actorId===foe.id&&b.actors.find(a=>a.id===e.targetId)?.row==='rear')).toBe(true);
  }
});
