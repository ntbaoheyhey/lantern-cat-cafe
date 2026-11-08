/**
 * DEMO_PREVIEW: independently authored placeholders, never balance inputs.
 * All unlock counts, level steps, perLevel values and equip limits in this module
 * are DEMO_PREVIEW. No pet value may feed stats, rewards, drops or forge rules.
 */
export const PET_PREVIEW_STATUS = 'DEMO_PREVIEW' as const;
export const PET_PREVIEW_RULES = Object.freeze({ maxEquipped: 2 });
export const PET_KILL_TARGET = 'claimed-idle-kills' as const;

export interface PetDef {
  readonly id: string;
  readonly name: string;
  readonly unlock: { readonly target: string; readonly count: number };
  /** A preview label, deliberately unrelated to StatId or reward keys. */
  readonly bonusKey: `preview.${string}`;
  /** DEMO_PREVIEW display values only; index = level minus one. */
  readonly perLevel: readonly number[];
  readonly flavour: string;
  readonly status: typeof PET_PREVIEW_STATUS;
}

const pet = (id: string, name: string, count: number, label: string, flavour: string): PetDef => Object.freeze({
  id: `pet.${id}`, name, unlock: Object.freeze({ target: PET_KILL_TARGET, count }),
  bonusKey: `preview.${label}` as const,
  perLevel: Object.freeze([0.7, 1.3, 2.1]), // DEMO_PREVIEW, no units or gameplay effect.
  flavour, status: PET_PREVIEW_STATUS,
});

/** DEMO_PREVIEW: all thresholds are new placeholders, not taken from the proposal demo. */
export const PET_DEFS: readonly PetDef[] = Object.freeze([
  pet('hemwhisk', 'Hemwhisk', 7, 'blanket-fold', 'A tiny tailor who hems every blanket with a purr.'),
  pet('sillskip', 'Sillskip', 13, 'window-watch', 'Keeps a patient watch over the windowsill kingdom.'),
  pet('thimblepurr', 'Thimblepurr', 19, 'button-hoard', 'Collects lost buttons and sleeps in the sewing basket.'),
  pet('kettlepaw', 'Kettlepaw', 31, 'tea-steam', 'Follows warm tea steam around the kitchen.'),
  pet('crumbcurl', 'Crumbcurl', 43, 'napkin-nest', 'Builds elaborate napkin nests beneath the breakfast table.'),
  pet('bristletoe', 'Bristletoe', 61, 'broom-dance', 'Treats the broom as a partner for midnight dancing.'),
  pet('puddleplume', 'Puddleplume', 79, 'raindrop-song', 'Sings to each raindrop from a perfectly dry perch.'),
  pet('latchlynx', 'Latchlynx', 103, 'door-greeting', 'Greets every opening door with a ceremonial stretch.'),
  pet('pocketmew', 'Pocketmew', 137, 'pocket-nap', 'Can find a comfortable pocket in any discarded coat.'),
  pet('hushspool', 'Hushspool', 173, 'thread-trail', 'Leaves a wandering thread trail between quiet rooms.'),
  pet('eavetuft', 'Eavetuft', 227, 'rooftop-hum', 'Hums along with the wind beneath the roof tiles.'),
  pet('dawnknead', 'Dawnknead', 283, 'sunrise-loaf', 'Kneads the first patch of sunlight into a morning loaf.'),
]);

export type PetKillCounts = Readonly<Record<string, number>>;
export interface PetProgress {
  readonly unlocked: boolean;
  readonly level: number;
  /** Absolute target kill count for the next level; null at the preview cap. */
  readonly nextAt: number | null;
  /** Percent within the current step; full at the preview cap. */
  readonly pct: number;
}

/** DEMO_PREVIEW: each level takes another unlock.count kills; missing/invalid counts are empty. */
export function petProgress(killCounts: PetKillCounts, defs: readonly PetDef[] = PET_DEFS): Readonly<Record<string, PetProgress>> {
  return Object.fromEntries(defs.map(def => {
    if (!Number.isSafeInteger(def.unlock.count) || def.unlock.count <= 0 || !def.perLevel.length) {
      throw new Error(`Invalid preview progression: ${def.id}`);
    }
    const raw = Object.hasOwn(killCounts, def.unlock.target) ? killCounts[def.unlock.target] : undefined;
    const count = typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
    const level = Math.min(def.perLevel.length, Math.floor(count / def.unlock.count));
    const capped = level === def.perLevel.length;
    return [def.id, Object.freeze({
      unlocked: level > 0, level,
      nextAt: capped ? null : (level + 1) * def.unlock.count,
      pct: capped ? 100 : (count - level * def.unlock.count) / def.unlock.count * 100,
    })];
  }));
}

export type PetEquipResult = { readonly ok: true; readonly equipped: readonly string[] }
  | { readonly ok: false; readonly reason: 'unknown' | 'locked' | 'duplicate' | 'limit' };

/** DEMO_PREVIEW: selection changes presentation only. Invalid requests leave selection intact. */
export function equipPet(equipped: readonly string[], id: string, killCounts: PetKillCounts, defs: readonly PetDef[] = PET_DEFS): PetEquipResult {
  if (!defs.some(def => def.id === id)) return { ok: false, reason: 'unknown' };
  if (equipped.includes(id)) return { ok: false, reason: 'duplicate' };
  if (equipped.length >= PET_PREVIEW_RULES.maxEquipped) return { ok: false, reason: 'limit' };
  if (!petProgress(killCounts, defs)[id]?.unlocked) return { ok: false, reason: 'locked' };
  return { ok: true, equipped: Object.freeze([...equipped, id]) };
}
