import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {firstInvitation} from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import {DepthModel} from '../depth/model';
import RecruitV3 from './RecruitV3';
beforeEach(()=>vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}})));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const ready=()=>{const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(826081,0),true);m.state.freeInvite=true;m.state.settings.reducedMotion=true;return m;};
const purchase=(count:number)=>screen.getByRole('group',{name:`${count} invitation purchase`});
const button=(count:number)=>within(purchase(count)).getByRole('button');

it('previews the stamp spend and mark gain without revealing or acquiring the draw',()=>{
 const m=ready();m.state.v4!.selectorMarks=23;const before=R.exportSave(m.state),expected=R.metaCommand(m.state,{type:'pull',bannerId:'standard',count:1,seed:m.state.account.seed+39});
 render(<RecruitV3 m={m}/>);expect(purchase(1).textContent).toContain('600 → 540 stamps · +1 mark.');expect(purchase(10).textContent).toContain('600 → 0 stamps · +10 marks.');expect(screen.getByText(/23 marks saved · 24 choose/)).toBeTruthy();expect(screen.queryByLabelText('Invitation results')).toBeNull();expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(button(1));expect(m.state).toEqual(expected.state);expect(screen.getByText(/24 marks saved · 24 choose/)).toBeTruthy();expect(screen.getByLabelText('Invitation results').querySelectorAll('article')).toHaveLength(1);
});

it('discloses every shortage and keeps a ten-item purchase atomic',()=>{
 const m=ready();m.state.account.currencies.stamps=0;m.state.account.daily.draws=29;
 while(m.state.gear.length<235)m.state.gear.push(R.makeGear(m.state,R.GEAR[0]!.id,m.state.gear.length));
 const before=R.exportSave(m.state);render(<RecruitV3 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Mending Basket'}));
 for(const text of ['Need 600 more stamps.','1 invitation left today; this needs 10.','5 gear spaces free; this needs 10.'])expect(within(purchase(10)).getByText(text)).toBeTruthy();
 expect((button(10)as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button(10));expect(R.exportSave(m.state)).toBe(before);
});

it('uses exact command eligibility when the selector mark balance is full',()=>{
 const m=ready();m.state.v4!.selectorMarks=Number.MAX_SAFE_INTEGER;const before=R.exportSave(m.state);render(<RecruitV3 m={m}/>);
 for(const count of [1,10]){expect((button(count)as HTMLButtonElement).disabled).toBe(true);expect(within(purchase(count)).getByText('This saved balance is full.')).toBeTruthy();fireEvent.click(button(count));}
 expect(R.exportSave(m.state)).toBe(before);
});

it('keeps the free welcome free, adds no marks and consumes one daily invitation',()=>{
 const m=ready();m.state.freeInvite=false;m.state.account.currencies.stamps=0;m.state.v4!.selectorMarks=11;const expected=firstInvitation(m.state,4);
 render(<RecruitV3 m={m}/>);const group=screen.getByRole('group',{name:'Free welcome'});expect(group.textContent).toContain('Free · stamps unchanged · no marks added.');expect((button(1)as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(within(group).getByRole('button'));expect(m.state).toEqual(expected.state);expect(m.state.account.currencies.stamps).toBe(0);expect(m.state.v4!.selectorMarks).toBe(11);expect(m.state.account.daily.draws).toBe(1);
});

it('rechecks a stale invitation after a route starts without spending',()=>{
 const m=ready();render(<RecruitV3 m={m}/>);expect((button(1)as HTMLButtonElement).disabled).toBe(false);
 m.state=R.startRun(m.state,1,826081).state;const before=R.exportSave(m.state);fireEvent.click(button(1));expect(R.exportSave(m.state)).toBe(before);expect(screen.queryByLabelText('Invitation results')).toBeNull();expect((button(1)as HTMLButtonElement).disabled).toBe(true);expect(within(purchase(1)).getByText('Finish your route to recruit.')).toBeTruthy();
});

it('uses the current pity counter when another invitation changes the account before clicking',()=>{
 const m=ready();render(<RecruitV3 m={m}/>);
 m.state=R.metaCommand(m.state,{type:'pull',bannerId:'standard',count:1,seed:143}).state;
 const pulls=m.state.account.pity['cats-standard']!.totalPulls,expected=R.metaCommand(m.state,{type:'pull',bannerId:'standard',count:1,seed:m.state.account.seed+pulls*101+39});
 fireEvent.click(button(1));expect(m.state).toEqual(expected.state);
});

it('shows duplicate cats as shards without suggesting a reset to one star',()=>{
 const m=ready();m.shortcut('unlock');m.state.account.cards.forEach(c=>{c.level=10;c.stars=3;});const before=structuredClone(m.state.account.cards);
 render(<RecruitV3 m={m}/>);fireEvent.click(button(1));const result=m.state.account.history.at(-1)!;expect(result.duplicate).toBe(true);
 const rewards=screen.getByLabelText('Invitation results');expect(within(rewards).queryByLabelText('1 star')).toBeNull();expect(rewards.textContent).toContain('matching shards');
 for(const c of m.state.account.cards){const previous=before.find(p=>p.cardId===c.cardId)!;expect(c.level).toBe(previous.level);expect(c.stars).toBe(previous.stars);}
});

it('describes equipment duplicates as new pieces in the bag in both results and history',()=>{
 const m=ready();for(const g of R.GEAR)if(!m.state.gear.some(i=>i.templateId===g.id))m.state.gear.push(R.makeGear(m.state,g.id,m.state.gear.length));const before=m.state.gear.length;
 const {container}=render(<RecruitV3 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Mending Basket'}));expect(screen.getByText('Missing gear templates are preferred within each rarity.',{exact:false})).toBeTruthy();
 fireEvent.click(button(1));expect(m.state.gear).toHaveLength(before+1);expect(screen.getByLabelText('Invitation results').textContent).toContain('Added to your bag');expect(container.querySelector('.uv-history')!.textContent).toContain('Added to your bag');expect(container.querySelector('.uv-history')!.textContent).not.toContain('0 shards');
});
