import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
import type {GearSlot,SquadItem} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
/** Optional, rendering-only descriptors. Never passed back to combat rules. */
export type EquipmentAppearance=Partial<Record<GearSlot,SquadItem>>;
export type ActorAppearance=(actor:TurnActor)=>EquipmentAppearance;
