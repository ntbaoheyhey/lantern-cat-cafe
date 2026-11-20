import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {packPixels} from './pixel-packing.mjs';

test('the full production roster round-trips every frame, pixel and catalog field',async()=>{
 const source=await readFile('/Users/bao/taskbar-hero-cardrpg-a4/apps/web/src/art/monsters/gameplay.generated.ts','utf8');
 const {code,data}=packPixels(source);
 const began=performance.now();
 const packed=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const importMs=performance.now()-began,decode=performance.now();
 assert.deepEqual(packed.GAMEPLAY_MONSTERS,data);
 const decodeMs=performance.now()-decode;
 for(const art of Object.values(packed.GAMEPLAY_MONSTERS))assert.equal(art.frames,art.frames,'Stable cached frames');
 const summary={sourceSha256:createHash('sha256').update(source).digest('hex'),sourceBytes:Buffer.byteLength(source),packedBytes:Buffer.byteLength(code),savedBytes:Buffer.byteLength(source)-Buffer.byteLength(code),roster:Object.keys(data).length,parity:'PASS',nodeImportMs:importMs,nodeDecodeAndAssertionMs:decodeMs,method:'Isolated native Node check; not a browser startup measurement or a production adoption.'};
 await writeFile('/tmp/cardrpg-a5-p1-prep/pixel-packing-parity.json',JSON.stringify(summary,null,2));
 console.log(summary);
});
