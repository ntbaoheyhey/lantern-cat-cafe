import type {EffectFrame} from './effects';
export type Motion={travel:number;arc:number;float:number;side:number;hold:number};
const motion=(travel=0,arc=0,float=0,side=0,hold=0):Motion=>({travel,arc,float,side,hold});
export const SKILL_MOTION:Record<string,Motion>={
 guardianBasic:motion(.52,.03,0,-.1,45),shieldBash:motion(.7,0,0,0,75),rally:motion(0,0,.02),hearthwall:motion(0,.12,0,0,85),
 witchBasic:motion(0,0,.08),threadSnare:motion(0,0,.16,.06),emberOrb:motion(0,0,.23,-.08,60),lanternstorm:motion(0,0,.3,0,80),
 alchemistBasic:motion(0,.08,0,.07),milkFlask:motion(0,.04,0,-.04),mossFlask:motion(0,.12,0,.12),nineLives:motion(0,.18,.06,0,40),
 guardAttack:motion(.48,0,0,.05,45),flankerAttack:motion(.74,.27,0,.35,40),rangerAttack:motion(0,0,.18,-.08),healerAttack:motion(0,0,.09,.04),
 chargerAttack:motion(.72,.06,0,0,80),eliteAttack:motion(.6,.2,0,-.15,85),yarnAttack:motion(.15,0,0,.1,90),bindThread:motion(0,0,.03),crossSweep:motion(.12,.08,0,-.12,90),threadAttack:motion(.38,.15,0,.18,40),dummyAttack:motion(.3,.18,0,0,40),
};
export function clipProgress(frame:EffectFrame){const spans={anticipation:[0,.23],travel:[.23,.48],impact:[.48,.57],reaction:[.57,.82],residue:[.82,1]} as const;const [a,b]=spans[frame.beat.kind];return a+(b-a)*frame.progress}
export function movementProgress(frame:EffectFrame){const t=frame.progress,e=t*t*(3-2*t);return frame.beat.kind==='travel'?e:frame.beat.kind==='impact'?1:frame.beat.kind==='reaction'?1-e:0}
