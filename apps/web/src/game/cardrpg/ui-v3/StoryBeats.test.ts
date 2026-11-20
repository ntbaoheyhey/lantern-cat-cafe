import {describe,expect,it} from 'vitest';
import {pendingBeat} from './StoryBeats';
import type {DepthModel} from '../depth/model';

const nodes=[{id:'0-0',kind:'battle'},{id:'6-0',kind:'boss'}];
function model(run:Record<string,unknown>|null,extra:Record<string,unknown>={}){
 return {showBattle:false,sceneStarted:false,battle:null,state:{run:run&&{mode:'campaign',chapter:1,nodes,visited:[],current:null,complete:false,won:false,...run}},...extra} as unknown as DepthModel;
}

describe('pendingBeat',()=>{
 it('opens with the opening beat before any run',()=>{
  expect(pendingBeat(model(null),[])?.id).toBe('opening');
 });
 it('shows the chapter intro when Fight has already entered the first node',()=>{
  expect(pendingBeat(model({current:'0-0'}),['opening'])?.id).toBe('ch1-intro');
 });
 it('shows the guardian beat on the boss node and nothing mid-battle',()=>{
  const seen=['opening','ch1-intro'];
  expect(pendingBeat(model({current:'6-0',visited:['0-0']}),seen)?.id).toBe('ch1-boss');
  expect(pendingBeat(model({current:'6-0',visited:['0-0']},{showBattle:true}),seen)).toBeNull();
 });
 it('closes a won chapter, then the ending after chapter 3',()=>{
  expect(pendingBeat(model({complete:true,won:true,visited:['0-0']}),['opening'])?.id).toBe('ch1-clear');
  expect(pendingBeat(model({chapter:3,complete:true,won:true,visited:['0-0']}),['opening','ch3-clear'])?.id).toBe('ending');
  expect(pendingBeat(model({complete:true,won:false,visited:['0-0']}),['opening'])).toBeNull();
 });
});
