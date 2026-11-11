import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RouteRewards} from './RouteRewards';
afterEach(cleanup);
function model(modern=true){
 const m=new DepthModel(true,modern,modern,modern);m.start(1,'campaign',1);
 const run=m.state.run!;run.current='0-0';run.rewardChoices=['shelter-1','night-1','skill:mochi-2'];run.boons['shelter-1']=1;return m;
}
for(const modern of [true,false])for(const rank of [0,1,2])it(`shows the exact skill rank bonus and purchase (modern=${modern}, rank=${rank})`,()=>{
 const m=model(modern);m.state.run!.upgrades['mochi-2']=rank;
 const before=R.exportSave(m.state),expected=R.chooseReward(m.state,'skill:mochi-2');render(<RouteRewards m={m}/>);
 const button=screen.getByRole('button',{name:/Warm welcome/});
 expect(button.textContent).toContain(`Rank ${rank} → ${rank+1}/3`);expect(button.textContent).toContain(`Effect power +${rank*20}% → +${(rank+1)*20}%.`);
 expect(button.textContent).toContain('Mochi · Skill upgrade');expect(button.textContent).toContain('Status stacks and timing stay the same.');
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(button);expect(m.state).toEqual(expected.state);expect(m.state.run!.current).toBeNull();
});
it.each([true,false])('shows charm stack progress and the correct mode effect (modern=%s)',modern=>{
 const m=model(modern),before=R.exportSave(m.state),expected=R.chooseReward(m.state,'shelter-1');render(<RouteRewards m={m}/>);
 const button=screen.getByRole('button',{name:/Door mat/});expect(button.textContent).toContain('Stack 1 → 2/2');
 expect(screen.getByRole('button',{name:/Late candle/}).textContent).toContain(R.boonForMode('night-1',modern).description);
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(button);expect(m.state).toEqual(expected.state);
});
it('disables a capped skill and charm while retaining another offered choice',()=>{
 const m=model();m.state.run!.upgrades['mochi-2']=3;m.state.run!.boons['shelter-1']=2;const before=R.exportSave(m.state);render(<RouteRewards m={m}/>);
 for(const name of [/Warm welcome/,/Door mat/]){const b=screen.getByRole('button',{name}) as HTMLButtonElement;expect(b.disabled).toBe(true);fireEvent.click(b);}
 expect(screen.getByText('Skill upgrade capped.')).toBeTruthy();expect(screen.getByText('This charm is at its stacking cap.')).toBeTruthy();
 expect(R.exportSave(m.state)).toBe(before);expect((screen.getByRole('button',{name:/Late candle/}) as HTMLButtonElement).disabled).toBe(false);
});
it('revalidates a stale reward against the current offered choices',()=>{
 const m=model();render(<RouteRewards m={m}/>);m.state={...m.state,run:{...m.state.run!,rewardChoices:['night-1']}};const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:/Warm welcome/}));expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(true);
 expect(screen.queryByRole('button',{name:/Warm welcome/})).toBeNull();
});
it('explains a power-free legacy skill instead of promising changed status effects',()=>{
 const m=model(false);m.state.run!.rewardChoices=['skill:mochi-3'];render(<RouteRewards m={m}/>);
 expect(screen.getByRole('button',{name:/Apron crossing/}).textContent).toContain('This skill has no power-based effect to increase.');
});
