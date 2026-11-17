import {expect,it} from 'vitest';
import {numberPeakScale,sampleNumberMotion,type NumberMotion} from './number-motion';
import {NUMBER_LIFETIME_MS,placeNumber,sweptNumberBox} from './number-layout';
const sample=():NumberMotion=>({scale:0,rise:0,alpha:0,accent:0});
it('keeps every normal, critical and healing sample inside its reserved animation bounds',()=>{
 for(const [critical,kind] of [[false,'damage'],[true,'damage'],[false,'heal']] as const){
  const out=sample(),repeat=sample();
  for(let age=0;age<=NUMBER_LIFETIME_MS;age+=5){
   expect(sampleNumberMotion(age,critical,kind,false,out)).toBe(out);
   expect(out).toEqual(sampleNumberMotion(age,critical,kind,false,repeat));
   expect(out.scale).toBeGreaterThanOrEqual(.88);expect(out.scale).toBeLessThanOrEqual(numberPeakScale(critical,kind));
   expect(out.rise).toBeGreaterThanOrEqual(0);expect(out.rise).toBeLessThanOrEqual(24);
   if(age>=220)expect(out.scale).toBe(1);
   if(age>=140||!critical)expect(out.accent).toBe(0);
  }
  expect(out.alpha).toBe(0);
 }
});
it('expands immediately after contact and makes critical pop stronger than healing',()=>{
 const at=(age:number,crit=false,kind='damage')=>sampleNumberMotion(age,crit,kind,false,sample());
 expect(at(30).scale).toBeGreaterThan(at(0).scale);
 expect(at(60,true).scale).toBeGreaterThan(at(100,false,'heal').scale);
 expect(at(300).alpha).toBe(1);expect(at(600).alpha).toBeLessThan(1);
});
it('keeps reduced-motion numbers stationary at full size with no critical accent',()=>{
 for(const age of [0,30,60,100,220,600]){
  const out=sampleNumberMotion(age,true,'damage',true,sample());
  expect(out.scale).toBe(1);expect(out.rise).toBe(0);expect(out.accent).toBe(0);
 }
});
it('places three peak critical footprints without overlap in a representative stack',()=>{
 const peak=46*numberPeakScale(true,'damage'),footprint={halfWidth:75,top:peak*.75+7+4,bottom:peak/2+4,rise:24};
 const occupied:ReturnType<typeof sweptNumberBox>[]=[];
 for(let i=0;i<3;i++){
  const p=placeNumber({x:480,y:260,width:150,height:260},footprint,1280,720,[],occupied)!;
  expect(p).toBeDefined();
  for(const box of occupied)expect(p.box.x>=box.x+box.width||p.box.x+p.box.width<=box.x||p.box.y>=box.y+box.height||p.box.y+p.box.height<=box.y).toBe(true);
  occupied.push(p.box);
 }
});
