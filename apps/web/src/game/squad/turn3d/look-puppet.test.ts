import { afterEach, describe, expect, it } from 'vitest';
import {Vector3,Matrix4} from 'three';
import rig from '../../../../../../assets/cardrpg-look/v3-puppets/mochi.rig.json';
import inkcapRig from '../../../../../../assets/cardrpg-look/v3-puppets/inkcap.rig.json';
import sockRig from '../../../../../../assets/cardrpg-look/v3-puppets/sock-skipper.rig.json';
import cinnamonRig from '../../../../../../assets/cardrpg-look/v3-puppets/cinnamon.rig.json';
import { parsePuppetRig, puppetMotion, puppetPhase, puppetPose, plantedPuppetPivot } from './look-puppet-rig';
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
    expect(puppetPose('cast',0,.3,false,0,'clover')).toEqual(puppetPose('cast',0,.3,false));
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
    expect(puppetPose('attack',0,.52,false,0,'button-guard')).toEqual(puppetPose('attack',0,.52,false));
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
    expect(puppetPose('cast',3,.38,false,.4,'clover').tailBend).toBe(0);
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
