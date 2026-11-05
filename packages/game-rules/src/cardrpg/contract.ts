/** Renderer-independent, local-only contract. All amounts are integer points or basis points. */
export const CONTRACT_VERSION = '0.4.0' as const;
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'] as const;
export const EQUIPMENT_SLOTS = ['weapon', 'outfit', 'charm', 'relic'] as const;
export const CURRENCY_IDS = ['fish', 'threads', 'stamps', 'essence'] as const;
export const LOCAL_NOTICE = 'Local, unsaved preview. Reload resets progress.';
export const CHAIN_NOTICE = 'Design only, not minted' as const;
export type Rarity = typeof RARITY_ORDER[number];
export type Slot = typeof EQUIPMENT_SLOTS[number];
export type CurrencyId = typeof CURRENCY_IDS[number];
export type Balances = Record<CurrencyId, number>;
export type Cost = Partial<Balances>;
export type Role = 'guardian' | 'witch' | 'alchemist';
export type Stat = 'hp' | 'attack' | 'defense' | 'critBp' | 'critDamageBp' | 'effectHitBp' | 'effectResistBp' | 'healingBp' | 'shieldBp' | 'initiative';
export type Stats = Record<Stat, number>;
export interface Skill { id: string; name: string; description: string; cooldownRounds: number; chargeCost: number; powerBp: number; target: string }
export interface Card { id: string; name: string; rarity: Rarity; role: Role; flavour: 'hearth' | 'moon' | 'garden'; lore: string; baseStats: Stats; skills: Skill[]; passive: { id: string; name: string; description: string }; levelCap: number }
export interface CardInstance { id: string; cardId: string; level: number; stars: number; shards: number; soulbound: true }
export interface Affix { stat: Stat; value: number; tier: 1 | 2 | 3 }
export interface SetBonus { id: string; name: string; pieces: 2 | 4; stats: Partial<Stats>; description: string }
export interface Item { id: string; name: string; kind: 'equipment'; rarity: Rarity; slot: Slot; fit: Role[]; main: Affix; affixes: Affix[]; setId: string; uniqueEffect?: string; description: string }
export interface ItemInstance { id: string; itemId: string; level: number; enhancement: number; affixes: Affix[]; locked: boolean; favourite: boolean; soulbound: true; source: 'starter' | 'draw' | 'forge' | 'battle'; reforgeCount: number }
export interface StackItem { id: string; name: string; kind: 'material' | 'consumable' | 'key' | 'cosmetic'; rarity: Rarity; source: string; sink: string; description: string }
export interface Inventory { items: ItemInstance[]; stacks: Record<string, number> }
export type Loadout = Partial<Record<Slot, string>>;
export interface Team { id: string; name: string; cardIds: string[] }
export type Odds = Record<Rarity, number>;
export interface GachaBanner { id: string; name: string; kind: 'cat' | 'equipment'; cost: Cost; oddsBp: Odds; softPity: number; hardPity: number; softStepBp: number; featuredCardId?: string; featuredRateBp: number; pityGroup: string; description: string }
export interface PityState { sinceLegendary: number; featuredGuaranteed: boolean; totalPulls: number }
export interface GachaResult { index: number; bannerId: string; rarity: Rarity; cardId?: string; itemId?: string; instanceId?: string; duplicate: boolean; shards: number; pityBefore: number; oddsBp: Odds; soulbound: true; tradeable: false }
export interface Reward { currencies: Cost; xp: number; items?: string[]; stacks?: Record<string, number> }
export interface Quest { id: string; name: string; description: string; cadence: 'daily' | 'weekly' | 'achievement'; metric: 'battles' | 'wins' | 'draws' | 'enhances' | 'bossWins' | 'service'; target: number; reward: Reward }
export interface QuestProgress { progress: number; claimed: boolean }
export interface ForgeRecipe { id: string; name: string; outputItemId?: string; outputStackId?: string; cost: Cost; materials: Record<string, number>; requiredChapter: number; scarcityId?: string; description: string }
export interface ScarcityInfo { id: string; name: string; rarity: 'epic' | 'legendary'; relicId: 3 | 4; rarityIndex: 2 | 3; globalCap: number; seasonCap: number; issuedDesign: number; seasonIssuedDesign: number; mintedSoFar: 0; soulbound: true; futureTradeable: true; chainId: 43113; status: typeof CHAIN_NOTICE; path: string }
export interface BattleRewardPayload { id: string; runId: number; chapterId: string; won: boolean; wavesCleared: number; rounds: number; reward: Reward; firstClear: boolean; eligibleRelicDesign: boolean }
export interface Chapter { id: string; name: string; requiredClears: number; waves: string[][]; boss: string; implemented: boolean; description: string }
export interface Enemy { id: string; name: string; role: string; chapter: number; stats: Pick<Stats, 'hp' | 'attack' | 'defense' | 'initiative'>; intent: string; counter: string; implemented: boolean }
export interface AccountState { version: typeof CONTRACT_VERSION; seed: number; nextId: number; day: number; accountXp: number; accountLevel: number; chapter: number; currencies: Balances; cards: CardInstance[]; inventory: Inventory; loadouts: Record<string, Loadout>; teams: Team[]; activeTeamId: string; pity: Record<string, PityState>; history: GachaResult[]; quests: Record<string, QuestProgress>; claimedBattleIds: string[]; clearedChapters: string[]; daily: { xpEarned?: number; battles: number; service: number; draws: number; earned: Balances }; scarcity: Record<string, ScarcityInfo>; designClaims: string[]; nextRunId: number; pendingRun: { id: number; chapterId: string; seed: number } | null }
export type Event = { type: 'pull.revealed'; result: GachaResult } | { type: 'item.enhanced'; instanceId: string; level: number } | { type: 'item.equipped'; cardId: string; instanceId: string | null; slot: Slot } | { type: 'set.activated'; cardId: string; setId: string; pieces: number } | { type: 'levelUp'; cardId?: string; level: number } | { type: 'reward.claimed'; id: string; reward: Reward } | { type: 'day.advanced'; day: number } | { type: 'item.forged'; id: string } | { type: 'item.salvaged'; id: string } | { type: 'relic.designClaimed'; scarcityId: string; notice: typeof CHAIN_NOTICE };
export type ErrorCode = 'UNKNOWN_ID' | 'INVALID_AMOUNT' | 'INSUFFICIENT_FUNDS' | 'LOCKED' | 'EQUIPPED' | 'WRONG_SLOT' | 'WRONG_ROLE' | 'MAX_LEVEL' | 'NOT_READY' | 'ALREADY_CLAIMED' | 'DAILY_CAP' | 'SUPPLY_CAP' | 'INVALID_TEAM' | 'BATTLE_PENDING';
export interface RuleError { code: ErrorCode; message: string }
export type Result<T = void> = { ok: true; state: AccountState; events: Event[]; value: T } | { ok: false; state: AccountState; events: []; error: RuleError };
export type Preview<T> = { ok: true; value: T } | { ok: false; error: RuleError };
export interface EnhanceResult { instanceId: string; before: number; after: number; cost: Cost }
export interface SalvageResult { instanceId: string; reward: Reward }
export interface EquipPreview { before: Stats; after: Stats; delta: Stats; activatedSets: SetBonus[] }
export type Command = { type: 'pull'; bannerId: string; seed: number; count?: number } | { type: 'equip'; cardId: string; instanceId: string } | { type: 'unequip'; cardId: string; slot: Slot } | { type: 'enhance'; instanceId: string } | { type: 'salvage'; instanceId: string } | { type: 'forge'; recipeId: string } | { type: 'claimQuest'; questId: string } | { type: 'lock'; instanceId: string; locked: boolean; favourite?: boolean } | { type: 'level'; cardId: string } | { type: 'ascend'; cardId: string } | { type: 'reforge'; instanceId: string; affixIndex: number; stat: Stat } | { type: 'selectTeam'; cardIds: string[] } | { type: 'advanceLocalDay' } | { type: 'service'; minutes: number } | { type: 'exchangeShards'; cardId: string; batches: number };
/** Implemented by index.ts; signatures describe the stable UI boundary, not ambient globals. */
export interface RulesApi {
  createStarterAccount(seed?: number): AccountState;
  applyCommand(state: AccountState, command: Command): Result<unknown>;
  pull(bannerId: string, state: AccountState, seed: number, count?: number): Result<GachaResult[]>;
  equip(state: AccountState, cardId: string, instanceId: string): Result;
  unequip(state: AccountState, cardId: string, slot: Slot): Result;
  enhance(state: AccountState, instanceId: string): Result<EnhanceResult>;
  salvage(state: AccountState, instanceId: string): Result<SalvageResult>;
  forge(state: AccountState, recipeId: string): Result<string>;
  claimQuest(state: AccountState, questId: string): Result<Reward>;
  applyBattleRewards(state: AccountState, payload: BattleRewardPayload): Result<Reward>;
  computeCardStats(state: AccountState, cardId: string): Stats;
  previewEnhance(state: AccountState, instanceId: string): Preview<EnhanceResult>;
}
