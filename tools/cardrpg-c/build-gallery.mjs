/** Static gallery artifact, bundled from the exact battle renderer. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{build}=await import(require.resolve('vite'));
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.atlas':'text/plain','.json':'application/json','.skel':'application/octet-stream','.glb':'model/gltf-binary'};
const result=await build({root:resolve(root,'apps/web'),configFile:false,publicDir:false,envDir:false,logLevel:'warn',plugins:[{name:'gallery-inline-assets',enforce:'pre',async load(id){const[file,query]=id.split('?');if(!new URLSearchParams(query).has('url')||!mime[extname(file)])return null;let bytes=readFileSync(file),type=mime[extname(file)];if(extname(file)==='.png'){bytes=await sharp(bytes).webp({quality:86,alphaQuality:100}).toBuffer();type='image/webp';}return `export default ${JSON.stringify('data:'+type+';base64,'+bytes.toString('base64'))};`;}}],define:{'process.env.NODE_ENV':'"production"'},resolve:{dedupe:['three','@taskbar-hero/game-rules']},build:{write:false,minify:true,lib:{entry:resolve(root,'tools/cardrpg-c/vfx-gallery.ts'),name:'LanternPaint',formats:['es']},rolldownOptions:{output:{codeSplitting:false}}}});
const chunks=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).filter(f=>f.type==='chunk');if(chunks.length!==1)throw Error('Expected one gallery module');
const payload=gzipSync(chunks[0].code,{level:9}).toString('base64');
const loader=`const packed=document.querySelector('#gallery-data').textContent;const bytes=Uint8Array.from(atob(packed),c=>c.charCodeAt(0));const source=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();const moduleUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));await import(moduleUrl);URL.revokeObjectURL(moduleUrl);`;
const html=readFileSync(resolve(root,'tools/cardrpg-c/vfx-gallery.html'),'utf8').replace('<script type="module" src="./vfx-gallery.ts"></script>',`<script id="gallery-data" type="application/octet-stream">${payload}</script><script type="module">${loader}</script>`);
if(Buffer.byteLength(html)>18_000_000)throw Error('Gallery exceeds18MB share of40MB demo budget');
mkdirSync(resolve(root,'docs/cardrpg-c'),{recursive:true});writeFileSync(resolve(root,'docs/cardrpg-c/vfx.html'),html);console.log(JSON.stringify({bytes:Buffer.byteLength(html),skills:74,statuses:18,mode:'offline single HTML, existing original art'}));
