import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {OutcomeV4} from './PreparationV4';

afterEach(cleanup);
const plans=[
 ['finish','steady','Weak foes','Steady',45],['finish','protect','Weak foes','Protect',65],
 ['support','steady','Their support','Steady',45],['support','protect','Their support','Protect',65],
 ['leader','steady','Their leader','Steady',45],['leader','protect','Their leader','Protect',65],
] as const;
function fixture(plan:R.StandingPlan,legacy=false){
 const state=R.setGameplayA6(R.createDepthAccount(917286,0),true);
 const battle=R.createBattle({seed:917286,chapter:1,cats:R.battleCats(state),enemies:['button-guard'],gameplayV4:true,skillsV5:!legacy,gameplayA6:!legacy,plan});
 const choice=R.legalChoices(battle)[0]!;expect(R.act(battle,choice)).toBe(true);return battle;
}
it.each(plans)('explains the recorded %s/%s plan and preserves its actual decision', (focus,care,target,label,threshold)=>{
 const battle=fixture({focus,care}),decision=battle.v4!.events.find(event=>event.kind==='plan-target')!;
 const before=structuredClone(battle);render(<OutcomeV4 battle={battle}/>);
 expect(screen.getByText(`Recorded plan · Target: ${target}. Care: ${label} — prefer support below ${threshold}% HP.`)).toBeTruthy();
 expect(screen.getByText(`Round ${decision.round} · ${target} · ${label}: ${decision.reason}`)).toBeTruthy();
 expect(screen.queryByText(new RegExp(`${focus}/${care} plan:`))).toBeNull();expect(battle).toEqual(before);
});
it('reads each decision’s own plan when the surrounding battle plan differs',()=>{
 const battle=fixture({focus:'support',care:'protect'}),decision=battle.v4!.events.find(event=>event.kind==='plan-target')!;
 battle.v4!.plan={focus:'leader',care:'steady'};const before=structuredClone(battle);render(<OutcomeV4 battle={battle}/>);
 expect(screen.getByText('Recorded plan · Target: Their leader. Care: Steady — prefer support below 45% HP.')).toBeTruthy();
 expect(screen.getByText(`Round ${decision.round} · Their support · Protect: ${decision.reason}`)).toBeTruthy();expect(battle).toEqual(before);
});
it('formats complete version1 receipts and preserves unfamiliar or incomplete recorded text',()=>{
 const battle=fixture({focus:'finish',care:'steady'},true),decision=battle.v4!.events.find(event=>event.kind==='plan-target')!;
 expect(decision.version).toBe(1);
 battle.v4!.events.push({...decision,sequence:100,reason:'',text:'An older recorded choice without a reason.'});
 battle.v4!.events.push({...decision,sequence:101,plan:{...decision.plan,focus:'future'} as unknown as R.StandingPlan,text:'A future tactic kept as recorded.'});
 const before=structuredClone(battle);render(<OutcomeV4 battle={battle}/>);
 expect(screen.getByText(`Round ${decision.round} · Weak foes · Steady: ${decision.reason}`)).toBeTruthy();
 for(const event of battle.v4!.events.filter(event=>event.kind!=='plan-target'||event.sequence>=100))expect(screen.getByText(`Round ${event.round} · ${event.text}`)).toBeTruthy();
 expect(battle).toEqual(before);
});
