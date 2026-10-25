// @vitest-environment node
import { deriveSeed, v2 } from '@taskbar-hero/game-rules';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { ClassId } from '../../api/GameApiV2';
import { MockGameApiV2, MOCK_V2_STORAGE_KEY } from '../../api/MockGameApiV2';
import { mockV2SaveJson } from '../../api/mockV2Fixtures';
import { ARENA_FIXTURES } from './arenaFixtures';
import { buildArenaCues } from './cues';

const NOW = Date.parse('2026-10-25T12:00:00Z');
const FILE = fileURLToPath(new URL('./arenaFixtures.ts', import.meta.url));
let fixturesToCheck = ARENA_FIXTURES;

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

type GeneratedFixture = {
  fixture: (typeof ARENA_FIXTURES)[number];
  seed: number;
  level: number;
  raw: v2.BossResultV2;
};

async function generateFixture(chapter: number, classId: ClassId, won: boolean): Promise<GeneratedFixture | null> {
  const kind = won ? 'bossReadyStrong' : 'bossReadyWeak';
  const json = mockV2SaveJson(kind, { nowMs: NOW, classId, chapter });
  for (let seed = 1; seed <= 20; seed++) {
    const storage = new MemoryStorage();
    storage.setItem(MOCK_V2_STORAGE_KEY, json);
    const api = new MockGameApiV2({ storage, now: () => NOW, seed });
    const before = await api.getState();
    const worn = before.inventory.filter(i => i.equipped)
      .map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }));
    const stats = v2.deriveStats({ classId, level: before.cat.level }, worn);
    const result = await api.fightBoss(chapter);
    if (result.won !== won) continue;
    const fixture = { id: `ch${chapter}-${won ? 'win' : 'loss'}`, chapter, classId, catMaxHp: stats.hp, result };
    const raw = v2.simulateBossV2(stats, classId, v2.bossOfChapter(chapter), deriveSeed(seed, 0));
    return { fixture, seed, level: before.cat.level, raw };
  }
  console.info(`${kind} chapter=${chapter} class=${classId}: no ${won ? 'win' : 'loss'} in seeds 1..20`);
  return null;
}

it('regenerates every generated demo API fixture and audits inference against the raw log', async () => {
  const generated: GeneratedFixture[] = [];
  for (const [chapter, classId, won] of [
    [1, 'warrior', true], [1, 'warrior', false],
    [3, 'archer', true], [3, 'archer', false], [5, 'witch', false],
  ] as const) {
    const entry = await generateFixture(chapter, classId, won);
    expect(entry, `STOP: chapter ${chapter} ${classId} expected ${won ? 'win' : 'loss'} in seeds 1..20`).not.toBeNull();
    generated.push(entry!);
  }
  // Preserve witch/burn coverage while trying the approved chapters in order.
  const replacement = await generateFixture(2, 'witch', true) ?? await generateFixture(4, 'witch', true);
  if (replacement) generated.push(replacement);
  else expect(ARENA_FIXTURES.some(f => f.id === 'ch5-win-handbuilt'), 'Both replacement chapters lost: the approved hand-built win is required').toBe(true);

  for (const { fixture, seed, level, raw } of generated) {
    const { result } = fixture;
    expect(result.timeline).toEqual(v2.timelineViewV2(raw.log));
    expect(result.won).toBe(raw.won);
    // Strip flags even after D2 merges: this audit measures the fallback alone.
    const timeline = result.timeline.map(e => {
      const { big: _big, dodged: _dodged, ...rest } = e as typeof e & { big?: boolean; dodged?: boolean };
      return rest;
    });
    const cues = buildArenaCues({ ...result, timeline }, { ...fixture, reducedMotion: false });
    const impacts = cues.filter(c => c.type === 'bossImpact');
    const windups = cues.filter(c => c.type === 'bossWindup');
    const rawImpacts = raw.log.filter(e => e.type === 'boss_impact');
    const rawWindups = raw.log.filter(e => e.type === 'boss_windup');
    expect(impacts).toHaveLength(rawImpacts.length);
    expect(windups).toHaveLength(rawWindups.length);
    const big = impacts.filter((c, i) => c.big === rawImpacts[i]!.big).length;
    const dodged = impacts.filter((c, i) => c.dodged === rawImpacts[i]!.dodged).length;
    const windup = windups.filter((c, i) => c.big === rawWindups[i]!.big).length;
    console.info(`${fixture.id}: class=${fixture.classId} chapter=${fixture.chapter} level=${level} seed=${seed} won=${result.won} duration=${raw.durationMs}ms events=${result.timeline.length}; inference impact.big=${big}/${impacts.length} impact.dodged=${dodged}/${impacts.length} windup.big=${windup}/${windups.length}`);
  }
  const fixtures = generated.map(entry => entry.fixture);
  const block = `// BEGIN GENERATED DATA\nconst GENERATED_FIXTURES: ArenaFixture[] = [\n${generated.map(({ fixture, seed }) => `  // ${fixture.id}: ${fixture.result.won ? 'bossReadyStrong' : 'bossReadyWeak'}, seed=${seed}\n  ${JSON.stringify(fixture)},`).join('\n')}\n];\n// END GENERATED DATA`;
  const source = readFileSync(FILE, 'utf8');
  const expected = source.replace(/\/\/ BEGIN GENERATED DATA[\s\S]*\/\/ END GENERATED DATA/, block);
  if (process.env.UPDATE_ARENA_FIXTURES === '1') {
    writeFileSync(FILE, expected, 'utf8');
    fixturesToCheck = [...fixtures, ...ARENA_FIXTURES.filter(f => f.id === 'ch5-win-handbuilt')];
  }
  else expect(ARENA_FIXTURES.filter(f => f.id !== 'ch5-win-handbuilt')).toEqual(fixtures);
  expect(readFileSync(FILE, 'utf8')).toBe(expected);
}, 60_000);

it('keeps six distinct outcomes and validates any approved hand-built win structurally', () => {
  expect(fixturesToCheck).toHaveLength(6);
  expect(new Set(fixturesToCheck.map(f => f.id)).size).toBe(6);
  for (const fixture of fixturesToCheck) {
    expect(fixture.result.won).toBe(fixture.id.includes('-win'));
    if (fixture.id !== 'ch5-win-handbuilt') continue;
    expect(fixture).toMatchObject({ chapter: 5, classId: 'witch', result: { won: true } });
    const { timeline } = fixture.result;
    for (let i = 1; i < timeline.length; i++) expect(timeline[i]!.t).toBeGreaterThanOrEqual(timeline[i - 1]!.t);
    expect(timeline.filter(e => e.type === 'attack_start').length).toBeGreaterThanOrEqual(3);
    expect(timeline.filter(e => e.type === 'impact').length).toBeGreaterThanOrEqual(3);
    expect(timeline.some(e => e.type === 'dot')).toBe(true);
    const flagged = timeline as (typeof timeline[number] & { big?: boolean; dodged?: boolean; won?: boolean })[];
    const windup = flagged.find(e => e.type === 'boss_windup' && e.big);
    const impact = flagged.find(e => e.type === 'boss_impact' && e.big && e.dodged);
    expect(windup).toBeDefined();
    expect(impact).toBeDefined();
    expect(windup!.t).toBeLessThanOrEqual(impact!.t);
    expect(flagged.at(-1)).toMatchObject({ type: 'end', won: true });
  }
});

it('reminds us to replace a hand-built win when chapter 5 becomes winnable', async context => {
  if (!ARENA_FIXTURES.some(f => f.id === 'ch5-win-handbuilt')) return;
  const win = await generateFixture(5, 'witch', true);
  if (win) {
    const message = 'chapter 5 is winnable now: replace the hand-built fixture by a generated win';
    console.warn(message);
    // Explicit card exception: a balance reminder must never block a merge.
    context.skip(message);
  }
}, 60_000);
