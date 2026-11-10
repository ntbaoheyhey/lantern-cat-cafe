import { afterEach, describe, expect, it } from 'vitest';
import {Vector3,Matrix4} from 'three';
import rig from '../../../../../../assets/cardrpg-look/v3-puppets/mochi.rig.json';
import inkcapRig from '../../../../../../assets/cardrpg-look/v3-puppets/inkcap.rig.json';
import sockRig from '../../../../../../assets/cardrpg-look/v3-puppets/sock-skipper.rig.json';
import cinnamonRig from '../../../../../../assets/cardrpg-look/v3-puppets/cinnamon.rig.json';
import threadRig from '../../../../../../assets/cardrpg-look/v3-puppets/binding-thread.rig.json';
import cloverRig from '../../../../../../assets/cardrpg-look/v3-puppets/clover.rig.json';
import cushionRig from '../../../../../../assets/cardrpg-look/v3-puppets/practice-cushion.rig.json';
import buttonRig from '../../../../../../assets/cardrpg-look/v3-puppets/button-guard.rig.json';
import marigoldRig from '../../../../../../assets/cardrpg-look/v3-puppets/marigold.rig.json';
import briocheRig from '../../../../../../assets/cardrpg-look/v3-puppets/brioche.rig.json';
import biscuitRig from '../../../../../../assets/cardrpg-look/v3-puppets/biscuit.rig.json';
import teacupRig from '../../../../../../assets/cardrpg-look/v3-puppets/teacup-healer.rig.json';
import needleMothRig from '../../../../../../assets/cardrpg-look/v3-puppets/needle-moth.rig.json';
import velvetRig from '../../../../../../assets/cardrpg-look/v3-puppets/velvet.rig.json';
import sorrelRig from '../../../../../../assets/cardrpg-look/v3-puppets/sorrel.rig.json';
import { parsePuppetRig, puppetMotion, puppetPhase, puppetPose, plantedPuppetPivot, SORREL_STAFF_CONTACT, VELVET_STAFF_CONTACT } from './look-puppet-rig';
import { artPipeline } from './look-art';
import { CATS, ENEMIES } from '../../../../../../packages/game-rules/src/cardrpg/depth/catalog';

const deliveredRigs=Object.values(import.meta.glob('../../../../../../assets/cardrpg-look/v3-puppets/*.rig.json',{eager:true,import:'default'}));
const deliveredAtlases=import.meta.glob('../../../../../../assets/cardrpg-look/v3-puppets/*.webp',{query:'?url',import:'default'});

afterEach(()=>{delete window.__LOOK_V2__;delete window.__LOOK_ART__;delete window.__LOOK_ART_PIPELINE__;});
describe('illustrated puppet contract and event motions',()=>{
  it('covers every playable cat with a valid rig and delivered atlas',()=>{
    const parsed=new Map(deliveredRigs.map(value=>{const r=parsePuppetRig(value);return[r.id,r];}));
    for(const cat of CATS){
      const r=parsed.get(cat.id);expect(r,cat.id).toBeDefined();
      expect(r!.boss,cat.id).toBe(false);
      expect(Object.keys(deliveredAtlases).some(path=>path.endsWith('/'+r!.atlas)),cat.id).toBe(true);
    }
  });
  it('covers every rules enemy and boss with its concept rig, role and atlas',()=>{
    const parsed=new Map(deliveredRigs.map(value=>{const r=parsePuppetRig(value);return[r.id,r];}));
    for(const enemy of ENEMIES){
      const r=parsed.get(enemy.id);expect(r,enemy.id).toBeDefined();
      expect(r!.role,enemy.id).toBe(enemy.role);
      expect(Object.keys(deliveredAtlases).some(path=>path.endsWith('/'+r!.atlas)),enemy.id).toBe(true);
      if(enemy.tier==='boss'){
        expect(r!.boss,enemy.id).toBe(true);expect(r!.eyeStyle,enemy.id).toBe('glow');expect(r!.eyes,enemy.id).toHaveLength(2);
      }
    }
  });
  it('loads an authored atlas and rejects corrupt coordinates before rendering',()=>{
    expect(parsePuppetRig(rig).layers.map(l=>l.part)).toContain('head');
    const broken=structuredClone(rig);broken.layers[0]!.atlasRect=[.9,0,.4,1];
    expect(()=>parsePuppetRig(broken)).toThrow('escapes');
    const duplicate=structuredClone(rig);duplicate.layers.push(duplicate.layers[0]!);
    expect(()=>parsePuppetRig(duplicate)).toThrow('duplicate');
    const socket=structuredClone(rig);socket.sockets.mainHand[0]='missing-arm';
    expect(()=>parsePuppetRig(socket)).toThrow('socket');
  });
  it('keeps the new roster behind the existing look switch',()=>{
    expect(artPipeline()).toBe('v2');
    window.__LOOK_ART__='v3';expect(artPipeline()).toBe('v2');
    window.__LOOK_V2__=true;expect(artPipeline()).toBe('puppet');
    window.__LOOK_ART_PIPELINE__='generated';expect(artPipeline()).toBe('generated');
  });
  it.each([
    ['mochi-1','attack'],['soot-2','cast'],['mochi-4','ultimate'],['heavy-hit-front','hurt'],
    ['victory','victory'],['KO','defeat'],['enemy:button-guard:basic','attack'],['idle','idle'],
  ] as const)('maps %s to its semantic motion', (clip,motion)=>expect(puppetMotion(clip)).toBe(motion));
  it('preserves attack ownership through travel, ultimate holds, and boss idle',()=>{
    expect(puppetMotion('step',true)).toBe('attack');
    expect(puppetMotion('idle',true,true)).toBe('ultimate');
    expect(puppetMotion('idle',false,false,true)).toBe('boss-idle');
    expect(puppetPose('ultimate',0,.25,false).gesture).toBe(puppetPose('ultimate',0,.4,false).gesture);
  });
  it('anticipates, overshoots, then returns exactly to rest',()=>{
    expect(puppetPose('attack',0,.22,false).gesture).toBeLessThan(0);
    expect(puppetPose('attack',0,.52,false).gesture).toBeGreaterThan(1);
    expect(puppetPose('attack',0,1,false).gesture).toBeCloseTo(0);
    expect(puppetPose('cast',0,1,false).gesture).toBeCloseTo(0);
  });
  it('desynchronizes actors and disables movement for reduced motion',()=>{
    expect(puppetPhase('cat-1')).not.toBe(puppetPhase('cat-2'));
    const p=puppetPose('attack',1,.52,true,puppetPhase('mochi'));
    expect([p.gesture,p.head,p.tail,p.wing,p.lean,p.prop,p.offhand,p.breathe]).toEqual([0,0,0,0,0,0,0,0]);
  });
  it('flashes briefly at impact and restores concept colours through recovery',()=>{
    expect(puppetPose('hurt',0,0,false).flash).toBe(.45);
    expect(puppetPose('hurt',0,.3,false).flash).toBe(0);
    expect(puppetPose('hurt',0,.7,false).flash).toBe(0);
    expect(puppetPose('hurt',0,0,true).flash).toBe(0);
  });
  it('gives Soot delayed tail follow-through with bounded joints and an exact settle',()=>{
    for(const motion of ['attack','cast','ultimate'] as const){
      const pose=(t:number,reduced=false)=>puppetPose(motion,0,t,reduced,0,'soot');
      expect(pose(.04).tail).toBe(0);
      expect(Math.abs(pose(.52).tail)).toBeGreaterThan(.02);
      expect([pose(1).tail,pose(1).cloth,pose(1).prop,pose(1).head].every(v=>Math.abs(v)<1e-10)).toBe(true);
      for(let i=0;i<=100;i++){
        const p=pose(i/100),quiet=pose(i/100,true);
        expect(Math.abs(p.prop)).toBeLessThan(.32);
        expect(Math.abs(p.tail)).toBeLessThan(.1);
        expect([quiet.prop,quiet.tail,quiet.cloth,quiet.head,quiet.lean]).toEqual([0,0,0,0,0]);
      }
    }
    expect(puppetPose('cast',0,.3,false,0,'pollen-scout')).toEqual(puppetPose('cast',0,.3,false));
  });
  it('plants Spool Ram into a horn dip and lets its tail recover after the body',()=>{
    const pose=(t:number,reduced=false)=>puppetPose('attack',0,t,reduced,0,'spool-ram');
    expect(pose(.52).head).toBeGreaterThan(.06);
    expect(pose(.52).lean).toBeGreaterThan(.04);
    expect(Math.abs(pose(.52).prop)).toBeLessThan(.12);
    expect(pose(.04).tail).toBe(0);
    expect(pose(.52).tail).toBeLessThan(-.07);
    for(let i=0;i<=100;i++){
      const p=pose(i/100),quiet=pose(i/100,true);
      expect(Math.max(Math.abs(p.head),Math.abs(p.lean),Math.abs(p.prop),Math.abs(p.offhand),Math.abs(p.tail))).toBeLessThan(.12);
      expect([quiet.head,quiet.lean,quiet.prop,quiet.offhand,quiet.tail]).toEqual([0,0,0,0,0]);
    }
    expect([pose(1).head,pose(1).lean,pose(1).prop,pose(1).tail].every(v=>Math.abs(v)<1e-10)).toBe(true);
    expect(puppetPose('attack',0,.52,false,0,'pollen-scout')).toEqual(puppetPose('attack',0,.52,false));
  });

  it('keeps a foot contact fixed through body lean, breathing and leg rotation',()=>{
    const rest:[number,number]=[-.8,.7],contact:[number,number]=[.1,-.6];
    for(const [rotation,lean,sx,sy] of [[-.12,.06,.991,1.009],[.08,-.03,1.009,.991],[0,0,1,1]]){
      const [x,y]=plantedPuppetPivot(rest,contact,rotation!,lean!,[sx!,sy!]);
      const point=new Vector3(...contact,0).applyMatrix4(new Matrix4().makeRotationZ(rotation!)).add(new Vector3(x,y,0));
      point.applyMatrix4(new Matrix4().makeScale(sx!,sy!,1)).applyMatrix4(new Matrix4().makeRotationZ(lean!));
      expect(point.x).toBeCloseTo(rest[0]+contact[0],10);
      expect(point.y).toBeCloseTo(rest[1]+contact[1],10);
    }
    expect(puppetPose('attack',1,.5,true,0,'spool-ram').plant).toBe(false);
    expect(puppetPose('idle',1,.5,false,0,'spool-ram').plant).toBe(false);
    expect(puppetPose('attack',1,.5,false,0,'soot').plant).toBe(false);
  });

  it('settles Inkcap lantern and tail to idle, with no added motion in reduced mode',()=>{
    for(const motion of ['attack','cast','ultimate'] as const){
      const idle=puppetPose('idle',3,0,false,.4,'inkcap');
      const end=puppetPose(motion,3,1,false,.4,'inkcap');
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      expect(end.prop).toBeCloseTo(0,12);
      for(const progress of [0,.18,.38,.52,.88,1]){
        const quiet=puppetPose(motion,3,progress,true,.4,'inkcap');
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
    }
    const [,x,y]=inkcapRig.sockets.mainHand;
    const windup=puppetPose('cast',3,.38,false,.4,'inkcap');
    const lifted=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(windup.prop));
    expect(lifted.y).toBeGreaterThan(Number(y)+.04);
    expect(puppetPose('cast',3,.38,false,.4,'inkcap').tailBend).not.toBe(puppetPose('idle',3,0,false,.4,'inkcap').tailBend);
    expect(puppetPose('cast',3,.38,false,.4,'needle-moth').tailBend).toBe(0);
  });

  it('leads with Button Guard needle toward foes, braces its shield and plants both boots',()=>{
    const tip=new Vector3(Number(buttonRig.sockets.mainHand[1]),Number(buttonRig.sockets.mainHand[2]),0);
    const shield=new Vector3(Number(buttonRig.sockets.offHand[1]),Number(buttonRig.sockets.offHand[2]),0);
    expect(buttonRig.sockets.mainHand[0]).toBe('armR');expect(buttonRig.sockets.offHand[0]).toBe('armL');
    const windup=puppetPose('attack',0,.18,false,0,'button-guard'),strike=puppetPose('attack',0,.52,false,0,'button-guard');
    const displaced=(point:Vector3,angle:number)=>point.clone().applyMatrix4(new Matrix4().makeRotationZ(angle)).sub(point);
    expect(displaced(tip,windup.prop).x).toBeGreaterThan(.035);
    expect(displaced(tip,strike.prop).x).toBeLessThan(-.13);
    expect(displaced(shield,strike.offhand).x).toBeLessThan(-.035);
    expect(displaced(shield,strike.offhand).y).toBeGreaterThan(.02);
    for(const motion of ['attack','cast'] as const)for(let i=0;i<=60;i++){
      const p=puppetPose(motion,3,i/60,false,.4,'button-guard'),quiet=puppetPose(motion,3,i/60,true,.4,'button-guard');
      expect(p.feetPlant).toBe(true);expect(Math.abs(p.prop)).toBeLessThan(.265);expect(Math.abs(p.head)).toBeLessThan(.035);
      for(const foot of buttonRig.layers.filter(l=>l.part.startsWith('foot'))){
        const rest=[(foot.pivot[0]!-.5)*buttonRig.height*buttonRig.aspect,(1-foot.pivot[1]!)*buttonRig.height];
        const contact=[(foot.rect[0]!+foot.rect[2]!/2-foot.pivot[0]!)*buttonRig.height*buttonRig.aspect,(foot.pivot[1]!-foot.rect[1]!-foot.rect[3]!)*buttonRig.height];
        const scale=[1-p.breathe,1+p.breathe],rotation=p.gesture*(foot.part==='footL'?.025:-.025);
        const [x,y]=plantedPuppetPivot(rest,contact,rotation,p.lean,scale);
        const actual=new Vector3(contact[0]!,contact[1]!,0).applyMatrix4(new Matrix4().makeRotationZ(rotation)).add(new Vector3(x,y,0));
        actual.applyMatrix4(new Matrix4().makeScale(scale[0]!,scale[1]!,1)).applyMatrix4(new Matrix4().makeRotationZ(p.lean));
        expect(actual.distanceTo(new Vector3(rest[0]!+contact[0]!,rest[1]!+contact[1]!,0))).toBeLessThan(1e-10);
      }
      expect([quiet.prop,quiet.offhand,quiet.head,quiet.lean,quiet.feetPlant]).toEqual([0,0,0,0,false]);
    }
    for(const motion of ['attack','cast'] as const){const rest=puppetPose(motion,0,1,false,0,'button-guard');expect(rest.prop).toBeCloseTo(0,12);expect(rest.offhand).toBeCloseTo(0,12);}
  });

  it('lifts Marigold real spout before pouring and keeps its free sleeve gesture bounded',()=>{
    const spout=new Vector3(Number(marigoldRig.sockets.mainHand[1]),Number(marigoldRig.sockets.mainHand[2]),0);
    const palm=new Vector3(Number(marigoldRig.sockets.offHand[1]),Number(marigoldRig.sockets.offHand[2]),0);
    expect(marigoldRig.sockets.mainHand[0]).toBe('armR');expect(marigoldRig.sockets.offHand[0]).toBe('armL');
    const held=puppetPose('cast',0,.28,false,0,'marigold');
    const offered=palm.clone().applyMatrix4(new Matrix4().makeRotationZ(held.offhand)).sub(palm);
    expect(offered.y).toBeGreaterThan(.012);expect(offered.x).toBeLessThan(-.015);
    for(const motion of ['attack','cast','ultimate'] as const){
      const windup=puppetPose(motion,0,.28,false,0,'marigold'),release=puppetPose(motion,0,.52,false,0,'marigold');
      const start=spout.clone().applyMatrix4(new Matrix4().makeRotationZ(windup.prop));
      const end=spout.clone().applyMatrix4(new Matrix4().makeRotationZ(release.prop));
      expect(start.y-spout.y).toBeGreaterThan(.045);
      expect(end.y-start.y).toBeLessThan(-.1);expect(end.x-start.x).toBeGreaterThan(.025);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'marigold'),quiet=puppetPose(motion,3,i/60,true,.4,'marigold');
        expect(Math.abs(p.prop)).toBeLessThan(.121);expect(Math.abs(p.offhand)).toBeLessThan(.081);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const rest=puppetPose(motion,3,1,false,.4,'marigold'),idle=puppetPose('idle',3,0,false,.4,'marigold');
      expect(rest.prop).toBeCloseTo(0,12);expect(rest.offhand).toBeCloseTo(0,12);
      expect(rest.tail).toBeCloseTo(idle.tail,12);expect(rest.tailBend).toBeCloseTo(idle.tailBend,12);
    }
  });

  it('swings Brioche basket without dragging it down and lifts the real free palm',()=>{
    const basket=new Vector3(Number(briocheRig.sockets.mainHand[1]),Number(briocheRig.sockets.mainHand[2]),0);
    const palm=new Vector3(Number(briocheRig.sockets.offHand[1]),Number(briocheRig.sockets.offHand[2]),0);
    expect(briocheRig.sockets.mainHand[0]).toBe('armL');expect(briocheRig.sockets.offHand[0]).toBe('armR');
    const held=puppetPose('cast',0,.28,false,0,'brioche');
    const offered=palm.clone().applyMatrix4(new Matrix4().makeRotationZ(held.prop)).sub(palm);
    expect(offered.x).toBeGreaterThan(.015);expect(offered.y).toBeGreaterThan(.015);
    for(const motion of ['attack','cast','ultimate'] as const){
      const windup=puppetPose(motion,0,.28,false,0,'brioche'),release=puppetPose(motion,0,.52,false,0,'brioche');
      const start=basket.clone().applyMatrix4(new Matrix4().makeRotationZ(windup.offhand));
      const end=basket.clone().applyMatrix4(new Matrix4().makeRotationZ(release.offhand));
      expect(end.x-start.x).toBeGreaterThan(.075);expect(Math.abs(end.y-start.y)).toBeLessThan(.025);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'brioche'),quiet=puppetPose(motion,3,i/60,true,.4,'brioche');
        expect(Math.abs(p.offhand)).toBeLessThan(.106);expect(Math.abs(p.prop)).toBeLessThan(.15);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const rest=puppetPose(motion,3,1,false,.4,'brioche'),idle=puppetPose('idle',3,0,false,.4,'brioche');
      expect(rest.offhand).toBeCloseTo(0,12);expect(rest.prop).toBeCloseTo(0,12);
      expect(rest.tail).toBeCloseTo(idle.tail,12);expect(rest.tailBend).toBeCloseTo(idle.tailBend,12);
    }
  });

  it('braces Biscuit actual shield and sweeps its wooden spatula forward/up without quiet-mode motion',()=>{
    const tip=new Vector3((.175-.34)*1.9*1036/1200,(.46-.345)*1.9,0);
    const [,x,y]=biscuitRig.sockets.offHand;
    expect(biscuitRig.sockets.offHand[0]).toBe('armR');
    const held=puppetPose('cast',0,.28,false,0,'biscuit');
    const shield=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(held.prop));
    expect(shield.x).toBeGreaterThan(Number(x)+.02);
    expect(shield.y).toBeGreaterThan(Number(y)+.01);
    for(const motion of ['attack','cast','ultimate'] as const){
      const windup=puppetPose(motion,0,.28,false,0,'biscuit'),strike=puppetPose(motion,0,.52,false,0,'biscuit');
      const start=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(windup.offhand));
      const end=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(strike.offhand));
      expect(end.x).toBeGreaterThan(start.x+.04);
      expect(end.y).toBeGreaterThan(start.y+.055);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'biscuit'),quiet=puppetPose(motion,3,i/60,true,.4,'biscuit');
        expect(Math.abs(p.prop)).toBeLessThan(.18);
        expect(Math.abs(p.offhand)).toBeLessThanOrEqual(.151);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const rest=puppetPose(motion,3,1,false,.4,'biscuit'),idle=puppetPose('idle',3,0,false,.4,'biscuit');
      expect(rest.offhand).toBeCloseTo(0,12);expect(rest.prop).toBeCloseTo(0,12);
      expect(rest.tail).toBeCloseTo(idle.tail,12);expect(rest.tailBend).toBeCloseTo(idle.tailBend,12);
    }
  });

  it('sweeps Mallow complete whisk forward from a held windup and returns to a quiet pose',()=>{
    // Original top wire at UV(.88,.185), relative to the right shoulder(.73,.46).
    const tip=new Vector3((.88-.73)*1.9*1115/1200,(.46-.185)*1.9,0);
    for(const motion of ['attack','cast','ultimate'] as const){
      const windup=puppetPose(motion,0,.28,false,0,'mallow'),strike=puppetPose(motion,0,.52,false,0,'mallow');
      const raised=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(windup.prop));
      const hit=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(strike.prop));
      expect(hit.x).toBeGreaterThan(raised.x+.12);
      expect(hit.y).toBeLessThan(raised.y-.05);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'mallow'),quiet=puppetPose(motion,3,i/60,true,.4,'mallow');
        expect(Math.abs(p.prop)).toBeLessThanOrEqual(.161);
        expect(Math.abs(p.offhand)).toBeLessThan(.14);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const end=puppetPose(motion,3,1,false,.4,'mallow'),idle=puppetPose('idle',3,0,false,.4,'mallow');
      expect(end.prop).toBeCloseTo(0,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
    }
  });

  it('strikes down and forward with Panko whole roller, with a still reduced-motion pose',()=>{
    // Actual painted top-handle centre relative to the shoulder; sourceUV(.493,.376).
    const tip=new Vector3((.493-.32)*1.9*1081/1200,(.43-.376)*1.9,0);
    for(const motion of ['attack','cast','ultimate'] as const){
      const windup=puppetPose(motion,0,.28,false,0,'panko'),strike=puppetPose(motion,0,.52,false,0,'panko');
      const raised=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(windup.offhand));
      const hit=tip.clone().applyMatrix4(new Matrix4().makeRotationZ(strike.offhand));
      expect(hit.x).toBeGreaterThan(raised.x+.025);
      expect(hit.y).toBeLessThan(raised.y-.08);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'panko'),quiet=puppetPose(motion,3,i/60,true,.4,'panko');
        expect(Math.abs(p.offhand)).toBeLessThanOrEqual(.181);
        expect(Math.abs(p.prop)).toBeLessThan(.11);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const end=puppetPose(motion,3,1,false,.4,'panko'),idle=puppetPose('idle',3,0,false,.4,'panko');
      expect(end.offhand).toBeCloseTo(0,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
    }
  });

  it('lifts Clover before tipping the real teapot at release, then settles without reduced motion',()=>{
    const [,x,y]=cloverRig.sockets.mainHand;
    for(const motion of ['attack','cast','ultimate'] as const){
      const charge=puppetPose(motion,0,.28,false,0,'clover'),release=puppetPose(motion,0,.52,false,0,'clover');
      const raised=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(charge.prop));
      expect(raised.y).toBeGreaterThan(Number(y)+.03);
      expect(charge.prop).toBeGreaterThan(.14);
      expect(release.prop).toBeLessThan(-.20);
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'clover'),quiet=puppetPose(motion,3,i/60,true,.4,'clover');
        expect(Math.abs(p.prop)).toBeLessThanOrEqual(.221);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const end=puppetPose(motion,3,1,false,.4,'clover'),idle=puppetPose('idle',3,0,false,.4,'clover');
      expect(end.prop).toBeCloseTo(0,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
    }
    expect(puppetPose('cast',0,.28,false,0,'panko').prop).toBeLessThan(0);
  });

  it("raises Mochi's real shield socket toward foes with bounded, quiet follow-through",()=>{
    const [,x,y]=rig.sockets.mainHand;
    const held=puppetPose('cast',0,.38,false,0,'mochi');
    const shield=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(held.prop));
    expect(shield.x).toBeGreaterThan(Number(x)+.04);
    expect(shield.y).toBeGreaterThan(Number(y)+.035);
    for(const motion of ['attack','cast','ultimate'] as const){
      for(let i=0;i<=60;i++){
        const p=puppetPose(motion,3,i/60,false,.4,'mochi'),quiet=puppetPose(motion,3,i/60,true,.4,'mochi');
        expect(Math.abs(p.prop)).toBeLessThan(.21);
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
      }
      const end=puppetPose(motion,3,1,false,.4,'mochi'),idle=puppetPose('idle',3,0,false,.4,'mochi');
      expect(end.prop).toBeCloseTo(0,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
    }
    expect(puppetPose('cast',0,.38,false,0,'panko').prop).toBeLessThan(0);
    expect(puppetPose('cast',0,.38,false,0,'needle-moth').tailBend).toBe(0);
  });

  it("reaches Binding Thread's actual knot toward the party and settles with accessible quiet poses",()=>{
    const [,x,y]=threadRig.sockets.mainHand;
    const pose=puppetPose('cast',0,.38,false,0,'binding-thread');
    const hand=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(pose.prop));
    expect(hand.x).toBeLessThan(Number(x)-.20);
    expect(pose.feetPlant).toBe(true);
    for(const motion of ['attack','cast','ultimate'] as const){
      const end=puppetPose(motion,0,1,false,0,'binding-thread');
      expect(Math.max(Math.abs(end.prop),Math.abs(end.offhand),Math.abs(end.head),Math.abs(end.lean))).toBeLessThan(1e-10);
      for(let i=0;i<=60;i++){
        const quiet=puppetPose(motion,3,i/60,true,.4,'binding-thread');
        expect([quiet.prop,quiet.offhand,quiet.head,quiet.lean,quiet.feetPlant]).toEqual([0,0,0,0,false]);
      }
    }
    expect(puppetPose('cast',0,.38,false,0,'pollen-scout').feetPlant).toBe(false);
  });

  it('compresses and releases Practice Cushion with planted boots, a forward jab and an intact face seam',()=>{
    const pose=(t:number,reduced=false)=>puppetPose('attack',0,t,reduced,0,'practice-cushion');
    expect(pose(.18).bodySquash).toBeGreaterThan(.025);
    expect(pose(.48).bodySquash).toBeLessThan(-.015);
    const [,x,y]=cushionRig.sockets.mainHand;
    const hand=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(pose(.52).prop));
    expect(hand.x).toBeLessThan(Number(x)-.05);
    for(let i=0;i<=100;i++){
      const p=pose(i/100),quiet=pose(i/100,true);
      expect(Math.abs(p.bodySquash)).toBeLessThanOrEqual(.028);
      expect(Math.abs(p.head)).toBeLessThan(.004);
      expect(p.feetPlant).toBe(true);
      expect(p.hopLift).toBe(0);
      for(const foot of cushionRig.layers.filter(l=>l.part.startsWith('foot'))){
        const rest=[(foot.pivot[0]!-.5)*cushionRig.height*cushionRig.aspect,(1-foot.pivot[1]!)*cushionRig.height];
        const contact=[(foot.rect[0]!+foot.rect[2]!/2-foot.pivot[0]!)*cushionRig.height*cushionRig.aspect,(foot.pivot[1]!-foot.rect[1]!-foot.rect[3]!)*cushionRig.height];
        const scale=[1+p.bodySquash*.6,1-p.bodySquash],rotation=p.gesture*(foot.part==='footL'?.025:-.025);
        const [px,py]=plantedPuppetPivot(rest,contact,rotation,p.lean,scale);
        const actual=new Vector3(contact[0]!,contact[1]!,0).applyMatrix4(new Matrix4().makeRotationZ(rotation)).add(new Vector3(px,py,0));
        actual.applyMatrix4(new Matrix4().makeScale(scale[0]!,scale[1]!,1)).applyMatrix4(new Matrix4().makeRotationZ(p.lean));
        expect(actual.distanceTo(new Vector3(rest[0]!+contact[0]!,rest[1]!+contact[1]!,0))).toBeLessThan(1e-10);
      }
      expect([quiet.bodySquash,quiet.hopLift,quiet.prop,quiet.offhand,quiet.head,quiet.lean,quiet.feetPlant]).toEqual([0,0,0,0,0,0,false]);
    }
    for(const t of [0,1])expect(pose(t).bodySquash).toBe(0);
    for(const id of ['binding-thread','sock-skipper','mochi'])expect(puppetPose('attack',0,.18,false,0,id).bodySquash).toBe(0);
  });

  it('plants Velvet at its painted needle tip and presents the open palm with coherent recovery',()=>{
    const arm=velvetRig.layers.find(l=>l.part==='armR')!;
    const rest=[(arm.pivot[0]!-.5)*velvetRig.height*velvetRig.aspect,(1-arm.pivot[1]!)*velvetRig.height];
    const expectedSource=[(685/1108-arm.pivot[0]!)*velvetRig.height*velvetRig.aspect,(arm.pivot[1]!-1084/1200)*velvetRig.height];
    expect(VELVET_STAFF_CONTACT[0]).toBeCloseTo(expectedSource[0]!,12);expect(VELVET_STAFF_CONTACT[1]).toBeCloseTo(expectedSource[1]!,12);
    const target=new Vector3(rest[0]!+VELVET_STAFF_CONTACT[0],rest[1]!+VELVET_STAFF_CONTACT[1],0);
    expect(velvetRig.sockets.mainHand[0]).toBe('armR');expect(velvetRig.sockets.offHand[0]).toBe('armL');
    const palm=new Vector3(Number(velvetRig.sockets.offHand[1]),Number(velvetRig.sockets.offHand[2]),0);
    const held=puppetPose('cast',0,.38,false,0,'velvet');
    expect(palm.clone().applyMatrix4(new Matrix4().makeRotationZ(held.offhand)).y).toBeGreaterThan(palm.y+.03);
    for(const motion of ['idle','attack','cast','ultimate'] as const)for(let i=0;i<=60;i++){
      const p=puppetPose(motion,i/10,i/60,false,.4,'velvet'),scale=[1-p.breathe,1+p.breathe];
      expect(p.staffPlant).toBe(true);
      const [x,y]=plantedPuppetPivot(rest,VELVET_STAFF_CONTACT,p.prop,p.lean,scale);
      const actual=new Vector3(...VELVET_STAFF_CONTACT,0).applyMatrix4(new Matrix4().makeRotationZ(p.prop)).add(new Vector3(x,y,0));
      actual.applyMatrix4(new Matrix4().makeScale(scale[0]!,scale[1]!,1)).applyMatrix4(new Matrix4().makeRotationZ(p.lean));
      expect(actual.distanceTo(target)).toBeLessThan(1e-10);expect(Math.hypot(x-rest[0]!,y-rest[1]!)).toBeLessThan(.075);
      const quiet=puppetPose(motion,i/10,i/60,true,.4,'velvet');expect(quiet.staffPlant).toBe(false);
      expect([quiet.prop,quiet.offhand,quiet.head,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0,0]);
    }
    for(const motion of ['attack','cast','ultimate'] as const){const p=puppetPose(motion,0,1,false,0,'velvet');expect(p.prop).toBeCloseTo(0,12);expect(p.offhand).toBeCloseTo(0,12);}
  });

  it('anchors Sorrel\'s painted staff tip through breath and casting without a wide shoulder shift',()=>{
    const arm=sorrelRig.layers.find(l=>l.part==='armR')!;
    const rest=[(arm.pivot[0]!-.5)*sorrelRig.height*sorrelRig.aspect,(1-arm.pivot[1]!)*sorrelRig.height];
    const target=new Vector3(rest[0]!+SORREL_STAFF_CONTACT[0],rest[1]!+SORREL_STAFF_CONTACT[1],0);
    for(const motion of ['idle','attack','cast','ultimate'] as const)for(let i=0;i<=60;i++){
      const p=puppetPose(motion,i/10,i/60,false,.4,'sorrel'),scale=[1-p.breathe,1+p.breathe];
      expect(p.staffPlant).toBe(true);
      const [x,y]=plantedPuppetPivot(rest,SORREL_STAFF_CONTACT,p.prop,p.lean,scale);
      const actual=new Vector3(...SORREL_STAFF_CONTACT,0).applyMatrix4(new Matrix4().makeRotationZ(p.prop)).add(new Vector3(x,y,0));
      actual.applyMatrix4(new Matrix4().makeScale(scale[0]!,scale[1]!,1)).applyMatrix4(new Matrix4().makeRotationZ(p.lean));
      expect(actual.distanceTo(target)).toBeLessThan(1e-10);
      expect(Math.hypot(x-rest[0]!,y-rest[1]!)).toBeLessThan(.1);
      expect(puppetPose(motion,i/10,i/60,true,.4,'sorrel').staffPlant).toBe(false);
    }
    expect(puppetPose('cast',0,.38,false,0,'cinnamon').staffPlant).toBe(false);
  });

  it('raises Cinnamon\'s actual serving tray and returns its tail to the current idle pose',()=>{
    const pose=puppetPose('cast',3,.38,false,.4,'cinnamon');
    const [,x,y]=cinnamonRig.sockets.mainHand;
    expect(cinnamonRig.sockets.mainHand[0]).toBe('armL');
    const tray=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(pose.offhand));
    expect(tray.y).toBeGreaterThan(Number(y)+.03);
    expect(Math.abs(pose.prop)).toBeLessThan(Math.abs(pose.offhand)/2);
    for(const motion of ['attack','cast','ultimate'] as const){
      const end=puppetPose(motion,3,1,false,.4,'cinnamon'),idle=puppetPose('idle',3,0,false,.4,'cinnamon');
      expect(end.tailBend).toBeCloseTo(idle.tailBend,12);
      expect(end.tail).toBeCloseTo(idle.tail,12);
      const quiet=puppetPose(motion,3,.38,true,.4,'cinnamon');
      expect([quiet.prop,quiet.offhand,quiet.tail,quiet.tailBend,quiet.lean]).toEqual([0,0,0,0,0]);
      expect(end.hopLift).toBe(0);
    }
  });

  it('gives Sock Skipper a bounded hop, a forward mitten and an exact quiet landing',()=>{
    const pose=(t:number,reduced=false)=>puppetPose('attack',0,t,reduced,0,'sock-skipper');
    expect(pose(.16).hopSquash).toBeGreaterThan(.03);
    expect(pose(.42).hopLift).toBeGreaterThan(.10);
    expect(pose(.70).hopSquash).toBeGreaterThan(.02);
    for(let i=0;i<=100;i++){
      const p=pose(i/100),quiet=pose(i/100,true);
      expect(p.hopLift).toBeGreaterThanOrEqual(0);
      expect(p.hopLift).toBeLessThanOrEqual(.11);
      expect(Math.abs(p.hopSquash)).toBeLessThanOrEqual(.035);
      expect([quiet.hopLift,quiet.hopSquash,quiet.prop,quiet.offhand,quiet.tailBend]).toEqual([0,0,0,0,0]);
    }
    for(const t of [0,1])expect([pose(t).hopLift,pose(t).hopSquash]).toEqual([0,0]);
    const [,x,y]=sockRig.sockets.mainHand;
    const reach=new Vector3(Number(x),Number(y),0).applyMatrix4(new Matrix4().makeRotationZ(pose(.52).offhand));
    expect(reach.x).toBeLessThan(Number(x)-.03);
    for(const id of ['inkcap','soot','spool-ram','clover'])expect(puppetPose('attack',0,.42,false,0,id).hopLift).toBe(0);
  });

});


it('draws Needle Moth wings before its whole needle leads, with quiet planted recovery',()=>{
  expect(needleMothRig.sockets.mainHand[0]).toBe('armL');
  const needle=new Vector3(Number(needleMothRig.sockets.mainHand[1]),Number(needleMothRig.sockets.mainHand[2]),0);
  for(const motion of ['attack','cast','ultimate'] as const){
    const draw=puppetPose(motion,0,.22,false,0,'needle-moth');
    const release=puppetPose(motion,0,.54,false,0,'needle-moth');
    expect(draw.wing).toBeGreaterThan(.02);expect(release.wing).toBeLessThan(-.01);
    const lead=puppetPose(motion,0,motion==='attack'?.52:.38,false,0,'needle-moth');
    expect(needle.clone().applyAxisAngle(new Vector3(0,0,1),lead.offhand).x-needle.x).toBeLessThan(-.065);
    for(let i=0;i<=60;i++){
      const pose=puppetPose(motion,i/10,i/60,false,.4,'needle-moth');expect(pose.feetPlant).toBe(true);
      expect(Math.abs(pose.wing)).toBeLessThan(.038);expect(Math.abs(pose.head)).toBeLessThan(.035);
      const quiet=puppetPose(motion,i/10,i/60,true,.4,'needle-moth');expect(quiet.wing).toBe(0);expect(quiet.offhand).toBe(0);expect(quiet.feetPlant).toBe(false);
    }
    const end=puppetPose(motion,0,1,false,0,'needle-moth');expect(end.wing).toBeCloseTo(0,12);expect(end.offhand).toBeCloseTo(0,12);
  }
});


it('blesses with Teacup Healer whole spoon and open palm while its ceramic body stays quiet',()=>{
  expect(teacupRig.sockets.mainHand[0]).toBe('armL');expect(teacupRig.sockets.offHand[0]).toBe('armR');
  const spoon=new Vector3(Number(teacupRig.sockets.mainHand[1]),Number(teacupRig.sockets.mainHand[2]),0);
  const palm=new Vector3(Number(teacupRig.sockets.offHand[1]),Number(teacupRig.sockets.offHand[2]),0);
  for(const motion of ['attack','cast','ultimate'] as const){
    const lead=puppetPose(motion,0,motion==='attack'?.52:.38,false,0,'teacup-healer');
    expect(spoon.clone().applyAxisAngle(new Vector3(0,0,1),lead.offhand).x-spoon.x).toBeLessThan(-.06);
    expect(palm.clone().applyAxisAngle(new Vector3(0,0,1),lead.prop).y-palm.y).toBeGreaterThan(.04);
    for(let i=0;i<=60;i++){
      const pose=puppetPose(motion,i/10,i/60,false,.4,'teacup-healer');expect(pose.feetPlant).toBe(true);
      expect(Math.abs(pose.head)).toBeLessThan(.025);expect(Math.abs(pose.lean)).toBeLessThan(.008);
      const quiet=puppetPose(motion,i/10,i/60,true,.4,'teacup-healer');
      expect(quiet.head).toBe(0);expect(quiet.prop).toBe(0);expect(quiet.offhand).toBe(0);expect(quiet.feetPlant).toBe(false);
    }
    const end=puppetPose(motion,0,1,false,0,'teacup-healer');expect(end.head).toBeCloseTo(0,12);expect(end.prop).toBeCloseTo(0,12);expect(end.offhand).toBeCloseTo(0,12);
  }
});
