import { afterEach, describe, expect, it } from 'vitest';
import {Vector3,Matrix4} from 'three';
import rig from '../../../../../../assets/cardrpg-look/v3-puppets/mochi.rig.json';
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

});
