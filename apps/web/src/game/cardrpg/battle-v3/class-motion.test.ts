import {expect,it} from 'vitest';
import {meleeContact,meleeRoot,denseMeleeRoot} from './class-motion';
const home={x:250,y:450,core:225},target={x:1080,y:510,core:225};
it('contacts the opaque front edge on either side and returns within the equal action clocks',()=>{
 for(const direction of [1,-1] as const){
  const h={...home,x:direction===1?home.x:1280-home.x},t={...target,x:direction===1?target.x:1280-target.x};
  const contact=meleeContact(h,t,220,95,direction,8);
  expect(Math.abs(t.x-contact.x)-220-95).toBe(8);
  for(const ultimate of [false,true]){
   const impact=ultimate?1100:350,end=ultimate?2200:800;
   expect(meleeRoot(impact,ultimate,h,contact)).toMatchObject({x:contact.x-h.x,y:contact.y-h.y,phase:'strike',sx:1,sy:1,angle:0});
   expect(meleeRoot(impact+89,ultimate,h,contact)).toEqual(meleeRoot(impact,ultimate,h,contact));
   expect(meleeRoot(end,ultimate,h,contact)).toMatchObject({x:0,y:0,phase:'idle'});
   if(ultimate)expect(meleeRoot(599,true,h,contact)).toMatchObject({x:0,y:0});
  }
 }
});
it('seeks without accumulating travel and does not retreat from a target already in reach',()=>{
 const contact=meleeContact(home,target,220,95,1,8),expected=meleeRoot(250,false,home,contact);
 meleeRoot(700,false,home,contact);expect(meleeRoot(250,false,home,contact)).toEqual(expected);
 expect(meleeContact(home,{...target,x:300},220,95,1,8).x).toBe(home.x);
});
it('keeps corridor arcs bounded, holds contact and retraces them before the same deadline',()=>{
 const contact={x:760,y:300},h={x:410,y:302,core:225};
 const mid=meleeRoot(200,false,h,contact,40,60);
 expect(mid.x).toBe(235);expect(mid.y).toBe(-41);
 expect(meleeRoot(350,false,h,contact,40,60)).toMatchObject({x:350,y:-2});
 expect(meleeRoot(439,false,h,contact,40,60)).toEqual(meleeRoot(350,false,h,contact,40,60));
 expect(meleeRoot(800,false,h,contact,40,60)).toMatchObject({x:0,y:0});
 const seeking=meleeRoot(620,false,h,contact,40,60);meleeRoot(100,false,h,contact,40,60);
 expect(meleeRoot(620,false,h,contact,40,60)).toEqual(seeking);
});

it('keeps the dense route continuous through the drawing swap and returns on the same clock',()=>{
 const h={x:432,y:819,core:283.5},contact={x:822.3,y:375};
 expect(denseMeleeRoot(99,h,contact)).toMatchObject({x:0,y:0});
 const strike=denseMeleeRoot(350,h,contact);
 expect(strike.phase).toBe('strike');expect(strike.x).toBeCloseTo(contact.x-h.x,8);expect(strike.y).toBeCloseTo(contact.y-h.y,8);
 expect(denseMeleeRoot(559,h,contact)).toEqual(denseMeleeRoot(350,h,contact));
 expect(denseMeleeRoot(800,h,contact)).toMatchObject({x:0,y:0,phase:'idle'});
 for(const t of [269.999,299.999,559.999,799.999]){
  const a=denseMeleeRoot(t,h,contact),b=denseMeleeRoot(t+.002,h,contact);
  expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(.05);
 }
 const before=denseMeleeRoot(250,h,contact);denseMeleeRoot(650,h,contact);expect(denseMeleeRoot(250,h,contact)).toEqual(before);
});
