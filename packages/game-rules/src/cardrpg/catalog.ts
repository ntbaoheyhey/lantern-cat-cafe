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
  const baseStats: Stats = { hp: C.roleStats[role].hp, attack: s.attack, defense: C.roleStats[role].defense, critBp: Math.round(s.crit * 10000), critDamageBp: C.baseCritDamageBp, effectHitBp: 0, effectResistBp: 0, healingBp: 0, shieldBp: 0, initiative: s.initiative };
  // Role variants, not disguised new combat kits. Signature trait is a horizontal stat choice.
  if (id !== 'mochi' && id !== 'soot' && id !== 'clover') {
    for (const [stat,value] of Object.entries(C.cardTraits[flavour])) baseStats[stat as keyof Stats] += value;
  }
  return { id, name, rarity, role, flavour, lore, baseStats, levelCap: C.rarity[rarity].cap,
    skills: TURN_KITS[role].map(skillId => { const s = TURN_SKILLS[skillId]!; return { id: s.id, name: s.name, description: s.description.replaceAll('Mochi',name), cooldownRounds: s.cooldown, chargeCost: s.chargeCost, powerBp: Math.round(s.power * 10000), target: s.target }; }),
    passive: { id: `${id}-hospitality`, name: `${name}'s Hospitality`, description: role === 'guardian' ? 'A trained guard shelters allies; flavour traits are included in base stats.' : role === 'witch' ? 'A trained caster gathers charge; flavour traits are included in base stats.' : 'A trained brewer shields an injured patient; flavour traits are included in base stats.' } };
});
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c])) as Record<string, Card>;
export const SET_BONUSES: readonly SetBonus[] = [
  { id: 'hearthloom', name: 'Hearthloom', pieces: 2, stats: { ...C.sets.hearthTwo }, description: '+5 DEF, +6% shielding.' },
  { id: 'hearthloom', name: 'Hearthloom', pieces: 4, stats: { ...C.sets.hearthFour }, description: '+30 HP, another +6% shielding.' },
  { id: 'moonwick', name: 'Moonwick', pieces: 2, stats: { ...C.sets.moonTwo }, description: '+6 ATK, +2% critical chance.' },
  { id: 'moonwick', name: 'Moonwick', pieces: 4, stats: { ...C.sets.moonFour }, description: '+8% effect hit, +10% critical bonus damage.' },
  { id: 'mossbrew', name: 'Mossbrew', pieces: 2, stats: { ...C.sets.mossTwo }, description: '+6% healing, +15 HP.' },
  { id: 'mossbrew', name: 'Mossbrew', pieces: 4, stats: { ...C.sets.mossFour }, description: 'Another +6% healing, +10% effect resistance.' },
];
export const ITEMS: readonly Item[] = (['hearthloom', 'moonwick', 'mossbrew'] as const).flatMap((setId, si) => RARITY_ORDER.flatMap((rarity, ri) => EQUIPMENT_SLOTS.map((slot, sl) => {
  const role = (['guardian', 'witch', 'alchemist'] as const)[si]!;
  const name = ({ weapon: ['Pan', 'Needle', 'Kettle'], outfit: ['Apron', 'Shawl', 'Vest'], charm: ['Bell', 'Button', 'Leaf'], relic: ['Cup', 'Wick', 'Snowdrop'] })[slot][si]!;
  const mainStat = (['attack', 'hp', 'defense', 'hp'] as const)[sl]!;
  const mainValue = C.gear.mainBase[sl]! + ri * C.gear.mainPerTier[sl]!;
  const pools: Item['affixes'] = [{ stat: 'defense', value: C.gear.defenseAffix + ri, tier: 1 }, { stat: 'critBp', value: C.gear.critAffix + ri * C.gear.critPerTier, tier: 2 }, { stat: 'effectResistBp', value: C.gear.resistAffix, tier: 3 }];
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
  ...([['shield-biscuit','Shield Biscuit','shieldBiscuit'],['quicken-yarn','Quicken Yarn','quickenYarn'],['cleanse-tea','Clearleaf Tea','cleanseTea'],['ultimate-treat','Starlight Treat','ultimateTreat']] as const).map(([id,name,skill]) => ({ id,name,kind:'consumable' as const,rarity:'rare' as const,source:'Pantry recipe',sink:'One battle action',description:TURN_SKILLS[skill]!.description })),
  { id: 'pantry-key', name: 'Pantry Key', kind: 'key', rarity: 'rare', source: 'Weekly quest or deterministic thread mending', sink: 'Pantry refill recipe', description: 'One key becomes one tonic; never an NFT.' },
  { id: 'cafe-ribbon', name: 'Cafe Ribbon', kind: 'cosmetic', rarity: 'epic', source: 'Deterministic essence recipe', sink: 'Permanent local collection unlock', description: 'A collection badge with no battle stats.' },
];
export const QUESTS: readonly Quest[] = [
  { id: 'daily-patrol', name: 'A Table for Three', description: 'Complete two battles.', cadence: 'daily', metric: 'battles', ...C.quests.dailyBattles },
  { id: 'daily-service', name: 'Warm the Kettle', description: 'Complete one ten-minute local cafe service.', cadence: 'daily', metric: 'service', ...C.quests.dailyService },
  { id: 'weekly-wins', name: 'Seven Good Evenings', description: 'Win three battles in this local week.', cadence: 'weekly', metric: 'wins', ...C.quests.weeklyWins },
  { id: 'first-boss', name: 'Untangle the Giant', description: 'Win a campaign.', cadence: 'achievement', metric: 'bossWins', ...C.quests.boss },
  { id: 'mender', name: 'A Stitch Remembered', description: 'Enhance equipment six times.', cadence: 'achievement', metric: 'enhances', ...C.quests.mender },
];
export const RECIPES: readonly ForgeRecipe[] = [
  ...(['hearthloom', 'moonwick', 'mossbrew'] as const).flatMap(set => EQUIPMENT_SLOTS.map(slot => ({ id: `sew-${set}-${slot}`, name: `Sew ${set} ${slot}`, outputItemId: `${set}-${slot}-rare`, cost: C.recipes.gear, materials: {}, requiredChapter: 1, description: 'Choose a guaranteed rare piece. Completing a set never needs a lucky draw.' }))),
  ...(['hearthloom', 'moonwick', 'mossbrew'] as const).flatMap(set => EQUIPMENT_SLOTS.map(slot => ({ id: `tailor-${set}-${slot}`, name: `Tailor ${set} ${slot}`, outputItemId: `${set}-${slot}-epic`, cost: C.recipes.epicGear, materials: {}, requiredChapter: 2, description: 'Choose an epic piece using earned essence and spare threads. No random affix roll.' }))),
  { id: 'mend-pantry-key', name: 'Mend Pantry Key', outputStackId: 'pantry-key', cost: C.recipes.pantryKey, materials: {}, requiredChapter: 1, description: 'Forty spare threads become one pantry key for a chosen finite supply.' },
  { id: 'pantry-tonic', name: 'Brew Warm Milk', outputStackId: 'milk-tonic', cost: C.recipes.pantry, materials: { 'pantry-key': 1 }, requiredChapter: 1, description: 'One key, one finite battle tonic.' },
  ...(['shield-biscuit','quicken-yarn','cleanse-tea','ultimate-treat'] as const).map(id => ({id:`pantry-${id}`,name:`Prepare ${id}`,outputStackId:id,cost:C.recipes.pantry,materials:{'pantry-key':1},requiredChapter:1,description:'One pantry key becomes one finite battle supply.'})),
  { id: 'cafe-ribbon', name: 'Weave Cafe Ribbon', outputStackId: 'cafe-ribbon', cost: C.recipes.ribbon, materials: {}, requiredChapter: 1, description: 'One cosmetic collection badge; duplicates rejected.' },
  { id: 'design-moon-collar', name: 'Moon Collar Design', cost: C.recipes.epicDesign, materials: { 'boss-proof': C.recipes.epicProof }, requiredChapter: 2, scarcityId: 'moon-collar', description: 'Three rewarded boss days; local capped eligibility only. Design only, not minted.' },
  { id: 'design-golden-maneki', name: 'Golden Maneki Design', cost: C.recipes.legendaryDesign, materials: { 'boss-proof': C.recipes.legendaryProof }, requiredChapter: 2, scarcityId: 'golden-maneki', description: 'Ten rewarded boss days; local capped eligibility only. Design only, not minted.' },
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
