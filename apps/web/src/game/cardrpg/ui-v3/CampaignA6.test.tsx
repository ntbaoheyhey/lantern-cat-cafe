import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { CampaignA6 } from './CampaignA6';
import { IdleChestA6 } from './IdleChestA6';
import ShellV3 from './ShellV3';

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
 fireEvent.click(screen.getByRole('button',{name:/Fast reward/}));
 expect(R.idleChestA6(m.state,m.cafeNow,true).remaining).toBe(1);
 expect(m.state.idle.lastAt).toBe(before);
 expect(screen.getByText('Tips collected!')).toBeTruthy();
});
it('opens preparation after choosing a stage from the home map button',async()=>{
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 const m=new DepthModel(true,true,true,true);
 function View(){useSyncExternalStore(m.subscribe,m.snapshot);return <ShellV3 m={m}>{null}</ShellV3>;}
 const {container}=render(<View/>);
 fireEvent.click(screen.getByRole('button',{name:'Open route map'}));
 fireEvent.click(await screen.findByRole('button',{name:/Chapter 1/}));
 const stage=container.querySelector('.dp-node:not(:disabled)');expect(stage).toBeTruthy();
 fireEvent.click(stage!);
 expect(await screen.findByRole('button',{name:/^Fight/})).toBeTruthy();
 expect(m.screen).toBe('prepare');
});
