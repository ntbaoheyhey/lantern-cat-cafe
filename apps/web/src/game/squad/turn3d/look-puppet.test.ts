import { afterEach, describe, expect, it } from 'vitest';
import rig from '../../../../../../assets/cardrpg-look/v3-puppets/mochi.rig.json';
import { parsePuppetRig, puppetMotion, puppetPhase, puppetPose } from './look-puppet-rig';
import { artPipeline } from './look-art';
import { CATS } from '../../../../../../packages/game-rules/src/cardrpg/depth/catalog';

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
    expect([p.gesture,p.head,p.tail,p.lean,p.prop,p.offhand,p.breathe]).toEqual([0,0,0,0,0,0,0]);
  });
});
