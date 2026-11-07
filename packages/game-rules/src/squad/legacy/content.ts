import type { EnemyRole, HeroRole, SkillId } from './types';

export const SKILLS: Record<SkillId, { name: string; cooldown: number; windup: number; travel: number; radius: number; help: string }> = {
  basic: { name: 'Basic attack', cooldown: 0, windup: 6, travel: 6, radius: 0, help: 'Attack the current priority target.' },
  bash: { name: 'Shield Bash', cooldown: 140, windup: 7, travel: 0, radius: 0, help: 'Strike, interrupt and deal 45 break to a boss.' },
  rally: { name: 'Rally', cooldown: 220, windup: 6, travel: 0, radius: 0, help: 'Taunt enemies and reduce incoming damage for 5 seconds.' },
  hearthwall: { name: 'Hearthwall', cooldown: 440, windup: 7, travel: 0, radius: 0, help: 'Shield the whole squad and guard it for 5 seconds.' },
  snare: { name: 'Thread Snare', cooldown: 180, windup: 6, travel: 6, radius: 120, help: 'Hold a group for 2 seconds. Bosses gain 25 break instead.' },
  orb: { name: 'Ember Orb', cooldown: 160, windup: 7, travel: 9, radius: 125, help: 'Burst in an area and burn enemies for 4 seconds. Burn never stacks.' },
  lanternstorm: { name: 'Lanternstorm', cooldown: 460, windup: 9, travel: 9, radius: 1000, help: 'Mark every enemy and strike each with a lantern.' },
  milk: { name: 'Milk Flask', cooldown: 100, windup: 5, travel: 9, radius: 0, help: 'Heal the most injured ally. Held until someone needs it.' },
  moss: { name: 'Moss Flask', cooldown: 200, windup: 6, travel: 9, radius: 155, help: 'A ground patch heals nearby allies every second for 5 seconds.' },
  shelter: { name: 'Nine-Lives Shelter', cooldown: 480, windup: 8, travel: 0, radius: 0, help: 'Cleanse restraints and shield all allies.' },
  volley: { name: 'Debris volley', cooldown: 110, windup: 22, travel: 8, radius: 0, help: 'A marked backline shot. Rally redirects the next volley.' },
  mend: { name: 'Spool stitch', cooldown: 120, windup: 10, travel: 6, radius: 0, help: 'The mender repairs its most injured ally. Focus it first.' },
  charge: { name: 'Button charge', cooldown: 150, windup: 26, travel: 0, radius: 0, help: 'A heavy rush at the backline. Shield Bash can interrupt it.' },
  sweep: { name: 'Yarn sweep', cooldown: 170, windup: 28, travel: 0, radius: 85, help: 'A directional sweep across the marked row. Its knot opens afterward.' },
  thread: { name: 'Binding thread', cooldown: 230, windup: 24, travel: 6, radius: 0, help: 'Bind a cat to a targetable knot. Break the knot or cleanse the thread.' },
};
export const HERO_KITS: Record<HeroRole, { abilities: [SkillId, SkillId]; ultimate: SkillId; passive: string; gear: string }> = {
  guardian: { abilities: ['bash', 'rally'], ultimate: 'hearthwall', passive: 'Steadfast · a successful interrupt grants a shield.', gear: 'Copper lid · hearth apron' },
  witch: { abilities: ['snare', 'orb'], ultimate: 'lanternstorm', passive: 'Kindling · defeating a burning enemy hastens Lanternstorm.', gear: 'Lantern staff · dusk shawl' },
  alchemist: { abilities: ['milk', 'moss'], ultimate: 'shelter', passive: 'Soft landing · Milk Flask leaves a small shield.', gear: 'Milk flask · moss satchel' },
};
export const ENEMIES: Record<EnemyRole, { name: string; hp: number; attack: number; defense: number; interval: number; help: string }> = {
  guard: { name: 'Thimble Guard', hp: 180, attack: 14, defense: 32, interval: 44, help: 'Armored front. Area damage reaches the enemies beside it.' },
  flanker: { name: 'Dust Skitter', hp: 100, attack: 12, defense: 4, interval: 34, help: 'Chases the most injured cat. Rally draws it to the Guardian.' },
  slinger: { name: 'Crumb Slinger', hp: 105, attack: 18, defense: 5, interval: 65, help: 'Targets the backline with a telegraphed volley.' },
  mender: { name: 'Spool Mender', hp: 110, attack: 7, defense: 6, interval: 60, help: 'Repairs injured enemies. Prioritize it to shorten the fight.' },
  charger: { name: 'Button Ram', hp: 160, attack: 28, defense: 16, interval: 65, help: 'Winds up a heavy charge. Bash it before the rush.' },
  yarn: { name: 'Yarn Giant', hp: 1200, attack: 34, defense: 24, interval: 65, help: 'Sweep → exposed knot; binding thread → break the small knot. Adds arrive once at half health.' },
  knot: { name: 'Binding Knot', hp: 55, attack: 0, defense: 0, interval: 99999, help: 'Destroy this knot to free its bound cat.' },
};
export const WAVES: readonly { name: string; roles: EnemyRole[]; budget: number }[] = [
  { name: 'Under the tea table', roles: ['guard', 'flanker', 'slinger'], budget: 100 },
  { name: 'The sewing corner', roles: ['guard', 'charger', 'mender', 'slinger'], budget: 140 },
  { name: 'Trouble on the rug', roles: ['guard', 'charger', 'flanker', 'mender', 'slinger'], budget: 180 },
  { name: 'The tangled hearth', roles: ['yarn'], budget: 250 },
];
