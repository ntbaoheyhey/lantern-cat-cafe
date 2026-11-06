import { CARDS as LEGACY_CARDS } from '../catalog';
import type { Cat, CatRole, Effect, Enemy, Flavour, Row, Skill, SkillType, StatusRule, TargetRule } from './contract';

export const FLAVOURS: Flavour[] = ['hearth', 'garden', 'tide', 'ember', 'moon'];
export const FLAVOUR_RULE = 'Hearth → Garden → Tide → Ember → Moon → Hearth. Advantage adds 1 break pressure, with no damage multiplier.';
export const hasAdvantage = (a: Flavour, b: Flavour) => FLAVOURS[(FLAVOURS.indexOf(a) + 1) % 5] === b;
export const STATUSES: StatusRule[] = [
  { id: 'cozy', name: 'Cozy', kind: 'buff', cap: 3, duration: 2, dispellable: true, tick: 'none', strength: 10, description: 'Reduce direct damage by 10% per stack. Does not reduce scald.' },
  { id: 'scald', name: 'Scald', kind: 'debuff', cap: 5, duration: 3, dispellable: true, tick: 'damage', strength: 12, description: 'Lose 12 HP per stack at round end, bypassing shields. Steep removes one stack when healing.' },
  { id: 'tangle', name: 'Tangle', kind: 'debuff', cap: 2, duration: 2, dispellable: true, tick: 'none', strength: 1, description: 'Direct hits add 1 break pressure per stack. Takes effect immediately.' },
  { id: 'steep', name: 'Steep', kind: 'buff', cap: 3, duration: 3, dispellable: true, tick: 'heal', strength: 18, description: 'Heal 18 HP per stack at round end and remove one Scald stack.' },
  { id: 'crumb', name: 'Crumb trail', kind: 'debuff', cap: 4, duration: 3, dispellable: true, tick: 'none', strength: 24, description: 'Stores 24 damage per stack for a detonation. Detonation consumes all stacks.' },
  { id: 'scent', name: 'Scented', kind: 'debuff', cap: 1, duration: 2, dispellable: true, tick: 'none', strength: 20, description: 'Can be targeted through front-row protection and takes 20% more direct damage.' },
  { id: 'rattled', name: 'Rattled', kind: 'debuff', cap: 2, duration: 2, dispellable: true, tick: 'none', strength: 15, description: 'Direct damage dealt falls by 15% per stack.' },
  { id: 'drowsy', name: 'Drowsy', kind: 'debuff', cap: 1, duration: 1, dispellable: true, tick: 'none', strength: 1, description: 'Committed enemy signature becomes a half-power basic. Every actor still takes its turn.' },
  { id: 'glaze', name: 'Glaze', kind: 'buff', cap: 2, duration: 2, dispellable: true, tick: 'none', strength: 20, description: 'Gain 20 shield per stack when starting a turn, capped at 60% maximum HP.' },
  { id: 'shelter', name: 'Shelter', kind: 'buff', cap: 1, duration: 2, dispellable: true, tick: 'none', strength: 1, description: 'Hostile single-target intents prefer this actor while alive. Row-wide attacks remain row-wide.' },
  { id: 'riposte', name: 'Saucer riposte', kind: 'buff', cap: 2, duration: 2, dispellable: true, tick: 'none', strength: 16, description: 'Each direct hostile hit returns 16 damage per stack. Reflections cannot trigger reflections.' },
  { id: 'hush', name: 'Hush', kind: 'debuff', cap: 1, duration: 2, dispellable: true, tick: 'none', strength: 1, description: 'Enemy heal, summon or shield action becomes a basic. Cat energy skills cost 1 more.' },
  { id: 'brittle', name: 'Brittle sugar', kind: 'debuff', cap: 3, duration: 2, dispellable: true, tick: 'none', strength: 15, description: 'Each direct hit removes an extra 15 shield per stack before damage.' },
  { id: 'link', name: 'Apron link', kind: 'buff', cap: 1, duration: 3, dispellable: true, tick: 'none', strength: 30, description: 'The living source takes 30% of direct HP damage to the linked ally. Shared damage does not chain.' },
  { id: 'sprout', name: 'Second sprout', kind: 'buff', cap: 1, duration: 3, dispellable: false, tick: 'none', strength: 25, description: 'Consume to survive a fatal hit at 25% HP, once per battle per actor.' },
  { id: 'decoy', name: 'Yarn decoy', kind: 'buff', cap: 1, duration: 2, dispellable: true, tick: 'none', strength: 1, description: 'Absorbs the next direct hit entirely, then disappears. Scald passes through.' },
];
export const STATUS_BY_ID = Object.fromEntries(STATUSES.map(s => [s.id, s])) as Record<StatusRule['id'], StatusRule>;

type SkillSpec = [string, SkillType, TargetRule, number, number, number, Effect[], string];
const specs: Record<string, SkillSpec[]> = {
  mochi: [
    ['Door knock','attack','foe',0,0,1,[{kind:'hit',power:90},{kind:'shield',power:18,self:true}],'Strike and shelter yourself.'],
    ['Warm welcome','defend','ally',1,0,0,[{kind:'shield',power:70},{kind:'rally',status:'cozy'}],'Shield an ally and grant Cozy.'],
    ['Apron crossing','defend','ally',2,2,1,[{kind:'swap'},{kind:'rally',status:'link'},{kind:'rally',status:'shelter',self:true}],'Swap rows with an ally and share their damage.'],
    ['Last light shelter','ultimate','allies',2,3,0,[{kind:'shield',power:130},{kind:'rally',status:'cozy',stacks:2}],'Protect the whole table with shields and Cozy.'],
  ],
  soot: [
    ['Cocoa spark','attack','pierce',0,0,1,[{kind:'hit',power:85},{kind:'rally',status:'crumb'}],'Seed a Crumb trail through any row.'],
    ['Black cup','control','foe',1,0,2,[{kind:'hit',power:55},{kind:'rally',status:'scent'}],'Mark a target so every cat can reach it.'],
    ['Lantern wick','attack','foe',2,1,2,[{kind:'hit',power:105},{kind:'detonate',power:150}],'Detonate Crumb trails and Scald for burst damage.'],
    ['Midnight service','ultimate','foes',2,3,2,[{kind:'hit',power:125},{kind:'detonate',power:125},{kind:'rally',status:'hush'}],'Detonate every enemy and quiet utility intents.'],
  ],
  clover: [
    ['Leaf tap','attack','foe',0,0,1,[{kind:'hit',power:80},{kind:'heal',power:18,self:true}],'Tap a foe and tend your own scratches.'],
    ['Patient steep','support','ally',1,0,0,[{kind:'heal',power:35},{kind:'rally',status:'steep'}],'Give a small heal and three rounds of Steep.'],
    ['Clearleaf rinse','support','allies',2,2,0,[{kind:'cleanse'},{kind:'heal',power:45}],'Remove every dispellable debuff and heal all allies.'],
    ['Greenhouse morning','ultimate','allies',2,3,0,[{kind:'heal',power:90},{kind:'rally',status:'sprout'}],'Heal the table and protect each ally from one fatal hit.'],
  ],
  panko: [
    ['Pan reply','attack','foe',0,0,1,[{kind:'hit',power:85},{kind:'rally',status:'riposte',self:true}],'Strike and ready a saucer counter.'],
    ['Bread cover','defend','self',1,0,0,[{kind:'shield',power:80},{kind:'rally',status:'shelter'}],'Draw single-target pressure onto a fresh shield.'],
    ['Crust return','defend','allies',2,2,0,[{kind:'rally',status:'riposte'},{kind:'shield',power:35}],'Let the whole team counter incoming hits.'],
    ['Oven door','ultimate','self',2,3,0,[{kind:'shield',power:180},{kind:'rally',status:'riposte',stacks:2},{kind:'rally',status:'shelter'}],'Become the defended counterattack target.'],
  ],
  mallow: [
    ['Whisk flare','attack','foe',0,0,1,[{kind:'hit',power:100},{kind:'rally',status:'scald'}],'A direct strike leaves a hot aftertaste.'],
    ['Split ember','attack','row',1,0,1,[{kind:'hit',power:60},{kind:'rally',status:'brittle'}],'Chip an entire row and soften its shields.'],
    ['Burnt sugar','attack','foe',2,2,2,[{kind:'hit',power:120},{kind:'consume',power:45}],'Consume your Cozy for extra damage. Protection becomes fuel.'],
    ['Closing blaze','ultimate','foes',2,3,2,[{kind:'hit',power:130},{kind:'rally',status:'scald',stacks:3}],'Set every enemy simmering for three rounds.'],
  ],
  sorrel: [
    ['Moon spoon','attack','foe',0,0,1,[{kind:'hit',power:70},{kind:'energy',power:1}],'Restore 1 shared energy after a light hit.'],
    ['Cold brew','control','pierce',1,0,1,[{kind:'hit',power:50},{kind:'rally',status:'rattled'}],'Reach a dangerous rear attacker and lower its damage.'],
    ['Decanted moon','support','ally',2,2,0,[{kind:'transfer'},{kind:'rally',status:'glaze'}],'Move your shield to an ally and grant shield regeneration.'],
    ['Shared pot','ultimate','allies',1,3,0,[{kind:'heal',power:50},{kind:'energy',power:3},{kind:'rally',status:'glaze'}],'Restore energy once and keep every cup protected.'],
  ],
  biscuit: [
    ['Rolling pin','attack','foe',0,0,2,[{kind:'hit',power:95},{kind:'break',power:1}],'A heavy basic that pressures break.'],
    ['Sideboard step','defend','ally',1,0,0,[{kind:'swap'},{kind:'shield',power:55}],'Trade rows and shield the ally moving with you.'],
    ['Last crumb','attack','pierce',2,2,2,[{kind:'execute',power:165}],'Deal double damage below 30% enemy HP.'],
    ['Bakers procession','ultimate','foe',2,3,3,[{kind:'chain',power:130},{kind:'rally',status:'rattled'}],'Bounce through three living foes and rattle the first.'],
  ],
  inkcap: [
    ['Ink thread','attack','pierce',0,0,1,[{kind:'hit',power:70},{kind:'rally',status:'tangle'}],'Tangle any row for follow-up break pressure.'],
    ['Quiet spores','control','foe',1,0,1,[{kind:'hit',power:45},{kind:'rally',status:'hush'}],'Quiet a healer, shielder or summoner.'],
    ['Paper decoy','defend','ally',2,2,0,[{kind:'rally',status:'decoy'},{kind:'rally',status:'shelter'}],'Place a one-hit decoy where enemies will look.'],
    ['Dreaming canopy','ultimate','foes',2,3,2,[{kind:'hit',power:65},{kind:'rally',status:'drowsy'},{kind:'rally',status:'tangle',stacks:2}],'Soften signatures and prepare every foe for a break.'],
  ],
  cinnamon: [
    ['Spice pinch','attack','foe',0,0,1,[{kind:'hit',power:75},{kind:'drain',power:40}],'Turn part of a hit into self-healing.'],
    ['Comfort cup','support','ally',1,0,0,[{kind:'heal',power:80},{kind:'rally',status:'cozy'}],'Immediate care with a protective aftertaste.'],
    ['Clean apron','support','ally',2,1,0,[{kind:'cleanse'},{kind:'shield',power:85},{kind:'rally',status:'steep'}],'Cleanse, shield and slowly mend one patient.'],
    ['Second serving','ultimate','fallen',2,4,0,[{kind:'revive',power:40}],'Bring one fallen ally back at 40% HP once per battle.'],
  ],
  brioche: [
    ['Bell patrol','attack','foe',0,0,1,[{kind:'hit',power:80},{kind:'rally',status:'glaze',self:true}],'Ring the night bell and renew your shield each turn.'],
    ['Borrowed blanket','defend','ally',1,0,0,[{kind:'transfer'},{kind:'heal',power:30}],'Give your accumulated shield to a hurt ally.'],
    ['Starched collar','control','foe',2,2,2,[{kind:'dispel'},{kind:'hit',power:110},{kind:'rally',status:'brittle'}],'Strip buffs, then crack the enemy shield.'],
    ['Constellation apron','ultimate','allies',2,3,0,[{kind:'shield',power:95},{kind:'rally',status:'link'},{kind:'rally',status:'glaze',stacks:2}],'Link the table to your protection and regenerate shields.'],
  ],
  velvet: [
    ['Silk nick','attack','pierce',0,0,1,[{kind:'hit',power:95},{kind:'rally',status:'scent'}],'Expose a rear target for the team.'],
    ['Candle bounce','attack','foe',1,0,1,[{kind:'chain',power:65}],'Bounce through three living enemies.'],
    ['Stolen flame','control','foe',2,2,2,[{kind:'dispel'},{kind:'hit',power:90},{kind:'energy',power:2}],'Remove buffs and reclaim shared energy.'],
    ['Velvet curtain','ultimate','foe',2,3,3,[{kind:'execute',power:210},{kind:'rally',status:'decoy',self:true}],'Execute a weakened target and vanish behind a decoy.'],
  ],
  marigold: [
    ['Seed stitch','attack','foe',0,0,1,[{kind:'hit',power:65},{kind:'rally',status:'steep',self:true}],'Plant slow healing while helping the offense.'],
    ['Garden bell','support','allies',1,0,0,[{kind:'heal',power:24},{kind:'rally',status:'steep'}],'Start a patient team-wide recovery.'],
    ['Spring pruning','control','foe',2,2,1,[{kind:'dispel'},{kind:'rally',status:'scald',stacks:2},{kind:'rally',status:'crumb',stacks:2}],'Prune buffs and seed two kinds of delayed damage.'],
    ['First tea blossom','ultimate','allies',2,3,0,[{kind:'cleanse'},{kind:'heal',power:110},{kind:'energy',power:2}],'Clear the team, restore health and refill the pot.'],
  ],
};
const identities: Array<[string, CatRole, Flavour, Row, string[], string, string]> = [
  ['mochi','guardian','hearth','front',['shelter','brew'],'Door keeper','Shielding another ally also grants you 12 shield.'],
  ['soot','hexer','moon','rear',['trail','night'],'Ash reader','Detonation restores 10 ultimate charge.'],
  ['clover','healer','garden','rear',['brew','garden'],'Second steep','The first heal each battle also cleanses its patient.'],
  ['panko','guardian','garden','front',['shelter','counter'],'Warm crust','Defend grants Saucer riposte.'],
  ['mallow','striker','ember','front',['ember','trail'],'Hot whisk','Attacking a Scalded target grants 8 ultimate charge.'],
  ['sorrel','controller','tide','rear',['brew','night'],'Measured pour','Gain 1 energy at the start of each odd round.'],
  ['biscuit','striker','hearth','front',['counter','shelter'],'Bakers resolve','Your first low-health strike gains 30 shield.'],
  ['inkcap','controller','garden','rear',['trail','garden'],'Soft landing','First hostile hit is softened by an initial Yarn decoy.'],
  ['cinnamon','healer','ember','rear',['brew','ember'],'Ground spice','Heals below half HP grant 15 shield.'],
  ['brioche','guardian','moon','front',['night','shelter'],'Night watch','Begin each round with 12 shield.'],
  ['velvet','witch','tide','rear',['night','trail'],'Lost flame','Defeating a foe grants 15 charge.'],
  ['marigold','healer','garden','rear',['garden','brew'],'First leaf','Steep on this cat lasts one extra round.'],
];
export const CATS: Cat[] = identities.map(([id, role, flavour, row, tags, passiveName, description]) => ({
  id, name: LEGACY_CARDS.find(c => c.id === id)!.name, role, flavour, row, tags,
  passive: { id: `${id}-passive`, name: passiveName, description },
  skills: specs[id]!.map(([name,type,target,cost,cooldown,breakPower,effects,description], index): Skill => ({
    id: `${id}-${index + 1}`, catId: id, name, type, target, cost, cooldown, breakPower, effects, description,
    charge: index === 3 ? 80 : 0, unlockLevel: index === 3 ? 6 : 1, unlockStars: index === 3 ? 3 : 1,
  })),
}));
export const CAT_BY_ID = Object.fromEntries(CATS.map(c => [c.id,c])) as Record<string, Cat>;
export const SKILLS = Object.fromEntries(CATS.flatMap(c => c.skills.map(s => [s.id,s]))) as Record<string, Skill>;
export const TEAM_COMBOS = [
  { id:'warm-table', name:'Warm table', tags:['shelter','brew'], description:'A guardian and brewer grant every cat 20 opening shield.' },
  { id:'night-garden', name:'Night garden', tags:['night','garden'], description:'Night and garden grant 10 starting ultimate charge.' },
  { id:'crumb-circuit', name:'Crumb circuit', tags:['trail','ember'], description:'Trail and ember grant 1 extra first-round energy. Detonation consumes Scald, shortening its damage over time.' },
];
export const teamCombos = (ids: string[]) => TEAM_COMBOS.filter(c => c.tags.every(tag => ids.some(id => CAT_BY_ID[id]?.tags.includes(tag))));

export const ENEMIES: Enemy[] = [
  {id:'button-guard',name:'Button Guard',role:'guard',flavour:'garden',row:'front',tier:'regular',hp:210,attack:48,defense:25,breakCap:4,mechanic:'shield',intent:'Button brace grants shields to its row.',counter:'Hush stops the brace. Brittle strips shield faster.',phases:[],chapter:1},
  {id:'sock-skipper',name:'Sock Skipper',role:'flanker',flavour:'ember',row:'rear',tier:'regular',hp:165,attack:54,defense:8,breakCap:3,mechanic:'steal',intent:'Pocket skip steals 1 shared energy and hits the rear.',counter:'Break it before its turn or lure it with Shelter.',phases:[],chapter:1},
  {id:'spool-ram',name:'Spool Ram',role:'charger',flavour:'moon',row:'front',tier:'elite',hp:300,attack:74,defense:16,breakCap:5,mechanic:'charge',intent:'Every third round charges a double-power front-row sweep.',counter:'Fill break to interrupt. Defend reduces the sweep.',phases:[],chapter:1},
  {id:'needle-moth',name:'Needle Moth',role:'ranger',flavour:'tide',row:'rear',tier:'regular',hp:155,attack:43,defense:6,breakCap:3,mechanic:'dot',intent:'Needle rain applies Scald to the rear row.',counter:'Cleanse Scald or interrupt with Drowsy.',status:'scald',phases:[],chapter:1},
  {id:'teacup-healer',name:'Teacup Healer',role:'healer',flavour:'garden',row:'rear',tier:'regular',hp:180,attack:35,defense:10,breakCap:3,mechanic:'heal',intent:'Refills the most wounded ally by 65 HP.',counter:'Apply Hush or reach the rear with a Scented mark.',phases:[],chapter:1},
  {id:'kettle-knight',name:'Kettle Knight',role:'elite',flavour:'ember',row:'front',tier:'elite',hp:340,attack:62,defense:35,breakCap:6,mechanic:'reflect',intent:'Reflects 12 damage per hit while its shield holds.',counter:'Dispel Cozy, apply Brittle, then break its shield.',phases:[],chapter:2},
  {id:'yarn-giant',name:'Yarn Giant',role:'yarn',flavour:'garden',row:'front',tier:'boss',hp:820,attack:80,defense:22,breakCap:7,mechanic:'bind',intent:'Every third round Loomfall sweeps the front and Tangled threads appear.',counter:'Hearth hits add break. Break before Loomfall, cleanse Tangle.',status:'tangle',phases:['Winding','At 50% HP, Loomfall also reaches the rear'],chapter:1},
  {id:'binding-thread',name:'Binding Thread',role:'thread',flavour:'moon',row:'rear',tier:'regular',hp:90,attack:25,defense:0,breakCap:2,mechanic:'snare',intent:'Knots apply Tangle to the weakest cat.',counter:'Clear the small thread or cleanse the knot.',status:'tangle',phases:[],chapter:1},
  {id:'practice-cushion',name:'Practice Cushion',role:'dummy',flavour:'garden',row:'front',tier:'regular',hp:230,attack:14,defense:0,breakCap:3,mechanic:'lesson',intent:'A gentle third-round bump teaches a break interrupt.',counter:'Two Hearth hits and a break skill stop the bump.',phases:[],chapter:1},
  {id:'pollen-scout',name:'Pollen Scout',role:'ranger',flavour:'tide',row:'rear',tier:'elite',hp:270,attack:54,defense:10,breakCap:5,mechanic:'summon',intent:'Every third round plants a Binding Thread, up to two.',counter:'Hush prevents planting. Defeat threads before they multiply pressure.',phases:[],chapter:2},
  {id:'rain-spool',name:'Rain Spool',role:'charger',flavour:'ember',row:'front',tier:'boss',hp:1050,attack:85,defense:24,breakCap:8,mechanic:'storm',intent:'Every third round Cloudburst washes shields away before a row hit.',counter:'Tide adds break. Use Steep and healing instead of stacking shields.',status:'rattled',phases:['Collecting rain','At 50% HP, Cloudburst targets both rows'],chapter:2},
  {id:'crumb-sentinel',name:'Crumb Sentinel',role:'guard',flavour:'moon',row:'front',tier:'elite',hp:360,attack:68,defense:22,breakCap:6,mechanic:'bomb',intent:'Every third round Sugar burst detonates Crumb trails on cats.',counter:'Cleanse Crumb trails before the signature, or break the sentinel.',status:'crumb',phases:[],chapter:3},
  {id:'pantry-crown',name:'Pantry Crown',role:'yarn',flavour:'tide',row:'rear',tier:'boss',hp:1220,attack:92,defense:25,breakCap:9,mechanic:'banquet',intent:'Every third round Empty banquet drains energy and silences the table.',counter:'Garden adds break. Reserve energy and cleanse Hush.',status:'hush',phases:['Counting cups','At 50% HP, signatures summon a Binding Thread'],chapter:3},
];
export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id,e])) as Record<string, Enemy>;
