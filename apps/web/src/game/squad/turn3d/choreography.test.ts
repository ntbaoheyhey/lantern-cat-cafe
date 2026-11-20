import {it,expect} from 'vitest';
import {SKILL_MOTION,clipProgress} from './choreography';
import {createEffectFixture} from './fixtures';
import {createActionPlan,sampleActionPlan} from './effects';
it('uses a unique movement direction per authored combat skill',()=>{
 const signatures=Object.values(SKILL_MOTION).map(x=>JSON.stringify(x));expect(new Set(signatures).size).toBe(signatures.length);
});
it('progresses continuously through one pose sequence across all five beats',()=>{
 const plan=createActionPlan(createEffectFixture('shieldBash').events);let last=0;
 for(let t=0;t<plan.duration;t+=7){const frame=sampleActionPlan(plan,t),value=clipProgress(frame);expect(value).toBeGreaterThanOrEqual(last);last=value;}
 expect(last).toBeGreaterThan(.98);
});
it('holds a heavy impact briefly without delaying event time and disables hold for reduced motion',()=>{
 const p=createActionPlan(createEffectFixture('shieldBash').events),at=p.beats[2]!.start;
 expect(sampleActionPlan(p,at+40).progress).toBe(0);expect(sampleActionPlan(p,at+40).elapsed).toBe(at+40);
 expect(sampleActionPlan(p,at+40,true).progress).toBeGreaterThan(0);
});

import {cueSignature} from './audio';
import {EFFECT_REGISTRY} from './effects';
it('gives every recipe a different original three-note cue',()=>{const cues=Object.keys(EFFECT_REGISTRY).map(id=>JSON.stringify(cueSignature(id)));expect(new Set(cues).size).toBe(cues.length)});

import {TurnController} from './controller';
it('inspects the requested resolved recipe including secondary shield, chain and opening burn',()=>{for(const id of Object.keys(EFFECT_REGISTRY)){const c=new TurnController();c.inspect(id,2);expect(c.frame?.plan.skillId,id).toBe(id)}});
