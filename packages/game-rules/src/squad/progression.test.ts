import { describe, expect, it } from 'vitest';
import { advanceBattle, createBattle, exportReplay, hasStatus, parseReplay, replayBattle, shieldOf } from './battle';
import { defaultLoadout } from './gear';
import { canRecruit, equipTeam, newProfile, parseSave, recruit, restoreCafe, savePreset, settleRun, squadLevel, unlockPattern, type LabSave } from './progression';
import { SKILLS } from './content';
import type { Actor, Battle, SkillId } from './types';

const finish = (battle: Battle) => advanceBattle(battle, 180_000);
function cast(battle: Battle, source: Actor, skill: SkillId, targets: Actor[]) {
  for (const a of battle.actors) a.cooldowns = Object.fromEntries(Object.keys(SKILLS).map(id => [id, 99999]));
  source.cast = { skill, start: 0, release: 1, impact: 2, end: 5, released: false, targets: targets.map(a => a.id), point: { x: targets[0]!.x, y: targets[0]!.y } };
  return advanceBattle(battle, 100);
}
function saveFor(battle: Battle): LabSave { return { version: 2, profile: newProfile(), run: { replay: exportReplay(battle), eligible: true, settled: false } }; }

describe('builds and new combat roles', () => {
  it('runs the Hunter squad with six new skills, marks and visible passives', () => {
    const result = finish(createBattle({ preset: 'hunters' }));
    expect(result.phase).toBe('won');
    for (const skill of ['pounce', 'feint', 'nightfall', 'mark', 'pierce', 'rain']) expect(result.events.some(e => e.type === 'cast' && e.skill === skill)).toBe(true);
    for (const passive of ['Keen eye', 'Second chance · −2s']) expect(result.events.some(e => e.text === passive)).toBe(true);
  });
  it('Needle bow hits one extra target in its row and cannot hit a third', () => {
    const s = createBattle({ preset: 'hunters', scenario: 'crowd' }), archer = s.actors[2]!;
    archer.gear = ['needle'];
    for (const [i, a] of s.actors.slice(3).entries()) { a.x = a.home.x = 500 + i * 5; a.y = a.home.y = 165; }
    const result = cast(s, archer, 'basic', [s.actors[3]!]);
    expect(result.actors.filter(a => a.side === 'enemy' && a.hp < a.maxHp)).toHaveLength(2);
  });
  it('Cinder lantern changes the actual area boundary and burn duration', () => {
    const s = createBattle(), witch = s.actors[1]!, primary = s.actors[3]!, edge = s.actors[4]!, outside = s.actors[5]!;
    witch.gear = ['cinder'];
    edge.x = edge.home.x = primary.x + 160; edge.y = edge.home.y = primary.y;
    outside.x = outside.home.x = primary.x + 161; outside.y = outside.home.y = primary.y;
    const result = cast(s, witch, 'orb', [primary]);
    expect(result.actors[4]!.hp).toBeLessThan(edge.hp);
    expect(result.actors[5]!.hp).toBe(outside.hp);
    expect(result.actors[4]!.statuses.find(x => x.kind === 'burn')!.until).toBe(122);
  });
  it('Milk pitcher shields after actual healing and never grants shields for overheal', () => {
    const s = createBattle(), alchemist = s.actors[2]!, ally = s.actors[0]!;
    alchemist.gear = ['overflow']; ally.hp -= 30;
    const result = cast(s, alchemist, 'milk', [ally]);
    expect(shieldOf(result.actors[0]!)).toBe(27);
    expect(result.events.filter(e => ['heal', 'shield'].includes(e.type)).map(e => e.type)).toEqual(['heal', 'shield', 'shield']);
    const full = createBattle(); full.actors[2]!.gear = ['overflow'];
    expect(shieldOf(cast(full, full.actors[2]!, 'milk', [full.actors[0]!]).actors[0]!)).toBe(0);
  });
  it('a charged kettle Bash consumes charges and adds break', () => {
    const s = createBattle({ scenario: 'boss' }); s.actors[0]!.gear = ['counter']; s.actors[0]!.charges = 3;
    const result = cast(s, s.actors[0]!, 'bash', [s.actors[3]!]);
    expect(result.actors[3]!.break).toBe(80); expect(result.actors[0]!.charges).toBe(0);
  });
  it('Vacuum suction moves only cats in the marked lane', () => {
    const s = createBattle({ scenario: 'vacuum' }), boss = s.actors[3]!, front = s.actors[0]!, rear = s.actors[1]!;
    const result = cast(s, boss, 'suction', [front]);
    expect(result.actors[0]!.x).toBe(front.x + 100); expect(hasStatus(result.actors[0]!, 'snare')).toBe(true);
    expect(result.actors[1]!.hp).toBe(rear.hp); expect(result.actors[1]!.x).toBe(rear.x);
  });
  it('interrupting the motor creates a long opening and cancels the blast', () => {
    const s = createBattle({ scenario: 'vacuum' }), boss = s.actors[3]!;
    boss.cast = { skill: 'motor', start: 0, release: 40, impact: 40, end: 47, targets: ['cat-0', 'cat-1', 'cat-2'], point: s.actors[0]!, released: false };
    const result = cast(s, s.actors[0]!, 'bash', [boss]);
    expect(result.actors[3]!.cast).toBeNull();
    expect(result.actors[3]!.statuses.find(x => x.kind === 'exposed')?.until).toBe(122);
    expect(result.events.some(e => e.type === 'interrupt')).toBe(true);
    expect(result.actors[0]!.hp).toBe(s.actors[0]!.hp);
  });
  it('Vacuum runs a different set of mechanics and replays all new builds exactly', () => {
    const result = finish(createBattle({ scenario: 'vacuum', team: [{ role: 'guardian', weapon: 'counter', charm: 'hearth' }, { role: 'archer', weapon: 'needle', charm: 'hunt' }, { role: 'alchemist', weapon: 'overflow', charm: 'ember' }] }));
    expect(result.phase).toBe('won');
    for (const skill of ['suction', 'motor', 'debris']) expect(result.events.some(e => e.type === 'cast' && e.skill === skill)).toBe(true);
    expect(result.events.some(e => e.skill === 'thread' || e.skill === 'sweep')).toBe(false);
    expect(replayBattle(exportReplay(result))).toEqual(result);
  });
  it('routes change enemy compositions, not just reward text', () => {
    const safe = finish(createBattle({ route: 'safe' })), cache = finish(createBattle({ route: 'supplies' })), challenge = finish(createBattle({ route: 'challenge' }));
    expect(challenge.settlements[2]!.defeated.length).toBe(safe.settlements[2]!.defeated.length + 1);
    expect(cache.events.filter(e => e.skill === 'mend').length).toBeGreaterThan(safe.events.filter(e => e.skill === 'mend').length);
  });
});

describe('local progression and migration', () => {
  it('settles a win once across serialized reloads and grants a first useful choice', () => {
    const won = finish(createBattle()); const first = settleRun(saveFor(won), won);
    expect(first.profile.coins).toBe(35); expect(first.profile.xp).toBe(80); expect(first.profile.rewardPending).toBe(true);
    const loaded = parseSave(JSON.parse(JSON.stringify(first)));
    expect(settleRun(loaded, replayBattle(loaded.run!.replay))).toEqual(first);
  });
  it('training, losses, imported replay and legacy sessions grant no supplies', () => {
    for (const scenario of ['crowd', 'boss', 'dummy'] as const) {
      const battle = finish(createBattle({ scenario })); expect(settleRun(saveFor(battle), battle).profile.coins).toBe(0);
    }
    const lost = createBattle(); lost.phase = 'lost'; expect(settleRun(saveFor(lost), lost).profile.coins).toBe(0);
    const won = finish(createBattle()), imported = saveFor(won); imported.run!.eligible = false;
    expect(settleRun(imported, won).profile).toEqual(newProfile());
  });
  it('recruits through patrol milestones and all cats catch up to shared level', () => {
    let p = newProfile(); expect(recruit(p, 'rogue')).toBe(p);
    p = { ...p, clears: 2, xp: 280 }; expect(canRecruit(p, 'archer')).toBe(true);
    p = recruit(recruit(p, 'archer'), 'rogue'); expect(squadLevel(p)).toBe(3);
    const battle = createBattle({ preset: 'hunters', level: squadLevel(p) });
    expect(battle.actors[1]!.maxHp).toBe(Math.round(380 * 1.12));
    expect(recruit(p, 'rogue')).toBe(p);
  });
  it('crafting and restoration cannot overspend and the free gift is claimed once', () => {
    let p = newProfile(); expect(unlockPattern(p, 'counter')).toBe(p); expect(restoreCafe(p)).toBe(p);
    p = { ...p, coins: 70, rewardPending: true };
    p = unlockPattern(p, 'counter', true); expect(p.coins).toBe(70); expect(p.rewardPending).toBe(false);
    expect(unlockPattern(p, 'overflow', true)).toBe(p);
    p = unlockPattern(p, 'overflow'); expect(p.coins).toBe(40);
    p = restoreCafe(p); expect(p.coins).toBe(0); expect(p.restoration).toBe(1);
    expect(restoreCafe(p)).toBe(p);
  });
  it('saved squads retain equipment independently and cannot equip a wrong-class weapon', () => {
    let p = newProfile(); p = unlockPattern({ ...p, coins: 100 }, 'counter');
    p = equipTeam(p, [{ role: 'guardian', weapon: 'counter', charm: 'plain' }, defaultLoadout('witch'), defaultLoadout('alchemist')]);
    p = savePreset(p, 'Boss'); const original = JSON.stringify(p.presets[0]);
    p = equipTeam(p, p.team.map(x => ({ ...x, weapon: 'starter' })));
    expect(JSON.stringify(p.presets[0])).toBe(original);
    expect(equipTeam(p, [{ role: 'witch', weapon: 'counter', charm: 'plain' }, ...p.team.slice(1)])).toBe(p);
    expect(equipTeam(p, [defaultLoadout('rogue'), ...p.team.slice(1)])).toBe(p);
  });
  it('preserves the recorded v1 result and migrates replay-only files without rewards', () => {
    const old = { version: 1, options: { seed: 1105, preset: 'hearth', scenario: 'patrol' }, commands: [], ticks: 1623 };
    const migrated = parseSave(old), result = replayBattle(migrated.run!.replay);
    expect(result.version).toBe(1); expect(result.phase).toBe('won'); expect(result.tick).toBe(1623);
    expect(result.settlements.reduce((sum, x) => sum + x.budget, 0)).toBe(670);
    expect(migrated.run!.eligible).toBe(false);
    const partial = replayBattle({ ...old, ticks: 300 });
    expect(finish(partial).events).toEqual(result.events);
  });
  it('validates saves and command logs before they can replace an existing session', () => {
    expect(() => parseSave({ version: 99 })).toThrow('version');
    expect(() => parseSave({ version: 2, profile: { ...newProfile(), coins: -1 }, run: null })).toThrow();
    const base = exportReplay(createBattle());
    expect(() => parseReplay({ ...base, ticks: 20, commands: [{ tick: 10, command: { type: 'auto', enabled: true } }, { tick: 2, command: { type: 'auto', enabled: false } }] })).toThrow('order');
    expect(() => parseReplay({ ...base, commands: [{ tick: 1, command: { type: 'auto', enabled: true } }] })).toThrow();
    expect(() => parseReplay({ ...base, commands: [{ tick: 0, command: { type: 'auto', enabled: 'yes' } }] })).toThrow();
    expect(() => parseReplay({ ...base, options: { ...base.options, level: 100 } })).toThrow();
  });
});
