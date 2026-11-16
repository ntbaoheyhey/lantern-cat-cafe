import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render} from '@testing-library/react';
const spies=vi.hoisted(()=>({music:vi.fn(),ambience:vi.fn(),session:{wallet:'0x0000000000000000000000000000000000000001',token:'fixture'} as {wallet:string;token:string}|null}));
vi.mock('wagmi',()=>({useWalletClient:()=>({data:undefined})}));
vi.mock('../../../wallet/WalletProvider',()=>({useSession:()=>spies.session}));
vi.mock('../../../audio/engine',()=>({audioEngine:{music:spies.music,ambience:spies.ambience}}));
vi.mock('../chain/runtime',()=>({chainRuntime:vi.fn(),loadChainConfig:()=>new Promise(()=>{}),txLink:()=>''}));
vi.mock('../chain/guest',()=>({existingGuestAddress:()=>undefined,guestClient:vi.fn()}));
vi.mock('../chain/journey-client',()=>({journeyClient:vi.fn()}));
vi.mock('../chain/WalletProof',()=>({WalletProof:()=>null}));
vi.mock('../chain/ReceiptToast',()=>({ReceiptToast:()=>null}));
vi.mock('./DemoWorkshop',()=>({DemoWorkshop:()=>null}));
import DemoJourney from './DemoJourney';
import type {DepthModel} from '../depth/model';
beforeEach(()=>{localStorage.clear();spies.music.mockClear();spies.ambience.mockClear();spies.session={wallet:'0x0000000000000000000000000000000000000001',token:'fixture'};});
afterEach(cleanup);
const model=()=>({screen:'hub',showBattle:false,battle:null,state:{run:{chapter:2}}}) as unknown as DepthModel;
it('follows actual boss entry and return without restarting on unchanged renders',()=>{
 const m=model(),view=render(<DemoJourney m={m}/>);
 expect(spies.music.mock.calls).toEqual([['home']]);expect(spies.ambience.mock.calls).toEqual([['home']]);
 Object.assign(m,{showBattle:true,battle:{initial:{enemies:['yarn-giant'],chapter:1}}});view.rerender(<DemoJourney m={m}/>);view.rerender(<DemoJourney m={m}/>);
 expect(spies.music.mock.calls).toEqual([['home'],['boss']]);expect(spies.ambience.mock.calls).toEqual([['home'],['boss']]);
 Object.assign(m,{showBattle:false,battle:null});view.rerender(<DemoJourney m={m}/>);
 expect(spies.music.mock.calls).toEqual([['home'],['boss'],['home']]);expect(spies.ambience.mock.calls).toEqual([['home'],['boss'],['home']]);
});
it('uses ordinary battle music and the encounter chapter, without restarting music for an ambience change',()=>{
 const m=model();Object.assign(m,{showBattle:true,battle:{initial:{enemies:['button-guard'],chapter:2}}});const view=render(<DemoJourney m={m}/>);
 expect(spies.music.mock.calls).toEqual([['battle']]);expect(spies.ambience.mock.calls).toEqual([['chapter-2']]);
 Object.assign(m,{battle:{initial:{enemies:['button-guard'],chapter:3}}});view.rerender(<DemoJourney m={m}/>);
 expect(spies.music.mock.calls).toEqual([['battle']]);expect(spies.ambience.mock.calls).toEqual([['chapter-2'],['chapter-3']]);
});
it('keeps a boss soundscape even without a campaign run',()=>{
 const m=model();Object.assign(m,{showBattle:true,battle:{initial:{enemies:['yarn-giant'],chapter:3}},state:{}});render(<DemoJourney m={m}/>);
 expect(spies.music).toHaveBeenLastCalledWith('boss');expect(spies.ambience).toHaveBeenLastCalledWith('boss');
});
it('waits for a session before taking ownership of scene audio',()=>{
 spies.session=null;render(<DemoJourney m={model()}/>);expect(spies.music).not.toHaveBeenCalled();expect(spies.ambience).not.toHaveBeenCalled();
});
