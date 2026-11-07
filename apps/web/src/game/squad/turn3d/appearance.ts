import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
import type {GearSlot,SquadItem} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
/** Optional, rendering-only descriptors. Never passed back to combat rules. */
export type VisualItem = SquadItem & { cardDesign?: string };
export type EquipmentAppearance=Partial<Record<GearSlot,VisualItem>>;
export type ActorAppearance=(actor:TurnActor)=>EquipmentAppearance;
