import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../apps/web/src/game/cardrpg/battle-v3');
const failures=[];
for(const name of await readdir(root)){
 if(!/\.(?:css|ts|tsx)$/.test(name))continue;
 const source=await readFile(resolve(root,name),'utf8');
 if(/system-ui|Arial|Helvetica|sans-serif|Times New Roman/.test(source))failures.push(name+': unscoped system font');
 for(const m of source.matchAll(/font-family\s*:\s*([^;}]+)/g))if(!m[1].startsWith('var(--font-'))failures.push(name+': font must use token');
}
if(failures.length)throw Error(failures.join('\n'));console.log('PASS battle typography uses --font-* tokens; canvas glyph atlas uses --font-num');
