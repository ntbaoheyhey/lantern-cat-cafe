import { TURN_CONFIG, TURN_KITS, TURN_SKILLS } from '../squad/turn/config';
import { CARD_RPG_CONFIG as C } from './config';
import { CHAIN_NOTICE, EQUIPMENT_SLOTS, RARITY_ORDER, type Card, type Chapter, type Enemy, type ForgeRecipe, type GachaBanner, type Item, type Quest, type Role, type ScarcityInfo, type SetBonus, type StackItem, type Stats } from './contract';
const roster = [
  ['mochi', 'Mochi', 'common', 'guardian', 'hearth', 'The cafe door never closes on a cold traveler.'],
  ['soot', 'Soot', 'common', 'witch', 'moon', 'A lantern keeper who reads tomorrow in spilled cocoa.'],
  ['clover', 'Clover', 'common', 'alchemist', 'garden', 'Every chipped cup deserves a second steep.'],
  ['panko', 'Panko', 'rare', 'guardian', 'garden', 'A patient baker who shelters seedlings beneath a bread pan.'],
  ['mallow', 'Mallow', 'rare', 'witch', 'hearth', 'Small sparks rise from a whisk full of impossible wishes.'],
  ['sorrel', 'Sorrel', 'rare', 'alchemist', 'moon', 'A midnight brewer measuring moonlight by the teaspoon.'],
  ['biscuit', 'Biscuit', 'epic', 'guardian', 'hearth', 'The oldest recipe in the cafe is standing together.'],
  ['inkcap', 'Inkcap', 'epic', 'witch', 'garden', 'Mushroom ink sketches a safe path through the thicket.'],
  ['cinnamon', 'Cinnamon', 'epic', 'alchemist', 'hearth', 'A warm kitchen is medicine before the first sip.'],
  ['brioche', 'Brioche', 'legendary', 'guardian', 'moon', 'Keeps the night shift beneath an apron embroidered with stars.'],
  ['velvet', 'Velvet', 'legendary', 'witch', 'moon', 'Collects lost lantern flames and returns them to the sky.'],
  ['marigold', 'Marigold', 'legendary', 'alchemist', 'garden', 'Tends the first tea plant, one careful leaf at a time.'],
] as const;
export const CARDS: readonly Card[] = roster.map(([id, name, rarity, role, flavour, lore]) => {
  const s = TURN_CONFIG.stats[role];
  const baseStats: Stats = { hp: s.hp, attack: s.attack, defense: s.defense, critBp: Math.round(s.crit * 10000), critDamageBp: 5000, effectHitBp: 0, effectResistBp: 0, healingBp: 0, shieldBp: 0, initiative: s.initiative };
  // Role variants, not disguised new combat kits. Signature trait is a horizontal stat choice.
  if (id !== 'mochi' && id !== 'soot' && id !== 'clover') {
    if (flavour === 'hearth') { baseStats.shieldBp = 500; baseStats.effectResistBp = 500; }
    if (flavour === 'moon') { baseStats.critBp += 200; baseStats.effectHitBp = 500; }
    if (flavour === 'garden') { baseStats.healingBp = 500; baseStats.hp += 15; }
  }
  return { id, name, rarity, role, flavour, lore, baseStats, levelCap: C.rarity[rarity].cap,
    skills: TURN_KITS[role].map(skillId => { const s = TURN_SKILLS[skillId]!; return { id: s.id, name: s.name, description: s.description, cooldownRounds: s.cooldown, chargeCost: s.chargeCost, powerBp: Math.round(s.power * 10000), target: s.target }; }),
    passive: { id: `${id}-hospitality`, name: `${name}'s Hospitality`, description: role === 'guardian' ? 'A trained guard shelters allies; flavour traits are included in base stats.' : role === 'witch' ? 'A trained caster gathers charge; flavour traits are included in base stats.' : 'A trained brewer shields an injured patient; flavour traits are included in base stats.' } };
});
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c])) as Record<string, Card>;
export const SET_BONUSES: readonly SetBonus[] = [
  { id: 'hearthloom', name: 'Hearthloom', pieces: 2, stats: { defense: 5, shieldBp: 600 }, description: '+5 DEF, +6% shielding.' },
  { id: 'hearthloom', name: 'Hearthloom', pieces: 4, stats: { hp: 30, shieldBp: 600 }, description: '+30 HP, another +6% shielding.' },
  { id: 'moonwick', name: 'Moonwick', pieces: 2, stats: { attack: 6, critBp: 200 }, description: '+6 ATK, +2% critical chance.' },
  { id: 'moonwick', name: 'Moonwick', pieces: 4, stats: { effectHitBp: 800, critDamageBp: 1000 }, description: '+8% effect hit, +10% critical bonus damage.' },
  { id: 'mossbrew', name: 'Mossbrew', pieces: 2, stats: { healingBp: 600, hp: 15 }, description: '+6% healing, +15 HP.' },
  { id: 'mossbrew', name: 'Mossbrew', pieces: 4, stats: { healingBp: 600, effectResistBp: 1000 }, description: 'Another +6% healing, +10% effect resistance.' },
];
export const ITEMS: readonly Item[] = (['hearthloom', 'moonwick', 'mossbrew'] as const).flatMap((setId, si) => RARITY_ORDER.flatMap((rarity, ri) => EQUIPMENT_SLOTS.map((slot, sl) => {
  const role = (['guardian', 'witch', 'alchemist'] as const)[si]!;
  const name = ({ weapon: ['Pan', 'Needle', 'Kettle'], outfit: ['Apron', 'Shawl', 'Vest'], charm: ['Bell', 'Button', 'Leaf'], relic: ['Cup', 'Wick', 'Snowdrop'] })[slot][si]!;
  const mainStat = (['attack', 'hp', 'defense', 'hp'] as const)[sl]!;
  const mainValue = ([12, 45, 6, 25][sl]!) + ri * ([4, 12, 2, 8][sl]!);
  const pools: Item['affixes'] = [{ stat: 'defense', value: 2 + ri, tier: 1 }, { stat: 'critBp', value: 100 + ri * 50, tier: 2 }, { stat: 'effectResistBp', value: 300, tier: 3 }];
  return { id: `${setId}-${slot}-${rarity}`, name: `${C.rarity[rarity].name} ${SET_BONUSES[si * 2]!.name} ${name}`, kind: 'equipment', rarity, slot, fit: slot === 'weapon' ? [role] : ['guardian', 'witch', 'alchemist'] as Role[], main: { stat: mainStat, value: mainValue, tier: 1 }, affixes: pools.slice(0, C.rarity[rarity].affixes), setId, ...(rarity === 'legendary' ? { uniqueEffect: ['neighborShield', 'efficient', 'renew'][si] } : {}), description: rarity === 'legendary' ? ['Shelter the next ally when guarding.', 'Ultimate skills cost 15 less charge (minimum 70).', 'Healing skills restore 18 extra HP.'][si]! : 'A cafe-made piece with a predictable enhancement path.' };
})));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i])) as Record<string, Item>;
export const BANNERS: readonly GachaBanner[] = [
  { id: 'standard', name: 'Cafe Guestbook', kind: 'cat', cost: { stamps: C.drawCost }, oddsBp: C.odds, softPity: C.pity.soft, hardPity: C.pity.hard, softStepBp: C.pity.stepBp, featuredRateBp: 0, pityGroup: 'cats-standard', description: 'Earned stamps only. Unowned cats preferred within the rolled rarity.' },
  { id: 'featured', name: 'Marigold at Closing Time', kind: 'cat', cost: { stamps: C.drawCost }, oddsBp: C.odds, softPity: C.pity.soft, hardPity: C.pity.hard, softStepBp: C.pity.stepBp, featuredCardId: 'marigold', featuredRateBp: C.pity.featuredBp, pityGroup: 'cats-featured', description: 'Legendary: 50% Marigold; after a miss the next legendary is Marigold. Pity carries within this group.' },
  { id: 'equipment', name: 'Mending Basket', kind: 'equipment', cost: { stamps: C.drawCost }, oddsBp: C.gearOdds, softPity: C.pity.soft, hardPity: C.pity.hard, softStepBp: C.pity.stepBp, featuredRateBp: 0, pityGroup: 'gear', description: 'Soulbound gear only. Missing templates preferred within rolled rarity.' },
];
export const STACK_ITEMS: readonly StackItem[] = [
  { id: 'boss-proof', name: 'Yarnkeeper Seal', kind: 'material', rarity: 'epic', source: 'First rewarded boss clear of a local day', sink: 'Deterministic Relic design recipes', description: 'Earned effort evidence; never sold or drawn.' },
  { id: 'milk-tonic', name: 'Warm Milk Tonic', kind: 'consumable', rarity: 'common', source: 'Pantry recipe', sink: 'One battle action', description: 'Restore 150 HP; finite battle supplies.' },
  { id: 'pantry-key', name: 'Pantry Key', kind: 'key', rarity: 'rare', source: 'Weekly quest', sink: 'Pantry refill recipe', description: 'One key becomes one tonic; never an NFT.' },
  { id: 'cafe-ribbon', name: 'Cafe Ribbon', kind: 'cosmetic', rarity: 'epic', source: 'Deterministic essence recipe', sink: 'Permanent local collection unlock', description: 'A collection badge with no battle stats.' },
];
export const QUESTS: readonly Quest[] = [
  { id: 'daily-patrol', name: 'A Table for Three', description: 'Complete two battles.', cadence: 'daily', metric: 'battles', target: 2, reward: { currencies: { stamps: 100, fish: 100 }, xp: 40 } },
  { id: 'daily-service', name: 'Warm the Kettle', description: 'Complete one ten-minute local cafe service.', cadence: 'daily', metric: 'service', target: 1, reward: { currencies: { stamps: 100, threads: 10 }, xp: 40 } },
  { id: 'weekly-wins', name: 'Seven Good Evenings', description: 'Win ten battles in this local week.', cadence: 'weekly', metric: 'wins', target: 10, reward: { currencies: { stamps: 300, essence: 5 }, xp: 100, stacks: { 'pantry-key': 1 } } },
  { id: 'first-boss', name: 'Untangle the Giant', description: 'Win a campaign.', cadence: 'achievement', metric: 'bossWins', target: 1, reward: { currencies: { essence: 15 }, xp: 150 } },
  { id: 'mender', name: 'A Stitch Remembered', description: 'Enhance equipment six times.', cadence: 'achievement', metric: 'enhances', target: 6, reward: { currencies: { stamps: 100 }, xp: 100 } },
];
export const RECIPES: readonly ForgeRecipe[] = [
  ...(['hearthloom', 'moonwick', 'mossbrew'] as const).flatMap(set => EQUIPMENT_SLOTS.map(slot => ({ id: `sew-${set}-${slot}`, name: `Sew ${set} ${slot}`, outputItemId: `${set}-${slot}-rare`, cost: { fish: 180, threads: 30 }, materials: {}, requiredChapter: 1, description: 'Choose a guaranteed rare piece. Completing a set never needs a lucky draw.' }))),
  { id: 'pantry-tonic', name: 'Brew Warm Milk', outputStackId: 'milk-tonic', cost: { fish: 40 }, materials: { 'pantry-key': 1 }, requiredChapter: 1, description: 'One key, one finite battle tonic.' },
  { id: 'cafe-ribbon', name: 'Weave Cafe Ribbon', outputStackId: 'cafe-ribbon', cost: { essence: 10, threads: 20 }, materials: {}, requiredChapter: 1, description: 'One cosmetic collection badge; duplicates rejected.' },
  { id: 'design-moon-collar', name: 'Moon Collar Design', cost: { fish: 900, threads: 120, essence: 15 }, materials: { 'boss-proof': 3 }, requiredChapter: 2, scarcityId: 'moon-collar', description: 'Three rewarded boss days; local capped eligibility only. Design only, not minted.' },
  { id: 'design-golden-maneki', name: 'Golden Maneki Design', cost: { fish: 2400, threads: 300, essence: 30 }, materials: { 'boss-proof': 10 }, requiredChapter: 2, scarcityId: 'golden-maneki', description: 'Ten rewarded boss days; local capped eligibility only. Design only, not minted.' },
];
export const SCARCITY: readonly ScarcityInfo[] = [
  { id: 'moon-collar', name: 'Moon Collar', rarity: 'epic', relicId: 3, rarityIndex: 2, globalCap: C.scarcity.epic.global, seasonCap: C.scarcity.epic.season, issuedDesign: 0, seasonIssuedDesign: 0, mintedSoFar: 0, soulbound: true, futureTradeable: true, chainId: 43113, status: CHAIN_NOTICE, path: 'Three rewarded boss days + deterministic forge; one eligibility per account per season.' },
  { id: 'golden-maneki', name: 'Golden Maneki', rarity: 'legendary', relicId: 4, rarityIndex: 3, globalCap: C.scarcity.legendary.global, seasonCap: C.scarcity.legendary.season, issuedDesign: 0, seasonIssuedDesign: 0, mintedSoFar: 0, soulbound: true, futureTradeable: true, chainId: 43113, status: CHAIN_NOTICE, path: 'Ten rewarded boss days + deterministic forge; one eligibility per account per season.' },
];
export const CHAPTERS: readonly Chapter[] = [
  { id: 'cafe-patrol', name: 'The Tangled Cafe', requiredClears: 0, waves: [['button-guard', 'sock-skipper'], ['spool-ram', 'needle-moth'], ['teacup-healer', 'kettle-knight']], boss: 'yarn-giant', implemented: true, description: 'Playable: existing three-wave patrol and Yarn Giant campaign.' },
  { id: 'rooftop-orchard', name: 'Rooftop Orchard', requiredClears: 1, waves: [['pollen-scout', 'spool-ram'], ['rain-spool', 'needle-moth'], ['pollen-scout', 'teacup-healer']], boss: 'rain-spool', implemented: false, description: 'Design chapter: row hazards and cleansing. Later playable content.' },
  { id: 'midnight-pantry', name: 'Midnight Pantry', requiredClears: 2, waves: [['crumb-sentinel', 'sock-skipper'], ['crumb-sentinel', 'kettle-knight'], ['teacup-healer', 'needle-moth']], boss: 'pantry-crown', implemented: false, description: 'Design chapter: timed interrupts and limited supplies. Later playable content.' },
];
export const ENEMIES: readonly Enemy[] = [
  ['button-guard','Button Guard','guard','Front guard; interrupt the heavy hit.'], ['sock-skipper','Sock Skipper','flanker','Rear hunter; guard the wounded cat.'], ['spool-ram','Spool Ram','charger','Charged attack; break its intent.'], ['needle-moth','Needle Moth','ranger','Rear volley; shield before impact.'], ['teacup-healer','Teacup Healer','healer','Heal the weakest foe; focus it first.'], ['kettle-knight','Kettle Knight','elite','Heavy armor; coordinate burst.'], ['yarn-giant','Yarn Giant','yarn','Row sweep and binds; rescue and interrupt.'], ['binding-thread','Binding Thread','thread','Restrains an ally; destroy the thread.'], ['practice-cushion','Practice Cushion','dummy','Training target; test a build.'], ['pollen-scout','Pollen Scout','ranger','Design: telegraphed garden volley.'], ['rain-spool','Rain Spool','charger','Design: cleanse a soaked row.'], ['crumb-sentinel','Crumb Sentinel','guard','Design: swap focus when it braces.'], ['pantry-crown','Pantry Crown','yarn','Design: alternate row pressure.'],
].map(([id,name,role,intent], index) => ({ id:id!, name:name!, role:role!, chapter:index<9?1:index<11?2:3, stats:{...TURN_CONFIG.stats[role as keyof typeof TURN_CONFIG.stats]}, intent:intent!, counter:intent!.split(';')[1]?.trim()??'Read the committed intent before choosing.', implemented:index<9 }));
