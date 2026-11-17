import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { CampaignA6 } from './CampaignA6';
import { IdleChestA6 } from './IdleChestA6';
import ShellV3 from './ShellV3';
import {RouteV3} from './EncounterV3';

const dialogMethods=['showModal','close']as const;
const dialogDescriptors=dialogMethods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{for(const key of dialogMethods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});});
afterAll(()=>{dialogMethods.forEach((key,i)=>{const descriptor=dialogDescriptors[i];if(descriptor)Object.defineProperty(HTMLDialogElement.prototype,key,descriptor);else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>)[key];});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('opens only unlocked chapters and claims earned star chests once',()=>{
 const m=new DepthModel(true,true,true,true);
 m.state.v4!.journey!.stars['1/0/0-0/battle']={key:'1/0/0-0/battle',chapter:1,band:0,nodeId:'0-0',kind:'battle',conditions:[true,true,true]};
 const {rerender}=render(<CampaignA6 m={m}/>);
 expect((screen.getByRole('button',{name:/Chapter 2/}) as HTMLButtonElement).disabled).toBe(true);
 const stamps=m.state.account.currencies.stamps;
 fireEvent.click(screen.getByRole('button',{name:/3 stars/}));
 expect(m.state.account.currencies.stamps).toBe(stamps+30);
 rerender(<CampaignA6 m={m}/>);
 expect((screen.getByRole('button',{name:/Collected/}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:/Chapter 1/}));
 expect(m.state.run?.chapter).toBe(1);expect(m.screen).toBe('map');
});
it('shows twelve-hour fill, claims a fast reward and keeps the passive chest intact',()=>{
 const m=new DepthModel(true,true,true,true);
 vi.spyOn(m,'cafeNow','get').mockReturnValue(m.state.idle.lastAt+3600000);
 render(<IdleChestA6 m={m}/>);
 expect(screen.getByRole('progressbar',{name:'Night tips fill'}).getAttribute('max')).toBe('43200');
 const before=m.state.idle.lastAt;
 fireEvent.click(screen.getByRole('button',{name:'Review Fast reward'}));
 fireEvent.click(screen.getByRole('button',{name:'Collect fast reward'}));
 expect(R.idleChestA6(m.state,m.cafeNow,true).remaining).toBe(1);
 expect(m.state.idle.lastAt).toBe(before);
 expect(screen.getByRole('status').textContent).toContain('Saved tips kept.');
});

function idleModel(){const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(3,0),true);return m;}
it('previews reduced saved tips without mutation, restores focus and settles the whole elapsed chest',()=>{
 const m=idleModel(),now=12*3600000;vi.spyOn(m,'cafeNow','get').mockReturnValue(now);
 m.state.account.daily.earned={...R.depthCaps(m.state),fish:R.depthCaps(m.state).fish-3,threads:R.depthCaps(m.state).threads-2,stamps:R.depthCaps(m.state).stamps-3};
 const before=R.exportSave(m.state),expected=R.claimIdleA6(m.state,now);render(<IdleChestA6 m={m}/>);
 const opener=screen.getByRole('button',{name:'Review Night tips'});opener.focus();fireEvent.click(opener);
 const dialog=screen.getByRole('dialog',{name:'Night tips and fast rewards'}),card=dialog.querySelector('[data-reward=tips]')!;
 expect(R.exportSave(m.state)).toBe(before);
 expect(within(card as HTMLElement).getByRole('row',{name:'fish 720 3'})).toBeTruthy();
 expect(within(card as HTMLElement).getByText('Collecting empties all saved tips.')).toBeTruthy();
 expect(within(card as HTMLElement).getByText(/missing supplies are lost/)).toBeTruthy();
 fireEvent.keyDown(dialog,{key:'Escape'});expect(document.activeElement).toBe(opener);expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(opener);fireEvent.click(screen.getByRole('button',{name:'Collect reduced tips'}));expect(m.state).toEqual(expected.state);
 expect(m.state.idle.lastAt).toBe(now);expect(m.state.dailyA6?.completed).toContain('tips');
 expect(screen.getByRole('status').textContent).toContain('Collected 3 fish · 2 threads · 3 stamps.');
 expect((screen.getByRole('button',{name:'Collect saved tips'})as HTMLButtonElement).disabled).toBe(true);
});
it('discloses each reduced fast use, leaves saved time and the daily tips task untouched, and blocks a third use',()=>{
 const m=idleModel(),now=3600000;vi.spyOn(m,'cafeNow','get').mockReturnValue(now);
 m.state.account.daily.earned={...R.depthCaps(m.state),fish:R.depthCaps(m.state).fish-100};
 render(<IdleChestA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Review Fast reward'}));
 for(let i=0;i<2;i++){
  const expected=R.claimIdleA6(m.state,now,true),button=screen.getByRole('button',{name:'Collect reduced fast reward'});
  const description=button.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' ');
  expect(description).toContain('Uses 1 free reward. Saved tips stay in the chest.');expect(description).toContain('missing supplies are lost');
  fireEvent.click(button);expect(m.state).toEqual(expected.state);expect(m.state.idle.lastAt).toBe(0);expect(m.state.dailyA6?.completed??[]).not.toContain('tips');
 }
 const settled=R.exportSave(m.state),button=screen.getByRole('button',{name:'Collect reduced fast reward'});expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);expect(R.exportSave(m.state)).toBe(settled);
 expect(screen.getByText('Two fast rewards collected. More tomorrow.')).toBeTruthy();
});
it('keeps capped tips safe, refreshes daily uses in the open view, and respects active-route locks',()=>{
 const m=idleModel();let now=3600000;vi.spyOn(m,'cafeNow','get').mockImplementation(()=>now);
 m.state.account.daily.earned={...R.depthCaps(m.state)};m.state.idle.a6={fastDay:0,fastClaims:2};const before=R.exportSave(m.state);
 render(<IdleChestA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Review Night tips'}));
 expect((screen.getByRole('button',{name:'Collect reduced tips'})as HTMLButtonElement).disabled).toBe(true);
 expect(R.exportSave(m.state)).toBe(before);now=25*3600000;act(()=>m.notify(false));
 expect((screen.getByRole('button',{name:'Collect fast reward'})as HTMLButtonElement).disabled).toBe(false);expect(screen.getByText('1 hour of tips · 2/2 free today')).toBeTruthy();expect(R.exportSave(m.state)).toBe(before);
 act(()=>{m.state=R.startRun(m.state,1,826044).state;m.notify(false);});
 expect(screen.getAllByText('Finish your patrol first.')).toHaveLength(2);
 const locked=R.exportSave(m.state);fireEvent.click(screen.getByRole('button',{name:'Collect fast reward'}));expect(R.exportSave(m.state)).toBe(locked);
});
it('opens preparation after choosing a stage from the home map button',async()=>{
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 const m=new DepthModel(true,true,true,true);
 function View(){useSyncExternalStore(m.subscribe,m.snapshot);return <ShellV3 m={m}>{null}</ShellV3>;}
 const {container}=render(<View/>);
 await act(async()=>{
  fireEvent.click(screen.getByRole('button',{name:'Open route map'}));
  await vi.dynamicImportSettled();
 });
 fireEvent.click(await screen.findByRole('button',{name:/Chapter 1/}));
 const stage=container.querySelector('.dp-node:not(:disabled)');expect(stage).toBeTruthy();
 fireEvent.click(stage!);
 expect(await screen.findByRole('button',{name:/^Fight/})).toBeTruthy();
 expect(m.screen).toBe('prepare');
});

it('returns from the practice route without starting a campaign under the lesson',async()=>{
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 const m=new DepthModel(true,true,true,true,true);m.tutorial();
 const practice=m.tutorialBattle,before=R.exportSave(m.state);
 function View(){useSyncExternalStore(m.subscribe,m.snapshot);return <ShellV3 m={m}>{null}</ShellV3>;}
 render(<View/>);
 await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Route',exact:true}));await vi.dynamicImportSettled();});
 expect(screen.getByRole('region',{name:'Practice route'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Chapter 1/})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Return to preparation'}));
 expect(await screen.findByRole('button',{name:'Fight',exact:true})).toBeTruthy();
 expect(m.tutorialBattle).toBe(practice);expect(R.exportSave(m.state)).toBe(before);
});

it('returns a pending campaign battle to preparation without replacing its state',()=>{
 const m=new DepthModel(true,true,true,true,true);m.start(1);m.enter(R.availableNodes(m.state.run!)[0]!.id);m.go('hub');
 const battle=m.battle,before=R.exportSave(m.state);render(<RouteV3 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Return to preparation'}));
 expect(m.screen).toBe('prepare');expect(m.battle).toBe(battle);expect(R.exportSave(m.state)).toBe(before);
});

it('the scenic route keeps branch availability and earned stars tied to real nodes',()=>{
 const m=new DepthModel(true,true,true,true);m.start(1,'campaign',1);
 const run=m.state.run!;run.visited=['0-0'];
 const node=run.nodes[0]!,key=R.nodeStarKeyV4(run,node);
 m.state.v4!.journey!.stars[key]={key,chapter:1,band:run.challengeLevel!,nodeId:node.id,kind:node.kind,conditions:[true,true,false]};
 const {container}=render(<CampaignA6 m={m}/>);
 expect(container.querySelectorAll('.a6-scenic-stop:not(:disabled)')).toHaveLength(2);
 expect(container.querySelector('[data-visited=true] [aria-label="2 of 3 stars"]')).toBeTruthy();
 expect((screen.getByRole('button',{name:/Chapter guardian/}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:/A little story/}));
 expect(m.state.run?.current).toBe('1-0');
});

it('shows the full and reduced star chest before the map consumes its one-time claim',()=>{
 const m=new DepthModel(true,true,true,true);
 m.state.v4!.journey!.stars={'1/0/0-0/battle':{key:'1/0/0-0/battle',chapter:1,band:0,nodeId:'0-0',kind:'battle',conditions:[true,true,true]}};
 m.state.account.daily.earned.stamps=R.depthCaps(m.state).stamps-3;
 const before=R.exportSave(m.state),command=R.claimStarRewardV4(m.state,'stars-3');render(<CampaignA6 m={m}/>);
 const button=screen.getByRole('button',{name:/3 stars/});expect(within(button).getByText('3/3 · Full gift: 30 stamps')).toBeTruthy();
 expect(within(button).getByText('Today: 3 stamps')).toBeTruthy();expect(within(button).getByText('Uses the whole gift.')).toBeTruthy();
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(button);expect(m.state).toEqual(command.state);
});
