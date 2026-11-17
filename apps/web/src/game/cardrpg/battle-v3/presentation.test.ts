import {expect,it} from 'vitest';
import {ENEMY_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {pilotFixture} from '../vfx-layered/fixture';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {presentationTier,impactFeedback,isSupportCast} from './presentation';
import {configureSequence} from './sequence';
import {CinematicPlayer} from './cinematic-player';
it('keeps shield and healing casts planted without misclassifying damaging shield attacks',()=>{
 for(const id of ['mochi-2','panko-2'])expect(isSupportCast(pilotFixture(id,false,true).plan)).toBe(true);
 expect(isSupportCast(pilotFixture('clover-1').plan)).toBe(true);
 for(const id of ['mochi-1','panko-1','soot-1'])expect(isSupportCast(pilotFixture(id).plan)).toBe(false);
 const support=pilotFixture('mochi-2',false,true).plan;
 const damage=pilotFixture('mochi-1').plan.events.find(e=>e.type==='damage')!;
 support.events.push({...damage,actorId:'retaliating-recipient'});
 expect(isSupportCast(support)).toBe(true);
 support.events.push({...damage,actorId:support.actorId,amount:0});
 expect(isSupportCast(support)).toBe(false);
});
it('gives enemies only Basic or Ultimate and limits shake to ultimate contact',()=>{
 for(const owner of Object.keys(ENEMY_BY_ID)){
  const ultimate=configureSequence(pilotFixture('enemy:'+owner).plan),basic=configureSequence(pilotFixture('enemy:'+owner+':basic').plan);
  expect(presentationTier(ultimate)).toBe('ultimate');expect(presentationTier(basic)).toBe('basic');expect(impactFeedback(basic,350,false)).toEqual({flash:0,shake:0});
  const before=JSON.stringify(ultimate),contact=ultimate.beats[2]!.start;
  expect(impactFeedback(ultimate,contact,false)).toEqual({flash:0,shake:4});
  for(const offset of [-1,120,300])expect(impactFeedback(ultimate,contact+offset,false)).toEqual({flash:0,shake:0});
  expect(impactFeedback(ultimate,contact,true)).toEqual({flash:0,shake:0});expect(JSON.stringify(ultimate)).toBe(before);
 }
});
it('shows only a local caster banner during focus and clears it on the next action',()=>{
 const host=document.createElement('div'),cinema=new CinematicPlayer(host);
 try{
  const plan=configureSequence(pilotFixture('mochi-4').plan),box={x:120,y:80,width:240,height:40};
  cinema.render(sampleActionPlan(plan,300,false),true,1,false,true,undefined,box);
  expect(cinema.audit).toMatchObject({plate:false,cutin:false,focus:true,banner:true});
  const title=host.querySelector('.b3-focus-name') as HTMLElement;expect(title.hidden).toBe(false);expect(title.textContent).toBe(plan.name);expect(title.style.left).toBe('120px');
  cinema.render(sampleActionPlan(plan,600,false),true,1,false,true);expect(title.hidden).toBe(true);
  cinema.render(sampleActionPlan(configureSequence(pilotFixture('mochi-1').plan),100,false),true,1,false,true);expect(title.hidden).toBe(true);
  cinema.render(null,true,1,false,true);expect(cinema.audit).toMatchObject({plate:false,cutin:false,flash:0,focus:false});
 }finally{cinema.dispose();}
});
it('keeps caster identity and full skill text through focus, then replaces them for the next caster',()=>{
 const host=document.createElement('div'),cinema=new CinematicPlayer(host),title=host.querySelector('.b3-focus-name') as HTMLElement;
 title.getBoundingClientRect=()=>new DOMRect(0,0,260,58);
 const identity=(id:string,name:string)=>({id,name,portrait:`/units/${id}/portrait.webp`,anchors:[{id,visible:true,labelX:100,labelY:100,body:{x:100,y:100,width:180,height:240}}]});
 try{
  const plan=configureSequence(pilotFixture('mochi-4').plan),before=JSON.stringify(plan);
  cinema.render(sampleActionPlan(plan,0,false),true,1,false,true,undefined,undefined,identity('mochi','Mochi'));
  const portrait=title.querySelector('img');expect(portrait?.getAttribute('src')).toBe('/units/mochi/portrait.webp');
  expect(title.querySelector('.b3-focus-owner')?.textContent).toBe('Mochi');expect(title.querySelector('.b3-focus-skill')?.textContent).toBe(plan.name);
  const position=[title.style.left,title.style.top];
  cinema.render(sampleActionPlan(plan,599,false),true,1,false,true,undefined,undefined,identity('mochi','Mochi'));
  expect(title.querySelector('img')).toBe(portrait);expect([title.style.left,title.style.top]).toEqual(position);expect(title.hidden).toBe(false);
  cinema.render(sampleActionPlan(plan,600,false),true,1,false,true);expect(title.hidden).toBe(true);expect(JSON.stringify(plan)).toBe(before);
  const next=configureSequence(pilotFixture('panko-4').plan);
  cinema.render(sampleActionPlan(next,0,false),true,1,false,true,undefined,undefined,identity('panko','Panko'));
  expect(title.querySelector('.b3-focus-owner')?.textContent).toBe('Panko');expect(title.querySelector('.b3-focus-skill')?.textContent).toBe(next.name);
  expect(title.querySelector('img')?.getAttribute('src')).toBe('/units/panko/portrait.webp');
 }finally{cinema.dispose();}
});
it('keeps a healing cast camera still at contact without changing its event plan',()=>{
 const plan=configureSequence(pilotFixture('clover-4').plan),before=JSON.stringify(plan);
 for(const reduced of [false,true])for(const at of [0,600,1099,1100,1133,1199,1200,2200])
  expect(impactFeedback(plan,at,reduced,true)).toEqual({shake:0,flash:0});
 expect(JSON.stringify(plan)).toBe(before);
});
it('never loads a full-screen video or plate regardless of seeking and reduced motion',()=>{
 const host=document.createElement('div'),cinema=new CinematicPlayer(host),plan=configureSequence(pilotFixture('mochi-4').plan),before=JSON.stringify(plan);
 try{for(const reduced of [false,true])for(const at of [2200,0,599,1100,300,600]){
  cinema.render(sampleActionPlan(plan,at,reduced),true,1,reduced,true);expect(host.querySelector('video,img.b3-plate')).toBeNull();expect(cinema.audit.plate).toBe(false);
 }expect(JSON.stringify(plan)).toBe(before);}finally{cinema.dispose();expect(host.children).toHaveLength(0);}
});
