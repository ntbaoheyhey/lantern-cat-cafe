import {writeFile} from 'node:fs/promises';
import {web,requireWeb} from '../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try{const M=await vite.ssrLoadModule('/@fs/'+process.cwd()+'/tools/cardrpg-look/skills-v5/v3-playback.ts');
 const frames=Object.fromEntries(M.caseNames.map(n=>[n,M.selectedFixture(n)]));
 const row=M.fixtureSource.fixtures.find(f=>f.id==='spread');const timeline=row.actions.slice(0,20).map(a=>M.fixtureFrame(row,a));
 await writeFile('/tmp/cardrpg-v5look-v3/frames.json',JSON.stringify({frames,timeline}));
 console.log(JSON.stringify(Object.entries(frames).map(([name,f])=>({name,fixture:f.fixtureId,action:f.actionId,ms:f.plan.duration}))));
}finally{await vite.close()}
