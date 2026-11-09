// Verify the delivered repair changes only the standalone preview bar position.
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pattern=/(<script id="payload" type="application\/octet-stream">)(.*?)(<\/script>)/s;
const rows=[];
for(const [variant,before,after]of [
 ['full','/tmp/cardrpg-b2-v6.html','docs/cardrpg-look/b2.html'],
 ['lean','/tmp/cardrpg-b2-lean-before-gallery-fix.html','docs/cardrpg-look/b2-lean.html'],
]){
 const old=await readFile(before,'utf8'),current=await readFile(after,'utf8');
 const unpack=text=>JSON.parse(gunzipSync(Buffer.from(text.match(pattern)[2],'base64')));
 const a=unpack(old),b=unpack(current);
 assert.equal(a.js,b.js,'Executable JavaScript must be byte-identical');
 assert.equal(old.replace(pattern,'PAYLOAD'),current.replace(pattern,'PAYLOAD'),'All asset/showcase/loader HTML must be byte-identical');
 const oldBar=a.css.match(/\.look-b2-preview\{[^}]+\}/)[0],newBar=b.css.match(/\.look-b2-preview\{[^}]+\}/)[0];
 assert(oldBar.includes('top:107px'));assert.equal(oldBar.replace('top:107px','top:171px'),newBar);
 assert.equal(a.css.replace(oldBar,'PREVIEW_BAR'),b.css.replace(newBar,'PREVIEW_BAR'),'Every other CSS rule must be byte-identical');
 rows.push({variant,beforeSha256:hash(old),afterSha256:hash(current),beforeBytes:Buffer.byteLength(old),afterBytes:Buffer.byteLength(current),javascriptSha256:hash(a.js),javascriptByteIdentical:true,allOtherHtmlByteIdentical:true,allOtherCssByteIdentical:true,change:{selector:'.look-b2-preview',property:'top',before:'107px',after:'171px'}});
}
await writeFile('reports/cardrpg-look/b2/v6/gallery-fix-lineage.json',JSON.stringify({method:'Decode the gzip JSON payload and compare exact JavaScript, every other CSS rule, and all HTML outside the payload (assets, gallery images, loader). The single rule only exists in a gallery preview, absent from canonical fights/cold runs. Retain original timing/video/screenshot hashes; do not relabel or repeat those samples.',rows},null,2)+'\n');
console.log(JSON.stringify(rows));
