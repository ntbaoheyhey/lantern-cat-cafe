// Original authored SVG export; seed 0 (deterministic/no random input), 24-unit grid, 64px archive.
import {mkdir,writeFile} from 'node:fs/promises';
import {web,requireWeb} from '../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try {
 const {STATUS_IDENTITIES}=await vite.ssrLoadModule('/@fs/'+process.cwd()+'/apps/web/src/game/squad/turn3d/card-status-data.ts');
 await mkdir('assets/cardrpg-look/statuses',{recursive:true});
 for(const [id,s] of Object.entries(STATUS_IDENTITIES))await writeFile(`assets/cardrpg-look/statuses/${id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><title>${s.name} — ${s.subtitle}</title><path fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="${s.path}"/></svg>\n`);
 console.log(JSON.stringify({icons:Object.keys(STATUS_IDENTITIES).length,seed:0}));
} finally {await vite.close()}
