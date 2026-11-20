import test from 'node:test';
import assert from 'node:assert/strict';
import {collectAudioCalls} from './sound-map-coverage.mjs';

test('finds literal, multiline, optional bridge and renamed-import calls',()=>{
  const calls=collectAudioCalls(`import {playCue as sound} from './contract';
    playCue(\n'ui.open'\n); sound('ui.close'); window.__thAudio?.play('ui.click');
    audioEngine.music('home'); // playCue('comment.only')
    const text="playCue('string.only')";`,'screen.tsx');
  assert.deepEqual(calls.map(c=>c.ids),[['ui.open'],['ui.close'],['ui.click'],['music.home']]);
});
test('expands finite templates but refuses unknown arguments and partial conditionals',()=>{
  const code='audio.play(`ult.${unit}.${phase}`); playCue(dynamic); playCue(ok ? "ui.open" : unknown);';
  const calls=collectAudioCalls(code,'events.ts',{domains:{unit:['mochi','soot'],phase:['charge','impact']}});
  assert.deepEqual(calls[0].ids,['ult.mochi.charge','ult.mochi.impact','ult.soot.charge','ult.soot.impact']);
  assert.deepEqual(calls.slice(1).map(c=>c.ids),[[],[]]);
});
test('event adapter is explicit, and unresolved music identifiers remain unresolved',()=>{
  const calls=collectAudioCalls('audio.play(eventCue(event)); audioEngine.music(selected);','events.ts',{eventCues:['ui.turn','hit.blunt']});
  assert.deepEqual(calls.map(c=>c.ids),[['ui.turn','hit.blunt'],[]]);
});
test('correlates unit and slot bindings instead of inventing nonexistent enemy skills',()=>{
 const calls=collectAudioCalls('audio.play(`skill.${unit}.${slot}.cast`); audio.play(unknown);','events.ts',{bindings:[{unit:'mochi',slot:3},{unit:'yarn-giant',slot:2}]});
 assert.deepEqual(calls.map(c=>c.ids),[['skill.mochi.3.cast','skill.yarn-giant.2.cast'],[]]);
});
