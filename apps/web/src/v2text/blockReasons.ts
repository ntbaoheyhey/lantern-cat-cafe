/**
 * Centralized mapping of action refusal and block reasons for Cat RPG v2 UI.
 * Keyed by ERROR_CODES_V2 from GameApiV2 and game-rules craftBlock/relicForgeBlock reasons.
 * Cat-café tone: cozy, encouraging, and clear about player requirements.
 */
import { ERROR_CODES_V2, type GameApiErrorCodeV2 } from '../api/GameApiV2';

/** Base static message mapping for every GameApiErrorCodeV2 code. */
export const BLOCK_REASONS: Record<GameApiErrorCodeV2, string> = {
  unauthenticated: 'Please sign in to save your café adventure.',
  invalid_request: 'Invalid request. Check your cat’s current state.',
  not_found: 'Item or recipe not found in the café records.',
  rate_limited: 'Hold your paws! You are taking actions a bit too fast.',
  server_error: 'The café kitchen encountered a server error. Please try again.',
  no_class: 'Pick a class first to start exploring.',
  not_owner: 'This gear belongs to another cat.',
  wrong_slot: 'This gear cannot be equipped in this slot.',
  slot_locked: 'This slot unlocks at a higher cat level.',
  wrong_weapon: 'Your class cannot equip this weapon type.',
  stale: 'Game state has updated. Refreshing your cat’s view.',
  cooldown: 'Your cat is taking a quick catnap to recover from defeat.',
  not_reached: 'Clear more rounds in this chapter to reach the boss.',
  no_key: 'You need a Cat Key to challenge this boss.',
  not_enough: 'Not enough materials or currency to complete this action.',
  bag_full: 'Bag is full (200/200). Salvage some spare gear first.',
  equipped: 'Equipped gear cannot be salvaged or moved.',
  locked: 'Locked gear cannot be salvaged. Unlock it first.',
  forge_blocked: 'The forge cannot craft this right now. Check costs and limits.',
};

/** Static messages for craftBlock refusal reasons. */
export const CRAFT_BLOCK_REASONS = {
  unknown_recipe: 'Unknown recipe.',
  unknown_slot: 'Unknown equipment slot.',
  not_enough_fish: 'Need more Fish to craft this.',
  not_enough_yarn: 'Need more Yarn to craft this.',
  not_enough_fluffTuft: 'Need more Fluff Tuft to craft this.',
  not_enough_shinyButton: 'Need more Shiny Buttons to craft this.',
  not_enough_catnipCrystal: 'Need more Catnip Crystals to craft this.',
  not_enough_starlightScale: 'Need more Starlight Scales to craft this.',
  not_enough_moonPearl: 'Need a Moon Pearl to craft this.',
} as const;

/** Static messages for relic forge refusal reasons. */
export const RELIC_BLOCK_REASONS = {
  daily_limit: "Daily limit reached: you already forged today's Relic. Come back tomorrow.",
  not_enough_yarn: 'Not enough Yarn (needs 30 Yarn).',
  no_moon_pearl: 'No Moon Pearl (needs 1 Moon Pearl).',
} as const;

/** Dynamic contextual formatter for craft block reasons. */
export function getCraftBlockReason(
  reason: string | null,
  context?: { diff?: number; matName?: string; bagFull?: boolean },
): string | null {
  if (context?.bagFull) {
    return BLOCK_REASONS.bag_full;
  }
  if (!reason) return null;
  if (reason.startsWith('not_enough_')) {
    if (context?.diff !== undefined && context?.matName) {
      return `Needs ${context.diff} more ${context.matName}`;
    }
    return (CRAFT_BLOCK_REASONS as Record<string, string>)[reason] ?? BLOCK_REASONS.not_enough;
  }
  return (CRAFT_BLOCK_REASONS as Record<string, string>)[reason] ?? BLOCK_REASONS[reason as GameApiErrorCodeV2] ?? reason;
}

/** Dynamic contextual formatter for relic forge block reasons. */
export function getRelicBlockReason(
  reason: string | null,
  context?: { yarnHeld?: number; pearlsHeld?: number; pending?: boolean },
): string | null {
  if (context?.pending) {
    return 'Finish saving your minted Relic before forging another.';
  }
  if (!reason) return null;
  if (reason === 'daily_limit') {
    return RELIC_BLOCK_REASONS.daily_limit;
  }
  if (reason === 'not_enough_yarn') {
    return `Not enough Yarn (needs 30 Yarn, you have ${context?.yarnHeld ?? 0}).`;
  }
  if (reason === 'no_moon_pearl') {
    return `No Moon Pearl (needs 1 Moon Pearl, you have ${context?.pearlsHeld ?? 0}).`;
  }
  return (RELIC_BLOCK_REASONS as Record<string, string>)[reason] ?? BLOCK_REASONS[reason as GameApiErrorCodeV2] ?? reason;
}

/** Dynamic contextual formatter for salvage block reasons. */
export function getSalvageBlockReason(context: {
  selectedCount: number;
  eligibleCount: number;
  isBusy?: boolean;
}): string | null {
  if (context.isBusy) return 'Salvaging in progress…';
  if (context.eligibleCount === 0) {
    return 'No unlocked spare gear in your bag to salvage.';
  }
  if (context.selectedCount === 0) {
    return 'Select at least one item to salvage.';
  }
  return null;
}

/** Dynamic contextual formatter for equip block reasons. */
export function getEquipBlockReason(
  code: 'no_class' | 'slot_locked' | 'wrong_weapon' | 'equipped' | 'locked' | null,
  context?: { slot?: string; unlockLevel?: number; requiredWeapon?: string },
): string | null {
  if (!code) return null;
  if (code === 'no_class') return 'Choose a class first';
  if (code === 'slot_locked') return `Unlocks at level ${context?.unlockLevel ?? 'higher'}`;
  if (code === 'wrong_weapon') return `Needs a ${context?.requiredWeapon ?? 'matching'} weapon`;
  if (code === 'equipped') return BLOCK_REASONS.equipped;
  if (code === 'locked') return BLOCK_REASONS.locked;
  return BLOCK_REASONS[code] ?? code;
}

/** Dynamic contextual formatter for boss fight block reasons. */
export function getBossBlockReason(
  kind: 'ready' | 'cooldown' | 'not_reached' | 'gated' | 'no_key' | 'no_class',
  context?: {
    secondsLeft?: number;
    neededPower?: number;
    roundsLeft?: number;
    killsLeft?: number;
    chapter?: number;
  },
): string | null {
  if (kind === 'ready') return null;
  if (kind === 'cooldown') {
    const s = context?.secondsLeft ?? 0;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `Catnap: ${m}:${sec.toString().padStart(2, '0')}`;
  }
  if (kind === 'no_key') {
    return 'You need a Cat Key. You get one each day from your first claim, and sometimes from monsters in cleared chapters.';
  }
  if (kind === 'no_class') {
    return 'Pick a class first.';
  }
  if (kind === 'not_reached') {
    if ((context?.roundsLeft ?? 0) <= 0 && (context?.killsLeft ?? 0) <= 0) {
      return `Beat the chapter ${(context?.chapter ?? 1) - 1} boss first.`;
    }
    const monsters = `${context?.killsLeft} more monster${context?.killsLeft === 1 ? '' : 's'}`;
    if ((context?.roundsLeft ?? 0) <= 0) {
      return `Clear ${monsters} to reach the boss.`;
    }
    const rounds = `${context?.roundsLeft} more round${context?.roundsLeft === 1 ? '' : 's'}`;
    return `Clear ${rounds} and ${monsters} to reach the boss.`;
  }
  if (kind === 'gated') {
    return `Needs about ${context?.neededPower ?? 0} power: upgrade your weapon or armor to keep going.`;
  }
  return BLOCK_REASONS[kind as GameApiErrorCodeV2] ?? kind;
}

/** Dynamic contextual formatter for claim reasons. */
export function getClaimBlockReason(context: {
  hasCat?: boolean;
  isSyncing?: boolean;
  offline?: boolean;
}): string | null {
  if (!context.hasCat) return 'Choose a class first to begin exploring and earning idle rewards.';
  if (context.isSyncing) return 'Syncing rewards with the café server…';
  if (context.offline) return 'You are offline. Idle progress will claim when you reconnect.';
  return null;
}

/** General fallback lookup. */
export function getBlockReason(code: string): string {
  if (code in BLOCK_REASONS) {
    return BLOCK_REASONS[code as GameApiErrorCodeV2] ?? code;
  }
  const craftMsg = (CRAFT_BLOCK_REASONS as Record<string, string>)[code];
  if (craftMsg) return craftMsg;
  const relicMsg = (RELIC_BLOCK_REASONS as Record<string, string>)[code];
  if (relicMsg) return relicMsg;
  return code.replaceAll('_', ' ');
}
