import {expect,it,vi} from 'vitest';
import {ENEMY_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {pilotFixture} from '../vfx-layered/fixture';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {presentationTier,impactFeedback} from './presentation';
import {configureSequence} from './sequence';
import {CinematicPlayer} from './cinematic-player';

it('gives each real enemy signature active feedback and keeps its basic quiet',()=>{
 for(const owner of Object.keys(ENEMY_BY_ID)){
  const active=configureSequence(pilotFixture('enemy:'+owner).plan),basic=configureSequence(pilotFixture('enemy:'+owner+':basic').plan);
  expect(presentationTier(active)).toBe(active.ultimate?'ultimate':'active');
  expect(presentationTier(basic)).toBe('basic');
  const before=JSON.stringify(active),contact=active.beats[2]!.start;
  expect(impactFeedback(active,contact,false).flash).toBeGreaterThan(0);
  expect(impactFeedback(active,contact-1,false)).toEqual({flash:0,shake:0});
  expect(impactFeedback(active,contact+34,false).flash).toBe(0);
  expect(impactFeedback(active,contact+300,false)).toEqual({flash:0,shake:0});
  expect(impactFeedback(active,contact,true).flash).toBe(0);
  expect(JSON.stringify(active)).toBe(before);
 }
});

it('paints and clears fallback contact without leaving a stale ultimate plate',()=>{
 const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const load=vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
 const host=document.createElement('div'),cinema=new CinematicPlayer(host);
 try{
  const ultimate=configureSequence(pilotFixture('mochi-4').plan);
  cinema.render(sampleActionPlan(ultimate,1000,false),true,1,false,true);
  expect(cinema.audit.plate).toBe(true);
  const active=configureSequence(pilotFixture('enemy:teacup-healer').plan),at=active.beats[2]!.start;
  cinema.render(sampleActionPlan(active,at,false),true,1,false,true);
  expect(cinema.audit).toMatchObject({plate:false,cutin:false,flash:.16});
  expect((host.querySelector('.b3-cinema-flash') as HTMLElement).hidden).toBe(false);
  cinema.render(sampleActionPlan(active,at+34,false),true,1,false,true);
  expect(cinema.audit.flash).toBe(0);
  expect((host.querySelector('.b3-cinema-flash') as HTMLElement).hidden).toBe(true);
  cinema.render(sampleActionPlan(active,at,false),true,1,true,true);
  expect(cinema.audit.flash).toBe(0);
  cinema.render(null,true,1,false,true);
  expect(cinema.audit).toMatchObject({plate:false,cutin:false,flash:0});
 }finally{cinema.dispose();pause.mockRestore();load.mockRestore();}
});
