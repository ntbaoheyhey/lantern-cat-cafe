import type { HeroRole, Loadout } from './types';

export interface Gear { id: string; name: string; slot: 'weapon' | 'charm'; role?: HeroRole; help: string; cost: number; set?: 'ember' | 'hearth' | 'hunt' }
export const GEAR: readonly Gear[] = [
  { id: 'starter', name: 'Trusted tool', slot: 'weapon', help: 'A familiar weapon. No special effect.', cost: 0 },
  { id: 'plain', name: 'Cozy scarf', slot: 'charm', help: 'A comfortable starting scarf.', cost: 0 },
  { id: 'counter', name: 'Kettle lid', slot: 'weapon', role: 'guardian', help: 'Three guarded hits charge the next Bash: +60% damage and +35 break.', cost: 30, set: 'hearth' },
  { id: 'cinder', name: 'Cinder lantern', slot: 'weapon', role: 'witch', help: 'Ember Orb reaches 35 pixels farther and burns for 2 extra seconds.', cost: 30, set: 'ember' },
  { id: 'overflow', name: 'Milk pitcher', slot: 'weapon', role: 'alchemist', help: 'Every effective heal leaves a shield equal to 30% of healing.', cost: 30, set: 'hearth' },
  { id: 'ambush', name: 'Silver teaspoons', slot: 'weapon', role: 'rogue', help: 'Pounce interrupts a support enemy and adds 35 boss break.', cost: 30, set: 'hunt' },
  { id: 'needle', name: 'Needle bow', slot: 'weapon', role: 'archer', help: 'Basic arrows pierce one extra enemy in the same row.', cost: 30, set: 'hunt' },
  { id: 'hearth', name: 'Hearth ribbon', slot: 'charm', help: '+12% HP. With a Hearth weapon: healing is 15% stronger.', cost: 25, set: 'hearth' },
  { id: 'ember', name: 'Ember brooch', slot: 'charm', help: '10% shorter skill cooldowns. With an Ember weapon: Orb splashes for +20% damage.', cost: 25, set: 'ember' },
  { id: 'hunt', name: 'Star bell', slot: 'charm', help: '+10% crit chance. With a Hunt weapon: marked enemies take another 10% damage.', cost: 25, set: 'hunt' },
];
export const gearById = (id: string) => GEAR.find(g => g.id === id);
export const defaultLoadout = (role: HeroRole): Loadout => ({ role, weapon: 'starter', charm: 'plain' });
export const PRESETS: Record<'hearth' | 'cinders' | 'hunters', HeroRole[]> = { hearth: ['guardian', 'witch', 'alchemist'], cinders: ['witch', 'witch', 'alchemist'], hunters: ['guardian', 'rogue', 'archer'] };
export function validLoadout(value: unknown): value is Loadout {
  if (!value || typeof value !== 'object') return false;
  const x = value as Loadout;
  return ['guardian', 'witch', 'alchemist', 'rogue', 'archer'].includes(x.role) && (['weapon', 'charm'] as const).every(slot => {
    const g = gearById(x[slot]); return g?.slot === slot && (!g.role || g.role === x.role);
  });
}
