import {test} from 'node:test';
import assert from 'node:assert/strict';
import {holdoutCells,validateSavedRow} from './item-holdout.mjs';
import {pairedSummary} from './item-impact.mjs';

const cell={template:'crumbweave-weapon-legendary',cardId:'soot',mode:'fourth',level:6,chapter:3,node:'6-0'};
test('fixture union retains every context and excludes historical outcomes',()=>{
 const union=holdoutCells([{...cell,pairs:'13',gainPp:50}],[cell,{...cell,cardId:'panko'}]);
 assert.equal(union.length,2);assert.ok(union.some(r=>r.cardId==='panko'));
 assert.ok(union.every(r=>!('pairs' in r)&&!('gainPp' in r)));
 assert.throws(()=>holdoutCells([{...cell,mode:'unknown'}]));
 assert.throws(()=>holdoutCells([{...cell,node:'missing'}]));
});
test('resuming validates the retained paired outcomes and derived statistics',()=>{
 const row={...cell,...pairedSummary([0,1,2,3]),pairs:'0123'};
 validateSavedRow(row,4);
 assert.throws(()=>validateSavedRow({...row,gainPp:1},4));
 assert.throws(()=>validateSavedRow(row,5));
 assert.throws(()=>validateSavedRow({...row,pairs:'0124'},4));
});
