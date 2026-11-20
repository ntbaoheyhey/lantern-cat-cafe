import {expect,it} from 'vitest';
import {StatusCues,conditionGlyph} from './status-cues';

it('announces application and expires while the condition remains',()=>{
 const cues=new StatusCues();cues.sample('a',[{id:'scald',stacks:1}],4);
 expect(cues.sample('a',[{id:'scald',stacks:1}],4.12)[0]).toMatchObject({status:'scald',alpha:.9});
 expect(cues.sample('a',[{id:'scald',stacks:1}],4.61)).toHaveLength(0);
 expect(cues.sample('a',[{id:'scald',stacks:1}],40)).toHaveLength(0);
});
it('does not extend the pulse on repeated stacks and retriggers only on a later application',()=>{
 const cues=new StatusCues();cues.sample('a',[{id:'bitter',stacks:1}],0);
 cues.sample('a',[{id:'bitter',stacks:2}],.3,['bitter']);
 expect(cues.sample('a',[{id:'bitter',stacks:2}],.61)).toHaveLength(0);
 expect(cues.sample('a',[{id:'bitter',stacks:2}],1,['bitter'])).toHaveLength(1);
 expect(cues.sample('a',[{id:'bitter',stacks:3}],2)).toHaveLength(1);
});
it('removes expired/dead units, resets rewinds, and bounds simultaneous accents',()=>{
 const cues=new StatusCues();expect(cues.sample('a',['scald','bitter','drowsy'],0)).toHaveLength(2);
 expect(cues.sample('a',[],.1)).toHaveLength(0);
 cues.sample('a',['scald'],1);cues.retain(new Set());
 expect(cues.sample('a',['scald'],4)).toHaveLength(1);
 expect(cues.sample('a',['scald'],2)[0]?.age).toBe(0);
 cues.clear();expect(cues.sample('a',['glaze','shield','decoy'],5)).toHaveLength(0);
});
it('keeps Drowsy and break-pressure shapes distinct from stun and slow implications',()=>{
 expect(conditionGlyph('drowsy').path).not.toBe(conditionGlyph('stun').path);
 expect(conditionGlyph('tangle').path).toBe(conditionGlyph('brittle').path);
 expect(conditionGlyph('tangle').path).not.toBe(conditionGlyph('crumb').path);
 expect(new Set(['scald','bitter','drowsy','tangle'].map(id=>conditionGlyph(id).path)).size).toBe(4);
});
