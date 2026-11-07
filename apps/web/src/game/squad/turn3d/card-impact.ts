// Pure animation data: safe for the presenter without importing three.js or models.
import { STARTER_SKILL_CLIPS } from './card-motion-data';
import { ROSTER_SKILL_CLIPS } from './card-roster-motion';
import { BATCH2_SKILL_CLIPS } from './card-roster-batch2-motion';
import { BATCH3_SKILL_CLIPS } from './card-roster-batch3-motion';
import { ENEMY_BATCH1_CLIPS } from './card-enemy-batch1-motion';
import { ENEMY_BATCH2_CLIPS } from './card-enemy-batch2-motion';
import { ENEMY_BATCH3_CLIPS } from './card-enemy-batch3-motion';
import { ENEMY_BATCH4_CLIPS } from './card-enemy-batch4-motion';
import { BOSS_SKILL_CLIPS } from './card-boss-motion';
const holds = new Map([
 STARTER_SKILL_CLIPS,ROSTER_SKILL_CLIPS,BATCH2_SKILL_CLIPS,BATCH3_SKILL_CLIPS,
 ENEMY_BATCH1_CLIPS,ENEMY_BATCH2_CLIPS,ENEMY_BATCH3_CLIPS,ENEMY_BATCH4_CLIPS,BOSS_SKILL_CLIPS,
].flatMap(group=>Object.values(group).flatMap(clips=>clips.map(clip=>[clip.id,clip.travel?.hold] as const))));
/** Undefined preserves the previous presenter behavior for unrelated battle modes. */
export const cardImpactHold = (presentationId?:string) => presentationId ? holds.get(presentationId) : undefined;
