/** Bundle the production player for an ordinary static repository server. */
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{build}=await import(require.resolve('vite'));
const entry=resolve(root,'tmp/b2-audio-lab-entry.ts');mkdirSync(resolve(root,'tmp'),{recursive:true});
writeFileSync(entry,"export {AudioEngine} from '../apps/web/src/audio/engine';\nexport {resolveCue,resolveDesign} from '../apps/web/src/audio/cues';\n");
try{await build({configFile:false,root,publicDir:false,logLevel:'warn',define:{'import.meta.env.DEV':'false'},build:{outDir:resolve(root,'docs/audio-lab'),emptyOutDir:false,minify:true,lib:{entry,formats:['es'],fileName:()=> 'runtime.js'}}});}finally{rmSync(entry);}
console.log('Static audio player built:',readFileSync('docs/audio-lab/runtime.js').length,'bytes');
